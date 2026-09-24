import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { FileStack, ShieldCheck, GitPullRequestArrow, ListChecks } from 'lucide-react';
import { MapaProcesos, type Proceso, type Interaccion, type MarcoNormativo } from '@/components/procesos-gestion/mapa-procesos';
import { ListaRiesgos } from '@/components/procesos-gestion/lista-riesgos';
import { ChecklistKanban } from '@/components/procesos-gestion/checklist-kanban';
import { calcularIndiceMadurez, fechaDentroDeMeses } from '@/lib/calculos/indice-madurez';

export default async function ProcesosGestionPage() {
  const perfil = await getPerfilActual();
  if (!perfil) return null;
  if (!['admin_th', 'lider', 'gerencia'].includes(perfil.rol)) redirect('/inicio');

  const supabase = createClient();
  const puedeEditar = perfil.rol === 'admin_th';

  const [{ data: procesos }, { data: marcos }, { data: interacciones }, { data: riesgos }, { data: checklist }, { data: colaboradores }] = await Promise.all([
    supabase
      .from('procesos_gestion')
      .select('id, area_proceso, nombre, descripcion, tipo, codigo, objetivo, estado, responsable_id, version, fecha_actualizacion')
      .eq('empresa_id', perfil.empresa_id)
      .order('codigo', { ascending: true, nullsFirst: false }),
    supabase.from('proceso_marcos_normativos').select('proceso_id, marco_normativo'),
    supabase.from('interacciones_proceso').select('id, proceso_origen_id, proceso_destino_id, tipo, descripcion'),
    supabase
      .from('matriz_riesgos_controles')
      .select('id, marco_normativo, tipo, riesgo, consecuencia, categoria, grado_impacto, grado_probabilidad, control, grado_efectividad_control, acciones_a_realizar, proceso_id, frecuencia_revision, fecha_ultima_revision')
      .eq('empresa_id', perfil.empresa_id)
      .order('created_at', { ascending: false }),
    supabase
      .from('checklist_cumplimiento')
      .select('id, marco_normativo, item, descripcion, estado, evidencia_url')
      .eq('empresa_id', perfil.empresa_id)
      .order('marco_normativo'),
    supabase.from('colaboradores').select('id, nombre_completo').eq('empresa_id', perfil.empresa_id).eq('estado', 'activo').order('nombre_completo'),
  ]);

  const procesoIds = (procesos ?? []).map((p: any) => p.id);
  const [{ data: elementosRaw }, { data: documentosRaw }, { data: acpmRaw }, { data: indicadoresRaw }] = procesoIds.length
    ? await Promise.all([
        supabase.from('elementos_proceso').select('proceso_id, tipo').in('proceso_id', procesoIds),
        supabase.from('documentos_proceso').select('proceso_id, estado').in('proceso_id', procesoIds),
        supabase.from('acpm').select('proceso_id, estado, fecha_compromiso').in('proceso_id', procesoIds),
        supabase.from('indicadores_proceso').select('id, proceso_id').in('proceso_id', procesoIds).eq('activo', true),
      ])
    : [{ data: [] }, { data: [] }, { data: [] }, { data: [] }];

  const indicadorIds = (indicadoresRaw ?? []).map((i: any) => i.id);
  const { data: medicionesRaw } = indicadorIds.length
    ? await supabase.from('mediciones_indicador').select('indicador_id, fecha_medicion').in('indicador_id', indicadorIds)
    : { data: [] };

  const procesoPorIndicador = new Map<string, string>();
  for (const i of indicadoresRaw ?? []) procesoPorIndicador.set((i as any).id, (i as any).proceso_id);
  const medicionRecientePorProceso = new Set<string>();
  for (const m of medicionesRaw ?? []) {
    const procesoId = procesoPorIndicador.get((m as any).indicador_id);
    if (procesoId && fechaDentroDeMeses((m as any).fecha_medicion, 6)) medicionRecientePorProceso.add(procesoId);
  }

  const marcosPorProceso = new Map<string, MarcoNormativo[]>();
  for (const m of marcos ?? []) {
    const lista = marcosPorProceso.get(m.proceso_id as string) ?? [];
    lista.push(m.marco_normativo as MarcoNormativo);
    marcosPorProceso.set(m.proceso_id as string, lista);
  }

  const hoy = new Date().toISOString().slice(0, 10);
  const procesosConMarcos: Proceso[] = (procesos ?? []).map((p: any) => {
    const elementosDelProceso = (elementosRaw ?? []).filter((e: any) => e.proceso_id === p.id);
    const tiposPresentes = new Set(elementosDelProceso.map((e: any) => e.tipo));
    const documentosVigentes = (documentosRaw ?? []).filter((d: any) => d.proceso_id === p.id && d.estado === 'vigente').length;
    const acpmVencidas = (acpmRaw ?? []).filter(
      (a: any) => a.proceso_id === p.id && a.fecha_compromiso && a.fecha_compromiso < hoy && a.estado !== 'cerrada_efectiva'
    ).length;
    const riesgoActualizadoReciente = (riesgos ?? []).some((r: any) => r.proceso_id === p.id && fechaDentroDeMeses(r.fecha_ultima_revision, 6));

    const { puntaje } = calcularIndiceMadurez({
      caracterizacionCompleta: tiposPresentes.has('entrada') && tiposPresentes.has('actividad') && tiposPresentes.has('salida'),
      indicadorConMedicionReciente: medicionRecientePorProceso.has(p.id),
      riesgoActualizadoReciente,
      documentosVigentes,
      acpmVencidas,
    });

    return { ...p, marcos: marcosPorProceso.get(p.id) ?? [], indice_madurez: puntaje };
  });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-2xl font-semibold text-secundario">Procesos y Sistemas de Gestión</h1>
          <p className="text-sm text-marmol-500 mt-1">
            Mapa de procesos, caracterización, matriz de riesgos y checklist de cumplimiento (ISO 9001, SST,
            SARLAFT/SAGRILAFT, PTEE) — aporte de V&E a la alianza. Base del paquete de evidencia de auditoría.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href="/procesos-gestion/documentos"
            className="inline-flex items-center gap-1.5 rounded-lg border border-marmol-200 hover:bg-marmol-50 text-marmol-600 text-sm font-medium px-3.5 py-2"
          >
            <FileStack size={15} /> Gestión documental
          </Link>
          <Link
            href="/procesos-gestion/auditorias"
            className="inline-flex items-center gap-1.5 rounded-lg border border-marmol-200 hover:bg-marmol-50 text-marmol-600 text-sm font-medium px-3.5 py-2"
          >
            <ShieldCheck size={15} /> Auditorías internas
          </Link>
          <Link
            href="/procesos-gestion/acpm"
            className="inline-flex items-center gap-1.5 rounded-lg border border-marmol-200 hover:bg-marmol-50 text-marmol-600 text-sm font-medium px-3.5 py-2"
          >
            <ListChecks size={15} /> ACPM
          </Link>
          <Link
            href="/procesos-gestion/cambios"
            className="inline-flex items-center gap-1.5 rounded-lg border border-marmol-200 hover:bg-marmol-50 text-marmol-600 text-sm font-medium px-3.5 py-2"
          >
            <GitPullRequestArrow size={15} /> Gestión de cambio
          </Link>
        </div>
      </div>

      <MapaProcesos
        procesosIniciales={procesosConMarcos}
        interaccionesIniciales={(interacciones ?? []) as Interaccion[]}
        colaboradores={(colaboradores ?? []) as any}
        puedeEditar={puedeEditar}
      />
      <ListaRiesgos riesgosIniciales={(riesgos ?? []) as any} procesos={(procesos ?? []) as any} puedeEditar={puedeEditar} />
      <ChecklistKanban itemsIniciales={(checklist ?? []) as any} puedeEditar={puedeEditar} empresaId={perfil.empresa_id} />
    </div>
  );
}
