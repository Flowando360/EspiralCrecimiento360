import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { FileStack, ShieldCheck, GitPullRequestArrow, ListChecks } from 'lucide-react';
import { MapaProcesos, type Proceso, type Interaccion, type MarcoNormativo } from '@/components/procesos-gestion/mapa-procesos';
import { ListaRiesgos } from '@/components/procesos-gestion/lista-riesgos';
import { ChecklistKanban } from '@/components/procesos-gestion/checklist-kanban';

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
      .select('id, marco_normativo, tipo, riesgo, categoria_riesgo, probabilidad, impacto, control, proceso_id, frecuencia_revision, fecha_ultima_revision, riesgo_residual')
      .eq('empresa_id', perfil.empresa_id)
      .order('created_at', { ascending: false }),
    supabase
      .from('checklist_cumplimiento')
      .select('id, marco_normativo, item, descripcion, estado, evidencia_url')
      .eq('empresa_id', perfil.empresa_id)
      .order('marco_normativo'),
    supabase.from('colaboradores').select('id, nombre_completo').eq('empresa_id', perfil.empresa_id).eq('estado', 'activo').order('nombre_completo'),
  ]);

  const marcosPorProceso = new Map<string, MarcoNormativo[]>();
  for (const m of marcos ?? []) {
    const lista = marcosPorProceso.get(m.proceso_id as string) ?? [];
    lista.push(m.marco_normativo as MarcoNormativo);
    marcosPorProceso.set(m.proceso_id as string, lista);
  }

  const procesosConMarcos: Proceso[] = (procesos ?? []).map((p: any) => ({
    ...p,
    marcos: marcosPorProceso.get(p.id) ?? [],
  }));

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
        <div className="flex items-center gap-2 flex-wrap shrink-0">
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
