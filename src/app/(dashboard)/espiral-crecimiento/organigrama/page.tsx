import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { createClient } from '@/lib/supabase/server';
import { OrganigramaArbol } from '@/components/espiral-crecimiento/organigrama-arbol';

export default async function OrganigramaPage() {
  const perfil = await getPerfilActual();
  if (!perfil) return null;

  const supabase = createClient();
  const { data: colaboradores } = await supabase
    .from('colaboradores')
    .select('id, nombre_completo, lider_id, es_externo, cargo:cargos(nombre)')
    .eq('empresa_id', perfil.empresa_id)
    .eq('estado', 'activo');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-secundario">Organigrama</h1>
        <p className="text-sm text-marmol-500 mt-1">
          Regla automática de acompañantes: el líder es quien está justo arriba; los pares comparten
          el mismo líder; los colaboradores a cargo son quienes reportan directamente.
        </p>
      </div>

      <div className="card p-6 overflow-x-auto">
        <OrganigramaArbol colaboradores={(colaboradores ?? []) as any} />
      </div>
    </div>
  );
}
