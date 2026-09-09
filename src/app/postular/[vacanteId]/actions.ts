'use server';

import { createAdminClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Acción de servidor para el formulario PÚBLICO de postulación — la usa
// gente externa que nunca ha iniciado sesión (candidatos), por eso usa el
// cliente con service_role (createAdminClient) en vez del cliente normal:
// no hay usuario autenticado del que RLS pueda derivar empresa/rol. Toda la
// validación de qué se puede insertar y para qué vacante vive aquí, no en
// una policy de base de datos.

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
    })
    .select('id')
    .single();

  if (errorCandidato) return { ok: false as const, error: errorCandidato.message };

  const { error: errorPostulacion } = await supabase
    .from('postulaciones')
    .insert({ vacante_id: vacante.id, candidato_id: candidato.id });

  if (errorPostulacion) return { ok: false as const, error: errorPostulacion.message };

  return { ok: true as const };
}
