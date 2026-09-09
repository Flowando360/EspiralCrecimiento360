import { redirect } from 'next/navigation';
import { EmptyState } from '@/components/ui/empty-state';
import { BarChart3, FileDown, FileSpreadsheet } from 'lucide-react';
import { cn } from '@/lib/utils';
import { obtenerInformeBrechas, type Agrupacion, type SemaforoDimension } from './data';

const CLASE_SEMAFORO: Record<NonNullable<SemaforoDimension>, string> = {
  alto: 'badge-alto',
  medio: 'badge-medio',
  bajo: 'badge-bajo',
};

function Celda({ promedio, conDato, tamano, semaforo, sufijo = '' }: { promedio: number | null; conDato: number; tamano: number; semaforo: SemaforoDimension; sufijo?: string }) {
  if (promedio === null) {
    return <span className="text-xs text-marmol-400">Sin dato registrado</span>;
  }
  return (
    <div className="flex items-center gap-1.5">
      <span className={cn('text-xs rounded-full px-2 py-0.5 font-medium', semaforo && CLASE_SEMAFORO[semaforo])}>
        {promedio}
        {sufijo}
      </span>
      {conDato < tamano && <span className="text-[10px] text-marmol-400">({conDato}/{tamano})</span>}
    </div>
  );
}

export default async function InformeBrechasPage({
  searchParams,
}: {
  searchParams: { agrupacion?: string };
}) {
  const agrupacion: Agrupacion = searchParams.agrupacion === 'area' ? 'area' : 'equipo';
  const { perfil, filas } = await obtenerInformeBrechas(agrupacion);

  if (!perfil) redirect('/informes');

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
            href={`/api/informes/brechas/pdf?agrupacion=${agrupacion}`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-marmol-200 hover:border-flow-300 text-marmol-600 text-sm font-medium px-3.5 py-2 transition"
          >
            <FileDown size={16} /> PDF
          </a>
          <a
            href={`/api/informes/brechas/excel?agrupacion=${agrupacion}`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-marmol-200 hover:border-flow-300 text-marmol-600 text-sm font-medium px-3.5 py-2 transition"
          >
            <FileSpreadsheet size={16} /> Excel
          </a>
        </div>
      </div>

      <div className="card p-3 flex items-center gap-2 w-fit">
        <a
          href="?agrupacion=equipo"
          className={cn(
            'rounded-lg px-3 py-1.5 text-sm font-medium transition',
            agrupacion === 'equipo' ? 'bg-flow-500 text-white' : 'text-marmol-600 hover:bg-marmol-100'
          )}
        >
          Por equipo
        </a>
        <a
          href="?agrupacion=area"
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
                    <Celda promedio={f.ser.promedio} conDato={f.ser.conDato} tamano={f.tamano} semaforo={f.ser.semaforo} />
                  </td>
                  <td className="px-4 py-3">
                    <Celda promedio={f.saber.promedio} conDato={f.saber.conDato} tamano={f.tamano} semaforo={f.saber.semaforo} sufijo="%" />
                  </td>
                  <td className="px-4 py-3">
                    <Celda promedio={f.hacer.promedio} conDato={f.hacer.conDato} tamano={f.tamano} semaforo={f.hacer.semaforo} />
                  </td>
                  <td className="px-4 py-3">
                    <Celda promedio={f.deber.promedio} conDato={f.deber.conDato} tamano={f.tamano} semaforo={f.deber.semaforo} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-marmol-400">
        Ser y Saber usan escalas distintas (Ser 1-5, Saber % de cumplimiento) — cada semáforo usa su propio
        umbral. "(x/y)" indica cuántas personas del grupo tienen dato registrado para esa dimensión.
      </p>
    </div>
  );
}
