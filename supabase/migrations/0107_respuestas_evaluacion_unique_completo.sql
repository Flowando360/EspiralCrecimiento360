-- ============================================================================
-- 0107_respuestas_evaluacion_unique_completo.sql
-- Arregla el guardado de calificaciones del Encuentro de Crecimiento.
--
-- El índice uq_respuesta_tarea_item (0008) era PARCIAL (where evaluacion_item_id
-- is not null). PostgreSQL no usa un índice parcial como destino de
-- "ON CONFLICT (evaluacion_tarea_id, evaluacion_item_id)" -> error 42P10 y
-- ninguna nota se guardaba. Se reemplaza por una restricción única completa.
-- Las filas con evaluacion_item_id nulo (históricas) no chocan: NULL no se
-- considera igual a NULL en una restricción única.
-- Idempotente.
-- ============================================================================
drop index if exists uq_respuesta_tarea_item;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'uq_respuesta_tarea_item' and conrelid = 'respuestas_evaluacion'::regclass
  ) then
    alter table respuestas_evaluacion
      add constraint uq_respuesta_tarea_item unique (evaluacion_tarea_id, evaluacion_item_id);
  end if;
end $$;
