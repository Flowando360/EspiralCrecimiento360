import { createClient } from '@/lib/supabase/server';
import { FiltroTabla } from '@/components/ui/filtro-tabla';
import { redirect } from 'next/navigation';
import { EmptyState } from '@/components/ui/empty-state';
import { ShieldCheck, FileDown, FileSpreadsheet } from 'lucide-react';
import { formatearFecha, cn } from '@/lib/utils';
import { obtenerInformeSST, type EstadoCertificacion } from './data';
import Link from 'next/link';
import { calcularCadenaSst } from '@/lib/informes/cadena-sst';

const ETIQUETA_ESTADO: Record<EstadoCertificacion, string> = {
  vigente: 'Vigente',
  por_vencer: 'Por vencer',
  vencido: 'Vencido',
  sin_vencimiento: 'Sin vencimiento',
};

const CLASE_ESTADO: Record<EstadoCertificacion, string> = {
  vigente: 'badge-alto',
  por_vencer: 'badge-medio',
  vencido: 'badge-bajo',
  sin_vencimiento: 'bg-marmol-100 text-marmol-500 border border-marmol-200',
};

export default async function InformeSSTPage({
  searchParams,
}: {
  searchParams: { colaboradorId?: string };
}) {
  const colaboradorId = searchParams.colaboradorId || undefined;
  const { perfil, informe } = await obtenerInformeSST(colaboradorId);

  if (!perfil) redirect('/informes');

  const supabase = createClient();
  let colaboradoresQuery = supabase
    .from('colaboradores')
    .select('id, nombre_completo')
    .eq('empresa_id', perfil.empresa_id)
    .eq('estado', 'activo')
    .order('nombre_completo');

  if (perfil.rol === 'lider' && perfil.colaborador_id) {
    colaboradoresQuery = colaboradoresQuery.eq('lider_id', perfil.colaborador_id);
  }

  const { data: colaboradoresFiltrables } = await colaboradoresQuery;

  const queryString = colaboradorId ? `?colaboradorId=${colaboradorId}` : '';
  const cadena = ['admin_th', 'gerencia'].includes(perfil.rol) ? await calcularCadenaSst(perfil.empresa_id) : null;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-2xl font-semibold text-secundario">Informe de cumplimiento SST</h1>
          <p className="text-sm text-marmol-500 mt-1">
            Certificaciones registradas y alertas SST abiertas. Los exámenes médicos y la dotación (EPP)
            se muestran como referencia de lo exigido por cargo — hoy no hay un registro digital de si ya
            se hicieron o entregaron.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={`/api/informes/sst/pdf${queryString}`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-marmol-200 hover:border-flow-300 text-marmol-600 text-sm font-medium px-3.5 py-2 transition"
          >
            <FileDown size={16} /> PDF
          </a>
          <a
            href={`/api/informes/sst/excel${queryString}`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-marmol-200 hover:border-flow-300 text-marmol-600 text-sm font-medium px-3.5 py-2 transition"
          >
            <FileSpreadsheet size={16} /> Excel
          </a>
        </div>
      </div>

      {cadena && (
        <div className="card p-5">
          <h2 className="font-display font-semibold text-secundario">Cadena de evidencias del SG-SST</h2>
          <p className="text-xs text-marmol-500 mt-1 mb-4">
            La Resolución 0312 no audita cada módulo por separado sino el encadenamiento: peligros y controles, capacitación, ejecución, hallazgos, acciones y
            indicadores. Cada eslabón enlaza al módulo donde se gestiona.
          </p>
          <ol className="grid gap-3 md:grid-cols-3">
            {[
              {
                n: 1,
                titulo: 'Peligros y controles',
                href: '/procesos-gestion/riesgos',
                lineas: [`${cadena.riesgos.total} riesgos registrados`, `${cadena.riesgos.conControl} con control evaluado`, `${cadena.riesgos.residualAlto} con riesgo residual alto`],
                alerta: cadena.riesgos.residualAlto > 0,
              },
              {
                n: 2,
                titulo: 'Capacitación SST',
                href: '/nexa/formacion',
                lineas: [`${cadena.capacitacion.completadas} de ${cadena.capacitacion.asignadas} cursos completados`, `Cobertura: ${cadena.capacitacion.pct != null ? `${cadena.capacitacion.pct}%` : '—'}`],
                alerta: cadena.capacitacion.pct != null && cadena.capacitacion.pct < 70,
              },
              {
                n: 3,
                titulo: 'Ejecución del plan',
                href: '/procesos-gestion/plan-trabajo',
                lineas: [`${cadena.ejecucion.ejecutadas} de ${cadena.ejecucion.programadas} actividades SST ejecutadas`, `${cadena.ejecucion.atrasadas} atrasadas`, `Cumplimiento: ${cadena.ejecucion.cumplimientoPct != null ? `${cadena.ejecucion.cumplimientoPct}%` : '—'}`],
                alerta: cadena.ejecucion.atrasadas > 0,
              },
              {
                n: 4,
                titulo: 'Simulacros y hallazgos',
                href: '/nexa/simulacros',
                lineas: [`${cadena.simulacros.total} simulacros`, `${cadena.simulacros.hallazgos} hallazgos (${cadena.simulacros.criticos} altos o críticos)`, `${cadena.simulacros.sinAcpm} no conformidades sin acción ACPM`],
                alerta: cadena.simulacros.sinAcpm > 0,
              },
              {
                n: 5,
                titulo: 'Acciones (ACPM)',
                href: '/procesos-gestion/acpm',
                lineas: [`${cadena.acpm.total} acciones nacidas de riesgos, simulacros o el plan`, `${cadena.acpm.cerradasEfectivas} cerradas efectivas · ${cadena.acpm.abiertas} abiertas`, `${cadena.acpm.vencidas} vencidas`],
                alerta: cadena.acpm.vencidas > 0,
              },
              {
                n: 6,
                titulo: 'Indicadores y revisión',
                href: '/informes/revision-direccion',
                lineas: [
                  `Tasa de accidentalidad: ${cadena.indicadores.tasaAccidentalidad != null ? `${cadena.indicadores.tasaAccidentalidad}%` : '—'}`,
                  `Cobertura de exámenes: ${cadena.indicadores.coberturaExamenes != null ? `${cadena.indicadores.coberturaExamenes}%` : '—'}`,
                  `${cadena.indicadores.diasIncapacidad} días de incapacidad (12 meses)`,
                ],
                alerta: false,
              },
            ].map((e) => (
              <li key={e.n} className={cn('rounded-lg border p-3', e.alerta ? 'border-medio/40 bg-medio/5' : 'border-marmol-200')}>
                <p className="text-xs font-semibold text-marmol-500">Paso {e.n}</p>
                <p className="text-sm font-medium text-marmol-900">{e.titulo}</p>
                <ul className="mt-1 text-xs text-marmol-600 space-y-0.5">
                  {e.lineas.map((l) => (
                    <li key={l}>{l}</li>
                  ))}
                </ul>
                <Link href={e.href} className="mt-2 inline-block text-xs text-flow-600 hover:underline">
                  Gestionar en el módulo →
                </Link>
              </li>
            ))}
          </ol>
          <p className="text-xs text-marmol-400 mt-3">
            Todo son conteos de la empresa. Hoy no se registran las investigaciones de accidentes ni el ausentismo por permisos; cuando existan, entran en los pasos 4 y 6.
          </p>
        </div>
      )}

      <form className="card p-3 flex items-center gap-3">
        <label className="text-xs text-marmol-500 shrink-0">Filtrar por persona</label>
        <select
          name="colaboradorId"
          defaultValue={colaboradorId ?? ''}
          className="rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm flex-1"
        >
          <option value="">Toda la empresa</option>
          {(colaboradoresFiltrables ?? []).map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre_completo}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-lg bg-flow-500 hover:bg-flow-600 text-white text-sm font-medium px-3.5 py-1.5 transition"
        >
          Aplicar
        </button>
      </form>

      <div className="card p-5">
        <h2 className="font-display font-semibold text-secundario mb-3">Certificaciones</h2>
        {!informe || informe.certificaciones.length === 0 ? (
          <EmptyState icon={ShieldCheck} titulo="Sin certificaciones registradas" />
        ) : (
          <FiltroTabla columnas={['Estado']} plural="registros" placeholder="Buscar por persona o certificación…">
          <div className="overflow-hidden -mx-5">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-marmol-200 text-left text-xs uppercase tracking-wide text-marmol-400">
                  <th className="px-5 py-2 font-medium">Colaborador</th>
                  <th className="px-5 py-2 font-medium">Certificación</th>
                  <th className="px-5 py-2 font-medium">Vencimiento</th>
                  <th className="px-5 py-2 font-medium">Verificado</th>
                  <th className="px-5 py-2 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody>
                {informe.certificaciones.map((c) => (
                  <tr key={c.id} className="border-b border-marmol-100 last:border-0">
                    <td className="px-5 py-3 font-medium text-marmol-900">{c.colaborador_nombre}</td>
                    <td className="px-5 py-3 text-marmol-600">{c.titulo}</td>
                    <td className="px-5 py-3 text-marmol-500">
                      {c.fecha_vencimiento ? formatearFecha(c.fecha_vencimiento) : '—'}
                    </td>
                    <td className="px-5 py-3 text-marmol-500">{c.verificado ? 'Sí' : 'No'}</td>
                    <td className="px-5 py-3">
                      <span className={cn('text-xs rounded-full px-2 py-0.5 font-medium', CLASE_ESTADO[c.estado])}>
                        {ETIQUETA_ESTADO[c.estado]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </FiltroTabla>
        )}
      </div>

      <div className="card p-5">
        <h2 className="font-display font-semibold text-secundario mb-3">Alertas SST abiertas</h2>
        {!informe || informe.alertas.length === 0 ? (
          <EmptyState icon={ShieldCheck} titulo="Sin alertas SST abiertas" />
        ) : (
          <div className="space-y-2">
            {informe.alertas.map((a) => (
              <div key={a.id} className="flex items-center justify-between border-b border-marmol-100 pb-2 last:border-0 text-sm">
                <div>
                  <p className="font-medium text-marmol-800">{a.titulo}</p>
                  <p className="text-xs text-marmol-400">{a.colaborador_nombre}</p>
                </div>
                <span className="text-xs text-marmol-500">{formatearFecha(a.fecha_objetivo)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card p-5">
        <h2 className="font-display font-semibold text-secundario mb-1">Exámenes médicos y EPP exigidos por cargo</h2>
        <p className="text-xs text-marmol-400 mb-3">
          Lo que exige el cargo de cada persona, según su perfil. Sin pantalla de captura todavía, así que el
          estado siempre aparece como "Sin dato registrado" — no significa que no se haya hecho, sino que no
          hay un registro digital de si se hizo o no.
        </p>
        {!informe || informe.requisitosSinDato.length === 0 ? (
          <EmptyState icon={ShieldCheck} titulo="Sin requisitos SST definidos por cargo" />
        ) : (
          <FiltroTabla columnas={['Tipo', 'Estado']} plural="registros" placeholder="Buscar por persona, cargo o requisito…">
          <div className="overflow-hidden -mx-5">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-marmol-200 text-left text-xs uppercase tracking-wide text-marmol-400">
                  <th className="px-5 py-2 font-medium">Colaborador</th>
                  <th className="px-5 py-2 font-medium">Cargo</th>
                  <th className="px-5 py-2 font-medium">Tipo</th>
                  <th className="px-5 py-2 font-medium">Requisito</th>
                  <th className="px-5 py-2 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody>
                {informe.requisitosSinDato.map((r, i) => (
                  <tr key={i} className="border-b border-marmol-100 last:border-0">
                    <td className="px-5 py-3 font-medium text-marmol-900">{r.colaborador_nombre}</td>
                    <td className="px-5 py-3 text-marmol-600">{r.cargo_nombre}</td>
                    <td className="px-5 py-3 text-marmol-600">{r.tipo}</td>
                    <td className="px-5 py-3 text-marmol-600">
                      {r.requisito}
                      {r.detalle && <span className="text-marmol-400"> ({r.detalle})</span>}
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-xs rounded-full px-2 py-0.5 font-medium bg-marmol-100 text-marmol-500 border border-marmol-200">
                        Sin dato registrado
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </FiltroTabla>
        )}
      </div>
    </div>
  );
}
