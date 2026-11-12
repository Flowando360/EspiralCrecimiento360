import { redirect } from 'next/navigation';
import { leerFiltrosEquipo, queryFiltrosEquipo, opcionesFiltroEquipo } from '@/lib/informes/filtros-equipo';
import { FiltroEquipo } from '@/components/informes/filtro-equipo';
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

export default async function InformeConsolidadoPage({ searchParams }: { searchParams: { area?: string; liderId?: string } }) {
  const filtros = leerFiltrosEquipo(searchParams);
  const { perfil, informe } = await obtenerInformeConsolidado(filtros);
  if (!perfil || !informe) redirect('/inicio');
  const opcionesEquipo = await opcionesFiltroEquipo(perfil);
  const qs = queryFiltrosEquipo(filtros);

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
            href={`/api/informes/consolidado/pdf${qs}`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-marmol-200 hover:border-flow-300 text-marmol-600 text-sm font-medium px-3.5 py-2 transition"
          >
            <FileDown size={16} /> PDF
          </a>
          <a
            href={`/api/informes/consolidado/excel${qs}`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-marmol-200 hover:border-flow-300 text-marmol-600 text-sm font-medium px-3.5 py-2 transition"
          >
            <FileSpreadsheet size={16} /> Excel
          </a>
        </div>
      </div>

      <FiltroEquipo
        rutaBase="/informes/consolidado"
        areas={opcionesEquipo.areas}
        lideres={opcionesEquipo.lideres}
        actuales={filtros}
        conservar={{}}
        mostrarLider={perfil.rol !== 'lider'}
      />

      {informe.filtroDescripcion && (
        <p className="text-xs text-medio bg-medio/10 border border-medio/20 rounded-lg px-3 py-2">
          Mostrando solo: {informe.filtroDescripcion}. Saber, alineación talento-rol y alertas se calculan para toda la empresa, por eso no se muestran con filtro.
        </p>
      )}

      {(informe.filtroProtegido || informe.porArea.some((a) => a.protegido)) && (
        <p className="text-xs text-marmol-500 bg-marmol-50 border border-marmol-200 rounded-lg px-3 py-2">
          Por privacidad no se muestran promedios de grupos con menos de {informe.umbralAnonimato} personas con dato (se configura en Administración → Configuración).
        </p>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Dato etiqueta="Colaboradores activos" valor={informe.totalActivos} />
        <Dato etiqueta="En proceso de salida" valor={informe.enProcesoSalida} />
        <Dato etiqueta="Alineación talento-rol" valor={informe.pctAlineacionTalentoRol != null ? `${informe.pctAlineacionTalentoRol}%` : '—'} />
        <Dato etiqueta="Alertas críticas abiertas" valor={informe.alertasCriticas ?? '—'} />
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
                <td className="px-4 py-3 text-marmol-600">{a.protegido ? `Menos de ${informe.umbralAnonimato} personas` : a.promedioHacer ?? '—'}</td>
                <td className="px-4 py-3 text-marmol-600">{a.protegido ? `Menos de ${informe.umbralAnonimato} personas` : a.promedioDeber ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
