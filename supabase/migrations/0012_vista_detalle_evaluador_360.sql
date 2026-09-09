-- ============================================================================
-- 0012_vista_detalle_evaluador_360.sql
-- Vista de solo lectura para el Informe de Evaluación 360° Integrado
-- (Fase 2, Informes). resultados_evaluacion.detalle_por_competencia existe
-- en el esquema pero el trigger de cálculo (0010_recalculo_por_items.sql)
-- nunca lo llena, así que se expone el desglose por evaluador aquí en vez
-- de duplicar la lógica de agrupación dentro de la app.
--
-- A diferencia del índice oficial (que pondera por los pesos del ciclo),
-- esta vista muestra un promedio simple por fuente — es solo para mostrar
-- "cómo calificó cada tipo de evaluador", no para recalcular el índice.
-- ============================================================================

create or replace view v_360_detalle_evaluador as
select
  et.evaluacion_id,
  coalesce(cp.dimension, 'hacer') as dimension,
  et.tipo_evaluador,
  round(avg(rv.nota)::numeric, 2) as promedio,
  count(*) as total_respuestas
from respuestas_evaluacion rv
join evaluacion_tareas et on et.id = rv.evaluacion_tarea_id
join evaluacion_items ei on ei.id = rv.evaluacion_item_id
left join competencias cp on cp.id = ei.competencia_id
where ei.activo = true
group by et.evaluacion_id, coalesce(cp.dimension, 'hacer'), et.tipo_evaluador;

comment on view v_360_detalle_evaluador is 'Promedio simple por dimensión (hacer/deber) y tipo de evaluador, para el desglose "por evaluador" del Informe 360° Integrado. No sustituye el índice oficial ponderado de resultados_evaluacion.';
