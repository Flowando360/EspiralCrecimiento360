import { redirect } from 'next/navigation';
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

export default async function InformeHistoricoPage() {
  const { perfil, filas } = await obtenerInformeHistorico();
  if (!perfil) redirect('/inicio');

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-2xl font-semibold text-secundario">Histórico Comparativo entre Ciclos</h1>
          <p className="text-sm text-marmol-500 mt-1">Evolución del promedio de Hacer y Deber de un ciclo al siguiente.</p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="/api/informes/historico/pdf"
            className="inline-flex items-center gap-1.5 rounded-lg border border-marmol-200 hover:border-flow-300 text-marmol-600 text-sm font-medium px-3.5 py-2 transition"
          >
            <FileDown size={16} /> PDF
          </a>
          <a
            href="/api/informes/historico/excel"
            className="inline-flex items-center gap-1.5 rounded-lg border border-marmol-200 hover:border-flow-300 text-marmol-600 text-sm font-medium px-3.5 py-2 transition"
          >
            <FileSpreadsheet size={16} /> Excel
          </a>
        </div>
      </div>

      {filas.length === 0 ? (
        <EmptyState icon={TrendingUp} titulo="Sin ciclos con resultados todavía" descripcion="Cuando haya más de un ciclo con resultados, aquí se compara la evolución." />
      ) : (
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
                  <td className="px-4 py-3 text-marmol-600">{f.promedioHacer ?? '—'}</td>
                  <td className="px-4 py-3 text-xs">
                    <Tendencia actual={f.promedioHacer} anterior={filas[i - 1]?.promedioHacer} />
                  </td>
                  <td className="px-4 py-3 text-marmol-600">{f.promedioDeber ?? '—'}</td>
                  <td className="px-4 py-3 text-xs">
                    <Tendencia actual={f.promedioDeber} anterior={filas[i - 1]?.promedioDeber} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
