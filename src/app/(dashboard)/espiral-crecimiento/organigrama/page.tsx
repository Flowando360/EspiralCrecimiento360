import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { OrganigramaArbol } from '@/components/espiral-crecimiento/organigrama-arbol';
import { ESTADOS_VIGENTES } from '@/lib/colaboradores/estados';

export default async function OrganigramaPage() {
  const perfil = await getPerfilActual();
  if (!perfil) return null;

  const supabase = createClient();
  const { data: colaboradores } = await supabase
    .from('colaboradores')
    .select('id, nombre_completo, lider_id, es_externo, estado, cargo:cargos(nombre)')
    .eq('empresa_id', perfil.empresa_id)
    .in('estado', ESTADOS_VIGENTES);

  const { data: depsRaw } = await (supabase as any)
    .from('dependencias_funcionales')
    .select('colaborador_id, lider_funcional_id, tipo, detalle')
    .eq('empresa_id', perfil.empresa_id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-secundario">Organigrama</h1>
        <p className="text-sm text-marmol-500 mt-1">
          Regla automática de acompañantes: el líder es quien está justo arriba; los pares comparten
          el mismo líder; los colaboradores a cargo son quienes reportan directamente. Las líneas punteadas son líderes funcionales o de proyecto (organigrama matricial).
        </p>
        {perfil.rol === 'admin_th' && (
          <p className="text-sm mt-2">
            <Link href="/administracion/organigrama" className="text-flow-600 hover:text-flow-700 underline">
              Editar organigrama: asignar el equipo de un líder o el líder de cada persona
            </Link>
          </p>
        )}
      </div>

      <div className="card p-6 overflow-x-auto">
        <OrganigramaArbol colaboradores={(colaboradores ?? []) as any} dependencias={(depsRaw ?? []) as any} />
      </div>
    </div>
  );
}
