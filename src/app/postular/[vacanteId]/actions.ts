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
import { registrarHojaVida } from '@/lib/reclutamiento/registrar-hoja-vida';
import { validarHojaVida } from '@/lib/reclutamiento/documento';

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

  // Hoja de vida (opcional). Se valida por contenido antes de crear nada; se guarda después, ya con el candidato.
  const archivo = formData.get('hojaVida');
  const hojaVida = archivo instanceof File && archivo.size > 0 ? archivo : null;
  if (hojaVida) {
    const validacion = await validarHojaVida(new Uint8Array(await hojaVida.arrayBuffer()));
    if (!validacion.ok) return { ok: false as const, error: validacion.error ?? 'Archivo no válido.' };
  }

  // Plazo de conservación: 6 meses para el proceso; 12 meses solo si acepta el banco de talento.
  // Son valores de trabajo que deben validarse con el asesor legal.
  const conservarHasta = new Date();
  conservarHasta.setMonth(conservarHasta.getMonth() + (autorizaBanco ? 12 : 6));

  // Candidato repetido (§7.4): mismo correo dentro de la empresa → la postulación se vincula al
  // registro existente. No se sobrescriben sus datos; cada postulación y autorización queda aparte.
  const correo = parsed.data.correo ? parsed.data.correo.toLowerCase() : null;
  const patronCorreo = correo ? correo.replace(/[\\%_]/g, (c) => `\\${c}`) : null;
  const { data: existente } = patronCorreo
    ? await supabase
        .from('candidatos')
        .select('id, autorizacion_banco')
        .eq('empresa_id', vacante.empresa_id)
        .ilike('correo', patronCorreo)
        .limit(1)
        .maybeSingle()
    : { data: null };

  let candidatoId: string;
  const creado = !existente;
  if (existente) {
    candidatoId = existente.id;
    if (autorizaBanco && !existente.autorizacion_banco) {
      await supabase.from('candidatos').update({ autorizacion_banco: true, conservar_hasta: conservarHasta.toISOString().slice(0, 10) }).eq('id', candidatoId);
    }
  } else {
    const { data: nuevo, error: errorCandidato } = await supabase
      .from('candidatos')
      .insert({
        empresa_id: vacante.empresa_id,
        nombre_completo: parsed.data.nombreCompleto,
        numero_documento: parsed.data.numeroDocumento || null,
        correo: parsed.data.correo || null,
        telefono: parsed.data.telefono || null,
        linkedin_url: parsed.data.linkedinUrl || null,
        origen: 'postulacion_publica',
        autorizacion_banco: autorizaBanco,
        conservar_hasta: conservarHasta.toISOString().slice(0, 10),
      })
      .select('id')
      .single();
    if (errorCandidato) return { ok: false as const, error: errorCandidato.message };
    candidatoId = nuevo.id;
  }

  // Si algo falla después, se revierte solo lo que esta postulación creó.
  const revertir = async () => {
    if (creado) await supabase.from('candidatos').delete().eq('id', candidatoId);
  };

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
    // Sin evidencia de autorización no puede quedar el registro guardado.
    await revertir();
    return { ok: false as const, error: 'No se pudo registrar tu autorización: ' + errorAutorizacion.message };
  }

  const { data: postulacion, error: errorPostulacion } = await supabase
    .from('postulaciones')
    .insert({ vacante_id: vacante.id, candidato_id: candidatoId })
    .select('id')
    .single();

  if (errorPostulacion) {
    await revertir();
    return {
      ok: false as const,
      error: errorPostulacion.code === '23505' ? 'Ya registraste una postulación para esta vacante.' : errorPostulacion.message,
    };
  }

  if (hojaVida) {
    const registro = await registrarHojaVida(supabase, {
      empresaId: vacante.empresa_id,
      candidatoId,
      postulacionId: postulacion.id,
      archivo: hojaVida,
    });
    if (!registro.ok) {
      await revertir();
      return { ok: false as const, error: registro.error };
    }
  }

  return { ok: true as const };
}
