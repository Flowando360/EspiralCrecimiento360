import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { AcpmKanban, type Acpm } from '@/components/procesos-gestion/acpm-kanban';

export default async function AcpmPage() {
  const perfil = await getPerfilActual();
  if (!perfil) return null;
  if (!['admin_th', 'lider', 'gerencia'].includes(perfil.rol)) redirect('/inicio');

  const supabase = createClient();

  const [{ data: acpmRaw }, { data: procesos }, { data: colaboradores }] = await Promise.all([
    supabase
      .from('acpm')
      .select('id, codigo, proceso_id, origen_tipo, origen_detalle, tipo_accion, descripcion, metodologia_causa, analisis_causa, responsable_id, estado, fecha_compromiso, eficaz')
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

  const acpm: Acpm[] = (acpmRaw ?? []).map((a: any) => ({ ...a, tareas: tareasPorAcpm.get(a.id) ?? [] }));

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

      <div className="card p-5">
        <AcpmKanban acpmIniciales={acpm} procesos={(procesos ?? []) as any} colaboradores={(colaboradores ?? []) as any} puedeEditar={perfil.rol === 'admin_th'} />
      </div>
    </div>
  );
}
