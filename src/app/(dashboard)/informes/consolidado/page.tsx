import { redirect } from 'next/navigation';
import { leerFiltrosEquipo, queryFiltrosEquipo, opcionesFiltroEquipo } from '@/lib/informes/filtros-equipo';
import { FiltroEquipo } from '@/components/informes/filtro-equipo';
import { obtenerInformeConsolidado } from './data';
import { ETIQUETAS_MOTIVO_SALIDA, ETIQUETAS_TIPO_INCAPACIDAD } from '@/lib/informes/talento';
import { BarChart3, FileDown, FileSpreadsheet } from 'lucide-react';

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string | number }) {
  return (
    <div className="card p-4">
      <p className="text-xs text-marmol-500 mb-1">{etiqueta}</p>
      <p className="text-2xl font-display font-semibold text-secundario">{valor}</p>
    </div>
  );
}

export default async function InformeConsolidadoPage({ searchParams }: { searchParams: { area?: string; liderId?: string; cargoId?: string; antiguedad?: string; desde?: string; hasta?: string } }) {
  const filtros = leerFiltrosEquipo(searchParams);
  const { perfil, informe } = await obtenerInformeConsolidado(filtros, { desde: searchParams.desde, hasta: searchParams.hasta });
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
        cargos={opcionesEquipo.cargos}
        actuales={filtros}
        conservar={{}}
        mostrarLider={perfil.rol !== 'lider'}
      />

      {informe.filtroDescripcion && (
        <p className="text-xs text-medio bg-medio/10 border border-medio/20 rounded-lg px-3 py-2">
          Mostrando solo: {informe.filtroDescripcion}. Saber, «con Guía y desempeño sin alerta» y alertas se calculan para toda la empresa, por eso no se muestran con filtro.
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
        <Dato etiqueta="Con Guía y desempeño sin alerta" valor={informe.pctAlineacionTalentoRol != null ? `${informe.pctAlineacionTalentoRol}%` : '—'} />
        <Dato etiqueta="Alertas críticas abiertas" valor={informe.alertasCriticas ?? '—'} />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Dato etiqueta="Índice de Hacer (promedio)" valor={informe.promedioHacerEmpresa ?? '—'} />
        <Dato etiqueta="Índice de Deber (promedio)" valor={informe.promedioDeberEmpresa ?? '—'} />
        <Dato etiqueta="Cumplimiento de Saber" valor={informe.promedioSaberEmpresa != null ? `${informe.promedioSaberEmpresa}%` : '—'} />
      </div>

      <div className="card p-5 space-y-5">
        <div className="flex items-end justify-between gap-3 flex-wrap">
          <div>
            <h2 className="font-display font-semibold text-secundario">Indicadores de talento</h2>
            <p className="text-xs text-marmol-500">Rotación, ausentismo, selección y headcount del período elegido (por defecto, el último año).</p>
          </div>
          <form method="GET" className="flex items-end gap-2 text-sm">
            {filtros.area && <input type="hidden" name="area" value={filtros.area} />}
            {filtros.liderId && <input type="hidden" name="liderId" value={filtros.liderId} />}
            {filtros.cargoId && <input type="hidden" name="cargoId" value={filtros.cargoId} />}
            {filtros.antiguedad && <input type="hidden" name="antiguedad" value={filtros.antiguedad} />}
            <label className="flex flex-col text-xs text-marmol-500">
              Desde
              <input type="date" name="desde" defaultValue={informe.periodoDesde} className="rounded-lg border border-marmol-200 px-2 py-1 text-sm text-marmol-800" />
            </label>
            <label className="flex flex-col text-xs text-marmol-500">
              Hasta
              <input type="date" name="hasta" defaultValue={informe.periodoHasta} className="rounded-lg border border-marmol-200 px-2 py-1 text-sm text-marmol-800" />
            </label>
            <button type="submit" className="rounded-lg bg-flow-500 hover:bg-flow-600 text-white font-medium px-3 py-1.5">Recalcular</button>
          </form>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Dato etiqueta="Vigentes (activos + en período de prueba)" valor={informe.talento.totalVigentes} />
          <Dato etiqueta="De ellos, en período de prueba" valor={informe.talento.totalEnPrueba} />
          <Dato etiqueta="Salidas en el período" valor={informe.talento.rotacion.salidas} />
          <Dato etiqueta="Rotación del período" valor={informe.talento.rotacion.tasaPct != null ? `${informe.talento.rotacion.tasaPct}%` : '—'} />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <h3 className="text-sm font-semibold text-marmol-800 mb-2">Headcount por área</h3>
            {informe.talento.headcountPorArea.length === 0 ? (
              <p className="text-sm text-marmol-400">Sin personas.</p>
            ) : (
              <>
                <Barras filas={informe.talento.headcountPorArea.map((a) => ({ etiqueta: a.enPrueba ? `${a.area} (${a.enPrueba} en prueba)` : a.area, valor: a.total }))} />
                <p className="text-xs text-marmol-400 mt-2">Para ver el peso en la masa salarial hace falta que los salarios estén cargados en cada ficha; hoy no se muestra para proteger ese dato.</p>
              </>
            )}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-marmol-800 mb-2">Salidas por causa</h3>
            {informe.talento.rotacion.porCausa.length === 0 ? (
              <p className="text-sm text-marmol-400">No hubo salidas en el período.</p>
            ) : (
              <Barras filas={informe.talento.rotacion.porCausa.map((c) => ({ etiqueta: ETIQUETAS_MOTIVO_SALIDA[c.causa] ?? c.causa, valor: c.cantidad }))} />
            )}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-marmol-800 mb-2">Ausentismo por tipo (días)</h3>
            {informe.talento.ausentismo === null ? (
              <p className="text-sm text-marmol-400">Solo lo ve Talento Humano, sin filtros de equipo (son datos de salud).</p>
            ) : informe.talento.ausentismo.porTipo.length === 0 ? (
              <p className="text-sm text-marmol-400">Sin incapacidades ni licencias en el período.</p>
            ) : (
              <>
                <Barras filas={informe.talento.ausentismo.porTipo.map((t) => ({ etiqueta: `${ETIQUETAS_TIPO_INCAPACIDAD[t.tipo] ?? t.tipo} (${t.eventos})`, valor: t.dias }))} />
                <p className="text-xs text-marmol-400 mt-2">{informe.talento.ausentismo.dias} días en {informe.talento.ausentismo.eventos} eventos. Permisos y calamidades aún no se registran en la plataforma.</p>
              </>
            )}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-marmol-800 mb-2">Selección</h3>
            <ul className="text-sm text-marmol-700 space-y-1">
              <li>Vacantes cerradas en el período: <strong>{informe.talento.seleccion.vacantesCerradas}</strong></li>
              <li>Tiempo promedio de cierre: <strong>{informe.talento.seleccion.diasPromedioCierre != null ? `${informe.talento.seleccion.diasPromedioCierre} días` : '—'}</strong></li>
              <li>
                Superan los primeros 90 días:{' '}
                <strong>{informe.talento.seleccion.pctSuperaPrueba != null ? `${informe.talento.seleccion.pctSuperaPrueba}%` : '—'}</strong>{' '}
                <span className="text-xs text-marmol-400">({informe.talento.seleccion.superaronPrueba} de {informe.talento.seleccion.contratadosEvaluables} ingresos con 90 días cumplidos)</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="card p-5">
        <h2 className="font-display font-semibold text-secundario mb-3">Desempeño por área (gráfico)</h2>
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <p className="text-xs text-marmol-500 mb-2">Hacer (promedio, escala 1 a 5)</p>
            <Barras filas={informe.porArea.filter((a) => a.promedioHacer != null).map((a) => ({ etiqueta: a.area, valor: a.promedioHacer as number }))} />
          </div>
          <div>
            <p className="text-xs text-marmol-500 mb-2">Deber (promedio, escala 1 a 5)</p>
            <Barras filas={informe.porArea.filter((a) => a.promedioDeber != null).map((a) => ({ etiqueta: a.area, valor: a.promedioDeber as number }))} />
          </div>
        </div>
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

function Barras({ filas, sufijo = '' }: { filas: { etiqueta: string; valor: number }[]; sufijo?: string }) {
  const max = Math.max(1, ...filas.map((f) => f.valor));
  return (
    <ul className="space-y-1.5">
      {filas.map((f) => (
        <li key={f.etiqueta} className="flex items-center gap-3 text-sm">
          <span className="w-44 shrink-0 truncate text-marmol-700" title={f.etiqueta}>{f.etiqueta}</span>
          <span className="flex-1 h-3 rounded bg-marmol-100 overflow-hidden">
            <span className="block h-full rounded bg-flow-500" style={{ width: `${(f.valor / max) * 100}%` }} />
          </span>
          <span className="w-16 text-right text-marmol-600">{f.valor}{sufijo}</span>
        </li>
      ))}
    </ul>
  );
}
