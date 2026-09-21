import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { DetalleDocumento } from '@/components/procesos-gestion/detalle-documento';

const ETIQUETA_TIPO_DOC: Record<string, string> = {
  procedimiento: 'Procedimiento',
  politica: 'Política',
  formato: 'Formato',
  instructivo: 'Instructivo',
};

export default async function DetalleDocumentoPage({ params }: { params: { id: string } }) {
  const perfil = await getPerfilActual();
  if (!perfil) return null;
  if (!['admin_th', 'lider', 'gerencia'].includes(perfil.rol)) redirect('/inicio');

  const supabase = createClient();

  const { data: documento } = await supabase
    .from('documentos_proceso')
    .select('id, proceso_id, codigo, nombre, tipo_documento, version_vigente, estado, requiere_confirmacion, proceso:proceso_id(id, nombre, codigo, empresa_id)')
    .eq('id', params.id)
    .maybeSingle();

  if (!documento || (documento.proceso as any)?.empresa_id !== perfil.empresa_id) notFound();

  const [{ data: empresa }, { data: historial }, { data: confirmacionesRaw }, { data: perfilesConAcceso }] = await Promise.all([
    supabase.from('empresas').select('documental_umbral_difusion_pct').eq('id', perfil.empresa_id).maybeSingle(),
    supabase.from('documentos_historial_version').select('id, version, resumen_cambio, fecha').eq('documento_id', params.id).order('fecha', { ascending: false }),
    supabase
      .from('confirmaciones_lectura')
      .select('id, colaborador_id, comentario, confirmado_at, colaborador:colaborador_id(nombre_completo)')
      .eq('documento_id', params.id)
      .order('confirmado_at', { ascending: false }),
    supabase.from('perfiles_usuario').select('id').eq('empresa_id', perfil.empresa_id).eq('activo', true).in('rol', ['admin_th', 'lider', 'gerencia']),
  ]);

  const idsUsuariosConAcceso = (perfilesConAcceso ?? []).map((p: any) => p.id);
  const { count: totalConAcceso } = idsUsuariosConAcceso.length
    ? await supabase.from('colaboradores').select('id', { count: 'exact', head: true }).in('usuario_id', idsUsuariosConAcceso)
    : { count: 0 };

  const confirmaciones = (confirmacionesRaw ?? []).map((c: any) => ({
    id: c.id,
    colaborador_id: c.colaborador_id,
    colaborador_nombre: c.colaborador?.nombre_completo ?? '—',
    comentario: c.comentario,
    confirmado_at: c.confirmado_at,
  }));

  const yaConfirme = perfil.colaborador_id ? confirmaciones.some((c) => c.colaborador_id === perfil.colaborador_id) : false;

  return (
    <div className="space-y-4">
      <div>
        <Link href="/procesos-gestion/documentos" className="inline-flex items-center gap-1 text-sm text-marmol-500 hover:text-flow-600 mb-2">
          <ChevronLeft size={14} /> Gestión documental
        </Link>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-marmol-400">{documento.codigo}</span>
          <h1 className="font-display text-2xl font-semibold text-secundario">{documento.nombre}</h1>
        </div>
        <p className="text-sm text-marmol-500 mt-1">
          {ETIQUETA_TIPO_DOC[documento.tipo_documento]} · {documento.version_vigente} ·{' '}
          <Link href={`/procesos-gestion/${(documento.proceso as any)?.id}`} className="hover:text-flow-600">
            {(documento.proceso as any)?.codigo ? `${(documento.proceso as any).codigo} · ` : ''}
            {(documento.proceso as any)?.nombre}
          </Link>
        </p>
      </div>

      <DetalleDocumento
        documentoId={documento.id}
        requiereConfirmacion={documento.requiere_confirmacion}
        totalConColaboradorAcceso={totalConAcceso ?? 0}
        umbralPct={empresa?.documental_umbral_difusion_pct ?? 100}
        confirmacionesIniciales={confirmaciones}
        yaConfirme={yaConfirme}
        puedeConfirmar={!!perfil.colaborador_id}
        historial={(historial ?? []) as any}
      />
    </div>
  );
}
