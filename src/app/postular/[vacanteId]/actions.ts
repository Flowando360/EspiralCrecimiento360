'use server';

import { createAdminClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Acción de servidor para el formulario PÚBLICO de postulación — la usa
// gente externa que nunca ha iniciado sesión (candidatos), por eso usa el
// cliente con service_role (createAdminClient) en vez del cliente normal:
// no hay usuario autenticado del que RLS pueda derivar empresa/rol. Toda la
// validación de qué se puede insertar y para qué vacante vive aquí, no en
// una policy de base de datos.

import { VERSION_POLITICA } from '@/lib/reclutamiento/politica';
import { buscarCandidatoExistente } from '@/lib/reclutamiento/duplicados';

const PostulacionSchema = z.object({
  vacanteId: z.string().uuid(),
  nombreCompleto: z.string().trim().min(1, 'El nombre es requerido').max(200),
  numeroDocumento: z.string().trim().max(50).optional(),
  correo: z.string().trim().email('Correo inválido').max(200).optional().or(z.literal('')),
  telefono: z.string().trim().max(30).optional(),
  linkedinUrl: z.string().trim().max(300).optional(),
});

export async function enviarPostulacion(formData: FormData) {
  const parsed = PostulacionSchema.safeParse({
    vacanteId: formData.get('vacanteId'),
    nombreCompleto: formData.get('nombreCompleto'),
    numeroDocumento: formData.get('numeroDocumento') || undefined,
    correo: formData.get('correo') || undefined,
    telefono: formData.get('telefono') || undefined,
    linkedinUrl: formData.get('linkedinUrl') || undefined,
  });

  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  }

  // Autorización previa, informada y demostrable (Ley 1581 de 2012): sin ella no se guarda nada.
  const autorizaTratamiento = formData.get('autorizaTratamiento') === 'on';
  const autorizaBanco = formData.get('autorizaBanco') === 'on';
  if (!autorizaTratamiento) {
    return { ok: false as const, error: 'Debes autorizar el tratamiento de tus datos para postularte.' };
  }

  const supabase = createAdminClient();

  // La vacante debe existir y seguir abierta — si alguien guarda el enlace
  // de una vacante ya cerrada, no debe poder seguir postulando.
  const { data: vacante, error: errorVacante } = await supabase
    .from('vacantes')
    .select('id, empresa_id, estado')
    .eq('id', parsed.data.vacanteId)
    .maybeSingle();

  if (errorVacante || !vacante) return { ok: false as const, error: 'Vacante no encontrada.' };
  if (vacante.estado !== 'abierta') return { ok: false as const, error: 'Esta vacante ya no está recibiendo postulaciones.' };

  // Hoja de vida (opcional): se sube antes de crear el candidato, a
  // <empresa_id>/<archivo> para que la policy de lectura de admin_th
  // (segmentada por carpeta = empresa) pueda encontrarlo.
  let hojaVidaUrl: string | null = null;
  const archivo = formData.get('hojaVida');
  if (archivo instanceof File && archivo.size > 0) {
    if (archivo.size > 8 * 1024 * 1024) {
      return { ok: false as const, error: 'La hoja de vida no puede pesar más de 8 MB.' };
    }
    const extension = archivo.name.split('.').pop() || 'pdf';
    const ruta = `${vacante.empresa_id}/${crypto.randomUUID()}.${extension}`;
    const { error: errorSubida } = await supabase.storage
      .from('hojas-vida-candidatos')
      .upload(ruta, archivo, { contentType: archivo.type || undefined });
    if (errorSubida) return { ok: false as const, error: 'No se pudo subir la hoja de vida: ' + errorSubida.message };
    hojaVidaUrl = ruta;
  }

  // Plazo de conservación: 6 meses para el proceso; 12 meses solo si acepta el banco de talento.
  // Son valores de trabajo que deben validarse con el asesor legal.
  const conservarHasta = new Date();
  conservarHasta.setMonth(conservarHasta.getMonth() + (autorizaBanco ? 12 : 6));

  // ¿Ya existe esta persona? (mismo documento o correo). Si ya está, se reutiliza su registro para no
  // perder el histórico de procesos anteriores; nunca se acorta su plazo de conservación.
  const existente = await buscarCandidatoExistente(supabase, vacante.empresa_id, parsed.data.numeroDocumento, parsed.data.correo);
  const fechaConservar = conservarHasta.toISOString().slice(0, 10);
  let candidatoId: string;
  const esNuevo = !existente;

  if (existente) {
    const { data: yaPostulado } = await supabase
      .from('postulaciones')
      .select('id')
      .eq('vacante_id', vacante.id)
      .eq('candidato_id', existente.id)
      .maybeSingle();
    if (yaPostulado) return { ok: false as const, error: 'Ya tenemos tu postulación para esta vacante.' };

    candidatoId = existente.id;
    const actualizar: { autorizacion_banco: boolean; conservar_hasta: string; telefono?: string; linkedin_url?: string; hoja_vida_url?: string } = {
      autorizacion_banco: Boolean(existente.autorizacion_banco) || autorizaBanco,
      conservar_hasta: existente.conservar_hasta && existente.conservar_hasta > fechaConservar ? existente.conservar_hasta : fechaConservar,
    };
    if (parsed.data.telefono) actualizar.telefono = parsed.data.telefono;
    if (parsed.data.linkedinUrl) actualizar.linkedin_url = parsed.data.linkedinUrl;
    if (hojaVidaUrl) actualizar.hoja_vida_url = hojaVidaUrl; // la versión anterior queda en el almacenamiento
    await supabase.from('candidatos').update(actualizar).eq('id', existente.id);
  } else {
    const { data: candidato, error: errorCandidato } = await supabase
      .from('candidatos')
      .insert({
        empresa_id: vacante.empresa_id,
        nombre_completo: parsed.data.nombreCompleto,
        numero_documento: parsed.data.numeroDocumento || null,
        correo: parsed.data.correo || null,
        telefono: parsed.data.telefono || null,
        linkedin_url: parsed.data.linkedinUrl || null,
        hoja_vida_url: hojaVidaUrl,
        origen: 'postulacion_publica',
        autorizacion_banco: autorizaBanco,
        conservar_hasta: fechaConservar,
      })
      .select('id')
      .single();
    if (errorCandidato) return { ok: false as const, error: errorCandidato.message };
    candidatoId = candidato.id;
  }

  const { error: errorAutorizacion } = await supabase.from('autorizaciones_tratamiento').insert({
    empresa_id: vacante.empresa_id,
    candidato_id: candidatoId,
    vacante_id: vacante.id,
    version_politica: VERSION_POLITICA,
    finalidades: autorizaBanco
      ? ['Evaluar mi perfil para la vacante', 'Conservar mis datos en el banco de talento para futuras vacantes']
      : ['Evaluar mi perfil para la vacante'],
    acepto_banco: autorizaBanco,
    canal: 'formulario_publico',
  });
  if (errorAutorizacion) {
    // Sin evidencia de autorización no puede quedar un candidato NUEVO guardado (uno existente conserva su histórico).
    if (esNuevo) await supabase.from('candidatos').delete().eq('id', candidatoId);
    return { ok: false as const, error: 'No se pudo registrar tu autorización: ' + errorAutorizacion.message };
  }

  const { error: errorPostulacion } = await supabase
    .from('postulaciones')
    .insert({ vacante_id: vacante.id, candidato_id: candidatoId });

  if (errorPostulacion) return { ok: false as const, error: errorPostulacion.message };

  return { ok: true as const };
}
