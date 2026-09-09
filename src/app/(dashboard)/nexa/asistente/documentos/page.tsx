import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, FileText } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { ListaDocumentosPolitica } from '@/components/espiral-crecimiento/lista-documentos-politica';
import { FormularioDocumentoPolitica } from '@/components/espiral-crecimiento/formulario-documento-politica';

export default async function DocumentosPoliticaPage() {
  const perfil = await getPerfilActual();
  if (!perfil) return null;
  if (perfil.rol !== 'admin_th') redirect('/nexa/asistente');

  const supabase = createClient();
  const { data: documentos } = await supabase
    .from('nexa_documentos_politica')
    .select('id, titulo, categoria, activo, archivo_url, created_at, contenido')
    .eq('empresa_id', perfil.empresa_id)
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <Link href="/nexa/asistente" className="inline-flex items-center gap-1 text-xs text-marmol-500 hover:text-flow-600 mb-2">
          <ArrowLeft size={13} /> Volver al asistente
        </Link>
        <h1 className="font-display text-2xl font-semibold text-secundario">Base documental del asistente</h1>
        <p className="text-sm text-marmol-500 mt-1">
          Carga aquí el reglamento SST, el manual interno y demás políticas propias. El asistente busca en estos
          documentos antes de responder, para dar respuestas normativas reales en vez de genéricas.
        </p>
      </div>

      <FormularioDocumentoPolitica />

      {!documentos || documentos.length === 0 ? (
        <EmptyState icon={FileText} titulo="Sin documentos cargados todavía" />
      ) : (
        <ListaDocumentosPolitica documentosIniciales={documentos as any} />
      )}
    </div>
  );
}
