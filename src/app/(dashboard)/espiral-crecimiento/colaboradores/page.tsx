import Link from 'next/link';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { createClient } from '@/lib/supabase/server';
import { EmptyState } from '@/components/ui/empty-state';
import { Users, Plus, FileSpreadsheet } from 'lucide-react';
import { crearNormalizadorAreas } from '@/lib/areas';
import { ListaColaboradores } from '@/components/espiral-crecimiento/lista-colaboradores';

export default async function ColaboradoresPage() {
  const perfil = await getPerfilActual();
  if (!perfil) return null;

  const supabase = createClient();

  let query = supabase
    .from('colaboradores')
    .select('id, nombre_completo, numero_documento, estado, fecha_ingreso, foto_url, lider_id, cargo:cargos(nombre, proceso_area, tiene_personal_a_cargo)')
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
  const normalizarArea = crearNormalizadorAreas((colaboradores ?? []).map((c: any) => c.cargo?.proceso_area));
  const idsLideres = new Set((colaboradores ?? []).map((c: any) => c.lider_id).filter(Boolean));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-secundario">
            {perfil.rol === 'lider' ? 'Mi equipo' : 'Colaboradores'}
          </h1>
          <p className="text-sm text-marmol-500 mt-1">
            Ficha 360°: perfil, hoja de vida, Encuentros de Crecimiento y PDI de cada persona.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
        {perfil.rol !== 'colaborador' && perfil.rol !== 'auditor_externo' && (
          <a
            href="/api/colaboradores/exportar"
            className="inline-flex items-center gap-1.5 rounded-lg border border-marmol-200 hover:border-flow-300 text-marmol-600 text-sm font-medium px-3.5 py-2 transition"
          >
            <FileSpreadsheet size={16} /> Exportar a Excel
          </a>
        )}
        {perfil.rol === 'admin_th' && (
          <>
          <Link
            href="/espiral-crecimiento/colaboradores/importar"
            className="text-xs text-marmol-500 hover:text-flow-600 underline"
          >
            Importar desde Excel
          </Link>
          <Link
            href="/espiral-crecimiento/colaboradores/historico"
            className="text-xs text-marmol-500 hover:text-flow-600 underline"
          >
            Histórico de eliminados
          </Link>
          <Link
            href="/administracion/organigrama"
            className="text-xs text-marmol-500 hover:text-flow-600 underline"
          >
            Asignar equipos (organigrama)
          </Link>
          <Link
            href="/espiral-crecimiento/colaboradores/nuevo"
            className="inline-flex items-center gap-1.5 rounded-lg bg-flow-500 hover:bg-flow-600 text-white text-sm font-medium px-3.5 py-2 transition"
          >
            <Plus size={16} /> Nuevo colaborador
          </Link>
          </>
        )}
        </div>
      </div>

      {!colaboradores || colaboradores.length === 0 ? (
        <EmptyState
          icon={Users}
          titulo="Aún no hay colaboradores cargados"
          descripcion="Carga el organigrama desde Administración o corre el seed inicial de Mármoles y Servicios."
        />
      ) : (
        <ListaColaboradores
          puedeEliminar={puedeEliminar}
          nombresPorId={Object.fromEntries(colaboradores.map((c: any) => [c.id, c.nombre_completo]))}
          colaboradores={colaboradores.map((c: any) => ({
            id: c.id as string,
            nombre_completo: c.nombre_completo as string,
            numero_documento: (c.numero_documento as string | null) ?? null,
            estado: c.estado as string,
            fecha_ingreso: c.fecha_ingreso as string,
            cargo: c.cargo ? { nombre: c.cargo.nombre, proceso_area: normalizarArea(c.cargo.proceso_area) } : null,
            // Líder de área: tiene un cargo con personal a cargo o alguien lo tiene como líder directo
            liderId: (c.lider_id as string | null) ?? null,
            esLider: Boolean(c.cargo?.tiene_personal_a_cargo) || idsLideres.has(c.id),
          }))}
        />
      )}
    </div>
  );
}
