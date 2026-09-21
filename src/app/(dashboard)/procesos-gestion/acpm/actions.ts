'use server';

import { createClient } from '@/lib/supabase/server';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const RUTA = '/procesos-gestion/acpm';

async function requerirAdminTh() {
  const perfil = await getPerfilActual();
  if (!perfil || perfil.rol !== 'admin_th') return null;
  return perfil;
}

async function generarCodigoAcpm(supabase: ReturnType<typeof createClient>, empresaId: string) {
  const { count } = await supabase.from('acpm').select('id', { count: 'exact', head: true }).eq('empresa_id', empresaId);
  return `ACPM-${String((count ?? 0) + 1).padStart(3, '0')}`;
}

const AcpmSchema = z.object({
  procesoId: z.string().uuid().optional(),
  origenTipo: z.enum(['hallazgo_auditoria', 'riesgo', 'indicador', 'pqrs', 'mejora_propia']),
  origenHallazgoId: z.string().uuid().optional(),
  origenRiesgoId: z.string().uuid().optional(),
  origenDetalle: z.string().trim().optional(),
  tipoAccion: z.enum(['correctiva', 'preventiva', 'mejora']),
  descripcion: z.string().trim().min(1, 'La descripción es requerida'),
  metodologiaCausa: z.enum(['cinco_porques', 'ishikawa', 'libre']).optional(),
  responsableId: z.string().uuid().optional(),
  fechaCompromiso: z.string().trim().optional(),
});

export async function crearAcpm(input: z.infer<typeof AcpmSchema>) {
  const perfil = await requerirAdminTh();
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const parsed = AcpmSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  const d = parsed.data;

  const supabase = createClient();
  const codigo = await generarCodigoAcpm(supabase, perfil.empresa_id);

  const { data, error } = await supabase
    .from('acpm')
    .insert({
      empresa_id: perfil.empresa_id,
      proceso_id: d.procesoId || null,
      codigo,
      origen_tipo: d.origenTipo,
      origen_hallazgo_id: d.origenTipo === 'hallazgo_auditoria' ? d.origenHallazgoId || null : null,
      origen_riesgo_id: d.origenTipo === 'riesgo' ? d.origenRiesgoId || null : null,
      origen_detalle: d.origenDetalle || null,
      tipo_accion: d.tipoAccion,
      descripcion: d.descripcion,
      metodologia_causa: d.metodologiaCausa || null,
      responsable_id: d.responsableId || null,
      fecha_compromiso: d.fechaCompromiso || null,
    })
    .select('id')
    .single();

  if (error) return { ok: false as const, error: error.message };
  revalidatePath(RUTA);
  return { ok: true as const, id: data.id as string, codigo };
}

const ESTADOS_ACPM = ['registrada', 'analisis_causa', 'plan_accion', 'seguimiento', 'validacion_eficacia', 'cerrada_efectiva', 'reabierta'] as const;

export async function actualizarEstadoAcpm(id: string, estado: (typeof ESTADOS_ACPM)[number]) {
  const perfil = await requerirAdminTh();
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const supabase = createClient();
  const { error } = await supabase.from('acpm').update({ estado }).eq('id', id).eq('empresa_id', perfil.empresa_id);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath(RUTA);
  return { ok: true as const };
}

const EditarAcpmSchema = AcpmSchema.extend({
  id: z.string().uuid(),
  analisisCausa: z.string().trim().optional(),
});

export async function actualizarAcpm(input: z.infer<typeof EditarAcpmSchema>) {
  const perfil = await requerirAdminTh();
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const parsed = EditarAcpmSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  const d = parsed.data;

  const supabase = createClient();
  const { error } = await supabase
    .from('acpm')
    .update({
      proceso_id: d.procesoId || null,
      origen_tipo: d.origenTipo,
      origen_hallazgo_id: d.origenTipo === 'hallazgo_auditoria' ? d.origenHallazgoId || null : null,
      origen_riesgo_id: d.origenTipo === 'riesgo' ? d.origenRiesgoId || null : null,
      origen_detalle: d.origenDetalle || null,
      tipo_accion: d.tipoAccion,
      descripcion: d.descripcion,
      metodologia_causa: d.metodologiaCausa || null,
      analisis_causa: d.analisisCausa || null,
      responsable_id: d.responsableId || null,
      fecha_compromiso: d.fechaCompromiso || null,
    })
    .eq('id', d.id)
    .eq('empresa_id', perfil.empresa_id);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath(RUTA);
  return { ok: true as const };
}

const CerrarAcpmSchema = z.object({
  id: z.string().uuid(),
  eficaz: z.boolean(),
  evidenciaUrl: z.string().trim().optional(),
});

/** Validación de eficacia: cierra la ACPM como efectiva, o la reabre si la causa no se eliminó. */
export async function cerrarAcpm(input: z.infer<typeof CerrarAcpmSchema>) {
  const perfil = await requerirAdminTh();
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const parsed = CerrarAcpmSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  const d = parsed.data;

  const supabase = createClient();
  const { error } = await supabase
    .from('acpm')
    .update({
      eficaz: d.eficaz,
      evidencia_eficacia_url: d.evidenciaUrl || null,
      estado: d.eficaz ? 'cerrada_efectiva' : 'reabierta',
      fecha_cierre: d.eficaz ? new Date().toISOString().slice(0, 10) : null,
    })
    .eq('id', d.id)
    .eq('empresa_id', perfil.empresa_id);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath(RUTA);
  return { ok: true as const };
}

export async function eliminarAcpm(id: string) {
  const perfil = await requerirAdminTh();
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const supabase = createClient();
  const { error } = await supabase.from('acpm').delete().eq('id', id).eq('empresa_id', perfil.empresa_id);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath(RUTA);
  return { ok: true as const };
}

const TareaSchema = z.object({
  acpmId: z.string().uuid(),
  descripcion: z.string().trim().min(1, 'La descripción es requerida'),
  responsableId: z.string().uuid().optional(),
  fechaLimite: z.string().trim().optional(),
});

export async function agregarTarea(input: z.infer<typeof TareaSchema>) {
  const perfil = await requerirAdminTh();
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const parsed = TareaSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  const d = parsed.data;

  const supabase = createClient();
  const { count } = await supabase.from('tareas_acpm').select('id', { count: 'exact', head: true }).eq('acpm_id', d.acpmId);

  const { data, error } = await supabase
    .from('tareas_acpm')
    .insert({
      acpm_id: d.acpmId,
      descripcion: d.descripcion,
      responsable_id: d.responsableId || null,
      fecha_limite: d.fechaLimite || null,
      orden: (count ?? 0) + 1,
    })
    .select('id')
    .single();

  if (error) return { ok: false as const, error: error.message };
  revalidatePath(RUTA);
  return { ok: true as const, id: data.id as string };
}

export async function actualizarTarea(id: string, completada: boolean) {
  const perfil = await requerirAdminTh();
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const supabase = createClient();
  const { error } = await supabase.from('tareas_acpm').update({ completada }).eq('id', id);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath(RUTA);
  return { ok: true as const };
}

export async function eliminarTarea(id: string) {
  const perfil = await requerirAdminTh();
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const supabase = createClient();
  const { error } = await supabase.from('tareas_acpm').delete().eq('id', id);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath(RUTA);
  return { ok: true as const };
}
