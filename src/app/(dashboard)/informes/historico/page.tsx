import { redirect } from 'next/navigation';
import { leerFiltrosEquipo, queryFiltrosEquipo, opcionesFiltroEquipo } from '@/lib/informes/filtros-equipo';
import { FiltroEquipo } from '@/components/informes/filtro-equipo';
import { EmptyState } from '@/components/ui/empty-state';
import { TrendingUp, TrendingDown, Minus, FileDown, FileSpreadsheet } from 'lucide-react';
import { formatearFecha } from '@/lib/utils';
import { obtenerInformeHistorico } from './data';

function Tendencia({ actual, anterior }: { actual: number | null; anterior: number | null | undefined }) {
  if (actual == null || anterior == null) return <span className="text-marmol-300">—</span>;
  const diferencia = Math.round((actual - anterior) * 100) / 100;
  if (diferencia > 0) return <span className="text-alto inline-flex items-center gap-0.5"><TrendingUp size={12} /> +{diferencia}</span>;
  if (diferencia < 0) return <span className="text-bajo inline-flex items-center gap-0.5"><TrendingDown size={12} /> {diferencia}</span>;
  return <span className="text-marmol-400 inline-flex items-center gap-0.5"><Minus size={12} /> sin cambio</span>;
}

export default async function InformeHistoricoPage({ searchParams }: { searchParams: { area?: string; liderId?: string } }) {
  const filtros = leerFiltrosEquipo(searchParams);
  const { perfil, filas, umbral } = await obtenerInformeHistorico(filtros);
  if (!perfil) redirect('/inicio');
  const opcionesEquipo = await opcionesFiltroEquipo(perfil);
  const qs = queryFiltrosEquipo(filtros);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-2xl font-semibold text-secundario">Histórico Comparativo entre Ciclos</h1>
          <p className="text-sm text-marmol-500 mt-1">Evolución del promedio de Hacer y Deber de un ciclo al siguiente.</p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={`/api/informes/historico/pdf${qs}`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-marmol-200 hover:border-flow-300 text-marmol-600 text-sm font-medium px-3.5 py-2 transition"
          >
            <FileDown size={16} /> PDF
          </a>
          <a
            href={`/api/informes/historico/excel${qs}`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-marmol-200 hover:border-flow-300 text-marmol-600 text-sm font-medium px-3.5 py-2 transition"
          >
            <FileSpreadsheet size={16} /> Excel
          </a>
        </div>
      </div>

      <FiltroEquipo
        rutaBase="/informes/historico"
        areas={opcionesEquipo.areas}
        lideres={opcionesEquipo.lideres}
        actuales={filtros}
        conservar={{}}
        mostrarLider={perfil.rol !== 'lider'}
      />

      {filas.length === 0 ? (
        <EmptyState icon={TrendingUp} titulo="Sin ciclos con resultados todavía" descripcion="Cuando haya más de un ciclo con resultados, aquí se compara la evolución." />
      ) : (
        <>
        <GraficaEvolucion filas={filas} />
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-marmol-200 text-left text-xs uppercase tracking-wide text-marmol-400">
                <th className="px-4 py-3 font-medium">Ciclo</th>
                <th className="px-4 py-3 font-medium">Apertura</th>
                <th className="px-4 py-3 font-medium">Personas evaluadas</th>
                <th className="px-4 py-3 font-medium">Hacer (promedio)</th>
                <th className="px-4 py-3 font-medium">vs. anterior</th>
                <th className="px-4 py-3 font-medium">Deber (promedio)</th>
                <th className="px-4 py-3 font-medium">vs. anterior</th>
              </tr>
            </thead>
            <tbody>
              {filas.map((f, i) => (
                <tr key={f.cicloId} className="border-b border-marmol-100 last:border-0">
                  <td className="px-4 py-3 font-medium text-marmol-900">{f.cicloNombre}</td>
                  <td className="px-4 py-3 text-marmol-500">{formatearFecha(f.fechaApertura)}</td>
                  <td className="px-4 py-3 text-marmol-600">{f.personas}</td>
                  <td className="px-4 py-3 text-marmol-600">{f.protegido ? `Menos de ${umbral} personas` : f.promedioHacer ?? '—'}</td>
                  <td className="px-4 py-3 text-xs">
                    <Tendencia actual={f.promedioHacer} anterior={filas[i - 1]?.promedioHacer} />
                  </td>
                  <td className="px-4 py-3 text-marmol-600">{f.protegido ? `Menos de ${umbral} personas` : f.promedioDeber ?? '—'}</td>
                  <td className="px-4 py-3 text-xs">
                    <Tendencia actual={f.promedioDeber} anterior={filas[i - 1]?.promedioDeber} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </>
      )}
    </div>
  );
}

/** Línea de evolución de Hacer y Deber por ciclo (escala 1 a 5). Los ciclos sin dato o protegidos por anonimato quedan sin punto. */
function GraficaEvolucion({ filas }: { filas: { cicloNombre: string; promedioHacer: number | null; promedioDeber: number | null }[] }) {
  const W = 640;
  const H = 220;
  const m = { l: 34, r: 16, t: 16, b: 44 };
  const x = (i: number) => (filas.length === 1 ? (W + m.l - m.r) / 2 : m.l + (i * (W - m.l - m.r)) / (filas.length - 1));
  const y = (v: number) => m.t + ((5 - v) * (H - m.t - m.b)) / 4;
  const serie = (clave: 'promedioHacer' | 'promedioDeber') =>
    filas.map((f, i) => (f[clave] != null ? { i, v: f[clave] as number } : null)).filter((p): p is { i: number; v: number } => p !== null);
  const lineas = [
    { clave: 'promedioHacer' as const, nombre: 'Hacer', color: 'rgb(var(--flow-600))' },
    { clave: 'promedioDeber' as const, nombre: 'Deber', color: '#d97706' },
  ];
  return (
    <div className="card p-4">
      <h2 className="font-display font-semibold text-secundario mb-1">Evolución por ciclo</h2>
      <p className="text-xs text-marmol-500 mb-3">
        Hacer y Deber, escala 1 a 5, con los mismos filtros de arriba. Ser y Saber no se grafican aquí: el Ser es descriptivo, sin nota, y el
        Saber no se mide por ciclo.
      </p>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Evolución del promedio de Hacer y Deber por ciclo">
        {[1, 2, 3, 4, 5].map((v) => (
          <g key={v}>
            <line x1={m.l} x2={W - m.r} y1={y(v)} y2={y(v)} stroke="currentColor" strokeOpacity="0.12" />
            <text x={m.l - 8} y={y(v) + 4} textAnchor="end" fontSize="11" fill="currentColor" fillOpacity="0.6">{v}</text>
          </g>
        ))}
        {filas.map((f, i) => (
          <text key={i} x={x(i)} y={H - 22} textAnchor="middle" fontSize="11" fill="currentColor" fillOpacity="0.7">
            {f.cicloNombre.length > 16 ? f.cicloNombre.slice(0, 15) + '…' : f.cicloNombre}
          </text>
        ))}
        {lineas.map((l) => {
          const pts = serie(l.clave);
          return (
            <g key={l.clave}>
              {pts.length > 1 && <polyline fill="none" stroke={l.color} strokeWidth="2.5" points={pts.map((p) => `${x(p.i)},${y(p.v)}`).join(' ')} />}
              {pts.map((p) => (
                <g key={p.i}>
                  <circle cx={x(p.i)} cy={y(p.v)} r="4" fill={l.color} />
                  <text x={x(p.i)} y={y(p.v) - 9} textAnchor="middle" fontSize="11" fill="currentColor">{p.v}</text>
                </g>
              ))}
            </g>
          );
        })}
      </svg>
      <div className="flex gap-4 text-xs text-marmol-600 mt-1">
        {lineas.map((l) => (
          <span key={l.clave} className="inline-flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-5 rounded" style={{ background: l.color, height: 3 }} /> {l.nombre}
          </span>
        ))}
      </div>
    </div>
  );
}
