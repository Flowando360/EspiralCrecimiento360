'use server';

import { createClient } from '@/lib/supabase/server';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const RUTA = '/procesos-gestion';

async function requerirAdminTh() {
  const perfil = await getPerfilActual();
  if (!perfil || perfil.rol !== 'admin_th') return null;
  return perfil;
}

const ProcesoSchema = z.object({
  areaProceso: z.string().trim().min(1, 'El área/proceso es requerido'),
  nombre: z.string().trim().min(1, 'El nombre es requerido'),
  descripcion: z.string().trim().optional(),
  version: z.string().trim().optional(),
});

export async function crearProceso(input: z.infer<typeof ProcesoSchema>) {
  const perfil = await requerirAdminTh();
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const parsed = ProcesoSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };

  const supabase = createClient();
  const { data, error } = await supabase
    .from('procesos_gestion')
    .insert({
      empresa_id: perfil.empresa_id,
      area_proceso: parsed.data.areaProceso,
      nombre: parsed.data.nombre,
      descripcion: parsed.data.descripcion || null,
      version: parsed.data.version || null,
    })
    .select('id')
    .single();

  if (error) return { ok: false as const, error: error.message };
  revalidatePath(RUTA);
  return { ok: true as const, id: data.id as string };
}

export async function eliminarProceso(id: string) {
  const perfil = await requerirAdminTh();
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const supabase = createClient();
  const { error } = await supabase.from('procesos_gestion').delete().eq('id', id).eq('empresa_id', perfil.empresa_id);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath(RUTA);
  return { ok: true as const };
}

const RiesgoSchema = z.object({
  marcoNormativo: z.enum(['iso_9001', 'sarlaft_sagrilaft', 'ptee', 'interno']),
  riesgo: z.string().trim().min(1, 'El riesgo es requerido'),
  categoriaRiesgo: z.string().trim().optional(),
  probabilidad: z.enum(['baja', 'media', 'alta']).optional(),
  impacto: z.enum(['bajo', 'medio', 'alto']).optional(),
  control: z.string().trim().optional(),
});

export async function crearRiesgo(input: z.infer<typeof RiesgoSchema>) {
  const perfil = await requerirAdminTh();
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const parsed = RiesgoSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };

  const supabase = createClient();
  const { data, error } = await supabase
    .from('matriz_riesgos_controles')
    .insert({
      empresa_id: perfil.empresa_id,
      marco_normativo: parsed.data.marcoNormativo,
      riesgo: parsed.data.riesgo,
      categoria_riesgo: parsed.data.categoriaRiesgo || null,
      probabilidad: parsed.data.probabilidad || null,
      impacto: parsed.data.impacto || null,
      control: parsed.data.control || null,
    })
    .select('id')
    .single();

  if (error) return { ok: false as const, error: error.message };
  revalidatePath(RUTA);
  return { ok: true as const, id: data.id as string };
}

export async function eliminarRiesgo(id: string) {
  const perfil = await requerirAdminTh();
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const supabase = createClient();
  const { error } = await supabase.from('matriz_riesgos_controles').delete().eq('id', id).eq('empresa_id', perfil.empresa_id);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath(RUTA);
  return { ok: true as const };
}

const ChecklistSchema = z.object({
  marcoNormativo: z.enum(['iso_9001', 'sarlaft_sagrilaft', 'ptee']),
  item: z.string().trim().min(1, 'El ítem es requerido'),
  descripcion: z.string().trim().optional(),
  estado: z.enum(['cumple', 'cumple_parcial', 'no_cumple', 'no_aplica']),
  evidenciaUrl: z.string().trim().optional(),
  observaciones: z.string().trim().optional(),
});

export async function crearChecklistItem(input: z.infer<typeof ChecklistSchema>) {
  const perfil = await requerirAdminTh();
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const parsed = ChecklistSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };

  const supabase = createClient();
  const { data, error } = await supabase
    .from('checklist_cumplimiento')
    .insert({
      empresa_id: perfil.empresa_id,
      marco_normativo: parsed.data.marcoNormativo,
      item: parsed.data.item,
      descripcion: parsed.data.descripcion || null,
      estado: parsed.data.estado,
      evidencia_url: parsed.data.evidenciaUrl || null,
      observaciones: parsed.data.observaciones || null,
    })
    .select('id')
    .single();

  if (error) return { ok: false as const, error: error.message };
  revalidatePath(RUTA);
  return { ok: true as const, id: data.id as string };
}

export async function actualizarEstadoChecklist(id: string, estado: 'cumple' | 'cumple_parcial' | 'no_cumple' | 'no_aplica') {
  const perfil = await requerirAdminTh();
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const supabase = createClient();
  const { error } = await supabase
    .from('checklist_cumplimiento')
    .update({ estado, fecha_verificacion: new Date().toISOString().slice(0, 10) })
    .eq('id', id)
    .eq('empresa_id', perfil.empresa_id);

  if (error) return { ok: false as const, error: error.message };
  revalidatePath(RUTA);
  return { ok: true as const };
}

export async function eliminarChecklistItem(id: string) {
  const perfil = await requerirAdminTh();
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const supabase = createClient();
  const { error } = await supabase.from('checklist_cumplimiento').delete().eq('id', id).eq('empresa_id', perfil.empresa_id);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath(RUTA);
  return { ok: true as const };
}
