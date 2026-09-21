import { createClient } from '@/lib/supabase/server';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';

export interface ActaDifusion {
  codigo: string;
  nombre: string;
  tipoDocumento: string;
  versionVigente: string;
  procesoNombre: string;
  umbralPct: number;
  totalConAcceso: number;
  confirmaciones: { colaborador: string; fecha: string; comentario: string | null }[];
  historial: { version: string; resumenCambio: string | null; fecha: string }[];
}

const ROLES_PERMITIDOS = ['admin_th', 'lider', 'gerencia'] as const;

export async function obtenerActaDifusion(documentoId: string): Promise<{
  perfil: Awaited<ReturnType<typeof getPerfilActual>>;
  acta: ActaDifusion | null;
}> {
  const perfil = await getPerfilActual();
  if (!perfil || !(ROLES_PERMITIDOS as readonly string[]).includes(perfil.rol)) return { perfil: null, acta: null };

  const supabase = createClient();
  const { data: documento } = await supabase
    .from('documentos_proceso')
    .select('id, codigo, nombre, tipo_documento, version_vigente, requiere_confirmacion, proceso:proceso_id(nombre, empresa_id)')
    .eq('id', documentoId)
    .maybeSingle();

  if (!documento || (documento.proceso as any)?.empresa_id !== perfil.empresa_id) return { perfil, acta: null };

  const [{ data: empresa }, { data: historialRaw }, { data: confirmacionesRaw }, { data: perfilesConAcceso }] = await Promise.all([
    supabase.from('empresas').select('documental_umbral_difusion_pct').eq('id', perfil.empresa_id).maybeSingle(),
    supabase.from('documentos_historial_version').select('version, resumen_cambio, fecha').eq('documento_id', documentoId).order('fecha', { ascending: false }),
    supabase
      .from('confirmaciones_lectura')
      .select('confirmado_at, comentario, colaborador:colaborador_id(nombre_completo)')
      .eq('documento_id', documentoId)
      .order('confirmado_at', { ascending: false }),
    supabase.from('perfiles_usuario').select('id').eq('empresa_id', perfil.empresa_id).eq('activo', true).in('rol', ROLES_PERMITIDOS),
  ]);

  const idsUsuarios = (perfilesConAcceso ?? []).map((p: any) => p.id);
  const { count: totalConAcceso } = idsUsuarios.length
    ? await supabase.from('colaboradores').select('id', { count: 'exact', head: true }).in('usuario_id', idsUsuarios)
    : { count: 0 };

  return {
    perfil,
    acta: {
      codigo: documento.codigo,
      nombre: documento.nombre,
      tipoDocumento: documento.tipo_documento,
      versionVigente: documento.version_vigente,
      procesoNombre: (documento.proceso as any)?.nombre ?? '—',
      umbralPct: empresa?.documental_umbral_difusion_pct ?? 100,
      totalConAcceso: totalConAcceso ?? 0,
      confirmaciones: (confirmacionesRaw ?? []).map((c: any) => ({
        colaborador: c.colaborador?.nombre_completo ?? '—',
        fecha: c.confirmado_at,
        comentario: c.comentario,
      })),
      historial: (historialRaw ?? []).map((h: any) => ({ version: h.version, resumenCambio: h.resumen_cambio, fecha: h.fecha })),
    },
  };
}
