import Link from 'next/link';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { createClient } from '@/lib/supabase/server';
import { EmptyState } from '@/components/ui/empty-state';
import { Users, Plus } from 'lucide-react';
import { FilaColaborador } from '@/components/espiral-crecimiento/fila-colaborador';

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
  const puedeEliminar = perfil.rol === 'admin_th';

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
          descripcion="Carga el organigrama desde Administración o corre el seed inicial de Mármoles y Servicios."
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
                {puedeEliminar && <th className="px-4 py-3 font-medium">Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {colaboradores.map((c) => (
                <FilaColaborador
                  key={c.id as string}
                  colaborador={{
                    id: c.id as string,
                    nombre_completo: c.nombre_completo as string,
                    estado: c.estado as string,
                    fecha_ingreso: c.fecha_ingreso as string,
                    cargo: c.cargo as { nombre: string; proceso_area: string | null } | null,
                  }}
                  puedeEliminar={puedeEliminar}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
