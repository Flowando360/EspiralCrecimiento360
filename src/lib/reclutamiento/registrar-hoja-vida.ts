import { createHash } from 'crypto';
import type { createAdminClient } from '@/lib/supabase/server';
import { ESQUEMA_HOJA_VIDA_VERSION } from './esquema-hoja-vida';
import { validarHojaVida } from './documento';

// Guarda el archivo original de una hoja de vida y crea su trabajo de extracción.
// Idempotente: el mismo archivo para el mismo candidato no se duplica ni se
// vuelve a procesar con el mismo esquema (requerimiento §18, reglas adicionales).

export const BUCKET_HOJAS_VIDA = 'hojas-vida-candidatos';

export type Cliente = ReturnType<typeof createAdminClient>;

export interface RegistroHojaVida {
  ok: true;
  documentoId: string;
  jobId: string | null;
  duplicada: boolean;
}

export async function registrarHojaVida(
  cliente: Cliente,
  params: { empresaId: string; candidatoId: string; postulacionId: string | null; archivo: File }
): Promise<RegistroHojaVida | { ok: false; error: string }> {
  const bytes = new Uint8Array(await params.archivo.arrayBuffer());
  const validacion = await validarHojaVida(bytes);
  if (!validacion.ok || !validacion.tipo) return { ok: false, error: validacion.error ?? 'Archivo no válido.' };

  const sha256 = createHash('sha256').update(bytes).digest('hex');

  // Mismo archivo ya guardado para este candidato: se reutiliza, no se vuelve a subir.
  const { data: existente } = await cliente
    .from('candidato_documentos')
    .select('id')
    .eq('candidato_id', params.candidatoId)
    .eq('sha256', sha256)
    .maybeSingle();

  let documentoId: string | null = existente?.id ?? null;
  let rutaVigente: string | null = null;
  if (!documentoId) {
    // La extensión sale del contenido verificado, no del nombre que trajo el archivo.
    const ruta = `${params.empresaId}/${crypto.randomUUID()}.${validacion.tipo}`;
    const { error: errorSubida } = await cliente.storage
      .from(BUCKET_HOJAS_VIDA)
      .upload(ruta, params.archivo, { contentType: params.archivo.type || undefined });
    if (errorSubida) return { ok: false, error: 'No se pudo guardar la hoja de vida: ' + errorSubida.message };

    const { count } = await cliente
      .from('candidato_documentos')
      .select('id', { count: 'exact', head: true })
      .eq('candidato_id', params.candidatoId);

    const { data: documento, error: errorDocumento } = await cliente
      .from('candidato_documentos')
      .insert({
        empresa_id: params.empresaId,
        candidato_id: params.candidatoId,
        postulacion_id: params.postulacionId,
        version: (count ?? 0) + 1,
        storage_path: ruta,
        nombre_original: params.archivo.name.slice(0, 200),
        mime_type: validacion.tipo === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        tamano_bytes: bytes.byteLength,
        sha256,
      })
      .select('id')
      .single();
    if (errorDocumento) return { ok: false, error: errorDocumento.message };
    documentoId = documento.id;
    rutaVigente = ruta;
  }

  // La hoja de vida vigente del candidato es la última que cargó.
  if (rutaVigente) {
    const { error: errorVigente } = await cliente.from('candidatos').update({ hoja_vida_url: rutaVigente }).eq('id', params.candidatoId);
    if (errorVigente) return { ok: false, error: errorVigente.message };
  }

  // Trabajo de extracción: una sola vez por (candidato, archivo, esquema).
  const claveIdempotencia = `${params.candidatoId}:${sha256}:${ESQUEMA_HOJA_VIDA_VERSION}`;
  const { data: job, error: errorJob } = await cliente
    .from('ai_processing_jobs')
    .upsert(
      {
        empresa_id: params.empresaId,
        candidato_id: params.candidatoId,
        documento_id: documentoId,
        clave_idempotencia: claveIdempotencia,
        esquema_version: ESQUEMA_HOJA_VIDA_VERSION,
      },
      { onConflict: 'clave_idempotencia', ignoreDuplicates: true }
    )
    .select('id');

  if (errorJob) return { ok: false, error: errorJob.message };
  let jobId = job?.[0]?.id ?? null;
  if (!jobId) {
    const { data: existenteJob } = await cliente.from('ai_processing_jobs').select('id').eq('clave_idempotencia', claveIdempotencia).maybeSingle();
    jobId = existenteJob?.id ?? null;
  }

  return { ok: true, documentoId: documentoId!, jobId, duplicada: !!existente };
}
