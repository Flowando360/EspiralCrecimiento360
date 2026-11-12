import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { createClient } from '@/lib/supabase/server';
import { ChevronLeft, Compass } from 'lucide-react';
import { DetalleContexto, type ItemContexto } from '@/components/procesos-gestion/detalle-contexto';
import { EstrategiasFoda, type EstrategiaVista } from '@/components/procesos-gestion/estrategias-foda';
import { formatearFecha } from '@/lib/utils';

export default async function DetalleContextoPage({ params }: { params: { id: string } }) {
  const perfil = await getPerfilActual();
  if (!perfil) return null;
  if (!['admin_th', 'lider', 'gerencia'].includes(perfil.rol)) redirect('/inicio');

  const supabase = createClient();

  const { data: analisis } = await supabase
    .from('analisis_contexto')
    .select('id, fecha, notas, responsable_id')
    .eq('id', params.id)
    .eq('empresa_id', perfil.empresa_id)
    .maybeSingle();

  if (!analisis) notFound();

  const { data: itemsRaw } = await supabase
    .from('contexto_items')
    .select('id, tipo, descripcion, orden, created_at, impacto, probabilidad, sugerencia_ia, riesgo_id')
    .eq('analisis_id', params.id)
    .order('orden', { ascending: true });

  const itemIds = (itemsRaw ?? []).map((i) => i.id);
  const { data: acpmRaw } = itemIds.length
    ? await supabase.from('acpm').select('id, origen_contexto_item_id').in('origen_contexto_item_id', itemIds)
    : { data: [] as { id: string; origen_contexto_item_id: string | null }[] };

  const conteoAcpmPorItem: Record<string, number> = {};
  for (const a of acpmRaw ?? []) {
    if (!a.origen_contexto_item_id) continue;
    conteoAcpmPorItem[a.origen_contexto_item_id] = (conteoAcpmPorItem[a.origen_contexto_item_id] ?? 0) + 1;
  }

  const { data: estrategiasRaw } = await supabase
    .from('contexto_estrategias')
    .select('id, tipo, descripcion, origen, estado, actividad_id, item_ids')
    .eq('analisis_id', params.id)
    .order('created_at');
  const itemPorId = new Map((itemsRaw ?? []).map((i) => [i.id as string, i]));
  const estrategias: EstrategiaVista[] = ((estrategiasRaw ?? []) as any[]).map((e) => ({
    id: e.id,
    tipo: e.tipo,
    descripcion: e.descripcion,
    origen: e.origen,
    estado: e.estado,
    actividad_id: e.actividad_id,
    factores: ((e.item_ids ?? []) as string[]).map((id) => itemPorId.get(id)).filter(Boolean).map((i: any) => ({ tipo: i.tipo, descripcion: i.descripcion })),
  }));

  const { data: responsable } = analisis.responsable_id
    ? await supabase.from('colaboradores').select('nombre_completo').eq('id', analisis.responsable_id).maybeSingle()
    : { data: null };

  return (
    <div className="space-y-4">
      <div>
        <Link href="/procesos-gestion/contexto" className="inline-flex items-center gap-1 text-sm text-marmol-500 hover:text-flow-600 mb-2">
          <ChevronLeft size={14} /> Contexto (análisis FODA)
        </Link>
        <h1 className="font-display text-2xl font-semibold text-secundario flex items-center gap-2">
          <Compass size={22} className="text-flow-600" /> Análisis del {formatearFecha(analisis.fecha)}
        </h1>
        {responsable && <p className="text-sm text-marmol-500 mt-1">Responsable: {responsable.nombre_completo}</p>}
        {analisis.notas && <p className="text-sm text-marmol-500 mt-1">{analisis.notas}</p>}
      </div>

      <DetalleContexto
        analisisId={analisis.id}
        itemsIniciales={(itemsRaw ?? []) as ItemContexto[]}
        conteoAcpmPorItem={conteoAcpmPorItem}
        puedeEditar={perfil.rol === 'admin_th'}
      />

      <EstrategiasFoda
        analisisId={analisis.id}
        estrategias={estrategias}
        factores={(itemsRaw ?? []).map((i: any) => ({ id: i.id, tipo: i.tipo, descripcion: i.descripcion }))}
        puedeEditar={perfil.rol === 'admin_th'}
      />
    </div>
  );
}
