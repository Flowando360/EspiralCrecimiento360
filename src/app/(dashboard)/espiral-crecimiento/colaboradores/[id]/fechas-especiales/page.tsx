import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { ListaFechasEspeciales } from '@/components/espiral-crecimiento/lista-fechas-especiales';
import { notFound } from 'next/navigation';
import { ArrowLeft, CalendarHeart } from 'lucide-react';

export default async function FechasEspecialesColaboradorPage({ params }: { params: { id: string } }) {
  const perfil = await getPerfilActual();
  if (!perfil) return null;

  const supabase = createClient();

  const { data: colaborador } = await supabase
    .from('colaboradores')
    .select('id, nombre_completo, empresa_id, lider_id')
    .eq('id', params.id)
    .maybeSingle();

  if (!colaborador || colaborador.empresa_id !== perfil.empresa_id) notFound();

  const puedeAdministrar =
    perfil.rol === 'admin_th' || (perfil.rol === 'lider' && colaborador.lider_id === perfil.colaborador_id);
  if (!puedeAdministrar) notFound();

  const { data: fechasEspeciales } = await supabase
    .from('fechas_especiales_colaborador')
    .select('id, descripcion, fecha')
    .eq('colaborador_id', params.id)
    .order('fecha');

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <Link
          href={`/espiral-crecimiento/colaboradores/${params.id}`}
          className="inline-flex items-center gap-1 text-xs text-marmol-400 hover:text-marmol-600 mb-2"
        >
          <ArrowLeft size={12} /> Volver a la ficha
        </Link>
        <h1 className="font-display text-2xl font-semibold text-secundario flex items-center gap-2">
          <CalendarHeart size={22} className="text-flow-600" /> Fechas especiales
        </h1>
        <p className="text-sm text-marmol-500 mt-1">{colaborador.nombre_completo}</p>
      </div>

      <div className="card p-5">
        <p className="text-xs text-marmol-400 mb-3">
          Cumpleaños, día de la profesión, aniversarios — cualquier fecha que valga la pena celebrar.
          El colaborador también puede agregar las suyas desde Mi Perfil.
        </p>
        <ListaFechasEspeciales colaboradorId={params.id} itemsIniciales={fechasEspeciales ?? []} />
      </div>
    </div>
  );
}
