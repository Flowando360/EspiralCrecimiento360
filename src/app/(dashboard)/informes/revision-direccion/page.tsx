import { redirect } from 'next/navigation';
import { obtenerRevisionDireccion } from './data';
import { SeccionesManuales } from '@/components/informes/secciones-manuales-revision';
import { formatearFecha } from '@/lib/utils';
import { AlertTriangle, ShieldCheck, ListChecks, FileStack, GitPullRequestArrow, GraduationCap, Target } from 'lucide-react';

function hace90Dias() {
  const d = new Date();
  d.setDate(d.getDate() - 90);
  return d.toISOString().slice(0, 10);
}

export default async function RevisionDireccionPage({ searchParams }: { searchParams: { desde?: string; hasta?: string } }) {
  const periodoInicio = searchParams.desde || hace90Dias();
  const periodoFin = searchParams.hasta || new Date().toISOString().slice(0, 10);

  const { perfil, revision } = await obtenerRevisionDireccion(periodoInicio, periodoFin);
  if (!perfil || !revision) redirect('/informes');

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="font-display text-2xl font-semibold text-secundario">Informe de Revisión por la Dirección</h1>
        <p className="text-sm text-marmol-500 mt-1">
          Consolidado automático de todo el módulo de Procesos y su cruce con Formación y PDI — las decisiones y
          los cambios de contexto son lo único que se escribe a mano.
        </p>
      </div>

      <form method="GET" className="card p-4 flex items-end gap-3 flex-wrap">
        <div>
          <label className="block text-xs text-marmol-500 mb-1">Desde</label>
          <input type="date" name="desde" defaultValue={periodoInicio} className="rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm" />
        </div>
        <div>
          <label className="block text-xs text-marmol-500 mb-1">Hasta</label>
          <input type="date" name="hasta" defaultValue={periodoFin} className="rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm" />
        </div>
        <button type="submit" className="rounded-lg bg-flow-500 hover:bg-flow-600 text-white text-sm font-medium px-4 py-2">
          Recalcular período
        </button>
        <p className="text-xs text-marmol-400 ml-auto">
          {formatearFecha(periodoInicio)} — {formatearFecha(periodoFin)}
        </p>
      </form>

      <div className="card p-5">
        <h2 className="font-display font-semibold text-secundario mb-3 inline-flex items-center gap-2">
          <ShieldCheck size={16} className="text-flow-600" /> Auditorías internas
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <Stat valor={revision.auditorias.total} etiqueta="Total registradas" />
          <Stat valor={revision.auditorias.cerradas} etiqueta="Cerradas" />
          <Stat valor={revision.auditorias.hallazgosMayores} etiqueta="NC Mayores" clase={revision.auditorias.hallazgosMayores > 0 ? 'text-bajo' : undefined} />
          <Stat valor={revision.auditorias.hallazgosMenores} etiqueta="NC Menores" clase={revision.auditorias.hallazgosMenores > 0 ? 'text-medio' : undefined} />
        </div>
      </div>

      <div className="card p-5">
        <h2 className="font-display font-semibold text-secundario mb-3 inline-flex items-center gap-2">
          <AlertTriangle size={16} className="text-flow-600" /> Riesgos y oportunidades
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <Stat valor={revision.riesgos.total} etiqueta="Riesgos" />
          <Stat valor={revision.riesgos.oportunidades} etiqueta="Oportunidades" />
          <Stat valor={revision.riesgos.vencidos} etiqueta="Revisión vencida" clase={revision.riesgos.vencidos > 0 ? 'text-bajo' : undefined} />
          <Stat valor={revision.riesgos.residualAlto} etiqueta="Residual alto" clase={revision.riesgos.residualAlto > 0 ? 'text-medio' : undefined} />
        </div>
      </div>

      <div className="card p-5">
        <h2 className="font-display font-semibold text-secundario mb-3 inline-flex items-center gap-2">
          <ListChecks size={16} className="text-flow-600" /> ACPM
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <Stat valor={revision.acpm.registradasEnPeriodo} etiqueta="Registradas en el período" />
          <Stat valor={revision.acpm.cerradasEfectivasEnPeriodo} etiqueta="Cerradas efectivas" />
          <Stat valor={revision.acpm.tasaEficaciaGlobal !== null ? `${revision.acpm.tasaEficaciaGlobal}%` : '—'} etiqueta="Tasa de eficacia global" />
          <Stat valor={revision.acpm.abiertasVencidas} etiqueta="Vencidas sin cerrar" clase={revision.acpm.abiertasVencidas > 0 ? 'text-bajo' : undefined} />
        </div>
      </div>

      <div className="card p-5">
        <h2 className="font-display font-semibold text-secundario mb-3 inline-flex items-center gap-2">
          <Target size={16} className="text-flow-600" /> Indicadores
        </h2>
        <div className="grid grid-cols-2 gap-3 text-center mb-3">
          <Stat valor={revision.indicadores.total} etiqueta="Indicadores activos" />
          <Stat valor={revision.indicadores.conMedicionEnPeriodo} etiqueta="Con medición en el período" />
        </div>
        {revision.indicadores.fueraDeMeta.length > 0 && (
          <div>
            <p className="text-xs font-medium text-marmol-600 mb-1">Fuera de meta (última medición)</p>
            <ul className="text-sm text-marmol-600 space-y-0.5">
              {revision.indicadores.fueraDeMeta.map((i, idx) => (
                <li key={idx}>
                  {i.nombre} <span className="text-marmol-400">({i.procesoNombre})</span> — {i.valor} vs. meta {i.meta}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="card p-5">
        <h2 className="font-display font-semibold text-secundario mb-3 inline-flex items-center gap-2">
          <FileStack size={16} className="text-flow-600" /> Gestión documental
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <Stat valor={revision.documentos.solicitudesResueltasEnPeriodo} etiqueta="Solicitudes resueltas" />
          <Stat valor={revision.documentos.aprobadas} etiqueta="Aprobadas" />
          <Stat valor={revision.documentos.rechazadas} etiqueta="Rechazadas" />
          <Stat valor={revision.documentos.difusionIncompleta} etiqueta="Con difusión incompleta" clase={revision.documentos.difusionIncompleta > 0 ? 'text-medio' : undefined} />
        </div>
      </div>

      <div className="card p-5">
        <h2 className="font-display font-semibold text-secundario mb-3 inline-flex items-center gap-2">
          <GitPullRequestArrow size={16} className="text-flow-600" /> Gestión de cambio
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <Stat valor={revision.cambios.total} etiqueta="Total" />
          <Stat valor={revision.cambios.aprobados} etiqueta="Aprobados" />
          <Stat valor={revision.cambios.implementados} etiqueta="Implementados" />
          <Stat valor={revision.cambios.rechazados} etiqueta="Rechazados" />
        </div>
      </div>

      <div className="card p-5">
        <h2 className="font-display font-semibold text-secundario mb-3 inline-flex items-center gap-2">
          <GraduationCap size={16} className="text-flow-600" /> Formación y competencias
        </h2>
        <p className="text-sm text-marmol-600">
          <strong>{revision.formacion.cursosCompletadosEnPeriodo}</strong> cursos de Nexa completados y{' '}
          <strong>{revision.pdi.cerradosEnPeriodo}</strong> Planes de Desarrollo Individual cerrados en el período — cruce con
          Espiral de Crecimiento y Nexa.
        </p>
      </div>

      <SeccionesManuales
        periodoInicio={revision.periodoInicio}
        periodoFin={revision.periodoFin}
        cambiosContextoInicial={revision.cambiosContexto}
        decisionesInicial={revision.decisiones}
        puedeEditar={perfil.rol === 'admin_th'}
      />
    </div>
  );
}

function Stat({ valor, etiqueta, clase }: { valor: number | string; etiqueta: string; clase?: string }) {
  return (
    <div>
      <p className={`text-xl font-semibold ${clase ?? 'text-secundario'}`}>{valor}</p>
      <p className="text-xs text-marmol-400">{etiqueta}</p>
    </div>
  );
}
