-- ============================================================================
-- 0010_recalculo_por_items.sql
-- Actualiza el motor de cálculo en tiempo real para leer desde
-- evaluacion_items (los ítems reales de CADA evaluación, editables) en vez
-- de ir directo al catálogo general de competencias. Ítems que no vienen de
-- una competencia (agregados manualmente, o del bloque Roles y Funciones)
-- se tratan como 'hacer' con peso 1.0 por defecto.
-- ============================================================================

create or replace function fn_recalcular_resultados_evaluacion(p_evaluacion_id uuid)
returns void
language plpgsql
security definer
as $$
declare
  v_eval record;
  v_indice_hacer numeric(3,2);
  v_indice_deber numeric(3,2);
  v_semaforo_hacer text;
  v_semaforo_deber text;
  v_autoeval_hacer numeric(3,2);
  v_autoeval_deber numeric(3,2);
begin
  select e.*, ce.peso_lider_con_equipo, ce.peso_pares_con_equipo, ce.peso_colaboradores_con_equipo,
         ce.peso_lider_sin_equipo, ce.peso_pares_sin_equipo
  into v_eval
  from evaluaciones e
  join ciclos_evaluacion ce on ce.id = e.ciclo_id
  where e.id = p_evaluacion_id;

  if not found then
    return;
  end if;

  with respuestas as (
    select
      rv.nota,
      -- dimensión heredada de la competencia si el ítem viene de una;
      -- si es de Roles y Funciones o agregado manual, cuenta como 'hacer'
      coalesce(cp.dimension, 'hacer') as dimension,
      coalesce(cp.peso_relativo, 1.0) as peso_relativo,
      et.tipo_evaluador
    from respuestas_evaluacion rv
    join evaluacion_tareas et on et.id = rv.evaluacion_tarea_id
    join evaluacion_items ei on ei.id = rv.evaluacion_item_id
    left join competencias cp on cp.id = ei.competencia_id
    where et.evaluacion_id = p_evaluacion_id
      and et.completada = true
      and ei.activo = true
  ),
  por_fuente as (
    select
      dimension,
      tipo_evaluador,
      sum(nota * peso_relativo) / nullif(sum(peso_relativo), 0) as promedio
    from respuestas
    group by dimension, tipo_evaluador
  ),
  pesos as (
    select
      case when v_eval.tenia_personal_a_cargo then v_eval.peso_lider_con_equipo else v_eval.peso_lider_sin_equipo end as w_lider,
      case when v_eval.tenia_personal_a_cargo then v_eval.peso_pares_con_equipo else v_eval.peso_pares_sin_equipo end as w_pares,
      case when v_eval.tenia_personal_a_cargo then v_eval.peso_colaboradores_con_equipo else 0 end as w_colab
  )
  select
    round((
      coalesce((select promedio from por_fuente where dimension='hacer' and tipo_evaluador='lider'),0) * (select w_lider from pesos)
      + coalesce((select promedio from por_fuente where dimension='hacer' and tipo_evaluador='par'),0) * (select w_pares from pesos)
      + coalesce((select promedio from por_fuente where dimension='hacer' and tipo_evaluador='colaborador_a_cargo'),0) * (select w_colab from pesos)
    ) / nullif(
        (case when (select promedio from por_fuente where dimension='hacer' and tipo_evaluador='lider') is not null then (select w_lider from pesos) else 0 end)
      + (case when (select promedio from por_fuente where dimension='hacer' and tipo_evaluador='par') is not null then (select w_pares from pesos) else 0 end)
      + (case when (select promedio from por_fuente where dimension='hacer' and tipo_evaluador='colaborador_a_cargo') is not null then (select w_colab from pesos) else 0 end)
    , 0), 2) as indice_hacer,
    round((
      coalesce((select promedio from por_fuente where dimension='deber' and tipo_evaluador='lider'),0) * (select w_lider from pesos)
      + coalesce((select promedio from por_fuente where dimension='deber' and tipo_evaluador='par'),0) * (select w_pares from pesos)
      + coalesce((select promedio from por_fuente where dimension='deber' and tipo_evaluador='colaborador_a_cargo'),0) * (select w_colab from pesos)
    ) / nullif(
        (case when (select promedio from por_fuente where dimension='deber' and tipo_evaluador='lider') is not null then (select w_lider from pesos) else 0 end)
      + (case when (select promedio from por_fuente where dimension='deber' and tipo_evaluador='par') is not null then (select w_pares from pesos) else 0 end)
      + (case when (select promedio from por_fuente where dimension='deber' and tipo_evaluador='colaborador_a_cargo') is not null then (select w_colab from pesos) else 0 end)
    , 0), 2) as indice_deber,
    (select promedio from por_fuente where dimension='hacer' and tipo_evaluador='autoevaluacion') as autoeval_hacer,
    (select promedio from por_fuente where dimension='deber' and tipo_evaluador='autoevaluacion') as autoeval_deber
  into v_indice_hacer, v_indice_deber, v_autoeval_hacer, v_autoeval_deber;

  v_semaforo_hacer := case
    when v_indice_hacer is null then null
    when v_indice_hacer >= 4.0 then 'alto'
    when v_indice_hacer >= 3.5 then 'medio'
    else 'bajo' end;

  v_semaforo_deber := case
    when v_indice_deber is null then null
    when v_indice_deber >= 4.0 then 'alto'
    when v_indice_deber >= 3.5 then 'medio'
    else 'bajo' end;

  insert into resultados_evaluacion (evaluacion_id, indice_hacer, indice_deber, semaforo_hacer, semaforo_deber, brecha_hacer, brecha_deber, actualizado_en)
  values (
    p_evaluacion_id, v_indice_hacer, v_indice_deber, v_semaforo_hacer, v_semaforo_deber,
    case when v_autoeval_hacer is not null and v_indice_hacer is not null then round(v_indice_hacer - v_autoeval_hacer, 2) end,
    case when v_autoeval_deber is not null and v_indice_deber is not null then round(v_indice_deber - v_autoeval_deber, 2) end,
    now()
  )
  on conflict (evaluacion_id) do update set
    indice_hacer = excluded.indice_hacer,
    indice_deber = excluded.indice_deber,
    semaforo_hacer = excluded.semaforo_hacer,
    semaforo_deber = excluded.semaforo_deber,
    brecha_hacer = excluded.brecha_hacer,
    brecha_deber = excluded.brecha_deber,
    actualizado_en = now();

  update evaluaciones set porcentaje_avance = (
    select round(100.0 * count(*) filter (where completada) / nullif(count(*),0), 1)
    from evaluacion_tareas where evaluacion_id = p_evaluacion_id
  )
  where id = p_evaluacion_id;
end;
$$;

-- El trigger de "tarea completada" ahora cuenta contra evaluacion_items
-- activos de la evaluación, no contra el catálogo general de competencias.
create or replace function fn_trigger_respuesta_evaluacion()
returns trigger
language plpgsql
security definer
as $$
declare
  v_evaluacion_id uuid;
  v_total_items int;
  v_respondidos int;
begin
  select et.evaluacion_id into v_evaluacion_id
  from evaluacion_tareas et where et.id = new.evaluacion_tarea_id;

  select count(*) into v_total_items
  from evaluacion_items where evaluacion_id = v_evaluacion_id and activo = true;

  select count(*) into v_respondidos
  from respuestas_evaluacion rv
  join evaluacion_items ei on ei.id = rv.evaluacion_item_id
  where rv.evaluacion_tarea_id = new.evaluacion_tarea_id and ei.activo = true;

  if v_respondidos >= v_total_items and v_total_items > 0 then
    update evaluacion_tareas set completada = true, fecha_completada = now()
    where id = new.evaluacion_tarea_id and completada = false;
  end if;

  perform fn_recalcular_resultados_evaluacion(v_evaluacion_id);
  return new;
end;
$$;
