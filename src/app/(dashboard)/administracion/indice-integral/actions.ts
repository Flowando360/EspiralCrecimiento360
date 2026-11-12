'use server';

import { createClient } from '@/lib/supabase/server';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { puedeAdministrar } from '@/lib/permisos/administracion';
import { registrarAuditoria } from '@/lib/auditoria/registrar';
import { pesosValidos, PESOS_POR_DEFECTO } from '@/lib/desempeno/indice-integral';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const NIVELES = ['operativo', 'tecnico_administrativo', 'supervision', 'directivo'] as const;

const PesosSchema = z.object({
  nivel: z.enum(NIVELES),
  saber: z.number().min(0).max(100),
  hacer: z.number().min(0).max(100),
  deber: z.number().min(0).max(100),
});

/** Guarda los pesos de Saber, Hacer y Deber de un nivel de cargo. Deben sumar 100 %. */
export async function guardarPesosDimensiones(input: z.infer<typeof PesosSchema>) {
  const perfil = await getPerfilActual();
  if (!perfil || !puedeAdministrar(perfil)) return { ok: false as const, error: 'No autorizado' };
  const parsed = PesosSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: 'Datos inválidos' };
  const { nivel, saber, hacer, deber } = parsed.data;
  if (!pesosValidos({ saber, hacer, deber })) return { ok: false as const, error: 'Los tres pesos deben sumar exactamente 100 %' };

  const supabase = createClient();
  const { data: antes } = await supabase.from('ponderacion_dimensiones_nivel').select('peso_saber, peso_hacer, peso_deber').eq('empresa_id', perfil.empresa_id).eq('nivel_cargo', nivel).maybeSingle();
  const { error } = await supabase
    .from('ponderacion_dimensiones_nivel')
    .upsert({ empresa_id: perfil.empresa_id, nivel_cargo: nivel, peso_saber: saber, peso_hacer: hacer, peso_deber: deber, actualizado_en: new Date().toISOString() }, { onConflict: 'empresa_id,nivel_cargo' });
  if (error) return { ok: false as const, error: error.message };

  await registrarAuditoria(perfil, {
    modulo: 'ponderaciones',
    accion: 'ponderacion.dimensiones',
    resumen: `Cambió los pesos del índice integral para el nivel ${nivel}: Saber ${saber} %, Hacer ${hacer} %, Deber ${deber} %`,
    objetoTipo: 'nivel_cargo',
    objetoId: nivel,
    detalle: { antes: antes ?? PESOS_POR_DEFECTO, despues: { saber, hacer, deber } },
  });
  revalidatePath('/administracion/indice-integral');
  return { ok: true as const };
}

/** Vuelve a los pesos de partida (25 / 40 / 35) para ese nivel. */
export async function restablecerPesosDimensiones(nivel: (typeof NIVELES)[number]) {
  const perfil = await getPerfilActual();
  if (!perfil || !puedeAdministrar(perfil)) return { ok: false as const, error: 'No autorizado' };
  if (!NIVELES.includes(nivel)) return { ok: false as const, error: 'Nivel inválido' };

  const supabase = createClient();
  const { error } = await supabase.from('ponderacion_dimensiones_nivel').delete().eq('empresa_id', perfil.empresa_id).eq('nivel_cargo', nivel);
  if (error) return { ok: false as const, error: error.message };

  await registrarAuditoria(perfil, {
    modulo: 'ponderaciones',
    accion: 'ponderacion.dimensiones',
    resumen: `Restableció los pesos del índice integral del nivel ${nivel} a los de partida (25 / 40 / 35)`,
    objetoTipo: 'nivel_cargo',
    objetoId: nivel,
  });
  revalidatePath('/administracion/indice-integral');
  return { ok: true as const };
}
