import { createClient } from '@/lib/supabase/server';

const UNA_HORA_EN_SEGUNDOS = 60 * 60;

/**
 * Igual que arriba pero para adjuntos del feed corporativo (bucket privado
 * "feed-adjuntos"): documentos, video o imagen destacada de un comunicado.
 */
export async function obtenerUrlFirmadaFeedAdjunto(path: string | null): Promise<string | null> {
  if (!path) return null;

  const supabase = createClient();
  const { data, error } = await supabase.storage
    .from('feed-adjuntos')
    .createSignedUrl(path, UNA_HORA_EN_SEGUNDOS);

  if (error || !data) return null;
  return data.signedUrl;
}

/**
 * Igual que arriba pero para documentos del colaborador (bucket privado
 * "documentos-colaborador"): hoja de vida y contrato. La ruta de cada
 * archivo trae el tipo ("hoja-vida" o "contrato") como tercer segmento, así
 * que Storage aplica una regla de lectura más estricta para el contrato
 * (excluye al líder, por el salario).
 */
export async function obtenerUrlFirmadaDocumentoColaborador(path: string | null): Promise<string | null> {
  if (!path) return null;

  const supabase = createClient();
  const { data, error } = await supabase.storage
    .from('documentos-colaborador')
    .createSignedUrl(path, UNA_HORA_EN_SEGUNDOS);

  if (error || !data) return null;
  return data.signedUrl;
}

/**
 * Hoja de vida de un candidato de Reclutamiento y Selección (bucket privado
 * "hojas-vida-candidatos"). Solo admin_th tiene policy de lectura — ver
 * 0066_reclutamiento.sql.
 */
export async function obtenerUrlFirmadaHojaVidaCandidato(path: string | null): Promise<string | null> {
  if (!path) return null;

  const supabase = createClient();
  const { data, error } = await supabase.storage
    .from('hojas-vida-candidatos')
    .createSignedUrl(path, UNA_HORA_EN_SEGUNDOS);

  if (error || !data) return null;
  return data.signedUrl;
}
