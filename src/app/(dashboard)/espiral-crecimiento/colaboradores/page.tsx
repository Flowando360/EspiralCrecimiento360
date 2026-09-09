import Link from 'next/link';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { createClient } from '@/lib/supabase/server';
import { EmptyState } from '@/components/ui/empty-state';
import { Users, Plus } from 'lucide-react';
import { formatearFecha } from '@/lib/utils';

export default async function ColaboradoresPage() {
  const perfil = await getPerfilActual();
  if (!perfil) return null;

  const supabase = createClient();

  let query = supabase
    .from('colaboradores')
    .select('id, nombre_completo, estado, fecha_ingreso, foto_url, cargo:cargos(nombre, proceso_area)')
    .eq('empresa_id', perfil.empresa_id)
    .eq('es_externo', false)
    .order('nombre_completo');

  // RLS ya filtra por rol, pero además acotamos explícitamente por
  // legibilidad y para que un líder no vea query vacía sin explicación.
  if (perfil.rol === 'lider' && perfil.colaborador_id) {
    query = query.or(`lider_id.eq.${perfil.colaborador_id},id.eq.${perfil.colaborador_id}`);
  }

  const { data: colaboradores } = await query;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-secundario">
            {perfil.rol === 'lider' ? 'Mi equipo' : 'Colaboradores'}
          </h1>
          <p className="text-sm text-marmol-500 mt-1">
            Ficha 360°: perfil, hoja de vida, Encuentros de Crecimiento y PDI de cada persona.
          </p>
        </div>
        {perfil.rol === 'admin_th' && (
          <Link
            href="/espiral-crecimiento/colaboradores/nuevo"
            className="inline-flex items-center gap-1.5 rounded-lg bg-flow-500 hover:bg-flow-600 text-white text-sm font-medium px-3.5 py-2 transition"
          >
            <Plus size={16} /> Nuevo colaborador
          </Link>
        )}
      </div>

      {!colaboradores || colaboradores.length === 0 ? (
        <EmptyState
          icon={Users}
          titulo="Aún no hay colaboradores cargados"
          descripcion="Carga el organigrama desde Administración o corre el seed inicial de Flow, Nexus y Visión."
        />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-marmol-200 text-left text-xs uppercase tracking-wide text-marmol-400">
                <th className="px-4 py-3 font-medium">Nombre</th>
                <th className="px-4 py-3 font-medium">Cargo</th>
                <th className="px-4 py-3 font-medium">Área</th>
                <th className="px-4 py-3 font-medium">Ingreso</th>
                <th className="px-4 py-3 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {colaboradores.map((c) => (
                <tr key={c.id as string} className="border-b border-marmol-100 last:border-0 hover:bg-marmol-50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/espiral-crecimiento/colaboradores/${c.id}`}
                      className="font-medium text-marmol-900 hover:text-flow-600"
                    >
                      {c.nombre_completo as string}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-marmol-600">
                    {(c.cargo as { nombre: string } | null)?.nombre ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-marmol-600">
                    {(c.cargo as { proceso_area: string } | null)?.proceso_area ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-marmol-500">{formatearFecha(c.fecha_ingreso as string)}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center rounded-full bg-marmol-100 px-2 py-0.5 text-xs text-marmol-600 capitalize">
                      {(c.estado as string).replace(/_/g, ' ')}
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
