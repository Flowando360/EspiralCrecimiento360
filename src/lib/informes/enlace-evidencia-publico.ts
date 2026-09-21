import { createAdminClient } from '@/lib/supabase/server';
import type { TipoPaqueteAuditoria } from '@/app/(dashboard)/informes/evidencia-auditoria/data';

export interface EnlacePublicoValido {
  id: string;
  empresaId: string;
  empresaNombre: string;
  tipoPaquete: TipoPaqueteAuditoria;
  expiraEn: string;
}

/**
 * Valida un token de /auditoria/[token] (y su equivalente en la API de
 * descarga) contra la base — sin sesión, con el cliente admin, porque quien
 * abre el enlace no tiene cuenta en la plataforma. Nunca expone por qué un
 * token es inválido (vencido vs. revocado vs. inexistente) para no dar
 * pistas de enumeración.
 */
export async function validarEnlaceEvidenciaPublico(token: string): Promise<EnlacePublicoValido | null> {
  const admin = createAdminClient();
  const { data: enlace } = await (admin as any)
    .from('enlaces_evidencia_auditoria')
    .select('id, empresa_id, tipo_paquete, expira_en, activo, empresa:empresas(nombre)')
    .eq('token', token)
    .maybeSingle();

  if (!enlace || !enlace.activo) return null;
  if (new Date(enlace.expira_en) < new Date()) return null;

  return {
    id: enlace.id,
    empresaId: enlace.empresa_id,
    empresaNombre: enlace.empresa?.nombre ?? 'Espiral de Crecimiento',
    tipoPaquete: enlace.tipo_paquete,
    expiraEn: enlace.expira_en,
  };
}

/**
 * Registra que el enlace se consultó — no distingue "vio la portada" de
 * "descargó", ambos cuentan como consulta. Nunca lanza: un fallo al contar
 * no debe tumbar la descarga real, que es lo que le importa al auditor.
 */
export async function registrarConsultaEnlace(id: string) {
  try {
    const admin = createAdminClient();
    const { data } = await (admin as any).from('enlaces_evidencia_auditoria').select('veces_consultado').eq('id', id).maybeSingle();
    await (admin as any)
      .from('enlaces_evidencia_auditoria')
      .update({ veces_consultado: (data?.veces_consultado ?? 0) + 1, ultima_consulta_en: new Date().toISOString() })
      .eq('id', id);
  } catch {
    // silencioso a propósito — ver comentario arriba
  }
}
