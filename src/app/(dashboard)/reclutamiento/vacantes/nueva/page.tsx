import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { redirect } from 'next/navigation';
import { FormularioVacante } from '@/components/reclutamiento/formulario-vacante';
import { ArrowLeft, Briefcase } from 'lucide-react';

export default async function NuevaVacantePage() {
  const perfil = await getPerfilActual();
  if (!perfil) return null;
  if (perfil.rol !== 'admin_th') redirect('/reclutamiento');

  const supabase = createClient();
  const [{ data: cargos }, { data: lideres }] = await Promise.all([
    supabase.from('cargos').select('id, nombre, proceso_area').eq('empresa_id', perfil.empresa_id).order('proceso_area'),
    supabase
      .from('colaboradores')
      .select('id, nombre_completo')
      .eq('empresa_id', perfil.empresa_id)
      .in('estado', ['activo', 'periodo_prueba'])
      .order('nombre_completo'),
  ]);

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <Link href="/reclutamiento" className="inline-flex items-center gap-1 text-xs text-marmol-400 hover:text-marmol-600 mb-2">
          <ArrowLeft size={12} /> Volver a Reclutamiento
        </Link>
        <h1 className="font-display text-2xl font-semibold text-secundario flex items-center gap-2">
          <Briefcase size={22} className="text-flow-600" /> Nueva vacante
        </h1>
        <p className="text-sm text-marmol-500 mt-1">
          Vincúlala a un Perfil de Cargo ya creado — el formulario público de postulación tomará el título
          y la información del cargo automáticamente.
        </p>
      </div>

      {!cargos || cargos.length === 0 ? (
        <div className="card p-5 text-sm text-marmol-500">
          Todavía no hay ningún cargo creado en Administración → Cargos. Crea al menos un cargo antes de
          abrir una vacante.
        </div>
      ) : (
        <FormularioVacante cargos={cargos} lideres={lideres ?? []} />
      )}
    </div>
  );
}
