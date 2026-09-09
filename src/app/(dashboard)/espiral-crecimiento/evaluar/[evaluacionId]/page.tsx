import { createClient } from '@/lib/supabase/server';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { FormularioEvaluacion, type ItemEvaluacion } from '@/components/espiral-crecimiento/formulario-evaluacion';
import { notFound } from 'next/navigation';

export default async function EvaluarPage({ params }: { params: { evaluacionId: string } }) {
  const perfil = await getPerfilActual();
  if (!perfil?.colaborador_id) return null;

  const supabase = createClient();

  const { data: evaluacion } = await supabase
    .from('evaluaciones')
    .select('id, tenia_personal_a_cargo, colaborador:colaborador_evaluado_id(nombre_completo)')
    .eq('id', params.evaluacionId)
    .maybeSingle();

  if (!evaluacion) notFound();

  const { data: tarea } = await supabase
    .from('evaluacion_tareas')
    .select('id, tipo_evaluador')
    .eq('evaluacion_id', params.evaluacionId)
    .eq('evaluador_colaborador_id', perfil.colaborador_id)
    .maybeSingle();

  if (!tarea) notFound();

  // Los ítems reales de ESTA evaluación (ya generados al abrir el ciclo,
  // y potencialmente ajustados por Talento Humano con el PATCH de /api/evaluaciones)
  const { data: items } = await supabase
    .from('evaluacion_items')
    .select(
      `id, bloque, titulo, descripcion,
       competencia:competencia_id(criterios:competencia_criterios(nivel, criterio))`
    )
    .eq('evaluacion_id', params.evaluacionId)
    .eq('activo', true)
    .order('orden');

  const { data: respuestasExistentes } = await supabase
    .from('respuestas_evaluacion')
    .select('evaluacion_item_id, nota, observacion, resultado_real')
    .eq('evaluacion_tarea_id', tarea.id);

  const respuestasIniciales = Object.fromEntries(
    (respuestasExistentes ?? []).map((r) => [
      r.evaluacion_item_id,
      { nota: r.nota, observacion: r.observacion ?? undefined, resultadoReal: r.resultado_real ?? undefined },
    ])
  );

  const itemsFormateados: ItemEvaluacion[] = (items ?? []).map((i: any) => ({
    id: i.id,
    bloque: i.bloque,
    titulo: i.titulo,
    descripcion: i.descripcion,
    criterios: i.competencia?.criterios,
  }));

  const etiquetaTipo: Record<string, string> = {
    autoevaluacion: 'Autoevaluación',
    lider: 'Valoración del líder',
    par: 'Valoración de un par',
    colaborador_a_cargo: 'Valoración de colaborador a cargo',
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <p className="text-xs font-medium text-flow-600 mb-1">
          {etiquetaTipo[tarea.tipo_evaluador] ?? tarea.tipo_evaluador}
        </p>
        <h1 className="font-display text-2xl font-semibold text-secundario">
          Valorando a {(evaluacion.colaborador as any)?.nombre_completo}
        </h1>
        <p className="text-sm text-marmol-500 mt-1">
          Valora comportamientos observables del período completo. Cada respuesta se guarda y
          recalcula el resultado de inmediato. Puedes agregar una observación en cualquier ítem.
        </p>
      </div>

      {itemsFormateados.length === 0 ? (
        <p className="text-sm text-marmol-400">
          Este Encuentro de Crecimiento todavía no tiene ítems generados. Pide a Talento Humano que la regenere
          desde el ciclo correspondiente.
        </p>
      ) : (
        <FormularioEvaluacion
          evaluacionTareaId={tarea.id}
          items={itemsFormateados}
          respuestasIniciales={respuestasIniciales as any}
        />
      )}
    </div>
  );
}
