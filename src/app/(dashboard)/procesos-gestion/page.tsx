import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ListaProcesos } from '@/components/procesos-gestion/lista-procesos';
import { ListaRiesgos } from '@/components/procesos-gestion/lista-riesgos';
import { ChecklistKanban } from '@/components/procesos-gestion/checklist-kanban';

export default async function ProcesosGestionPage() {
  const perfil = await getPerfilActual();
  if (!perfil) return null;
  if (!['admin_th', 'lider', 'gerencia'].includes(perfil.rol)) redirect('/inicio');

  const supabase = createClient();
  const puedeEditar = perfil.rol === 'admin_th';

  const [{ data: procesos }, { data: riesgos }, { data: checklist }] = await Promise.all([
    supabase
      .from('procesos_gestion')
      .select('id, area_proceso, nombre, descripcion, version, fecha_actualizacion')
      .eq('empresa_id', perfil.empresa_id)
      .order('area_proceso'),
    supabase
      .from('matriz_riesgos_controles')
      .select('id, marco_normativo, riesgo, categoria_riesgo, probabilidad, impacto, control')
      .eq('empresa_id', perfil.empresa_id)
      .order('created_at', { ascending: false }),
    supabase
      .from('checklist_cumplimiento')
      .select('id, marco_normativo, item, descripcion, estado, evidencia_url')
      .eq('empresa_id', perfil.empresa_id)
      .order('marco_normativo'),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-secundario">Procesos y Sistemas de Gestión</h1>
        <p className="text-sm text-marmol-500 mt-1">
          Procesos documentados, matriz de riesgos y checklist de cumplimiento (ISO 9001, SARLAFT/SAGRILAFT,
          PTEE) — aporte de V&E a la alianza. Base del paquete de evidencia de auditoría.
        </p>
      </div>

      <ListaProcesos procesosIniciales={(procesos ?? []) as any} puedeEditar={puedeEditar} />
      <ListaRiesgos riesgosIniciales={(riesgos ?? []) as any} puedeEditar={puedeEditar} />
      <ChecklistKanban itemsIniciales={(checklist ?? []) as any} puedeEditar={puedeEditar} empresaId={perfil.empresa_id} />
    </div>
  );
}
