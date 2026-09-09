import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { obtenerUrlFirmadaDocumentoColaborador } from '@/lib/supabase/storage';
import { DocumentosColaborador } from '@/components/espiral-crecimiento/documentos-colaborador';
import { notFound } from 'next/navigation';
import { ArrowLeft, FolderLock } from 'lucide-react';

export default async function DocumentosColaboradorPage({ params }: { params: { id: string } }) {
  const perfil = await getPerfilActual();
  if (!perfil) return null;

  const supabase = createClient();

  const { data: colaborador } = await supabase
    .from('colaboradores')
    .select('id, nombre_completo, empresa_id, hoja_vida_url, contrato_url, salario, eps, arl, afp, caja_compensacion')
    .eq('id', params.id)
    .maybeSingle();

  if (!colaborador || colaborador.empresa_id !== perfil.empresa_id) notFound();

  // Documentos sensibles (el contrato trae el salario): solo Talento Humano
  // y el propio colaborador — a diferencia de otras secciones de la ficha,
  // aquí ni el líder directo tiene acceso.
  const puedeVer = perfil.rol === 'admin_th' || (perfil.rol === 'colaborador' && perfil.colaborador_id === colaborador.id);
  if (!puedeVer) notFound();

  const puedeEditar = perfil.rol === 'admin_th';

  const [urlHojaVida, urlContrato] = await Promise.all([
    obtenerUrlFirmadaDocumentoColaborador(colaborador.hoja_vida_url),
    obtenerUrlFirmadaDocumentoColaborador(colaborador.contrato_url),
  ]);

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <Link
          href={`/espiral-crecimiento/colaboradores/${params.id}`}
          className="inline-flex items-center gap-1 text-xs text-marmol-400 hover:text-marmol-600 mb-2"
        >
          <ArrowLeft size={12} /> Volver a la ficha
        </Link>
        <h1 className="font-display text-2xl font-semibold text-secundario flex items-center gap-2">
          <FolderLock size={22} className="text-flow-600" /> Documentos
        </h1>
        <p className="text-sm text-marmol-500 mt-1">{colaborador.nombre_completo}</p>
        <p className="text-xs text-marmol-400 mt-1">
          Sección de manejo exclusivo de Talento Humano y del propio colaborador.
        </p>
      </div>

      <DocumentosColaborador
        colaboradorId={params.id}
        puedeEditar={puedeEditar}
        hojaVidaUrl={urlHojaVida}
        contratoUrl={urlContrato}
        salarioInicial={colaborador.salario}
        afiliaciones={{
          eps: colaborador.eps,
          arl: colaborador.arl,
          afp: colaborador.afp,
          caja_compensacion: colaborador.caja_compensacion,
        }}
      />
    </div>
  );
}
