import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Target } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { ObjetivosCiclo } from '@/components/espiral-crecimiento/objetivos-ciclo';
import { calcularCumplimientoObjetivos } from '@/lib/desempeno/objetivos';
import { primero } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function ObjetivosEvaluacionPage({ params }: { params: { evaluacionId: string } }) {
  const perfil = await getPerfilActual();
  if (!perfil) return null;
  const supabase = createClient();

  const { data: ev } = await supabase
    .from('evaluaciones')
    .select('id, ciclo_id, colaborador:colaborador_evaluado_id(id, nombre_completo, empresa_id, lider_id), ciclo:ciclo_id(nombre)')
    .eq('id', params.evaluacionId)
    .maybeSingle();
  const col = primero(ev?.colaborador as any) as any;
  if (!ev || !col || col.empresa_id !== perfil.empresa_id) notFound();

  const gestiona = perfil.rol === 'admin_th' || (perfil.rol === 'lider' && col.lider_id === perfil.colaborador_id);
  const esLaPersona = perfil.colaborador_id === col.id;
  if (!gestiona && !esLaPersona) notFound();

  const { data: objetivos } = await supabase
    .from('objetivos_ciclo')
    .select('id, titulo, descripcion, criterio_exito, fecha_meta, creado_por_nombre, aceptado_en, comentario_colaborador, resultado, cierre_comentario, cerrado_por_nombre')
    .eq('evaluacion_id', ev.id)
    .order('created_at', { ascending: true });

  const lista = (objetivos ?? []) as any[];
  const cumplimiento = calcularCumplimientoObjetivos(lista);
  const ciclo = primero(ev.ciclo as any) as any;

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <Link href={`/espiral-crecimiento/evaluaciones/${ev.id}/resultado`} className="inline-flex items-center gap-1 text-xs text-marmol-400 hover:text-marmol-600 mb-2">
          <ArrowLeft size={12} /> Volver al resultado
        </Link>
        <h1 className="font-display text-2xl font-semibold text-secundario flex items-center gap-2">
          <Target size={22} className="text-hacer" /> Objetivos concertados
        </h1>
        <p className="text-sm text-marmol-500 mt-1">
          {col.nombre_completo}
          {ciclo?.nombre ? ` · ${ciclo.nombre}` : ''}
        </p>
        <p className="text-xs text-marmol-400 mt-2 max-w-xl">
          Antes de evaluar se acuerda qué se espera y con qué criterio se juzgará. El líder propone, la persona acepta o pide conversarlo, y al cierre del ciclo se registra si se cumplió.
        </p>
      </div>

      {lista.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="card p-4"><p className="text-xs text-marmol-500">Acordados</p><p className="font-display text-2xl font-semibold text-secundario">{cumplimiento.aceptados}/{cumplimiento.total}</p></div>
          <div className="card p-4"><p className="text-xs text-marmol-500">Cerrados</p><p className="font-display text-2xl font-semibold text-secundario">{cumplimiento.cerrados}/{cumplimiento.total}</p></div>
          <div className="card p-4"><p className="text-xs text-marmol-500">Cumplimiento de objetivos</p><p className="font-display text-2xl font-semibold text-secundario">{cumplimiento.porcentaje != null ? `${cumplimiento.porcentaje}%` : '—'}</p></div>
        </div>
      )}

      <ObjetivosCiclo evaluacionId={ev.id} objetivos={lista} gestiona={gestiona} esLaPersona={esLaPersona} />
    </div>
  );
}
