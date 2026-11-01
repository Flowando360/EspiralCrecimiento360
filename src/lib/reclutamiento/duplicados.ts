/**
 * Busca si una persona ya existe como candidato de la empresa, por número de documento o por
 * correo (sin distinguir mayúsculas). Así quien se vuelve a postular conserva TODO su histórico
 * (procesos anteriores, motivos de descarte, apreciaciones del líder, referencias) en vez de quedar
 * duplicada como si fuera una persona nueva.
 */
export async function buscarCandidatoExistente(
  supabase: any,
  empresaId: string,
  numeroDocumento?: string | null,
  correo?: string | null
): Promise<{ id: string; conservar_hasta: string | null; autorizacion_banco: boolean | null; hoja_vida_url: string | null } | null> {
  const columnas = 'id, conservar_hasta, autorizacion_banco, hoja_vida_url';
  const doc = numeroDocumento?.trim();
  if (doc) {
    const { data } = await supabase.from('candidatos').select(columnas).eq('empresa_id', empresaId).eq('numero_documento', doc).order('created_at').limit(1);
    if (data?.[0]) return data[0];
  }
  const mail = correo?.trim().toLowerCase();
  if (mail) {
    const { data } = await supabase.from('candidatos').select(columnas).eq('empresa_id', empresaId).ilike('correo', mail).order('created_at').limit(1);
    if (data?.[0]) return data[0];
  }
  return null;
}
