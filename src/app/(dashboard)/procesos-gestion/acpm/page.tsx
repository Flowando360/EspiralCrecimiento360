import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { AcpmKanban, type Acpm } from '@/components/procesos-gestion/acpm-kanban';

export default async function AcpmPage({
  searchParams,
}: {
  searchParams: {
    origenHallazgo?: string;
    origenRiesgo?: string;
    origenContexto?: string;
    proceso?: string;
    origenDetalle?: string;
    descripcion?: string;
  };
}) {
  const perfil = await getPerfilActual();
  if (!perfil) return null;
  if (!['admin_th', 'lider', 'gerencia'].includes(perfil.rol)) redirect('/inicio');

  const supabase = createClient();

  const [{ data: acpmRaw }, { data: procesos }, { data: colaboradores }] = await Promise.all([
    supabase
      .from('acpm')
      .select(
        'id, codigo, proceso_id, origen_tipo, origen_hallazgo_id, origen_riesgo_id, origen_contexto_item_id, origen_detalle, tipo_accion, descripcion, metodologia_causa, analisis_causa, responsable_id, estado, fecha_compromiso, eficaz'
      )
      .eq('empresa_id', perfil.empresa_id)
      .order('created_at', { ascending: false }),
    supabase.from('procesos_gestion').select('id, nombre, codigo').eq('empresa_id', perfil.empresa_id).order('codigo'),
    supabase.from('colaboradores').select('id, nombre_completo').eq('empresa_id', perfil.empresa_id).eq('estado', 'activo').order('nombre_completo'),
  ]);

  const acpmIds = (acpmRaw ?? []).map((a: any) => a.id);
  const { data: tareasRaw } = acpmIds.length
    ? await supabase.from('tareas_acpm').select('id, acpm_id, descripcion, responsable_id, fecha_limite, completada').in('acpm_id', acpmIds).order('orden')
    : { data: [] };

  const tareasPorAcpm = new Map<string, any[]>();
  for (const t of tareasRaw ?? []) {
    const lista = tareasPorAcpm.get((t as any).acpm_id) ?? [];
    lista.push(t);
    tareasPorAcpm.set((t as any).acpm_id, lista);
  }

  // Resuelve el enlace de vuelta al registro de origen -- para el hallazgo
  // hace falta la auditoría a la que pertenece, y para el ítem de contexto,
  // el análisis al que pertenece (ninguno de los dos viaja directo en acpm).
  const hallazgoIds = [...new Set((acpmRaw ?? []).map((a: any) => a.origen_hallazgo_id).filter(Boolean))];
  const contextoItemIds = [...new Set((acpmRaw ?? []).map((a: any) => a.origen_contexto_item_id).filter(Boolean))];
  const [{ data: hallazgosRaw }, { data: contextoItemsRaw }] = await Promise.all([
    hallazgoIds.length ? supabase.from('hallazgos_auditoria').select('id, auditoria_id').in('id', hallazgoIds) : Promise.resolve({ data: [] as any[] }),
    contextoItemIds.length ? supabase.from('contexto_items').select('id, analisis_id').in('id', contextoItemIds) : Promise.resolve({ data: [] as any[] }),
  ]);
  const auditoriaPorHallazgo = new Map<string, string>((hallazgosRaw ?? []).map((h: any) => [h.id, h.auditoria_id]));
  const analisisPorContextoItem = new Map<string, string>((contextoItemsRaw ?? []).map((i: any) => [i.id, i.analisis_id]));

  function origenHref(a: any): string | null {
    if (a.origen_tipo === 'riesgo' && a.origen_riesgo_id) return `/procesos-gestion/riesgos#riesgo-${a.origen_riesgo_id}`;
    if (a.origen_tipo === 'hallazgo_auditoria' && a.origen_hallazgo_id) {
      const auditoriaId = auditoriaPorHallazgo.get(a.origen_hallazgo_id);
      return auditoriaId ? `/procesos-gestion/auditorias/${auditoriaId}` : null;
    }
    if (a.origen_tipo === 'contexto' && a.origen_contexto_item_id) {
      const analisisId = analisisPorContextoItem.get(a.origen_contexto_item_id);
      return analisisId ? `/procesos-gestion/contexto/${analisisId}#contexto-item-${a.origen_contexto_item_id}` : null;
    }
    return null;
  }

  const acpm: Acpm[] = (acpmRaw ?? []).map((a: any) => ({ ...a, origen_href: origenHref(a), tareas: tareasPorAcpm.get(a.id) ?? [] }));

  const cerradasEfectivas = acpm.filter((a) => a.estado === 'cerrada_efectiva').length;
  const reabiertas = acpm.filter((a) => a.estado === 'reabierta').length;
  const resueltas = cerradasEfectivas + reabiertas;
  const tasaEficacia = resueltas > 0 ? Math.round((cerradasEfectivas / resueltas) * 100) : null;

  const prefill =
    searchParams.origenHallazgo || searchParams.origenRiesgo || searchParams.origenContexto
      ? {
          origenTipo: (searchParams.origenHallazgo
            ? 'hallazgo_auditoria'
            : searchParams.origenRiesgo
              ? 'riesgo'
              : 'contexto') as 'hallazgo_auditoria' | 'riesgo' | 'contexto',
          origenHallazgoId: searchParams.origenHallazgo,
          origenRiesgoId: searchParams.origenRiesgo,
          origenContextoItemId: searchParams.origenContexto,
          procesoId: searchParams.proceso,
          descripcion: searchParams.descripcion,
        }
      : searchParams.origenDetalle
        ? {
            origenTipo: 'mejora_propia' as const,
            origenDetalle: searchParams.origenDetalle,
            descripcion: searchParams.descripcion,
          }
        : undefined;

  return (
    <div className="space-y-4">
      <div>
        <Link href="/procesos-gestion" className="inline-flex items-center gap-1 text-sm text-marmol-500 hover:text-flow-600 mb-2">
          <ChevronLeft size={14} /> Procesos y Sistemas de Gestión
        </Link>
        <h1 className="font-display text-2xl font-semibold text-secundario">ACPM — Acciones Correctivas, Preventivas y de Mejora</h1>
        <p className="text-sm text-marmol-500 mt-1">
          Ciclo completo con validación de eficacia: no se cierra una ACPM solo porque las tareas están marcadas
          completas, sino cuando se confirma que la causa raíz se eliminó. Haz clic en una tarjeta para ver su
          plan de acción y cerrarla.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="card p-3 text-center">
          <p className="text-xl font-semibold text-secundario">{acpm.length}</p>
          <p className="text-xs text-marmol-400">Total ACPM</p>
        </div>
        <div className="card p-3 text-center">
          <p className="text-xl font-semibold text-alto">{cerradasEfectivas}</p>
          <p className="text-xs text-marmol-400">Cerradas efectivas</p>
        </div>
        <div className="card p-3 text-center">
          <p className="text-xl font-semibold text-bajo">{reabiertas}</p>
          <p className="text-xs text-marmol-400">Reabiertas</p>
        </div>
        <div className="card p-3 text-center">
          <p className="text-xl font-semibold text-secundario">{tasaEficacia !== null ? `${tasaEficacia}%` : '—'}</p>
          <p className="text-xs text-marmol-400">Tasa de eficacia</p>
        </div>
      </div>

      <div className="card p-5">
        <AcpmKanban acpmIniciales={acpm} procesos={(procesos ?? []) as any} colaboradores={(colaboradores ?? []) as any} puedeEditar={perfil.rol === 'admin_th'} prefill={prefill} />
      </div>
    </div>
  );
}
