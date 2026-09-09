import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { ListaHojaVida } from '@/components/espiral-crecimiento/lista-hoja-vida';
import { notFound } from 'next/navigation';
import { ArrowLeft, Clock } from 'lucide-react';
import type { HojaVidaFormacion } from '@/types/colaborador';

export default async function HojaVidaColaboradorPage({ params }: { params: { id: string } }) {
  const perfil = await getPerfilActual();
  if (!perfil) return null;

  const supabase = createClient();

  const { data: colaborador } = await supabase
    .from('colaboradores')
    .select('id, nombre_completo, lider_id, empresa_id')
    .eq('id', params.id)
    .maybeSingle();

  if (!colaborador || colaborador.empresa_id !== perfil.empresa_id) notFound();

  // Misma regla que RLS: admin_th todo, líder ve la de su equipo, colaborador ve la propia.
  const puedeEditar = perfil.rol === 'admin_th';
  const puedeVer =
    puedeEditar ||
    (perfil.rol === 'lider' && colaborador.lider_id === perfil.colaborador_id) ||
    (perfil.rol === 'colaborador' && perfil.colaborador_id === colaborador.id);
  if (!puedeVer) notFound();

  const { data: items } = await supabase
    .from('hoja_vida_formacion')
    .select('*')
    .eq('colaborador_id', params.id)
    .order('created_at', { ascending: false });

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
          <Clock size={22} className="text-flow-600" /> Hoja de vida y certificaciones
        </h1>
        <p className="text-sm text-marmol-500 mt-1">{colaborador.nombre_completo}</p>
        {!puedeEditar && (
          <p className="text-xs text-marmol-400 mt-1">Solo Talento Humano puede cargar o editar estos registros.</p>
        )}
      </div>

      <div className="card p-5">
        <ListaHojaVida
          colaboradorId={params.id}
          itemsIniciales={(items ?? []) as HojaVidaFormacion[]}
          puedeEditar={puedeEditar}
        />
      </div>
    </div>
  );
}
