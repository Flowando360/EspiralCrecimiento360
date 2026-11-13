'use server';

import { createClient } from '@/lib/supabase/server';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { buscarCandidatoExistente } from '@/lib/reclutamiento/duplicados';
import { borradorOferta, limpiarPerfilParaOferta, mejorarOfertaConIA, type PerfilCargoOferta } from '@/lib/reclutamiento/oferta';

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
  modalidad: z.enum(['presencial', 'hibrido', 'remoto']).optional().or(z.literal('')),
  ciudad: z.string().trim().max(120).optional(),
  horario: z.string().trim().max(200).optional(),
  tipoContrato: z.string().trim().max(60).optional(),
  requisitos: z.string().trim().max(3000).optional(),
  beneficios: z.string().trim().max(2000).optional(),
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
      modalidad: parsed.data.modalidad || null,
      ciudad: parsed.data.ciudad || null,
      horario: parsed.data.horario || null,
      tipo_contrato: parsed.data.tipoContrato || null,
      requisitos: parsed.data.requisitos || null,
      beneficios: parsed.data.beneficios || null,
      creado_por: perfil.usuario_id,
    })
    .select('id')
    .single();

  if (error) return { ok: false as const, error: error.message };
  revalidatePath(RUTA);
  return { ok: true as const, id: data.id as string, yaExistia: false as const };
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
  modalidad: z.enum(['presencial', 'hibrido', 'remoto']).optional().or(z.literal('')),
  ciudad: z.string().trim().max(120).optional(),
  horario: z.string().trim().max(200).optional(),
  tipoContrato: z.string().trim().max(60).optional(),
  requisitos: z.string().trim().max(3000).optional(),
  beneficios: z.string().trim().max(2000).optional(),
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
      modalidad: parsed.data.modalidad || null,
      ciudad: parsed.data.ciudad || null,
      horario: parsed.data.horario || null,
      tipo_contrato: parsed.data.tipoContrato || null,
      requisitos: parsed.data.requisitos || null,
      beneficios: parsed.data.beneficios || null,
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

  // Si la persona ya está en el banco (mismo documento o correo) se usa ese registro: así conserva su histórico.
  const existente = await buscarCandidatoExistente(supabase, perfil.empresa_id, parsed.data.numeroDocumento, parsed.data.correo);
  if (existente) {
    if (vacanteId) {
      const { error: errorPostulacion } = await supabase.from('postulaciones').insert({ vacante_id: vacanteId, candidato_id: existente.id });
      if (errorPostulacion) {
        return { ok: false as const, error: errorPostulacion.code === '23505' ? 'Esta persona ya está postulada a esta vacante' : errorPostulacion.message };
      }
      revalidatePath(`${RUTA}/vacantes/${vacanteId}`);
    }
    revalidatePath(`${RUTA}/candidatos`);
    return { ok: true as const, id: existente.id as string, yaExistia: true as const };
  }

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

  // Nadie entra a "En evaluación del líder" sin asignación (el líder no lo vería y nadie le avisaría).
  if ((etapaDestino as string) === 'evaluacion_lider') {
    const { data: previos } = await supabase.from('postulaciones').select('id, etapa').in('id', idsEnOrdenDestino);
    const nuevos = (previos ?? []).filter((x) => x.etapa !== 'evaluacion_lider').map((x) => x.id);
    if (nuevos.length > 0) return { ok: false as const, error: 'Para evaluación del líder usa "Enviar al líder", así queda asignado y avisado.' };
  }

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

// ── Flujo de tres pasos: Talento Humano filtra → el líder evalúa → Talento Humano cierra ──

/** Talento Humano envía un candidato preseleccionado a un líder. La asignación le da visibilidad por un plazo. */
export async function enviarAEvaluacionLider(postulacionId: string, liderId: string, dias = 30) {
  const perfil = await requerirAdminTh();
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const supabase = createClient();
  const { data: postulacion } = await supabase
    .from('postulaciones')
    .select('id, etapa, vacante:vacantes(empresa_id)')
    .eq('id', postulacionId)
    .maybeSingle();
  if (!postulacion || (postulacion.vacante as any)?.empresa_id !== perfil.empresa_id) {
    return { ok: false as const, error: 'Postulación no encontrada' };
  }
  if (postulacion.etapa !== 'preseleccionado' && postulacion.etapa !== 'devuelto_th') {
    return { ok: false as const, error: 'Solo se envían al líder los candidatos preseleccionados o devueltos' };
  }

  const vence = new Date();
  vence.setDate(vence.getDate() + Math.min(Math.max(dias, 1), 60));

  const { error: errorAsignacion } = await supabase.from('asignaciones_evaluacion_lider').insert({
    empresa_id: perfil.empresa_id,
    postulacion_id: postulacionId,
    lider_id: liderId,
    vence_en: vence.toISOString().slice(0, 10),
  });
  if (errorAsignacion) return { ok: false as const, error: errorAsignacion.message };

  const { error } = await supabase.from('postulaciones').update({ etapa: 'evaluacion_lider' }).eq('id', postulacionId);
  if (error) return { ok: false as const, error: error.message };

  // Aviso dentro del aplicativo al líder, para que no tenga que adivinar que le llegó un candidato.
  // Si falla, la asignación ya quedó hecha y no se bloquea el envío.
  try {
    const [{ data: lider }, { data: detalle }] = await Promise.all([
      supabase.from('colaboradores').select('usuario_id').eq('id', liderId).maybeSingle(),
      supabase
        .from('postulaciones')
        .select('candidato:candidatos(nombre_completo), vacante:vacantes(titulo)')
        .eq('id', postulacionId)
        .maybeSingle(),
    ]);
    if (lider?.usuario_id) {
      await supabase.from('notificaciones').insert({
        destinatario_usuario_id: lider.usuario_id,
        canal: 'in_app',
        asunto: 'Candidato por evaluar',
        cuerpo: `Talento Humano te envió a ${(detalle?.candidato as any)?.nombre_completo ?? 'un candidato'} para la vacante "${(detalle?.vacante as any)?.titulo ?? ''}". Entra a Reclutamiento y selección para dejar tus apreciaciones (disponible hasta ${vence.toISOString().slice(0, 10)}).`,
        enviado: true,
        enviado_en: new Date().toISOString(),
      });
    }
  } catch {
    /* sin aviso, pero con asignación */
  }

  revalidatePath(RUTA);
  return { ok: true as const };
}

/** El líder devuelve sus apreciaciones a Talento Humano. Las políticas y el trigger limitan lo que puede tocar. */
export async function devolverEvaluacionLider(postulacionId: string, evaluacion: string) {
  const perfil = await getPerfilActual();
  if (!perfil || perfil.rol !== 'lider') return { ok: false as const, error: 'No autorizado' };
  const texto = evaluacion.trim();
  if (texto.length < 5) return { ok: false as const, error: 'Escribe tus apreciaciones sobre el candidato' };

  const supabase = createClient();
  const { data, error } = await supabase
    .from('postulaciones')
    .update({ evaluacion_lider: texto, evaluacion_lider_en: new Date().toISOString(), etapa: 'devuelto_th' })
    .eq('id', postulacionId)
    .eq('etapa', 'evaluacion_lider')
    .select('id');
  if (error) return { ok: false as const, error: error.message };
  if (!data || data.length === 0) return { ok: false as const, error: 'Esta evaluación ya no está disponible para ti.' };

  revalidatePath(RUTA);
  return { ok: true as const };
}

// ── Banco de candidatos ─────────────────────────────────────────────────────

export async function actualizarDisponibilidadCandidato(candidatoId: string, disponibleOtrosCargos: boolean) {
  const perfil = await requerirAdminTh();
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const supabase = createClient();
  const { error } = await supabase
    .from('candidatos')
    .update({ disponible_otros_cargos: disponibleOtrosCargos })
    .eq('id', candidatoId)
    .eq('empresa_id', perfil.empresa_id);
  if (error) return { ok: false as const, error: error.message };

  revalidatePath('/reclutamiento/candidatos');
  return { ok: true as const };
}

/** Marca una solicitud de titular como atendida. Debe responderse dentro del plazo legal. */
export async function atenderSolicitudTitular(solicitudId: string) {
  const perfil = await requerirAdminTh();
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const supabase = createClient();
  const { error } = await supabase
    .from('solicitudes_titular')
    .update({ estado: 'atendida', atendida_en: new Date().toISOString() })
    .eq('id', solicitudId)
    .eq('empresa_id', perfil.empresa_id);
  if (error) return { ok: false as const, error: error.message };

  revalidatePath('/reclutamiento/candidatos');
  return { ok: true as const };
}

const OfertaSchema = z.object({
  cargoId: z.string().uuid('Selecciona un cargo'),
  titulo: z.string().trim().max(200).optional(),
  modalidad: z.string().trim().max(20).optional(),
  ciudad: z.string().trim().max(120).optional(),
  horario: z.string().trim().max(200).optional(),
  tipoContrato: z.string().trim().max(60).optional(),
  beneficios: z.string().trim().max(2000).optional(),
  conIA: z.boolean().default(false),
});

/**
 * Propone el texto de la oferta (descripción y requisitos) a partir del perfil del cargo. Sin IA arma un borrador con
 * reglas; con IA lo redacta mejor sin inventar nada. No guarda: Talento Humano revisa, edita y publica.
 */
export async function proponerOfertaVacante(input: z.infer<typeof OfertaSchema>) {
  const perfil = await requerirAdminTh();
  if (!perfil) return { ok: false as const, error: 'No autorizado' };
  const p = OfertaSchema.safeParse(input);
  if (!p.success) return { ok: false as const, error: p.error.issues[0]?.message ?? 'Datos inválidos' };

  const supabase = createClient();
  const { data: cargo } = await supabase
    .from('cargos')
    .select('id, nombre, objetivo_cargo, formacion_nivel, formacion_titulo_especifico, experiencia_minima_meses, nivel_cargo, tiene_personal_a_cargo')
    .eq('id', p.data.cargoId)
    .eq('empresa_id', perfil.empresa_id)
    .maybeSingle();
  if (!cargo) return { ok: false as const, error: 'Cargo no encontrado' };

  const [{ data: funciones }, { data: habilidades }, { data: empresa }] = await Promise.all([
    supabase.from('cargo_funciones_principales').select('funcion').eq('cargo_id', cargo.id).order('orden'),
    supabase.from('cargo_habilidades').select('nombre').eq('cargo_id', cargo.id).order('orden'),
    supabase.from('empresas').select('nombre').eq('id', perfil.empresa_id).maybeSingle(),
  ]);
  const perfilCargo: PerfilCargoOferta = limpiarPerfilParaOferta({
    nombre: cargo.nombre,
    objetivo: cargo.objetivo_cargo ?? null,
    funciones: ((funciones ?? []) as any[]).map((f) => String(f.funcion)),
    habilidades: ((habilidades ?? []) as any[]).map((h) => String(h.nombre)),
    formacionNivel: cargo.formacion_nivel ?? null,
    formacionTitulo: cargo.formacion_titulo_especifico ?? null,
    experienciaMeses: cargo.experiencia_minima_meses ?? null,
  }, cargo as any);
  const borrador = borradorOferta(perfilCargo, p.data.titulo || cargo.nombre);
  if (!p.data.conIA) return { ok: true as const, ...borrador, fuente: 'automatico' as const };

  const mejorada = await mejorarOfertaConIA(
    perfilCargo,
    { titulo: p.data.titulo || cargo.nombre, modalidad: p.data.modalidad, ciudad: p.data.ciudad, horario: p.data.horario, tipoContrato: p.data.tipoContrato, beneficios: p.data.beneficios, empresa: empresa?.nombre ?? null },
    borrador
  );
  if (mejorada) return { ok: true as const, ...mejorada, fuente: 'ia' as const };
  return { ok: true as const, ...borrador, fuente: 'automatico' as const, aviso: 'No se pudo usar la IA en este momento; se dejó el borrador automático.' };
}
