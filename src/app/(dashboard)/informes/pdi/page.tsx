import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { EmptyState } from '@/components/ui/empty-state';
import { Target, FileDown, FileSpreadsheet } from 'lucide-react';
import { formatearFecha, cn } from '@/lib/utils';
import { obtenerPlanesInforme } from './data';
import { IdentidadReferencia } from '@/components/espiral-crecimiento/identidad-referencia';

const ESTADO_COLOR: Record<string, string> = {
  pendiente: 'bg-marmol-100 text-marmol-600',
  en_curso: 'bg-flow-50 text-flow-700',
  cumplido: 'bg-green-100 text-alto',
  vencido: 'bg-red-100 text-bajo',
};

export default async function InformePdiPage({
  searchParams,
}: {
  searchParams: { colaboradorId?: string };
}) {
  const colaboradorIdFiltro = searchParams.colaboradorId || undefined;
  const { perfil, planes } = await obtenerPlanesInforme(colaboradorIdFiltro);

  if (!perfil) redirect('/inicio');

  const puedeFiltrar = perfil.rol === 'admin_th' || perfil.rol === 'lider';
  let colaboradoresFiltrables: { id: string; nombre_completo: string }[] = [];

  if (puedeFiltrar) {
    const supabase = createClient();
    let query = supabase
      .from('colaboradores')
      .select('id, nombre_completo')
      .eq('empresa_id', perfil.empresa_id)
      .eq('estado', 'activo')
      .order('nombre_completo');

    if (perfil.rol === 'lider' && perfil.colaborador_id) {
      query = query.eq('lider_id', perfil.colaborador_id);
    }

    const { data } = await query;
    colaboradoresFiltrables = data ?? [];
  }

  const queryString = colaboradorIdFiltro ? `?colaboradorId=${colaboradorIdFiltro}` : '';

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-2xl font-semibold text-secundario">
            Informe de Plan de Desarrollo Individual
          </h1>
          <p className="text-sm text-marmol-500 mt-1">
            Brechas detectadas, plan de acción y seguimiento a su cumplimiento.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={`/api/informes/pdi/pdf${queryString}`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-marmol-200 hover:border-flow-300 text-marmol-600 text-sm font-medium px-3.5 py-2 transition"
          >
            <FileDown size={16} /> PDF
          </a>
          <a
            href={`/api/informes/pdi/excel${queryString}`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-marmol-200 hover:border-flow-300 text-marmol-600 text-sm font-medium px-3.5 py-2 transition"
          >
            <FileSpreadsheet size={16} /> Excel
          </a>
        </div>
      </div>

      <IdentidadReferencia empresaId={perfil.empresa_id} />

      {puedeFiltrar && colaboradoresFiltrables.length > 0 && (
        <form className="card p-3 flex items-center gap-3">
          <label className="text-xs text-marmol-500 shrink-0">Filtrar por persona</label>
          <select
            name="colaboradorId"
            defaultValue={colaboradorIdFiltro ?? ''}
            className="rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm flex-1"
          >
            <option value="">Todo {perfil.rol === 'lider' ? 'mi equipo' : 'la empresa'}</option>
            {colaboradoresFiltrables.map((c) => (
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
      )}

      {planes.length === 0 ? (
        <EmptyState
          icon={Target}
          titulo="Sin planes de desarrollo para mostrar"
          descripcion="No hay registros que coincidan con el filtro actual."
        />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-marmol-200 text-left text-xs uppercase tracking-wide text-marmol-400">
                <th className="px-4 py-3 font-medium">Colaborador</th>
                <th className="px-4 py-3 font-medium">Brecha</th>
                <th className="px-4 py-3 font-medium">Acción</th>
                <th className="px-4 py-3 font-medium">Compromiso</th>
                <th className="px-4 py-3 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {planes.map((p) => (
                <tr key={p.id} className="border-b border-marmol-100 last:border-0">
                  <td className="px-4 py-3 font-medium text-marmol-900">{p.colaborador_nombre}</td>
                  <td className="px-4 py-3 text-marmol-600">{p.brecha_detectada}</td>
                  <td className="px-4 py-3 text-marmol-600">{p.accion}</td>
                  <td className="px-4 py-3 text-marmol-500">
                    {p.fecha_compromiso ? formatearFecha(p.fecha_compromiso) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn('text-xs rounded-full px-2 py-0.5 font-medium capitalize', ESTADO_COLOR[p.estado])}>
                      {p.estado.replace(/_/g, ' ')}
                    </span>
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
