import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { ChecklistInduccion, type ItemAsignado } from '@/components/espiral-crecimiento/checklist-induccion';
import { notFound } from 'next/navigation';
import { ArrowLeft, GraduationCap } from 'lucide-react';

export default async function InduccionColaboradorPage({ params }: { params: { id: string } }) {
  const perfil = await getPerfilActual();
  if (!perfil) return null;

  const supabase = createClient();

  const { data: colaborador } = await supabase
    .from('colaboradores')
    .select('id, nombre_completo, empresa_id, lider_id')
    .eq('id', params.id)
    .maybeSingle();

  if (!colaborador || colaborador.empresa_id !== perfil.empresa_id) notFound();

  const puedeVer =
    perfil.rol === 'admin_th' ||
    (perfil.rol === 'lider' && colaborador.lider_id === perfil.colaborador_id) ||
    (perfil.rol === 'colaborador' && perfil.colaborador_id === colaborador.id);
  if (!puedeVer) notFound();

  const puedeEditar =
    perfil.rol === 'admin_th' || (perfil.rol === 'lider' && colaborador.lider_id === perfil.colaborador_id);

  const { data: itemsRaw } = await supabase
    .from('colaborador_induccion_items')
    .select(
      `id, completado, completado_en,
       completado_por:completado_por(nombre_completo),
       item:item_id(categoria, titulo, descripcion, orden)`
    )
    .eq('colaborador_id', params.id);

  const items: ItemAsignado[] = ((itemsRaw ?? []) as any[])
    .map((i) => ({
      id: i.id,
      completado: i.completado,
      completado_en: i.completado_en,
      completado_por_nombre: i.completado_por?.nombre_completo ?? null,
      categoria: i.item?.categoria,
      titulo: i.item?.titulo,
      descripcion: i.item?.descripcion,
      orden: i.item?.orden ?? 0,
    }))
    .sort((a, b) => a.orden - b.orden);

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
          <GraduationCap size={22} className="text-flow-600" /> Inducción
        </h1>
        <p className="text-sm text-marmol-500 mt-1">{colaborador.nombre_completo}</p>
        {!puedeEditar && (
          <p className="text-xs text-marmol-400 mt-1">Solo tu líder directo o Talento Humano pueden marcar puntos como cumplidos.</p>
        )}
      </div>

      <ChecklistInduccion colaboradorId={params.id} itemsIniciales={items} puedeEditar={puedeEditar} />
    </div>
  );
}
