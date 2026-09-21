'use server';

import { createClient } from '@/lib/supabase/server';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

async function requerirAdminTh() {
  const perfil = await getPerfilActual();
  if (!perfil || perfil.rol !== 'admin_th') return null;
  return perfil;
}

const IndicadorSchema = z.object({
  procesoId: z.string().uuid(),
  nombre: z.string().trim().min(1, 'El nombre es requerido'),
  formula: z.string().trim().optional(),
  meta: z.number().optional(),
  unidad: z.enum(['numero', 'porcentaje', 'dias', 'moneda']),
  sentido: z.enum(['mayor_mejor', 'menor_mejor']),
  frecuenciaMedicion: z.enum(['mensual', 'trimestral', 'semestral', 'anual']).optional(),
  responsableId: z.string().uuid().optional(),
});

export async function crearIndicador(input: z.infer<typeof IndicadorSchema>) {
  const perfil = await requerirAdminTh();
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const parsed = IndicadorSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  const d = parsed.data;

  const supabase = createClient();
  const { data, error } = await supabase
    .from('indicadores_proceso')
    .insert({
      proceso_id: d.procesoId,
      nombre: d.nombre,
      formula: d.formula || null,
      meta: d.meta ?? null,
      unidad: d.unidad,
      sentido: d.sentido,
      frecuencia_medicion: d.frecuenciaMedicion || null,
      responsable_id: d.responsableId || null,
    })
    .select('id')
    .single();

  if (error) return { ok: false as const, error: error.message };
  revalidatePath(`/procesos-gestion/${d.procesoId}`);
  return { ok: true as const, id: data.id as string };
}

export async function eliminarIndicador(procesoId: string, id: string) {
  const perfil = await requerirAdminTh();
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const supabase = createClient();
  const { error } = await supabase.from('indicadores_proceso').delete().eq('id', id);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath(`/procesos-gestion/${procesoId}`);
  return { ok: true as const };
}

const MedicionSchema = z.object({
  procesoId: z.string().uuid(),
  indicadorId: z.string().uuid(),
  periodo: z.string().trim().min(1, 'El período es requerido'),
  valor: z.number(),
  observaciones: z.string().trim().optional(),
});

export async function agregarMedicion(input: z.infer<typeof MedicionSchema>) {
  const perfil = await requerirAdminTh();
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const parsed = MedicionSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  const d = parsed.data;

  const supabase = createClient();
  const { data, error } = await supabase
    .from('mediciones_indicador')
    .insert({ indicador_id: d.indicadorId, periodo: d.periodo, valor: d.valor, observaciones: d.observaciones || null })
    .select('id')
    .single();

  if (error) return { ok: false as const, error: error.message };
  revalidatePath(`/procesos-gestion/${d.procesoId}`);
  return { ok: true as const, id: data.id as string };
}

export async function eliminarMedicion(procesoId: string, id: string) {
  const perfil = await requerirAdminTh();
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const supabase = createClient();
  const { error } = await supabase.from('mediciones_indicador').delete().eq('id', id);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath(`/procesos-gestion/${procesoId}`);
  return { ok: true as const };
}
