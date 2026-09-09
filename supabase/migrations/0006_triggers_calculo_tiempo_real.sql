-- ============================================================================
-- 0006_triggers_calculo_tiempo_real.sql
-- "Tiempo real de verdad" (secc. 13.6): al guardar una respuesta, se
-- recalculan de inmediato los índices de Hacer/Deber de esa persona.
-- Nada de "correr" un archivo ni recalcular manualmente.
-- ============================================================================

create or replace function fn_recalcular_resultados_evaluacion(p_evaluacion_id uuid)
returns void
language plpgsql
security definer
as $$
declare
  v_ciclo record;
  v_eval record;
  v_indice_hacer numeric(3,2);
  v_indice_deber numeric(3,2);
  v_semaforo_hacer text;
  v_semaforo_deber text;
  v_autoeval_hacer numeric(3,2);
  v_autoeval_deber numeric(3,2);
  v_terceros_hacer numeric(3,2);
  v_terceros_deber numeric(3,2);
  v_detalle jsonb;
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

  -- Promedio ponderado por fuente y por competencia, usando peso_relativo de la competencia
  -- (Resultados pesa el doble dentro de Hacer, secc. 10.1)
  with respuestas as (
    select
      rv.nota,
      cp.dimension,
      cp.peso_relativo,
      et.tipo_evaluador
    from respuestas_evaluacion rv
    join evaluacion_tareas et on et.id = rv.evaluacion_tarea_id
    join competencias cp on cp.id = rv.competencia_id
    where et.evaluacion_id = p_evaluacion_id
      and et.completada = true
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
    -- HACER: combinar lider/par/colaborador_a_cargo con los pesos del ciclo
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

  -- Actualiza % de avance de la evaluación (cuántas tareas completas / total)
  update evaluaciones set porcentaje_avance = (
    select round(100.0 * count(*) filter (where completada) / nullif(count(*),0), 1)
    from evaluacion_tareas where evaluacion_id = p_evaluacion_id
  )
  where id = p_evaluacion_id;
end;
$$;

comment on function fn_recalcular_resultados_evaluacion is 'Recalcula Índice de Hacer/Deber, semáforo y brechas para UNA evaluación. Se llama automáticamente por trigger al guardar una respuesta.';

-- Trigger: al insertar/actualizar una respuesta, marcar la tarea como completada
-- (cuando tiene nota para todas las competencias de su dimensión) y recalcular.
create or replace function fn_trigger_respuesta_evaluacion()
returns trigger
language plpgsql
security definer
as $$
declare
  v_evaluacion_id uuid;
  v_total_competencias int;
  v_respondidas int;
begin
  select et.evaluacion_id into v_evaluacion_id
  from evaluacion_tareas et where et.id = new.evaluacion_tarea_id;

  -- ¿Ya respondió todas las competencias de Hacer+Deber aplicables?
  select count(*) into v_total_competencias
  from competencias c
  join evaluaciones e on e.id = v_evaluacion_id
  where c.empresa_id = (select empresa_id from colaboradores where id = e.colaborador_evaluado_id)
    and c.activo = true
    and (c.solo_con_personal_a_cargo = false or exists(select 1 from evaluaciones ev where ev.id = v_evaluacion_id and ev.tenia_personal_a_cargo));

  select count(*) into v_respondidas
  from respuestas_evaluacion where evaluacion_tarea_id = new.evaluacion_tarea_id;

  if v_respondidas >= v_total_competencias then
    update evaluacion_tareas set completada = true, fecha_completada = now()
    where id = new.evaluacion_tarea_id and completada = false;
  end if;

  perform fn_recalcular_resultados_evaluacion(v_evaluacion_id);
  return new;
end;
$$;

drop trigger if exists trg_respuesta_evaluacion on respuestas_evaluacion;
create trigger trg_respuesta_evaluacion
  after insert or update on respuestas_evaluacion
  for each row execute function fn_trigger_respuesta_evaluacion();

-- ── Trigger: alertas automáticas de vencimiento al guardar hoja_vida_formacion
create or replace function fn_generar_alerta_vencimiento_formacion()
returns trigger
language plpgsql
security definer
as $$
declare
  v_empresa_id uuid;
begin
  if new.fecha_vencimiento is not null then
    select empresa_id into v_empresa_id from colaboradores where id = new.colaborador_id;

    insert into alertas (empresa_id, colaborador_id, tipo, severidad, titulo, descripcion, fecha_objetivo, dias_anticipacion, hoja_vida_formacion_id)
    values (
      v_empresa_id,
      new.colaborador_id,
      case when new.tipo = 'certificacion' then 'sst_certificacion' else 'formacion_vencimiento' end,
      'atencion',
      'Vencimiento: ' || new.titulo,
      'Certificación/formación próxima a vencer, verificar renovación.',
      new.fecha_vencimiento,
      30,
      new.id
    )
    on conflict do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_hv_formacion_alerta on hoja_vida_formacion;
create trigger trg_hv_formacion_alerta
  after insert on hoja_vida_formacion
  for each row execute function fn_generar_alerta_vencimiento_formacion();

-- ── Trigger: alerta de fin de contrato / periodo de prueba al crear colaborador
create or replace function fn_generar_alertas_ingreso_colaborador()
returns trigger
language plpgsql
security definer
as $$
begin
  -- Periodo de prueba (2 meses estándar Colombia, ajustable manualmente después)
  if new.tipo_contrato in ('indefinido','fijo') then
    insert into alertas (empresa_id, colaborador_id, tipo, severidad, titulo, fecha_objetivo, dias_anticipacion)
    values (new.empresa_id, new.id, 'periodo_prueba_fin', 'info', 'Fin de periodo de prueba', new.fecha_ingreso + interval '2 months', 7);
  end if;

  -- Aniversario de ingreso (primer año, se puede regenerar anualmente vía función programada)
  insert into alertas (empresa_id, colaborador_id, tipo, severidad, titulo, fecha_objetivo, dias_anticipacion)
  values (new.empresa_id, new.id, 'aniversario_ingreso', 'info', 'Aniversario de ingreso', new.fecha_ingreso + interval '1 year', 7);

  return new;
end;
$$;

drop trigger if exists trg_colaborador_alertas_ingreso on colaboradores;
create trigger trg_colaborador_alertas_ingreso
  after insert on colaboradores
  for each row execute function fn_generar_alertas_ingreso_colaborador();
