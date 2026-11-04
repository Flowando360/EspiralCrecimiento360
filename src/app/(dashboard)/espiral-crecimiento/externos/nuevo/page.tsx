import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft, UserRoundPlus } from 'lucide-react';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { createClient } from '@/lib/supabase/server';
import { ESTADOS_VIGENTES } from '@/lib/colaboradores/estados';
import { FormularioExterno } from '@/components/espiral-crecimiento/formulario-externo';

export default async function NuevoExternoPage() {
  const perfil = await getPerfilActual();
  if (!perfil) return null;
  if (perfil.rol !== 'admin_th') redirect('/inicio');

  const supabase = createClient();
  const { data } = await supabase
    .from('colaboradores')
    .select('id, nombre_completo')
    .eq('empresa_id', perfil.empresa_id)
    .eq('es_externo', false)
    .in('estado', ESTADOS_VIGENTES)
    .order('nombre_completo');

  return (
    <div className="space-y-6">
      <div>
        <Link href="/espiral-crecimiento/externos" className="inline-flex items-center gap-1 text-xs text-marmol-400 hover:text-marmol-600 mb-2">
          <ArrowLeft size={12} /> Volver a Externos
        </Link>
        <h1 className="font-display text-2xl font-semibold text-secundario flex items-center gap-2">
          <UserRoundPlus size={22} className="text-flow-600" /> Nuevo externo
        </h1>
        <p className="text-sm text-marmol-500 mt-1">
          Registra a una persona o firma que presta servicios sin ser empleada. Si son varias con el mismo vínculo (por ejemplo,
          los contratistas instaladores), usa «Varias a la vez».
        </p>
      </div>
      <FormularioExterno responsables={(data ?? []).map((c: any) => ({ id: c.id, nombre: c.nombre_completo }))} />
    </div>
  );
}
