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
});

export async function crearVacante(input: z.infer<typeof VacanteSchema>) {
  const perfil = await requerirAdminTh();
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const parsed = VacanteSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };

  const supabase = createClient();
  const { data, error } = await supabase
    .from('vacantes')
    .insert({
      empresa_id: perfil.empresa_id,
      cargo_id: parsed.data.cargoId,
      titulo: parsed.data.titulo,
      descripcion: parsed.data.descripcion || null,
      creado_por: perfil.usuario_id,
    })
    .select('id')
    .single();

  if (error) return { ok: false as const, error: error.message };
  revalidatePath(RUTA);
  return { ok: true as const, id: data.id as string };
}

export async function actualizarEstadoVacante(id: string, estado: 'abierta' | 'pausada' | 'cerrada') {
  const perfil = await requerirAdminTh();
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const supabase = createClient();
  const { error } = await supabase
    .from('vacantes')
    .update({ estado, fecha_cierre: estado === 'cerrada' ? new Date().toISOString().slice(0, 10) : null })
    .eq('id', id)
    .eq('empresa_id', perfil.empresa_id);

  if (error) return { ok: false as const, error: error.message };
  revalidatePath(RUTA);
  revalidatePath(`${RUTA}/vacantes/${id}`);
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
const ETAPAS_POSTULACION = ['recibido', 'entrevista', 'prueba', 'oferta', 'contratado', 'descartado'] as const;
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
