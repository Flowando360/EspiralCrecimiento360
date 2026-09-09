-- ============================================================================
-- 0005_vistas_indicadores.sql
-- Vistas que traducen el organigrama en arquitectura de evaluadores (secc. 9)
-- y que alimentan los dashboards de indicadores (individuo / equipo / empresa).
-- ============================================================================

-- ── El organigrama COMO regla de evaluadores (secc. 9.2, la pieza clave) ──
-- Líder: colaboradores.lider_id directo.
-- Pares: quienes comparten el mismo lider_id.
-- Colaboradores a cargo: quienes tienen a esta persona como lider_id.
create or replace view v_organigrama_pares as
select
  c1.id as colaborador_id,
  c2.id as par_id
from colaboradores c1
join colaboradores c2
  on c1.lider_id is not distinct from c2.lider_id
  and c1.id <> c2.id
  and c1.lider_id is not null
where c1.estado = 'activo' and c2.estado = 'activo' and c1.es_externo = false and c2.es_externo = false;

create or replace view v_organigrama_colaboradores_a_cargo as
select
  lider.id as colaborador_id,     -- la persona evaluada (que es líder de otros)
  subordinado.id as colaborador_a_cargo_id
from colaboradores lider
join colaboradores subordinado on subordinado.lider_id = lider.id
where lider.estado = 'activo' and subordinado.estado = 'activo' and subordinado.es_externo = false;

-- Caso especial: Gerencia General / cargos sin líder interno → pares = otros
-- líderes de línea de primer nivel (secc. 9.3). Se identifican como
-- colaboradores activos, no externos, con lider_id null y que sí tienen
-- gente reportándoles (son "líderes de línea").
create or replace view v_lideres_de_linea_sin_lider_interno as
select distinct c.id as colaborador_id
from colaboradores c
where c.lider_id is null
  and c.estado = 'activo'
  and c.es_externo = false
  and exists (select 1 from colaboradores sub where sub.lider_id = c.id);

-- Vista consolidada: "para esta persona, quién es líder / par / colaborador a cargo"
-- Se usa al abrir un ciclo para generar evaluacion_tareas automáticamente.
create or replace view v_organigrama_evaluadores as
select id as colaborador_id, 'lider'::tipo_evaluador as tipo_evaluador, lider_id as evaluador_id
from colaboradores where lider_id is not null and estado = 'activo' and es_externo = false
union all
select colaborador_id, 'par'::tipo_evaluador, par_id
from v_organigrama_pares
union all
select colaborador_id, 'colaborador_a_cargo'::tipo_evaluador, colaborador_a_cargo_id
from v_organigrama_colaboradores_a_cargo
union all
-- Autoevaluación siempre aplica
select id as colaborador_id, 'autoevaluacion'::tipo_evaluador, id
from colaboradores where estado = 'activo' and es_externo = false
union all
-- Caso especial: líderes de línea sin líder interno se evalúan entre sí como pares
select c1.colaborador_id, 'par'::tipo_evaluador, c2.colaborador_id
from v_lideres_de_linea_sin_lider_interno c1
join v_lideres_de_linea_sin_lider_interno c2 on c1.colaborador_id <> c2.colaborador_id;

comment on view v_organigrama_evaluadores is 'Traducción en vivo del organigrama a la matriz de evaluadores (líder/par/colaborador a cargo/autoevaluación), incluyendo el caso especial de Gerencia General y líderes de línea sin líder interno (secc. 9.3).';

-- ── % de cumplimiento de Saber por colaborador ─────────────────────────────
create or replace view v_saber_cumplimiento as
select
  colaborador_id,
  count(*) as total_items,
  count(*) filter (where estado = 'cumple') as items_cumple,
  count(*) filter (where estado = 'cumple_parcial') as items_parcial,
  count(*) filter (where estado = 'no_cumple_pendiente') as items_pendiente,
  round(
    100.0 * (count(*) filter (where estado = 'cumple') + 0.5 * count(*) filter (where estado = 'cumple_parcial'))
    / nullif(count(*), 0), 1
  ) as porcentaje_cumplimiento
from verificaciones_saber
group by colaborador_id;

comment on view v_saber_cumplimiento is 'Porcentaje de cumplimiento del perfil de cargo por colaborador (secc. 6.3). El parcial cuenta como medio punto.';

-- ── Indicador de alineación Ser–Hacer (talento-rol) ────────────────────────
-- Aproximación: colaborador con Guía del Flow completa Y último índice Hacer alto/medio
create or replace view v_alineacion_talento_rol as
select
  co.id as colaborador_id,
  co.empresa_id,
  (gf.id is not null) as tiene_guia_flow,
  re.semaforo_hacer,
  case
    when gf.id is not null and re.semaforo_hacer in ('alto','medio') then true
    when gf.id is not null and re.semaforo_hacer = 'bajo' then false
    else null
  end as alineado
from colaboradores co
left join lateral (
  select * from guia_del_flow g where g.colaborador_id = co.id order by fecha_aplicacion desc limit 1
) gf on true
left join lateral (
  select r.* from resultados_evaluacion r
  join evaluaciones e on e.id = r.evaluacion_id
  where e.colaborador_evaluado_id = co.id
  order by r.actualizado_en desc limit 1
) re on true
where co.estado = 'activo';

-- ── Panel de indicadores por equipo (agrupado por líder directo) ──────────
create or replace view v_indicadores_equipo as
select
  lider.id as lider_id,
  lider.nombre_completo as lider_nombre,
  lider.empresa_id,
  count(distinct miembro.id) as tamano_equipo,
  round(avg(re.indice_hacer), 2) as promedio_hacer,
  round(avg(re.indice_deber), 2) as promedio_deber,
  round(avg(sc.porcentaje_cumplimiento), 1) as promedio_saber,
  count(distinct pdi.id) filter (where pdi.estado = 'pendiente') as pdi_pendientes,
  count(distinct pdi.id) filter (where pdi.estado = 'cumplido') as pdi_cumplidos,
  count(distinct al.id) filter (where al.estado in ('pendiente','notificada') and al.severidad = 'critica') as alertas_criticas_abiertas
from colaboradores lider
join colaboradores miembro on miembro.lider_id = lider.id and miembro.estado = 'activo'
left join lateral (
  select r.* from resultados_evaluacion r
  join evaluaciones e on e.id = r.evaluacion_id
  where e.colaborador_evaluado_id = miembro.id
  order by r.actualizado_en desc limit 1
) re on true
left join v_saber_cumplimiento sc on sc.colaborador_id = miembro.id
left join planes_desarrollo pdi on pdi.colaborador_id = miembro.id
left join alertas al on al.colaborador_id = miembro.id
group by lider.id, lider.nombre_completo, lider.empresa_id;

comment on view v_indicadores_equipo is 'Mapa de equipo agregado: Hacer, Deber, Saber promedio + estado de PDI y alertas críticas, por cada líder directo.';

-- ── Panel de indicadores a nivel empresa (para Gerencia) ───────────────────
create or replace view v_indicadores_empresa as
select
  co.empresa_id,
  count(distinct co.id) filter (where co.estado = 'activo') as total_activos,
  count(distinct co.id) filter (where co.estado = 'en_proceso_salida') as en_proceso_salida,
  round(avg(re.indice_hacer), 2) as promedio_hacer_empresa,
  round(avg(re.indice_deber), 2) as promedio_deber_empresa,
  round(avg(sc.porcentaje_cumplimiento), 1) as promedio_saber_empresa,
  round(100.0 * count(*) filter (where at.alineado) / nullif(count(*) filter (where at.alineado is not null), 0), 1) as pct_alineacion_talento_rol,
  count(distinct al.id) filter (where al.estado in ('pendiente','notificada')) as alertas_abiertas,
  count(distinct al.id) filter (where al.estado in ('pendiente','notificada') and al.severidad = 'critica') as alertas_criticas
from colaboradores co
left join lateral (
  select r.* from resultados_evaluacion r
  join evaluaciones e on e.id = r.evaluacion_id
  where e.colaborador_evaluado_id = co.id
  order by r.actualizado_en desc limit 1
) re on true
left join v_saber_cumplimiento sc on sc.colaborador_id = co.id
left join v_alineacion_talento_rol at on at.colaborador_id = co.id
left join alertas al on al.colaborador_id = co.id
group by co.empresa_id;

comment on view v_indicadores_empresa is 'Reporte gerencial consolidado por dimensión: alineación talento-rol, brechas de formación, cumplimiento, coherencia cultural (secc. 12.3).';

-- ── Alertas próximas a vencer (para el badge de campana / centro de alertas)
create or replace view v_alertas_proximas as
select a.*, co.nombre_completo as colaborador_nombre, co.empresa_id as colaborador_empresa_id
from alertas a
join colaboradores co on co.id = a.colaborador_id
where a.estado in ('pendiente', 'notificada')
  and a.fecha_objetivo <= (current_date + (a.dias_anticipacion || ' days')::interval)
order by a.fecha_objetivo asc;
