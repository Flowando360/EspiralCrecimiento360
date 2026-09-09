'use server';

import { createClient } from '@/lib/supabase/server';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { revalidatePath } from 'next/cache';
import { formatearCOP } from '@/lib/utils';
import { z } from 'zod';

const FiltroSchema = z.object({
  comparador: z.enum(['igual', 'menor_o_igual', 'mayor_o_igual']),
  monto: z.number().positive('El monto de referencia debe ser mayor a 0'),
  modo: z.enum(['fijo', 'porcentaje']),
  valor: z.number().positive('El valor debe ser mayor a 0'),
  fecha: z.string().min(1, 'La fecha es requerida'),
  nota: z.string().trim().optional(),
});

type Filtro = z.infer<typeof FiltroSchema>;

async function soloAdminTh() {
  const perfil = await getPerfilActual();
  if (!perfil || perfil.rol !== 'admin_th') return null;
  return perfil;
}

/**
 * Trae los colaboradores activos e internos cuyo salario actual cumple el
 * comparador contra el monto de referencia — la misma consulta la usan la
 * previsualización y la aplicación real, así lo que se ve en pantalla es
 * exactamente lo que se va a modificar.
 */
async function colaboradoresFiltrados(
  supabase: ReturnType<typeof createClient>,
  empresaId: string,
  filtro: Pick<Filtro, 'comparador' | 'monto'>
) {
  let query = supabase
    .from('colaboradores')
    .select('id, nombre_completo, salario')
    .eq('empresa_id', empresaId)
    .eq('estado', 'activo')
    .eq('es_externo', false)
    .not('salario', 'is', null)
    .order('nombre_completo');

  if (filtro.comparador === 'igual') query = query.eq('salario', filtro.monto);
  else if (filtro.comparador === 'menor_o_igual') query = query.lte('salario', filtro.monto);
  else query = query.gte('salario', filtro.monto);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data as { id: string; nombre_completo: string; salario: number }[];
}

function salarioNuevo(salarioActual: number, filtro: Pick<Filtro, 'modo' | 'valor'>): number {
  return filtro.modo === 'fijo' ? filtro.valor : Math.round(salarioActual * (1 + filtro.valor / 100));
}

/** Muestra quiénes se verían afectados por el alza, sin modificar nada todavía (admin_th). */
export async function previsualizarAlzaSalarial(input: unknown) {
  const parsed = FiltroSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };

  const perfil = await soloAdminTh();
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const supabase = createClient();
  const filas = await colaboradoresFiltrados(supabase, perfil.empresa_id, parsed.data);

  return {
    ok: true as const,
    colaboradores: filas.map((f) => ({
      id: f.id,
      nombre: f.nombre_completo,
      salarioActual: f.salario,
      salarioNuevo: salarioNuevo(f.salario, parsed.data),
    })),
  };
}

/**
 * Aplica el alza a todos los colaboradores que cumplen el filtro en este
 * momento (se vuelve a calcular en el servidor, no se confía en la lista que
 * mandó el navegador) y deja un movimiento "Aumento salarial" en el
 * historial de cada uno, para que quede trazable quién y cuándo lo aplicó.
 */
export async function aplicarAlzaSalarialMasiva(input: unknown) {
  const parsed = FiltroSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };

  const perfil = await soloAdminTh();
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const supabase = createClient();
  const filas = await colaboradoresFiltrados(supabase, perfil.empresa_id, parsed.data);
  if (filas.length === 0) return { ok: true as const, actualizados: 0 };

  if (parsed.data.modo === 'fijo') {
    const { error } = await supabase
      .from('colaboradores')
      .update({ salario: parsed.data.valor })
      .in('id', filas.map((f) => f.id));
    if (error) return { ok: false as const, error: error.message };
  } else {
    const resultados = await Promise.all(
      filas.map((f) =>
        supabase
          .from('colaboradores')
          .update({ salario: salarioNuevo(f.salario, parsed.data) })
          .eq('id', f.id)
      )
    );
    const conError = resultados.find((r) => r.error);
    if (conError?.error) return { ok: false as const, error: conError.error.message };
  }

  const notaSufijo = parsed.data.nota ? ` — ${parsed.data.nota}` : '';
  const movimientos = filas.map((f) => {
    const nuevo = salarioNuevo(f.salario, parsed.data);
    const detalleValor = parsed.data.modo === 'porcentaje' ? ` (+${parsed.data.valor}%)` : '';
    return {
      colaborador_id: f.id,
      tipo: 'aumento_salarial',
      fecha: parsed.data.fecha,
      descripcion: `Alza salarial masiva: ${formatearCOP(f.salario)} → ${formatearCOP(nuevo)}${detalleValor}${notaSufijo}`,
      registrado_por: perfil.usuario_id,
    };
  });

  const { error: errorHistorial } = await supabase.from('historial_movimientos').insert(movimientos);
  if (errorHistorial) return { ok: false as const, error: errorHistorial.message };

  revalidatePath('/espiral-crecimiento/colaboradores');
  revalidatePath('/administracion/salarios');
  return { ok: true as const, actualizados: filas.length };
}
