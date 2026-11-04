import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Plus, UserRoundCog } from 'lucide-react';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { createClient } from '@/lib/supabase/server';
import { EmptyState } from '@/components/ui/empty-state';
import { FiltroTabla } from '@/components/ui/filtro-tabla';
import { ETIQUETA_TIPO_EXTERNO, diasParaFecha } from '@/lib/colaboradores/externos';
import { formatearFecha, primero } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function ExternosPage() {
  const perfil = await getPerfilActual();
  if (!perfil) return null;
  if (!['admin_th', 'lider', 'gerencia'].includes(perfil.rol)) redirect('/inicio');

  const supabase = createClient();
  const { data } = await supabase
    .from('colaboradores')
    .select('id, nombre_completo, estado, tipo_externo, entidad_externa, servicio, fecha_fin_vinculo, lider:lider_id(nombre_completo)')
    .eq('empresa_id', perfil.empresa_id)
    .eq('es_externo', true)
    .order('nombre_completo');

  const externos = (data ?? []).map((e: any) => ({
    ...e,
    responsable: (primero(e.lider) as { nombre_completo?: string } | null)?.nombre_completo ?? 'Sin responsable',
    dias: diasParaFecha(e.fecha_fin_vinculo),
  }));
  const activos = externos.filter((e) => e.estado === 'activo');
  const porVencer = activos.filter((e) => e.dias != null && e.dias <= 30);
  const porTipo = activos.reduce<Record<string, number>>((a, e) => ((a[e.tipo_externo ?? 'otro'] = (a[e.tipo_externo ?? 'otro'] ?? 0) + 1), a), {});

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-secundario">Externos</h1>
          <p className="text-sm text-marmol-500 mt-1 max-w-2xl">
            Contratistas, transportadores, asesores, freelance y proveedores. No son empleados: no se evalúan en los Ciclos de
            Crecimiento, pero quedan registrados con su vínculo, documentos y seguimiento.
          </p>
        </div>
        {perfil.rol === 'admin_th' && (
          <Link
            href="/espiral-crecimiento/externos/nuevo"
            className="inline-flex items-center gap-1.5 rounded-lg bg-flow-500 hover:bg-flow-600 text-white text-sm font-medium px-3.5 py-2 transition"
          >
            <Plus size={16} /> Nuevo externo
          </Link>
        )}
      </div>

      {externos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="card p-4">
            <p className="text-xs text-marmol-500 mb-1">Activos</p>
            <p className="font-display text-2xl font-semibold text-secundario">{activos.length}</p>
          </div>
          <div className="card p-4">
            <p className="text-xs text-marmol-500 mb-1">Vencen en 30 días o ya vencieron</p>
            <p className="font-display text-2xl font-semibold text-secundario">{porVencer.length}</p>
          </div>
          <div className="card p-4 col-span-2">
            <p className="text-xs text-marmol-500 mb-1">Por tipo</p>
            <p className="text-sm text-marmol-700">
              {Object.entries(porTipo)
                .map(([t, n]) => `${ETIQUETA_TIPO_EXTERNO[t] ?? t}: ${n}`)
                .join(' · ') || '—'}
            </p>
          </div>
        </div>
      )}

      {externos.length === 0 ? (
        <EmptyState
          icon={UserRoundCog}
          titulo="Aún no hay externos registrados"
          descripcion={perfil.rol === 'admin_th' ? 'Usa «Nuevo externo» para registrar uno, o varios a la vez.' : 'Talento Humano todavía no ha registrado externos.'}
        />
      ) : (
        <FiltroTabla columnas={['Tipo', 'Estado', 'Responsable']} plural="externos" placeholder="Buscar por nombre, empresa o servicio…">
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-marmol-200 text-left text-xs uppercase tracking-wide text-marmol-400">
                  <th className="px-4 py-3 font-medium">Nombre</th>
                  <th className="px-4 py-3 font-medium">Tipo</th>
                  <th className="px-4 py-3 font-medium">Servicio</th>
                  <th className="px-4 py-3 font-medium">Responsable</th>
                  <th className="px-4 py-3 font-medium">Vigencia</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody>
                {externos.map((e) => (
                  <tr key={e.id} className="border-b border-marmol-100 last:border-0 hover:bg-marmol-50">
                    <td className="px-4 py-3">
                      <Link href={`/espiral-crecimiento/externos/${e.id}`} className="font-medium text-marmol-900 hover:text-flow-600">
                        {e.nombre_completo}
                      </Link>
                      {e.entidad_externa && <p className="text-xs text-marmol-400">{e.entidad_externa}</p>}
                    </td>
                    <td className="px-4 py-3 text-marmol-600">{ETIQUETA_TIPO_EXTERNO[e.tipo_externo ?? 'otro'] ?? 'Otro'}</td>
                    <td className="px-4 py-3 text-marmol-600">{e.servicio ?? '—'}</td>
                    <td className="px-4 py-3 text-marmol-600">{e.responsable}</td>
                    <td className="px-4 py-3 text-marmol-600 whitespace-nowrap">
                      {e.fecha_fin_vinculo ? formatearFecha(e.fecha_fin_vinculo) : 'Sin fecha'}
                      {e.estado === 'activo' && e.dias != null && e.dias <= 30 && (
                        <span className="ml-2 text-[11px] text-bajo">{e.dias < 0 ? 'vencido' : `vence en ${e.dias} d`}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-marmol-600">{e.estado === 'activo' ? 'Activo' : 'Inactivo'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </FiltroTabla>
      )}
    </div>
  );
}
