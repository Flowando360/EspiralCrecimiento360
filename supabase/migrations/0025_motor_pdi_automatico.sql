-- ============================================================================
-- 0025_motor_pdi_automatico.sql
-- Motor automático brecha → PDI → formación (Modelo de Negocio Espiral
-- Evolutiva 360° + Nexa, secc. 1: "una brecha detectada en la evaluación
-- dispara, sin intervención manual, la ruta de formación correspondiente").
--
-- Hasta hoy planes_desarrollo (PDI) no tenía NINGÚN punto del código que
-- insertara filas — era 100% manual por fuera de la app. Este archivo:
--   1. Agrega la configuración (admin_th) de qué curso de Nexa refuerza una
--      brecha de Hacer o de Deber, por empresa.
--   2. Extiende fn_recalcular_resultados_evaluacion (el mismo trigger que ya
--      corre en tiempo real al guardar cada respuesta, ver
--      0006/0010_recalculo_por_items.sql) para que, SOLO cuando la
--      evaluación queda 100% respondida, genere automáticamente:
--        a) un PDI marcado como generado_automaticamente si el semáforo de
--           Hacer o Deber quedó en 'bajo',
--        b) la(s) ruta(s) de formación configuradas para esa dimensión,
--           trazadas hacia ese PDI (nexa_rutas_formacion.pdi_origen_id).
--   Es idempotente: si el semáforo se recalcula de nuevo (ej. corrigen una
--   respuesta) no duplica el PDI automático ya generado para ese ciclo.
-- ============================================================================

alter table planes_desarrollo add column if not exists generado_automaticamente boolean not null default false;
comment on column planes_desarrollo.generado_automaticamente is 'true si lo generó el motor automático de brechas al cerrarse la evaluación (secc. 1 del Modelo de Negocio Espiral Evolutiva), false si lo redactó admin_th/líder a mano.';

alter table nexa_rutas_formacion add column if not exists pdi_origen_id uuid references planes_desarrollo(id) on delete set null;
comment on column nexa_rutas_formacion.pdi_origen_id is 'PDI que disparó esta asignación de curso (brecha de Hacer/Deber), cuando aplica. Análogo a alerta_origen_id pero para el disparador de evaluación 360°.';

create table dimension_cursos_recomendados (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  dimension text not null check (dimension in ('hacer', 'deber')),
  curso_id uuid not null references nexa_cursos(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(empresa_id, dimension, curso_id)
);

comment on table dimension_cursos_recomendados is 'Configuración de admin_th: qué curso(s) de Nexa refuerzan una brecha de Hacer o de Deber detectada en el Encuentro de Crecimiento 360°. Fuente del motor automático brecha→formación.';

alter table dimension_cursos_recomendados enable row level security;

create policy "dimension_cursos: lectura empresa" on dimension_cursos_recomendados for select
  using (empresa_id = fn_mi_empresa_id());
create policy "dimension_cursos: admin_th administra" on dimension_cursos_recomendados for all
  using (empresa_id = fn_mi_empresa_id() and fn_mi_rol() = 'admin_th');

-- ── Generación automática de PDI + formación por brecha de dimensión ───────
create or replace function fn_generar_pdi_y_formacion_por_dimension(p_evaluacion_id uuid, p_dimension text, p_semaforo text)
returns void
language plpgsql
security definer
as $$
declare
  v_colaborador_id uuid;
  v_empresa_id uuid;
  v_ciclo_id uuid;
  v_pdi_id uuid;
  v_ya_generado boolean;
  v_curso record;
begin
  if p_semaforo is distinct from 'bajo' then
    return;
  end if;

  select e.colaborador_evaluado_id, e.ciclo_id, c.empresa_id
  into v_colaborador_id, v_ciclo_id, v_empresa_id
  from evaluaciones e
  join colaboradores c on c.id = e.colaborador_evaluado_id
  where e.id = p_evaluacion_id;

  if v_colaborador_id is null then
    return;
  end if;

  select exists(
    select 1 from planes_desarrollo
    where colaborador_id = v_colaborador_id
      and ciclo_origen_id = v_ciclo_id
      and origen = p_dimension::origen_pdi
      and generado_automaticamente = true
  ) into v_ya_generado;

  if v_ya_generado then
    return;
  end if;

  insert into planes_desarrollo (colaborador_id, ciclo_origen_id, origen, brecha_detectada, accion, estado, generado_automaticamente)
  values (
    v_colaborador_id,
    v_ciclo_id,
    p_dimension::origen_pdi,
    'Brecha detectada automáticamente al cerrar las respuestas del ciclo: Índice de ' ||
      (case when p_dimension = 'hacer' then 'Hacer' else 'Deber' end) || ' en semáforo bajo.',
    'Completar la(s) ruta(s) de formación asignada(s) automáticamente en Nexa para reforzar esta dimensión.',
    'pendiente',
    true
  )
  returning id into v_pdi_id;

  for v_curso in
    select dcr.curso_id
    from dimension_cursos_recomendados dcr
    where dcr.empresa_id = v_empresa_id and dcr.dimension = p_dimension
      and not exists (
        select 1 from nexa_rutas_formacion nrf
        where nrf.colaborador_id = v_colaborador_id and nrf.curso_id = dcr.curso_id
      )
  loop
    insert into nexa_rutas_formacion (colaborador_id, curso_id, pdi_origen_id, estado)
    values (v_colaborador_id, v_curso.curso_id, v_pdi_id, 'asignado');
  end loop;
end;
$$;

comment on function fn_generar_pdi_y_formacion_por_dimension is 'Idempotente: crea a lo sumo un PDI automático por colaborador+ciclo+dimensión, y asigna los cursos configurados en dimension_cursos_recomendados que la persona todavía no tenga.';

-- ── Re-crea fn_recalcular_resultados_evaluacion (misma lógica de
-- 0010_recalculo_por_items.sql) agregando la llamada al motor automático al
-- final, solo cuando la evaluación queda 100% respondida. ──
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

comment on function fn_recalcular_resultados_evaluacion is 'Recalcula Índice de Hacer/Deber, semáforo y brechas para UNA evaluación (tiempo real, secc. 13.6). Desde 0025, al llegar al 100% de avance dispara además el motor automático brecha→PDI→formación (Modelo de Negocio Espiral Evolutiva secc. 1).';
