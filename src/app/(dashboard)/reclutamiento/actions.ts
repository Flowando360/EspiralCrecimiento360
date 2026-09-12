'use server';

import { createClient } from '@/lib/supabase/server';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const RUTA = '/reclutamiento';

async function requerirAdminTh() {
  const perfil = await getPerfilActual();
  if (!perfil || perfil.rol !== 'admin_th') return null;
  return perfil;
}

// ── Vacantes ────────────────────────────────────────────────────────────
const VacanteSchema = z.object({
  cargoId: z.string().uuid('Selecciona un cargo'),
  titulo: z.string().trim().min(1, 'El título es requerido'),
  descripcion: z.string().trim().optional(),
  liderSolicitanteId: z.string().uuid().optional().or(z.literal('')),
  presupuestoSalarial: z.string().optional(),
});

export async function crearVacante(input: z.infer<typeof VacanteSchema>) {
  const perfil = await requerirAdminTh();
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const parsed = VacanteSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };

  const presupuesto = parsed.data.presupuestoSalarial?.trim() ? Number(parsed.data.presupuestoSalarial) : null;
  if (parsed.data.presupuestoSalarial?.trim() && (presupuesto === null || Number.isNaN(presupuesto))) {
    return { ok: false as const, error: 'El presupuesto salarial debe ser un número' };
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from('vacantes')
    .insert({
      empresa_id: perfil.empresa_id,
      cargo_id: parsed.data.cargoId,
      titulo: parsed.data.titulo,
      descripcion: parsed.data.descripcion || null,
      lider_solicitante_id: parsed.data.liderSolicitanteId || null,
      presupuesto_salarial: presupuesto,
      creado_por: perfil.usuario_id,
    })
    .select('id')
    .single();

  if (error) return { ok: false as const, error: error.message };
  revalidatePath(RUTA);
  return { ok: true as const, id: data.id as string };
}

const ESTADOS_VACANTE = ['abierta', 'pausada', 'cancelada', 'cubierta'] as const;

export async function actualizarEstadoVacante(id: string, estado: (typeof ESTADOS_VACANTE)[number]) {
  const perfil = await requerirAdminTh();
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const seCierra = estado === 'cancelada' || estado === 'cubierta';
  const supabase = createClient();
  const { error } = await supabase
    .from('vacantes')
    .update({ estado, fecha_cierre: seCierra ? new Date().toISOString().slice(0, 10) : null })
    .eq('id', id)
    .eq('empresa_id', perfil.empresa_id);

  if (error) return { ok: false as const, error: error.message };
  revalidatePath(RUTA);
  revalidatePath(`${RUTA}/vacantes/${id}`);
  return { ok: true as const };
}

const EditarVacanteSchema = z.object({
  vacanteId: z.string().uuid(),
  cargoId: z.string().uuid('Selecciona un cargo'),
  titulo: z.string().trim().min(1, 'El título es requerido'),
  descripcion: z.string().trim().optional(),
  liderSolicitanteId: z.string().uuid().optional().or(z.literal('')),
  presupuestoSalarial: z.string().optional(),
});

/** Edita título, descripción, cargo, líder solicitante y presupuesto de una vacante ya creada (admin_th). */
export async function actualizarVacante(input: z.infer<typeof EditarVacanteSchema>) {
  const perfil = await requerirAdminTh();
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const parsed = EditarVacanteSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };

  const presupuesto = parsed.data.presupuestoSalarial?.trim() ? Number(parsed.data.presupuestoSalarial) : null;
  if (parsed.data.presupuestoSalarial?.trim() && (presupuesto === null || Number.isNaN(presupuesto))) {
    return { ok: false as const, error: 'El presupuesto salarial debe ser un número' };
  }

  const supabase = createClient();
  const { error } = await supabase
    .from('vacantes')
    .update({
      cargo_id: parsed.data.cargoId,
      titulo: parsed.data.titulo,
      descripcion: parsed.data.descripcion || null,
      lider_solicitante_id: parsed.data.liderSolicitanteId || null,
      presupuesto_salarial: presupuesto,
    })
    .eq('id', parsed.data.vacanteId)
    .eq('empresa_id', perfil.empresa_id);

  if (error) return { ok: false as const, error: error.message };
  revalidatePath(RUTA);
  revalidatePath(`${RUTA}/vacantes/${parsed.data.vacanteId}`);
  return { ok: true as const };
}

// ── Candidatos (alta manual desde el panel — la postulación pública tiene su
// propia acción en src/app/postular/[vacanteId]/actions.ts, con service_role) ──
const CandidatoSchema = z.object({
  nombreCompleto: z.string().trim().min(1, 'El nombre es requerido'),
  numeroDocumento: z.string().trim().optional(),
  correo: z.string().trim().optional(),
  telefono: z.string().trim().optional(),
  linkedinUrl: z.string().trim().optional(),
  notas: z.string().trim().optional(),
});

export async function crearCandidato(input: z.infer<typeof CandidatoSchema>, vacanteId?: string) {
  const perfil = await requerirAdminTh();
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const parsed = CandidatoSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };

  const supabase = createClient();
  const { data, error } = await supabase
    .from('candidatos')
    .insert({
      empresa_id: perfil.empresa_id,
      nombre_completo: parsed.data.nombreCompleto,
      numero_documento: parsed.data.numeroDocumento || null,
      correo: parsed.data.correo || null,
      telefono: parsed.data.telefono || null,
      linkedin_url: parsed.data.linkedinUrl || null,
      notas: parsed.data.notas || null,
      origen: 'manual',
    })
    .select('id')
    .single();

  if (error) return { ok: false as const, error: error.message };

  if (vacanteId) {
    const { error: errorPostulacion } = await supabase
      .from('postulaciones')
      .insert({ vacante_id: vacanteId, candidato_id: data.id });
    if (errorPostulacion) return { ok: false as const, error: errorPostulacion.message };
    revalidatePath(`${RUTA}/vacantes/${vacanteId}`);
  }

  revalidatePath(`${RUTA}/candidatos`);
  return { ok: true as const, id: data.id as string };
}

export async function postularCandidatoExistente(candidatoId: string, vacanteId: string) {
  const perfil = await requerirAdminTh();
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const supabase = createClient();
  const { error } = await supabase.from('postulaciones').insert({ vacante_id: vacanteId, candidato_id: candidatoId });
  if (error) {
    return {
      ok: false as const,
      error: error.code === '23505' ? 'Este candidato ya está postulado a esta vacante' : error.message,
    };
  }
  revalidatePath(`${RUTA}/vacantes/${vacanteId}`);
  return { ok: true as const };
}

// ── Postulaciones (pipeline de selección) ──────────────────────────────
const ETAPAS_POSTULACION = ['recibido', 'preseleccionado', 'entrevista', 'prueba', 'oferta', 'contratado', 'descartado'] as const;
type EtapaPostulacion = (typeof ETAPAS_POSTULACION)[number];

export async function actualizarEtapaPostulacion(id: string, etapa: EtapaPostulacion, vacanteId: string, motivo?: string) {
  const perfil = await requerirAdminTh();
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const supabase = createClient();
  const { error } = await supabase
    .from('postulaciones')
    .update({ etapa, descartado_motivo: etapa === 'descartado' ? motivo || null : null })
    .eq('id', id);

  if (error) return { ok: false as const, error: error.message };
  revalidatePath(`${RUTA}/vacantes/${vacanteId}`);
  return { ok: true as const };
}

/**
 * Mueve una postulación al soltarla en el tablero Kanban: cambia su etapa y
 * reordena las tarjetas de la columna destino según cómo quedaron en
 * pantalla (mismo patrón que moverCaso en procesos-gestion/tablero).
 */
export async function moverPostulacion(vacanteId: string, etapaDestino: EtapaPostulacion, idsEnOrdenDestino: string[]) {
  const perfil = await requerirAdminTh();
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const supabase = createClient();
  const actualizaciones = idsEnOrdenDestino.map((id, orden) =>
    supabase.from('postulaciones').update({ etapa: etapaDestino, orden }).eq('id', id).eq('vacante_id', vacanteId)
  );
  const resultados = await Promise.all(actualizaciones);
  const error = resultados.find((r) => r.error)?.error;
  if (error) return { ok: false as const, error: error.message };

  revalidatePath(`${RUTA}/vacantes/${vacanteId}`);
  return { ok: true as const };
}

export async function actualizarCalificacionPostulacion(id: string, calificacion: number | null, vacanteId: string) {
  const perfil = await requerirAdminTh();
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const supabase = createClient();
  const { error } = await supabase.from('postulaciones').update({ calificacion }).eq('id', id);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath(`${RUTA}/vacantes/${vacanteId}`);
  return { ok: true as const };
}

export async function actualizarNotasPostulacion(id: string, notas: string, vacanteId: string) {
  const perfil = await requerirAdminTh();
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const supabase = createClient();
  const { error } = await supabase.from('postulaciones').update({ notas: notas || null }).eq('id', id);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath(`${RUTA}/vacantes/${vacanteId}`);
  return { ok: true as const };
}

// ── Entrevistas ─────────────────────────────────────────────────────────
const EntrevistaSchema = z.object({
  postulacionId: z.string().uuid(),
  entrevistadorId: z.string().uuid().optional(),
  fechaHora: z.string().min(1, 'La fecha y hora son requeridas'),
  modalidad: z.enum(['presencial', 'virtual', 'telefonica']),
});

export async function crearEntrevista(input: z.infer<typeof EntrevistaSchema>, vacanteId: string) {
  const perfil = await requerirAdminTh();
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const parsed = EntrevistaSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };

  const supabase = createClient();
  const { error } = await supabase.from('entrevistas').insert({
    postulacion_id: parsed.data.postulacionId,
    entrevistador_id: parsed.data.entrevistadorId || null,
    fecha_hora: new Date(parsed.data.fechaHora).toISOString(),
    modalidad: parsed.data.modalidad,
  });

  if (error) return { ok: false as const, error: error.message };
  revalidatePath(`${RUTA}/vacantes/${vacanteId}`);
  return { ok: true as const };
}

export async function actualizarEntrevista(
  id: string,
  estado: 'programada' | 'realizada' | 'cancelada',
  notas: string | null,
  vacanteId: string
) {
  // admin_th o el propio líder entrevistador — ambos casos ya los cubre RLS
  // ("entrevistas: admin_th administra" / "entrevistas: lider registra la
  // suya"); aquí solo se exige una sesión válida.
  const perfil = await getPerfilActual();
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const supabase = createClient();
  const { error } = await supabase.from('entrevistas').update({ estado, notas: notas || null }).eq('id', id);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath(`${RUTA}/vacantes/${vacanteId}`);
  return { ok: true as const };
}

// ── Referencias ─────────────────────────────────────────────────────────
const ReferenciaSchema = z.object({
  candidatoId: z.string().uuid(),
  nombreReferencia: z.string().trim().min(1, 'El nombre es requerido'),
  telefonoReferencia: z.string().trim().optional(),
  relacion: z.string().trim().optional(),
});

export async function crearReferencia(input: z.infer<typeof ReferenciaSchema>) {
  const perfil = await requerirAdminTh();
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const parsed = ReferenciaSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };

  const supabase = createClient();
  const { error } = await supabase.from('referencias_candidato').insert({
    candidato_id: parsed.data.candidatoId,
    nombre_referencia: parsed.data.nombreReferencia,
    telefono_referencia: parsed.data.telefonoReferencia || null,
    relacion: parsed.data.relacion || null,
  });

  if (error) return { ok: false as const, error: error.message };
  revalidatePath(`${RUTA}/candidatos/${parsed.data.candidatoId}`);
  return { ok: true as const };
}

/** Sube (o reemplaza) la hoja de vida de un candidato ya existente en el banco (admin_th) — para cuando se agregó a mano, sin pasar por la postulación pública. */
export async function subirHojaVidaCandidato(formData: FormData) {
  const perfil = await requerirAdminTh();
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const candidatoId = formData.get('candidatoId') as string;
  const archivo = formData.get('archivo') as File | null;
  if (!archivo || archivo.size === 0) return { ok: false as const, error: 'Selecciona un archivo' };
  if (archivo.size > 8 * 1024 * 1024) return { ok: false as const, error: 'La hoja de vida no puede pesar más de 8 MB.' };

  const supabase = createClient();
  const { data: candidato } = await supabase.from('candidatos').select('empresa_id').eq('id', candidatoId).maybeSingle();
  if (!candidato || candidato.empresa_id !== perfil.empresa_id) return { ok: false as const, error: 'Candidato no encontrado' };

  const extension = archivo.name.split('.').pop() || 'pdf';
  const ruta = `${perfil.empresa_id}/${crypto.randomUUID()}.${extension}`;
  const { error: errorSubida } = await supabase.storage
    .from('hojas-vida-candidatos')
    .upload(ruta, archivo, { contentType: archivo.type || undefined });
  if (errorSubida) return { ok: false as const, error: 'No se pudo subir la hoja de vida: ' + errorSubida.message };

  const { error } = await supabase.from('candidatos').update({ hoja_vida_url: ruta }).eq('id', candidatoId);
  if (error) return { ok: false as const, error: error.message };

  revalidatePath(`${RUTA}/candidatos/${candidatoId}`);
  return { ok: true as const };
}

/** Edita nombre de contacto/LinkedIn/notas del candidato (admin_th) — la ficha técnica completa. */
const EditarCandidatoSchema = z.object({
  candidatoId: z.string().uuid(),
  nombreCompleto: z.string().trim().min(1, 'El nombre es requerido'),
  correo: z.string().trim().optional(),
  telefono: z.string().trim().optional(),
  linkedinUrl: z.string().trim().optional(),
  notas: z.string().trim().optional(),
});

export async function actualizarCandidato(input: z.infer<typeof EditarCandidatoSchema>) {
  const perfil = await requerirAdminTh();
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const parsed = EditarCandidatoSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };

  const supabase = createClient();
  const { error } = await supabase
    .from('candidatos')
    .update({
      nombre_completo: parsed.data.nombreCompleto,
      correo: parsed.data.correo || null,
      telefono: parsed.data.telefono || null,
      linkedin_url: parsed.data.linkedinUrl || null,
      notas: parsed.data.notas || null,
    })
    .eq('id', parsed.data.candidatoId)
    .eq('empresa_id', perfil.empresa_id);

  if (error) return { ok: false as const, error: error.message };
  revalidatePath(`${RUTA}/candidatos/${parsed.data.candidatoId}`);
  revalidatePath(`${RUTA}/candidatos`);
  return { ok: true as const };
}

export async function verificarReferencia(id: string, candidatoId: string, notas?: string) {
  const perfil = await requerirAdminTh();
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const supabase = createClient();
  const { error } = await supabase
    .from('referencias_candidato')
    .update({ verificada: true, verificado_por: perfil.usuario_id, verificado_en: new Date().toISOString(), notas: notas || null })
    .eq('id', id);

  if (error) return { ok: false as const, error: error.message };
  revalidatePath(`${RUTA}/candidatos/${candidatoId}`);
  return { ok: true as const };
}
