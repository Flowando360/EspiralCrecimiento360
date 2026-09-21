'use server';

import { createClient } from '@/lib/supabase/server';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const RUTA = '/procesos-gestion/auditorias';

async function requerirAdminTh() {
  const perfil = await getPerfilActual();
  if (!perfil || perfil.rol !== 'admin_th') return null;
  return perfil;
}

async function generarCodigoAuditoria(supabase: ReturnType<typeof createClient>, empresaId: string) {
  const { count } = await supabase.from('auditorias_internas').select('id', { count: 'exact', head: true }).eq('empresa_id', empresaId);
  return `AI-${String((count ?? 0) + 1).padStart(3, '0')}`;
}

async function generarCodigoHallazgo(supabase: ReturnType<typeof createClient>, auditoriaId: string, auditoriaCodigo: string | null) {
  const { count } = await supabase.from('hallazgos_auditoria').select('id', { count: 'exact', head: true }).eq('auditoria_id', auditoriaId);
  return `H-${auditoriaCodigo ?? 'AI'}-${String((count ?? 0) + 1).padStart(2, '0')}`;
}

const AuditoriaSchema = z.object({
  objetivo: z.string().trim().optional(),
  alcance: z.string().trim().optional(),
  marcoNormativo: z.enum(['iso_9001', 'sst', 'sarlaft_sagrilaft', 'ptee', 'interno']).optional(),
  auditorId: z.string().uuid().optional(),
  auditorExternoNombre: z.string().trim().optional(),
  fechaPlaneada: z.string().trim().optional(),
  procesoIds: z.array(z.string().uuid()),
});

export async function crearAuditoria(input: z.infer<typeof AuditoriaSchema>) {
  const perfil = await requerirAdminTh();
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const parsed = AuditoriaSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  const d = parsed.data;

  const supabase = createClient();
  const codigo = await generarCodigoAuditoria(supabase, perfil.empresa_id);

  const { data, error } = await supabase
    .from('auditorias_internas')
    .insert({
      empresa_id: perfil.empresa_id,
      codigo,
      objetivo: d.objetivo || null,
      alcance: d.alcance || null,
      marco_normativo: d.marcoNormativo || null,
      auditor_id: d.auditorId || null,
      auditor_externo_nombre: d.auditorExternoNombre || null,
      fecha_planeada: d.fechaPlaneada || null,
    })
    .select('id')
    .single();

  if (error) return { ok: false as const, error: error.message };
  const auditoriaId = data.id as string;

  if (d.procesoIds.length > 0) {
    await supabase.from('auditoria_procesos').insert(d.procesoIds.map((proceso_id) => ({ auditoria_id: auditoriaId, proceso_id })));
  }

  revalidatePath(RUTA);
  return { ok: true as const, id: auditoriaId, codigo };
}

const EditarAuditoriaSchema = AuditoriaSchema.extend({
  id: z.string().uuid(),
  estado: z.enum(['planeada', 'en_curso', 'cerrada']),
  fechaEjecutada: z.string().trim().optional(),
});

export async function actualizarAuditoria(input: z.infer<typeof EditarAuditoriaSchema>) {
  const perfil = await requerirAdminTh();
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const parsed = EditarAuditoriaSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  const d = parsed.data;

  const supabase = createClient();
  const { error } = await supabase
    .from('auditorias_internas')
    .update({
      objetivo: d.objetivo || null,
      alcance: d.alcance || null,
      marco_normativo: d.marcoNormativo || null,
      auditor_id: d.auditorId || null,
      auditor_externo_nombre: d.auditorExternoNombre || null,
      fecha_planeada: d.fechaPlaneada || null,
      fecha_ejecutada: d.fechaEjecutada || null,
      estado: d.estado,
    })
    .eq('id', d.id)
    .eq('empresa_id', perfil.empresa_id);
  if (error) return { ok: false as const, error: error.message };

  await supabase.from('auditoria_procesos').delete().eq('auditoria_id', d.id);
  if (d.procesoIds.length > 0) {
    await supabase.from('auditoria_procesos').insert(d.procesoIds.map((proceso_id) => ({ auditoria_id: d.id, proceso_id })));
  }

  revalidatePath(RUTA);
  revalidatePath(`${RUTA}/${d.id}`);
  return { ok: true as const };
}

export async function eliminarAuditoria(id: string) {
  const perfil = await requerirAdminTh();
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const supabase = createClient();
  const { error } = await supabase.from('auditorias_internas').delete().eq('id', id).eq('empresa_id', perfil.empresa_id);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath(RUTA);
  return { ok: true as const };
}

const HallazgoSchema = z.object({
  auditoriaId: z.string().uuid(),
  procesoId: z.string().uuid().optional(),
  tipo: z.enum(['no_conformidad_mayor', 'no_conformidad_menor', 'observacion', 'oportunidad_mejora']),
  descripcion: z.string().trim().min(1, 'La descripción es requerida'),
  requisitoIncumplido: z.string().trim().optional(),
  responsableId: z.string().uuid().optional(),
});

export async function agregarHallazgo(input: z.infer<typeof HallazgoSchema>) {
  const perfil = await requerirAdminTh();
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const parsed = HallazgoSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  const d = parsed.data;

  const supabase = createClient();
  const { data: auditoria } = await supabase.from('auditorias_internas').select('codigo').eq('id', d.auditoriaId).maybeSingle();
  const codigo = await generarCodigoHallazgo(supabase, d.auditoriaId, (auditoria?.codigo as string) ?? null);

  const { data, error } = await supabase
    .from('hallazgos_auditoria')
    .insert({
      auditoria_id: d.auditoriaId,
      proceso_id: d.procesoId || null,
      codigo,
      tipo: d.tipo,
      descripcion: d.descripcion,
      requisito_incumplido: d.requisitoIncumplido || null,
      responsable_id: d.responsableId || null,
    })
    .select('id')
    .single();

  if (error) return { ok: false as const, error: error.message };
  revalidatePath(`${RUTA}/${d.auditoriaId}`);
  return { ok: true as const, id: data.id as string, codigo };
}

export async function actualizarEstadoHallazgo(auditoriaId: string, id: string, estado: 'abierto' | 'analisis_causa' | 'plan_accion' | 'seguimiento' | 'cerrado') {
  const perfil = await requerirAdminTh();
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const supabase = createClient();
  const { error } = await supabase
    .from('hallazgos_auditoria')
    .update({ estado, fecha_cierre: estado === 'cerrado' ? new Date().toISOString().slice(0, 10) : null })
    .eq('id', id);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath(`${RUTA}/${auditoriaId}`);
  return { ok: true as const };
}

const EditarHallazgoSchema = HallazgoSchema.omit({ auditoriaId: true }).extend({ id: z.string().uuid(), auditoriaId: z.string().uuid() });

export async function actualizarHallazgo(input: z.infer<typeof EditarHallazgoSchema>) {
  const perfil = await requerirAdminTh();
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const parsed = EditarHallazgoSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  const d = parsed.data;

  const supabase = createClient();
  const { error } = await supabase
    .from('hallazgos_auditoria')
    .update({
      proceso_id: d.procesoId || null,
      tipo: d.tipo,
      descripcion: d.descripcion,
      requisito_incumplido: d.requisitoIncumplido || null,
      responsable_id: d.responsableId || null,
    })
    .eq('id', d.id);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath(`${RUTA}/${d.auditoriaId}`);
  return { ok: true as const };
}

export async function eliminarHallazgo(auditoriaId: string, id: string) {
  const perfil = await requerirAdminTh();
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const supabase = createClient();
  const { error } = await supabase.from('hallazgos_auditoria').delete().eq('id', id);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath(`${RUTA}/${auditoriaId}`);
  return { ok: true as const };
}
