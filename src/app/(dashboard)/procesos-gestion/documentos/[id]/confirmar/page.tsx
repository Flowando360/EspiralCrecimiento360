import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { obtenerUrlFirmadaDocumentoProceso } from '@/lib/supabase/storage';
import { ConfirmarDocumento, VerDocumentoLink } from '@/components/procesos-gestion/confirmar-documento';

const ROLES_PERMITIDOS = ['admin_th', 'lider', 'gerencia', 'colaborador'];

const ETIQUETA_TIPO_DOC: Record<string, string> = {
  procedimiento: 'Procedimiento',
  politica: 'Política',
  formato: 'Formato',
  instructivo: 'Instructivo',
  registro: 'Registro',
};

/**
 * Pantalla angosta y de un solo propósito, fuera del gate de rol que
 * protege el resto de Gestión documental — punto 3.2: cualquier colaborador
 * de la empresa puede confirmar lectura sin tener acceso al módulo
 * completo. Llega principalmente desde el link que aprobarSolicitud publica
 * en el Feed.
 */
export default async function ConfirmarDocumentoPage({ params }: { params: { id: string } }) {
  const perfil = await getPerfilActual();
  if (!perfil) return null;
  if (!ROLES_PERMITIDOS.includes(perfil.rol)) redirect('/inicio');

  const supabase = createClient();

  const { data: documento } = await supabase
    .from('documentos_proceso')
    .select('id, codigo, nombre, tipo_documento, version_vigente, requiere_confirmacion, archivo_url, proceso:proceso_id(nombre, codigo, empresa_id)')
    .eq('id', params.id)
    .maybeSingle();

  if (!documento || (documento.proceso as any)?.empresa_id !== perfil.empresa_id) notFound();

  const { data: confirmacionesRaw } = await supabase.from('confirmaciones_lectura').select('colaborador_id').eq('documento_id', params.id);
  const confirmaciones = (confirmacionesRaw ?? []) as any[];
  const yaConfirme = perfil.colaborador_id ? confirmaciones.some((c) => c.colaborador_id === perfil.colaborador_id) : false;
  const urlFirmada = await obtenerUrlFirmadaDocumentoProceso(documento.archivo_url);

  return (
    <div className="max-w-lg mx-auto space-y-4 pt-4">
      <div className="card p-5">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span className="text-xs font-semibold text-marmol-400">{documento.codigo}</span>
          <span className="text-[11px] rounded-full bg-flow-50 text-flow-700 px-2 py-0.5 font-medium">{ETIQUETA_TIPO_DOC[documento.tipo_documento]}</span>
        </div>
        <h1 className="font-display text-xl font-semibold text-secundario">{documento.nombre}</h1>
        <p className="text-sm text-marmol-500 mt-1">
          {(documento.proceso as any)?.codigo ? `${(documento.proceso as any).codigo} · ` : ''}
          {(documento.proceso as any)?.nombre} · versión {documento.version_vigente}
        </p>

        <div className="mt-3">
          <VerDocumentoLink url={urlFirmada} />
        </div>

        {!documento.requiere_confirmacion ? (
          <p className="text-sm text-marmol-500 mt-4">Este documento no requiere confirmación de lectura.</p>
        ) : (
          <div className="mt-4 pt-4 border-t border-marmol-100">
            <ConfirmarDocumento documentoId={documento.id} yaConfirmeInicial={yaConfirme} totalConfirmaciones={confirmaciones.length} />
          </div>
        )}
      </div>
    </div>
  );
}
