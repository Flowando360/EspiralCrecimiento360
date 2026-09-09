import { redirect } from 'next/navigation';
import { obtenerInformeConsolidado } from './data';
import { BarChart3, FileDown, FileSpreadsheet } from 'lucide-react';

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string | number }) {
  return (
    <div className="card p-4">
      <p className="text-xs text-marmol-500 mb-1">{etiqueta}</p>
      <p className="text-2xl font-display font-semibold text-secundario">{valor}</p>
    </div>
  );
}

export default async function InformeConsolidadoPage() {
  const { perfil, informe } = await obtenerInformeConsolidado();
  if (!perfil || !informe) redirect('/inicio');

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-2xl font-semibold text-secundario flex items-center gap-2">
            <BarChart3 size={22} className="text-flow-600" /> Informe Consolidado Gerencial
          </h1>
          <p className="text-sm text-marmol-500 mt-1">Panorama completo de la empresa, listo para presentar.</p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="/api/informes/consolidado/pdf"
            className="inline-flex items-center gap-1.5 rounded-lg border border-marmol-200 hover:border-flow-300 text-marmol-600 text-sm font-medium px-3.5 py-2 transition"
          >
            <FileDown size={16} /> PDF
          </a>
          <a
            href="/api/informes/consolidado/excel"
            className="inline-flex items-center gap-1.5 rounded-lg border border-marmol-200 hover:border-flow-300 text-marmol-600 text-sm font-medium px-3.5 py-2 transition"
          >
            <FileSpreadsheet size={16} /> Excel
          </a>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Dato etiqueta="Colaboradores activos" valor={informe.totalActivos} />
        <Dato etiqueta="En proceso de salida" valor={informe.enProcesoSalida} />
        <Dato etiqueta="Alineación talento-rol" valor={informe.pctAlineacionTalentoRol != null ? `${informe.pctAlineacionTalentoRol}%` : '—'} />
        <Dato etiqueta="Alertas críticas abiertas" valor={informe.alertasCriticas} />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Dato etiqueta="Índice de Hacer (promedio)" valor={informe.promedioHacerEmpresa ?? '—'} />
        <Dato etiqueta="Índice de Deber (promedio)" valor={informe.promedioDeberEmpresa ?? '—'} />
        <Dato etiqueta="Cumplimiento de Saber" valor={informe.promedioSaberEmpresa != null ? `${informe.promedioSaberEmpresa}%` : '—'} />
      </div>

      <div className="card overflow-hidden">
        <div className="px-4 py-3 border-b border-marmol-200">
          <h2 className="font-display font-semibold text-secundario">Desempeño por área</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-marmol-200 text-left text-xs uppercase tracking-wide text-marmol-400">
              <th className="px-4 py-3 font-medium">Área</th>
              <th className="px-4 py-3 font-medium">Personas</th>
              <th className="px-4 py-3 font-medium">Hacer (promedio)</th>
              <th className="px-4 py-3 font-medium">Deber (promedio)</th>
            </tr>
          </thead>
          <tbody>
            {informe.porArea.map((a) => (
              <tr key={a.area} className="border-b border-marmol-100 last:border-0">
                <td className="px-4 py-3 font-medium text-marmol-900">{a.area}</td>
                <td className="px-4 py-3 text-marmol-600">{a.tamano}</td>
                <td className="px-4 py-3 text-marmol-600">{a.promedioHacer ?? '—'}</td>
                <td className="px-4 py-3 text-marmol-600">{a.promedioDeber ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
