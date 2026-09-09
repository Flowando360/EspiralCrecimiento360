-- ============================================================================
-- 0050_clima_umbral_configurable.sql
-- El umbral de anonimato de Clima Organizacional (mínimo de respuestas antes
-- de mostrar un resultado agregado) estaba fijo en 5, sin importar el tamaño
-- de la empresa. Ahora admin_th lo puede configurar de dos formas:
--   - 'cantidad': un número fijo de respuestas (por defecto, sigue siendo 5).
--   - 'porcentaje': un % de la planta activa (empresa completa o del equipo,
--     según corresponda), para que el umbral escale con el tamaño real.
-- ============================================================================

create type tipo_umbral_clima as enum ('cantidad', 'porcentaje');

alter table empresas add column if not exists clima_umbral_tipo tipo_umbral_clima not null default 'cantidad';
alter table empresas add column if not exists clima_umbral_cantidad integer not null default 5 check (clima_umbral_cantidad >= 1);
alter table empresas add column if not exists clima_umbral_porcentaje numeric(5,2) check (clima_umbral_porcentaje > 0 and clima_umbral_porcentaje <= 100);

comment on column empresas.clima_umbral_tipo is 'Cómo se calcula el mínimo de respuestas para mostrar resultados agregados de Clima Organizacional: por cantidad fija o por % de la planta activa.';
comment on column empresas.clima_umbral_cantidad is 'Umbral en cantidad fija de respuestas (usado si clima_umbral_tipo = cantidad). Por defecto 5.';
comment on column empresas.clima_umbral_porcentaje is 'Umbral como % de la planta activa (usado si clima_umbral_tipo = porcentaje). NULL mientras se use el tipo "cantidad".';

-- Calcula el umbral real (en número de respuestas) para una empresa, dado el
-- tamaño de la población de referencia (toda la empresa o un equipo). Con
-- tipo 'porcentaje', redondea hacia arriba y nunca baja de 1.
create or replace function fn_clima_umbral(p_empresa_id uuid, p_poblacion bigint) returns integer
language sql stable as $$
  select case
    when e.clima_umbral_tipo = 'porcentaje' and e.clima_umbral_porcentaje is not null then
      greatest(1, ceil(p_poblacion * e.clima_umbral_porcentaje / 100.0)::integer)
    else
      coalesce(e.clima_umbral_cantidad, 5)
  end
  from empresas e
  where e.id = p_empresa_id;
$$;

-- ── v_clima_ronda_resumen: umbral calculado sobre la planta activa total ──
create or replace view v_clima_ronda_resumen as
select
  rda.id as ronda_id,
  rda.empresa_id,
  rda.nombre,
  rda.estado,
  rda.fecha_apertura,
  rda.fecha_cierre,
  count(resp.id) as num_respuestas,
  case when fn_mi_rol() in ('admin_th', 'gerencia') and count(resp.id) >= cfg.umbral then
    round(100.0 * (count(*) filter (where resp.enps >= 9) - count(*) filter (where resp.enps <= 6)) / nullif(count(resp.id), 0))
  end as enps,
  case when fn_mi_rol() in ('admin_th', 'gerencia') and count(resp.id) >= cfg.umbral then round(avg(resp.reconocimiento), 2) end as prom_reconocimiento,
  case when fn_mi_rol() in ('admin_th', 'gerencia') and count(resp.id) >= cfg.umbral then round(avg(resp.liderazgo), 2) end as prom_liderazgo,
  case when fn_mi_rol() in ('admin_th', 'gerencia') and count(resp.id) >= cfg.umbral then round(avg(resp.desarrollo), 2) end as prom_desarrollo,
  case when fn_mi_rol() in ('admin_th', 'gerencia') and count(resp.id) >= cfg.umbral then round(avg(resp.comunicacion), 2) end as prom_comunicacion,
  case when fn_mi_rol() in ('admin_th', 'gerencia') and count(resp.id) >= cfg.umbral then round(avg(resp.condiciones), 2) end as prom_condiciones,
  case when fn_mi_rol() in ('admin_th', 'gerencia') and count(resp.id) >= cfg.umbral then round(avg(resp.pertenencia), 2) end as prom_pertenencia,
  case when fn_mi_rol() in ('admin_th', 'gerencia') and count(resp.id) >= cfg.umbral then
    round(avg((resp.reconocimiento + resp.liderazgo + resp.desarrollo + resp.comunicacion + resp.condiciones + resp.pertenencia) / 6.0), 2)
  end as indice_clima_general,
  cfg.umbral as umbral_respuestas
from clima_rondas rda
left join clima_respuestas resp on resp.ronda_id = rda.id
left join lateral (
  select fn_clima_umbral(rda.empresa_id, count(*)) as umbral
  from colaboradores co
  where co.empresa_id = rda.empresa_id and co.es_externo = false and co.estado = 'activo'
) cfg on true
where rda.empresa_id = fn_mi_empresa_id()
group by rda.id, rda.empresa_id, rda.nombre, rda.estado, rda.fecha_apertura, rda.fecha_cierre, cfg.umbral;

comment on view v_clima_ronda_resumen is 'Resumen de una ronda de clima a nivel empresa (eNPS + 6 dimensiones + índice general). La fila (metadatos de la ronda) la ve cualquiera de la empresa; los números agregados solo se calculan para admin_th/gerencia y solo si num_respuestas >= umbral_respuestas (configurable por empresa, ver fn_clima_umbral).';

-- ── v_clima_equipo_resumen: umbral calculado sobre la planta activa del equipo ──
create or replace view v_clima_equipo_resumen as
select
  resp.equipo_lider_id as lider_id,
  resp.ronda_id,
  rda.empresa_id,
  count(*) as num_respuestas,
  case when count(*) >= cfg.umbral then
    round(100.0 * (count(*) filter (where resp.enps >= 9) - count(*) filter (where resp.enps <= 6)) / nullif(count(*), 0))
  end as enps,
  case when count(*) >= cfg.umbral then
    round(avg((resp.reconocimiento + resp.liderazgo + resp.desarrollo + resp.comunicacion + resp.condiciones + resp.pertenencia) / 6.0), 2)
  end as indice_clima_general,
  cfg.umbral as umbral_respuestas
from clima_respuestas resp
join clima_rondas rda on rda.id = resp.ronda_id
left join lateral (
  select fn_clima_umbral(rda.empresa_id, count(*)) as umbral
  from colaboradores co
  where co.lider_id = resp.equipo_lider_id and co.empresa_id = rda.empresa_id and co.es_externo = false and co.estado = 'activo'
) cfg on true
where resp.equipo_lider_id is not null
  and rda.empresa_id = fn_mi_empresa_id()
  and (fn_mi_rol() in ('admin_th', 'gerencia') or resp.equipo_lider_id = fn_mi_colaborador_id())
group by resp.equipo_lider_id, resp.ronda_id, rda.empresa_id, cfg.umbral;

comment on view v_clima_equipo_resumen is 'Resumen de una ronda por equipo (agrupado por líder directo). admin_th/gerencia ven todos los equipos, un líder solo ve la fila de su propio equipo. Los números quedan en null si num_respuestas < umbral_respuestas (umbral calculado sobre la planta activa de ESE equipo, no de toda la empresa).';
