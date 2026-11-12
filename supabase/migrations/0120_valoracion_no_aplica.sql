-- Modelo integral (§6.1 y §6.5), Fase 1 parte 1: «No aplica / no evaluable».
-- Un ítem que el evaluador marca como No aplica NO cuenta como cero: se excluye del promedio y del
-- denominador, el peso efectivo de lo que sí se evaluó se recalcula solo, y el resultado deja a la vista
-- cuántos ítems no aplicaron para que se pueda leer con ese contexto.

alter table respuestas_evaluacion add column if not exists no_aplica boolean not null default false;
alter table respuestas_evaluacion alter column nota drop not null;

-- Una respuesta es una nota de 1 a 5 o un «No aplica», nunca ambas ni ninguna.
alter table respuestas_evaluacion drop constraint if exists respuestas_evaluacion_nota_check;
alter table respuestas_evaluacion drop constraint if exists respuestas_nota_o_no_aplica;
alter table respuestas_evaluacion add constraint respuestas_nota_o_no_aplica
  check ((no_aplica and nota is null) or (not no_aplica and nota between 1 and 5));

comment on column respuestas_evaluacion.no_aplica is 'true = el evaluador marcó el ítem como No aplica / no evaluable (con su justificación en observacion). No cuenta como cero: se excluye del cálculo.';

alter table resultados_evaluacion add column if not exists items_evaluados int;
alter table resultados_evaluacion add column if not exists items_no_aplica int;

comment on column resultados_evaluacion.items_evaluados is 'Respuestas enviadas con nota (no cuentan los No aplica).';
comment on column resultados_evaluacion.items_no_aplica is 'Respuestas enviadas marcadas como No aplica. Si son muchas frente al total, el resultado debe leerse con cautela.';

-- Mismo cálculo de siempre (0025), pero sin las respuestas «No aplica» y dejando constancia de cuántas hubo.
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
  v_porcentaje_avance numeric;
  v_items_evaluados int;
  v_items_no_aplica int;
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

  select
    count(*) filter (where rv.no_aplica = false),
    count(*) filter (where rv.no_aplica = true)
  into v_items_evaluados, v_items_no_aplica
  from respuestas_evaluacion rv
  join evaluacion_tareas et on et.id = rv.evaluacion_tarea_id
  join evaluacion_items ei on ei.id = rv.evaluacion_item_id
  where et.evaluacion_id = p_evaluacion_id
    and et.completada = true
    and ei.activo = true;

  with respuestas as (
    select
      rv.nota,
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
      and rv.no_aplica = false
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

  insert into resultados_evaluacion (evaluacion_id, indice_hacer, indice_deber, semaforo_hacer, semaforo_deber, brecha_hacer, brecha_deber, items_evaluados, items_no_aplica, actualizado_en)
  values (
    p_evaluacion_id, v_indice_hacer, v_indice_deber, v_semaforo_hacer, v_semaforo_deber,
    case when v_autoeval_hacer is not null and v_indice_hacer is not null then round(v_indice_hacer - v_autoeval_hacer, 2) end,
    case when v_autoeval_deber is not null and v_indice_deber is not null then round(v_indice_deber - v_autoeval_deber, 2) end,
    v_items_evaluados, v_items_no_aplica,
    now()
  )
  on conflict (evaluacion_id) do update set
    indice_hacer = excluded.indice_hacer,
    indice_deber = excluded.indice_deber,
    semaforo_hacer = excluded.semaforo_hacer,
    semaforo_deber = excluded.semaforo_deber,
    brecha_hacer = excluded.brecha_hacer,
    brecha_deber = excluded.brecha_deber,
    items_evaluados = excluded.items_evaluados,
    items_no_aplica = excluded.items_no_aplica,
    actualizado_en = now();

  update evaluaciones set porcentaje_avance = (
    select round(100.0 * count(*) filter (where completada) / nullif(count(*),0), 1)
    from evaluacion_tareas where evaluacion_id = p_evaluacion_id
  )
  where id = p_evaluacion_id
  returning porcentaje_avance into v_porcentaje_avance;

  -- Motor automático brecha → PDI → formación: solo dispara cuando la
  -- evaluación quedó 100% respondida (no en cada respuesta parcial).
  if v_porcentaje_avance = 100 then
    perform fn_generar_pdi_y_formacion_por_dimension(p_evaluacion_id, 'hacer', v_semaforo_hacer);
    perform fn_generar_pdi_y_formacion_por_dimension(p_evaluacion_id, 'deber', v_semaforo_deber);
  end if;
end;
$$;

comment on function fn_recalcular_resultados_evaluacion is 'Recalcula Índice de Hacer/Deber, semáforo y brechas para UNA evaluación. Las respuestas «No aplica» se excluyen del cálculo (no cuentan como cero) y se cuentan aparte. Al llegar al 100 % de avance dispara el motor brecha → PDI → formación.';
