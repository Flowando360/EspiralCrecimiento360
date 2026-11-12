-- Modelo integral (§7), Fase 3 parte 4: otras fuentes de evaluación — clientes internos.
-- Talento Humano puede invitar a valorar a personas que reciben el servicio de la persona evaluada (clientes internos de
-- otras áreas). Cuentan como una fuente más en Hacer y Deber, con su propio peso por ciclo (peso_clientes_internos, por
-- defecto 0: no cambia nada hasta que se active). El peso asignado se resta proporcionalmente a las demás fuentes, de modo
-- que todo sigue sumando 100 %. Idempotente.

alter type tipo_evaluador add value if not exists 'cliente_interno';

alter table ciclos_evaluacion add column if not exists peso_clientes_internos numeric(4,2) not null default 0;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'ciclos_peso_clientes_internos_rango') then
    alter table ciclos_evaluacion add constraint ciclos_peso_clientes_internos_rango check (peso_clientes_internos between 0 and 0.5);
  end if;
end $$;

comment on column ciclos_evaluacion.peso_clientes_internos is 'Peso (0 a 0,5) de la fuente «clientes internos» en Hacer y Deber. Las demás fuentes se escalan por (1 - este peso). 0 = la fuente no cuenta.';

-- Recalculo de resultados: misma lógica que antes, con la fuente nueva y los pesos escalados.
create or replace function fn_recalcular_resultados_evaluacion(p_evaluacion_id uuid)
returns void
language plpgsql
security definer
as $function$
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
         ce.peso_lider_sin_equipo, ce.peso_pares_sin_equipo, ce.peso_clientes_internos
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
      tipo_evaluador::text as tipo_evaluador,
      sum(nota * peso_relativo) / nullif(sum(peso_relativo), 0) as promedio
    from respuestas
    group by dimension, tipo_evaluador
  ),
  fuentes as (
    select 'lider'::text as tipo,
           (case when v_eval.tenia_personal_a_cargo then v_eval.peso_lider_con_equipo else v_eval.peso_lider_sin_equipo end) * (1 - v_eval.peso_clientes_internos) as w
    union all
    select 'par',
           (case when v_eval.tenia_personal_a_cargo then v_eval.peso_pares_con_equipo else v_eval.peso_pares_sin_equipo end) * (1 - v_eval.peso_clientes_internos)
    union all
    select 'colaborador_a_cargo',
           (case when v_eval.tenia_personal_a_cargo then v_eval.peso_colaboradores_con_equipo else 0 end) * (1 - v_eval.peso_clientes_internos)
    union all
    select 'cliente_interno', v_eval.peso_clientes_internos
  ),
  ponderado as (
    select pf.dimension, round(sum(pf.promedio * f.w) / nullif(sum(f.w), 0), 2) as indice
    from por_fuente pf
    join fuentes f on f.tipo = pf.tipo_evaluador
    group by pf.dimension
  )
  select
    (select indice from ponderado where dimension = 'hacer'),
    (select indice from ponderado where dimension = 'deber'),
    (select promedio from por_fuente where dimension = 'hacer' and tipo_evaluador = 'autoevaluacion'),
    (select promedio from por_fuente where dimension = 'deber' and tipo_evaluador = 'autoevaluacion')
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

  -- Motor automático brecha → PDI → formación: solo dispara cuando la evaluación quedó 100 % respondida.
  if v_porcentaje_avance = 100 then
    perform fn_generar_pdi_y_formacion_por_dimension(p_evaluacion_id, 'hacer', v_semaforo_hacer);
    perform fn_generar_pdi_y_formacion_por_dimension(p_evaluacion_id, 'deber', v_semaforo_deber);
  end if;
end;
$function$;
