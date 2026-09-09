import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { FirmaAcuerdo } from '@/components/espiral-crecimiento/firma-acuerdo';
import { notFound } from 'next/navigation';
import { ArrowLeft, HandshakeIcon } from 'lucide-react';
import { guardarCompromisosForm } from './actions';

export default async function AcuerdoCrecimientoPage({ params }: { params: { evaluacionId: string } }) {
  const perfil = await getPerfilActual();
  if (!perfil) return null;

  const supabase = createClient();

  const { data: evaluacion } = await supabase
    .from('evaluaciones')
    .select(`id, ciclo_id, colaborador:colaborador_evaluado_id(id, nombre_completo, empresa_id, lider_id)`)
    .eq('id', params.evaluacionId)
    .maybeSingle();

  if (!evaluacion) notFound();
  const colaborador = evaluacion.colaborador as any;
  if (!colaborador || colaborador.empresa_id !== perfil.empresa_id) notFound();

  const esAdminTh = perfil.rol === 'admin_th';
  const esLiderDirecto = perfil.rol === 'lider' && colaborador.lider_id === perfil.colaborador_id;
  const esElColaborador = perfil.colaborador_id === colaborador.id;

  // Mismas partes que ya autoriza RLS: admin_th, el líder directo, o el propio colaborador.
  const puedeVer = esAdminTh || esLiderDirecto || esElColaborador;
  if (!puedeVer) notFound();

  const puedeEditarCompromisos = esAdminTh || esLiderDirecto;

  const { data: acuerdo } = await supabase
    .from('acuerdos_crecimiento')
    .select('*')
    .eq('evaluacion_id', params.evaluacionId)
    .maybeSingle();

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <Link
          href={`/espiral-crecimiento/ciclos/${evaluacion.ciclo_id}`}
          className="inline-flex items-center gap-1 text-xs text-marmol-400 hover:text-marmol-600 mb-2"
        >
          <ArrowLeft size={12} /> Volver al ciclo
        </Link>
        <h1 className="font-display text-2xl font-semibold text-secundario flex items-center gap-2">
          <HandshakeIcon size={22} className="text-flow-600" /> Acuerdo de crecimiento
        </h1>
        <p className="text-sm text-marmol-500 mt-1">Compromisos acordados con {colaborador.nombre_completo}.</p>
      </div>

      <form action={guardarCompromisosForm} className="card p-5 space-y-4">
        <input type="hidden" name="evaluacionId" value={params.evaluacionId} />

        <div>
          <label className="block text-sm font-medium text-marmol-700 mb-1">
            Compromisos del colaborador
          </label>
          <textarea
            name="compromisos_colaborador"
            defaultValue={acuerdo?.compromisos_colaborador ?? ''}
            rows={3}
            disabled={!puedeEditarCompromisos}
            className="w-full rounded-lg border border-marmol-200 px-3 py-2 text-sm disabled:bg-marmol-50 disabled:text-marmol-500"
            placeholder="Qué se compromete a hacer el colaborador…"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-marmol-700 mb-1">Compromisos de la empresa</label>
          <textarea
            name="compromisos_empresa"
            defaultValue={acuerdo?.compromisos_empresa ?? ''}
            rows={3}
            disabled={!puedeEditarCompromisos}
            className="w-full rounded-lg border border-marmol-200 px-3 py-2 text-sm disabled:bg-marmol-50 disabled:text-marmol-500"
            placeholder="Qué se compromete a proveer/apoyar la empresa…"
          />
        </div>

        {puedeEditarCompromisos && (
          <button
            type="submit"
            className="rounded-lg bg-flow-500 hover:bg-flow-600 text-white text-sm font-medium px-4 py-2 transition"
          >
            Guardar
          </button>
        )}
      </form>

      <div className="grid sm:grid-cols-2 gap-4">
        <FirmaAcuerdo
          evaluacionId={params.evaluacionId}
          parte="colaborador"
          titulo={`Firma de ${colaborador.nombre_completo}`}
          firmadoInicial={acuerdo?.firmado_colaborador ?? false}
          fechaInicial={acuerdo?.fecha_firma_colaborador ?? null}
          puedeFirmar={esAdminTh || esElColaborador}
        />
        <FirmaAcuerdo
          evaluacionId={params.evaluacionId}
          parte="lider"
          titulo="Firma del líder"
          firmadoInicial={acuerdo?.firmado_lider ?? false}
          fechaInicial={acuerdo?.fecha_firma_lider ?? null}
          puedeFirmar={esAdminTh || esLiderDirecto}
        />
      </div>
    </div>
  );
}
