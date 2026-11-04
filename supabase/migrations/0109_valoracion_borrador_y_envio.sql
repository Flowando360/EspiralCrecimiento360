-- ============================================================================
-- 0109_valoracion_borrador_y_envio.sql
-- La valoración (Hacer/Deber) ahora tiene dos estados:
--   · Borrador: el evaluador guarda parcialmente y puede cambiar lo que quiera.
--   · Enviada (evaluacion_tareas.completada = true): ya no se puede modificar.
-- Antes, la tarea se marcaba "completada" sola al responder el último ítem.
-- Ahora solo se marca cuando la persona pulsa «Enviar valoración».
-- Los resultados (índices, semáforo) solo cuentan valoraciones enviadas.
-- ============================================================================

-- 1) Responder ya no completa la tarea.
create or replace function fn_trigger_respuesta_evaluacion()
returns trigger
language plpgsql
security definer
as $$
begin
  -- Mientras sea borrador no cuenta en los resultados; se recalcula al enviar.
  return new;
end;
$$;

-- 2) Al enviar (o reabrir) una valoración se recalculan los resultados.
create or replace function fn_trigger_tarea_enviada()
returns trigger
language plpgsql
security definer
as $$
begin
  if new.completada is distinct from old.completada then
    perform fn_recalcular_resultados_evaluacion(new.evaluacion_id);
  end if;
  return new;
end;
$$;

drop trigger if exists trg_tarea_enviada on evaluacion_tareas;
create trigger trg_tarea_enviada
  after update of completada on evaluacion_tareas
  for each row execute function fn_trigger_tarea_enviada();

-- 3) Candado: una valoración enviada no admite cambios en sus respuestas.
create or replace function fn_bloquear_respuestas_enviadas()
returns trigger
language plpgsql
security definer
as $$
declare
  v_enviada boolean;
begin
  select completada into v_enviada from evaluacion_tareas where id = new.evaluacion_tarea_id;
  if coalesce(v_enviada, false) then
    raise exception 'Esta valoración ya fue enviada y no se puede modificar';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_bloquear_respuestas_enviadas on respuestas_evaluacion;
create trigger trg_bloquear_respuestas_enviadas
  before insert or update on respuestas_evaluacion
  for each row execute function fn_bloquear_respuestas_enviadas();
