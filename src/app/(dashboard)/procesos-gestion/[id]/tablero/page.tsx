import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { TableroKanban } from '@/components/procesos-gestion/tablero-kanban';

export default async function TableroProcesoPage({ params }: { params: { id: string } }) {
  const perfil = await getPerfilActual();
  if (!perfil) return null;
  if (!['admin_th', 'lider', 'gerencia'].includes(perfil.rol)) redirect('/inicio');

  const supabase = createClient();
  const puedeEditar = perfil.rol === 'admin_th';

  const { data: proceso } = await supabase
    .from('procesos_gestion')
    .select('id, area_proceso, nombre')
    .eq('id', params.id)
    .eq('empresa_id', perfil.empresa_id)
    .maybeSingle();

  if (!proceso) notFound();

  const [{ data: etapas }, { data: casos }, { data: colaboradores }] = await Promise.all([
    supabase.from('etapas_proceso').select('id, nombre, color, orden').eq('proceso_id', params.id).order('orden'),
    supabase
      .from('casos_proceso')
      .select('id, etapa_id, titulo, descripcion, responsable_id, prioridad, fecha_limite, orden')
      .eq('proceso_id', params.id)
      .order('orden'),
    supabase
      .from('colaboradores')
      .select('id, nombre_completo')
      .eq('empresa_id', perfil.empresa_id)
      .eq('estado', 'activo')
      .order('nombre_completo'),
  ]);

  return (
    <div className="space-y-4">
      <div>
        <Link
          href="/procesos-gestion"
          className="inline-flex items-center gap-1 text-sm text-marmol-500 hover:text-flow-600 mb-2"
        >
          <ChevronLeft size={14} /> Procesos y Sistemas de Gestión
        </Link>
        <h1 className="font-display text-2xl font-semibold text-secundario">{proceso.nombre}</h1>
        <p className="text-sm text-marmol-500 mt-1">{proceso.area_proceso} · Tablero del proceso</p>
      </div>

      <TableroKanban
        key={(etapas ?? []).length}
        procesoId={proceso.id}
        etapasIniciales={(etapas ?? []) as any}
        casosIniciales={(casos ?? []) as any}
        colaboradores={(colaboradores ?? []) as any}
        puedeEditar={puedeEditar}
      />
    </div>
  );
}
