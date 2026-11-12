import { redirect } from 'next/navigation';
import { leerFiltrosEquipo, queryFiltrosEquipo, opcionesFiltroEquipo } from '@/lib/informes/filtros-equipo';
import { FiltroEquipo } from '@/components/informes/filtro-equipo';
import { EmptyState } from '@/components/ui/empty-state';
import { BarChart3, FileDown, FileSpreadsheet } from 'lucide-react';
import { cn } from '@/lib/utils';
import { obtenerInformeBrechas, type Agrupacion, type SemaforoDimension } from './data';

const CLASE_SEMAFORO: Record<NonNullable<SemaforoDimension>, string> = {
  alto: 'badge-alto',
  medio: 'badge-medio',
  bajo: 'badge-bajo',
};

function Celda({ promedio, conDato, tamano, semaforo, sufijo = '', protegido = false, umbral = 5 }: { promedio: number | null; conDato: number; tamano: number; semaforo: SemaforoDimension; sufijo?: string; protegido?: boolean; umbral?: number }) {
  if (protegido) {
    return <span className="text-xs text-marmol-400" title="Para proteger la privacidad no se muestran promedios de grupos pequeños">Menos de {umbral} personas</span>;
  }
  if (promedio === null) {
    return <span className="text-xs text-marmol-400">Sin dato registrado</span>;
  }
  return (
    <div className="flex items-center gap-1.5">
      <span className={cn('text-xs rounded-full px-2 py-0.5 font-medium', semaforo && CLASE_SEMAFORO[semaforo])}>
        {promedio}
        {sufijo}
      </span>
      {conDato < tamano && <span className="text-[12px] text-marmol-400">({conDato}/{tamano})</span>}
    </div>
  );
}

export default async function InformeBrechasPage({
  searchParams,
}: {
  searchParams: { agrupacion?: string; area?: string; liderId?: string };
}) {
  const agrupacion: Agrupacion = searchParams.agrupacion === 'area' ? 'area' : 'equipo';
  const filtros = leerFiltrosEquipo(searchParams);
  const { perfil, filas, umbral } = await obtenerInformeBrechas(agrupacion, filtros);

  if (!perfil) redirect('/informes');
  const opcionesEquipo = await opcionesFiltroEquipo(perfil);
  const qs = queryFiltrosEquipo(filtros, `agrupacion=${agrupacion}`);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-2xl font-semibold text-secundario">Informe de brechas por dimensión</h1>
          <p className="text-sm text-marmol-500 mt-1">
            Comparativo de Ser, Saber, Hacer y Deber por equipo o área, para priorizar intervenciones.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={`/api/informes/brechas/pdf${qs}`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-marmol-200 hover:border-flow-300 text-marmol-600 text-sm font-medium px-3.5 py-2 transition"
          >
            <FileDown size={16} /> PDF
          </a>
          <a
            href={`/api/informes/brechas/excel${qs}`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-marmol-200 hover:border-flow-300 text-marmol-600 text-sm font-medium px-3.5 py-2 transition"
          >
            <FileSpreadsheet size={16} /> Excel
          </a>
        </div>
      </div>

      <FiltroEquipo
        rutaBase="/informes/brechas"
        areas={opcionesEquipo.areas}
        lideres={opcionesEquipo.lideres}
        actuales={filtros}
        conservar={{ agrupacion }}
        mostrarLider={perfil.rol !== 'lider'}
      />

      <div className="card p-3 flex items-center gap-2 w-fit">
        <a
          href={queryFiltrosEquipo(filtros, 'agrupacion=equipo')}
          className={cn(
            'rounded-lg px-3 py-1.5 text-sm font-medium transition',
            agrupacion === 'equipo' ? 'bg-flow-500 text-white' : 'text-marmol-600 hover:bg-marmol-100'
          )}
        >
          Por equipo
        </a>
        <a
          href={queryFiltrosEquipo(filtros, 'agrupacion=area')}
          className={cn(
            'rounded-lg px-3 py-1.5 text-sm font-medium transition',
            agrupacion === 'area' ? 'bg-flow-500 text-white' : 'text-marmol-600 hover:bg-marmol-100'
          )}
        >
          Por área
        </a>
      </div>

      {filas.length === 0 ? (
        <EmptyState icon={BarChart3} titulo="Sin datos para comparar" descripcion="No hay colaboradores activos en tu alcance." />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-marmol-200 text-left text-xs uppercase tracking-wide text-marmol-400">
                <th className="px-4 py-3 font-medium">{agrupacion === 'equipo' ? 'Equipo (líder)' : 'Área'}</th>
                <th className="px-4 py-3 font-medium">Personas</th>
                <th className="px-4 py-3 font-medium text-ser">Ser</th>
                <th className="px-4 py-3 font-medium text-saber">Saber</th>
                <th className="px-4 py-3 font-medium text-hacer">Hacer</th>
                <th className="px-4 py-3 font-medium text-deber">Deber</th>
              </tr>
            </thead>
            <tbody>
              {filas.map((f) => (
                <tr key={f.grupo} className="border-b border-marmol-100 last:border-0">
                  <td className="px-4 py-3 font-medium text-marmol-900">{f.grupo}</td>
                  <td className="px-4 py-3 text-marmol-500">{f.tamano}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-marmol-500">{f.ser.conDato} de {f.tamano} con Guía</span>
                  </td>
                  <td className="px-4 py-3">
                    <Celda promedio={f.saber.promedio} conDato={f.saber.conDato} tamano={f.tamano} semaforo={f.saber.semaforo} sufijo="%" protegido={f.saber.protegido} umbral={umbral} />
                  </td>
                  <td className="px-4 py-3">
                    <Celda promedio={f.hacer.promedio} conDato={f.hacer.conDato} tamano={f.tamano} semaforo={f.hacer.semaforo} protegido={f.hacer.protegido} umbral={umbral} />
                  </td>
                  <td className="px-4 py-3">
                    <Celda promedio={f.deber.promedio} conDato={f.deber.conDato} tamano={f.tamano} semaforo={f.deber.semaforo} protegido={f.deber.protegido} umbral={umbral} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-marmol-400">
        El Ser se describe, no se califica: solo se indica cuántas personas ya tienen Guía del Flow. Saber es un % de cumplimiento y Hacer/Deber van de 1 a 5, cada semáforo con su propio
        umbral. Por privacidad no se muestran promedios de grupos con menos de {umbral} personas con dato. "(x/y)" indica cuántas personas del grupo tienen dato registrado para esa dimensión.
      </p>
    </div>
  );
}
