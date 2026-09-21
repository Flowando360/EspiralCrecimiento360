'use server';

import { createClient } from '@/lib/supabase/server';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { otorgarPuntos, PUNTOS_PROCESOS } from '@/lib/nexa/gamificacion';

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

const EditarProcesoSchema = z.object({
  id: z.string().uuid(),
  areaProceso: z.string().trim().min(1, 'El área/proceso es requerido'),
  nombre: z.string().trim().min(1, 'El nombre es requerido'),
  descripcion: z.string().trim().optional(),
  version: z.string().trim().optional(),
});

export async function actualizarProceso(input: z.infer<typeof EditarProcesoSchema>) {
  const perfil = await requerirAdminTh();
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const parsed = EditarProcesoSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };

  const supabase = createClient();
  const { error } = await supabase
    .from('procesos_gestion')
    .update({
      area_proceso: parsed.data.areaProceso,
      nombre: parsed.data.nombre,
      descripcion: parsed.data.descripcion || null,
      version: parsed.data.version || null,
      fecha_actualizacion: new Date().toISOString().slice(0, 10),
    })
    .eq('id', parsed.data.id)
    .eq('empresa_id', perfil.empresa_id);

  if (error) return { ok: false as const, error: error.message };
  revalidatePath(RUTA);
  return { ok: true as const };
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
  marcoNormativo: z.enum(['iso_9001', 'sst', 'sarlaft_sagrilaft', 'ptee', 'interno']),
  tipo: z.enum(['riesgo', 'oportunidad']).default('riesgo'),
  riesgo: z.string().trim().min(1, 'El riesgo es requerido'),
  categoriaRiesgo: z.string().trim().optional(),
  probabilidad: z.enum(['baja', 'media', 'alta']).optional(),
  impacto: z.enum(['bajo', 'medio', 'alto']).optional(),
  control: z.string().trim().optional(),
  procesoId: z.string().uuid().optional(),
  frecuenciaRevision: z.enum(['trimestral', 'semestral', 'anual']).optional(),
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
      tipo: parsed.data.tipo,
      riesgo: parsed.data.riesgo,
      categoria_riesgo: parsed.data.categoriaRiesgo || null,
      probabilidad: parsed.data.probabilidad || null,
      impacto: parsed.data.impacto || null,
      control: parsed.data.control || null,
      proceso_id: parsed.data.procesoId || null,
      frecuencia_revision: parsed.data.frecuenciaRevision || null,
      fecha_ultima_revision: new Date().toISOString().slice(0, 10),
    })
    .select('id')
    .single();

  if (error) return { ok: false as const, error: error.message };
  if (parsed.data.control?.trim()) {
    await otorgarPuntos(perfil.colaborador_id, PUNTOS_PROCESOS.registrarRiesgoConControl, `Registró ${parsed.data.tipo === 'oportunidad' ? 'una oportunidad' : 'un riesgo'} con control definido`, perfil.usuario_id);
  }
  revalidatePath(RUTA);
  return { ok: true as const, id: data.id as string };
}

const EditarRiesgoSchema = z.object({
  id: z.string().uuid(),
  marcoNormativo: z.enum(['iso_9001', 'sst', 'sarlaft_sagrilaft', 'ptee', 'interno']),
  tipo: z.enum(['riesgo', 'oportunidad']).default('riesgo'),
  riesgo: z.string().trim().min(1, 'El riesgo es requerido'),
  categoriaRiesgo: z.string().trim().optional(),
  probabilidad: z.enum(['baja', 'media', 'alta']).optional().or(z.literal('')),
  impacto: z.enum(['bajo', 'medio', 'alto']).optional().or(z.literal('')),
  control: z.string().trim().optional(),
  procesoId: z.string().uuid().optional(),
  frecuenciaRevision: z.enum(['trimestral', 'semestral', 'anual']).optional().or(z.literal('')),
  riesgoResidual: z.enum(['bajo', 'medio', 'alto']).optional().or(z.literal('')),
});

export async function actualizarRiesgo(input: z.infer<typeof EditarRiesgoSchema>) {
  const perfil = await requerirAdminTh();
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const parsed = EditarRiesgoSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };

  const supabase = createClient();
  const { error } = await supabase
    .from('matriz_riesgos_controles')
    .update({
      marco_normativo: parsed.data.marcoNormativo,
      tipo: parsed.data.tipo,
      riesgo: parsed.data.riesgo,
      categoria_riesgo: parsed.data.categoriaRiesgo || null,
      probabilidad: parsed.data.probabilidad || null,
      impacto: parsed.data.impacto || null,
      control: parsed.data.control || null,
      proceso_id: parsed.data.procesoId || null,
      frecuencia_revision: parsed.data.frecuenciaRevision || null,
      riesgo_residual: parsed.data.riesgoResidual || null,
    })
    .eq('id', parsed.data.id)
    .eq('empresa_id', perfil.empresa_id);

  if (error) return { ok: false as const, error: error.message };
  revalidatePath(RUTA);
  return { ok: true as const };
}

/** Revisión periódica (flujo diferenciador 3 de Nexus): confirma/actualiza el riesgo y estampa fecha_ultima_revision = hoy, recalculando el riesgo residual. */
export async function marcarRiesgoRevisado(input: {
  id: string;
  probabilidad: 'baja' | 'media' | 'alta';
  impacto: 'bajo' | 'medio' | 'alto';
  riesgoResidual: 'bajo' | 'medio' | 'alto';
}) {
  const perfil = await requerirAdminTh();
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const supabase = createClient();
  const { error } = await supabase
    .from('matriz_riesgos_controles')
    .update({
      probabilidad: input.probabilidad,
      impacto: input.impacto,
      riesgo_residual: input.riesgoResidual,
      fecha_ultima_revision: new Date().toISOString().slice(0, 10),
    })
    .eq('id', input.id)
    .eq('empresa_id', perfil.empresa_id);

  if (error) return { ok: false as const, error: error.message };
  await otorgarPuntos(perfil.colaborador_id, PUNTOS_PROCESOS.marcarRiesgoRevisado, 'Revisó un riesgo/oportunidad a tiempo', perfil.usuario_id);
  revalidatePath(RUTA);
  return { ok: true as const };
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
  marcoNormativo: z.enum(['iso_9001', 'sst', 'sarlaft_sagrilaft', 'ptee']),
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

const EditarChecklistSchema = z.object({
  id: z.string().uuid(),
  marcoNormativo: z.enum(['iso_9001', 'sst', 'sarlaft_sagrilaft', 'ptee']),
  item: z.string().trim().min(1, 'El ítem es requerido'),
  descripcion: z.string().trim().optional(),
  observaciones: z.string().trim().optional(),
});

/** Edita el texto del ítem (no el estado — eso ya lo maneja actualizarEstadoChecklist). admin_th. */
export async function actualizarChecklistItem(input: z.infer<typeof EditarChecklistSchema>) {
  const perfil = await requerirAdminTh();
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const parsed = EditarChecklistSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };

  const supabase = createClient();
  const { error } = await supabase
    .from('checklist_cumplimiento')
    .update({
      marco_normativo: parsed.data.marcoNormativo,
      item: parsed.data.item,
      descripcion: parsed.data.descripcion || null,
      observaciones: parsed.data.observaciones || null,
    })
    .eq('id', parsed.data.id)
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

// ============================================================================
// Bloque 1 — Mapa de procesos: tipo, código, objetivo, marcos normativos e
// interacciones (de las que la pantalla de mapa genera las flechas solas).
// ============================================================================

const TIPO_PROCESO = ['estrategico', 'misional', 'apoyo', 'evaluacion'] as const;
const PREFIJO_TIPO: Record<(typeof TIPO_PROCESO)[number], string> = {
  estrategico: 'PE',
  misional: 'PM',
  apoyo: 'PA',
  evaluacion: 'EV',
};
const MARCO_NORMATIVO = ['iso_9001', 'sst', 'sarlaft_sagrilaft', 'ptee', 'interno'] as const;

async function generarCodigoProceso(supabase: ReturnType<typeof createClient>, empresaId: string, tipo: (typeof TIPO_PROCESO)[number]) {
  const { count } = await supabase
    .from('procesos_gestion')
    .select('id', { count: 'exact', head: true })
    .eq('empresa_id', empresaId)
    .eq('tipo', tipo);
  return `${PREFIJO_TIPO[tipo]}-${(count ?? 0) + 1}`;
}

const InteraccionInputSchema = z.object({
  procesoId: z.string().uuid(),
  descripcion: z.string().trim().optional(),
  tipo: z.enum(['entrada', 'apoyo']),
  direccion: z.enum(['entra', 'sale']), // 'entra': procesoId me entrega a mí. 'sale': yo le entrego a procesoId.
});

const ProcesoCompletoSchema = z.object({
  areaProceso: z.string().trim().min(1, 'El área/proceso es requerida'),
  nombre: z.string().trim().min(1, 'El nombre es requerido'),
  tipo: z.enum(TIPO_PROCESO),
  responsableId: z.string().uuid().optional(),
  objetivo: z.string().trim().optional(),
  descripcion: z.string().trim().optional(),
  version: z.string().trim().optional(),
  marcosNormativos: z.array(z.enum(MARCO_NORMATIVO)),
  interacciones: z.array(InteraccionInputSchema),
});

export async function crearProcesoCompleto(input: z.infer<typeof ProcesoCompletoSchema>) {
  const perfil = await requerirAdminTh();
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const parsed = ProcesoCompletoSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  const d = parsed.data;

  const supabase = createClient();
  const codigo = await generarCodigoProceso(supabase, perfil.empresa_id, d.tipo);

  const { data: proceso, error } = await supabase
    .from('procesos_gestion')
    .insert({
      empresa_id: perfil.empresa_id,
      area_proceso: d.areaProceso,
      nombre: d.nombre,
      tipo: d.tipo,
      codigo,
      responsable_id: d.responsableId || null,
      objetivo: d.objetivo || null,
      descripcion: d.descripcion || null,
      version: d.version || null,
    })
    .select('id')
    .single();

  if (error) return { ok: false as const, error: error.message };
  const procesoId = proceso.id as string;

  if (d.marcosNormativos.length > 0) {
    await supabase
      .from('proceso_marcos_normativos')
      .insert(d.marcosNormativos.map((marco_normativo) => ({ proceso_id: procesoId, marco_normativo })));
  }

  if (d.interacciones.length > 0) {
    await supabase.from('interacciones_proceso').insert(
      d.interacciones.map((i) => ({
        proceso_origen_id: i.direccion === 'entra' ? i.procesoId : procesoId,
        proceso_destino_id: i.direccion === 'entra' ? procesoId : i.procesoId,
        tipo: i.tipo,
        descripcion: i.descripcion || null,
      }))
    );
  }

  revalidatePath(RUTA);
  return { ok: true as const, id: procesoId, codigo };
}

const EditarProcesoCompletoSchema = ProcesoCompletoSchema.extend({ id: z.string().uuid() });

/** Actualiza identidad + marcos + interacciones. Reemplaza marcos/interacciones en vez de diferenciar — más simple y el volumen por proceso es bajo. */
export async function actualizarProcesoCompleto(input: z.infer<typeof EditarProcesoCompletoSchema>) {
  const perfil = await requerirAdminTh();
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const parsed = EditarProcesoCompletoSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  const d = parsed.data;

  const supabase = createClient();
  const { error } = await supabase
    .from('procesos_gestion')
    .update({
      area_proceso: d.areaProceso,
      nombre: d.nombre,
      tipo: d.tipo,
      responsable_id: d.responsableId || null,
      objetivo: d.objetivo || null,
      descripcion: d.descripcion || null,
      version: d.version || null,
      fecha_actualizacion: new Date().toISOString().slice(0, 10),
    })
    .eq('id', d.id)
    .eq('empresa_id', perfil.empresa_id);
  if (error) return { ok: false as const, error: error.message };

  await supabase.from('proceso_marcos_normativos').delete().eq('proceso_id', d.id);
  if (d.marcosNormativos.length > 0) {
    await supabase
      .from('proceso_marcos_normativos')
      .insert(d.marcosNormativos.map((marco_normativo) => ({ proceso_id: d.id, marco_normativo })));
  }

  await supabase.from('interacciones_proceso').delete().or(`proceso_origen_id.eq.${d.id},proceso_destino_id.eq.${d.id}`);
  if (d.interacciones.length > 0) {
    await supabase.from('interacciones_proceso').insert(
      d.interacciones.map((i) => ({
        proceso_origen_id: i.direccion === 'entra' ? i.procesoId : d.id,
        proceso_destino_id: i.direccion === 'entra' ? d.id : i.procesoId,
        tipo: i.tipo,
        descripcion: i.descripcion || null,
      }))
    );
  }

  revalidatePath(RUTA);
  revalidatePath(`${RUTA}/${d.id}`);
  return { ok: true as const };
}

export async function cambiarEstadoProceso(id: string, estado: 'vigente' | 'en_definicion' | 'obsoleto') {
  const perfil = await requerirAdminTh();
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const supabase = createClient();
  const { error } = await supabase
    .from('procesos_gestion')
    .update({ estado })
    .eq('id', id)
    .eq('empresa_id', perfil.empresa_id);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath(RUTA);
  return { ok: true as const };
}

// ============================================================================
// Bloque 2 — Caracterización (ficha SIPOC): entradas, actividades y salidas.
// ============================================================================

const ElementoProcesoSchema = z.object({
  procesoId: z.string().uuid(),
  tipo: z.enum(['entrada', 'actividad', 'salida']),
  descripcion: z.string().trim().min(1, 'La descripción es requerida'),
  procesoRelacionadoId: z.string().uuid().optional(),
});

export async function agregarElementoProceso(input: z.infer<typeof ElementoProcesoSchema>) {
  const perfil = await requerirAdminTh();
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const parsed = ElementoProcesoSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  const d = parsed.data;

  const supabase = createClient();
  const { count } = await supabase
    .from('elementos_proceso')
    .select('id', { count: 'exact', head: true })
    .eq('proceso_id', d.procesoId)
    .eq('tipo', d.tipo);

  const { data, error } = await supabase
    .from('elementos_proceso')
    .insert({
      proceso_id: d.procesoId,
      tipo: d.tipo,
      descripcion: d.descripcion,
      proceso_relacionado_id: d.procesoRelacionadoId || null,
      orden: (count ?? 0) + 1,
    })
    .select('id')
    .single();

  if (error) return { ok: false as const, error: error.message };
  revalidatePath(`${RUTA}/${d.procesoId}`);
  return { ok: true as const, id: data.id as string };
}

export async function eliminarElementoProceso(procesoId: string, id: string) {
  const perfil = await requerirAdminTh();
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const supabase = createClient();
  const { error } = await supabase.from('elementos_proceso').delete().eq('id', id);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath(`${RUTA}/${procesoId}`);
  return { ok: true as const };
}
