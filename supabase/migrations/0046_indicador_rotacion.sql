-- ============================================================================
-- 0046_indicador_rotacion.sql
-- Indicador de rotación (turnover) en el panel de Indicadores. El dato ya
-- existía (colaboradores.fecha_salida / motivo_salida, alimentado desde el
-- movimiento "Salida" del historial — ver 0020 y la sesión de fase20), pero
-- nunca se calculaba ni se mostraba. Se agrega sin tocar tablas: solo
-- extiende v_indicadores_empresa (0005) y suma una vista de tendencia
-- mensual para el gráfico.
--
-- Fórmula: activos_hace_12_meses = colaboradores cuyo ingreso ya había
-- ocurrido hace 12 meses y que en ese momento seguían activos (no habían
-- salido todavía, o salieron después de esa fecha). Es exacta con los datos
-- que ya se registran — no requiere fotos históricas de nómina.
-- ============================================================================

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
  count(distinct al.id) filter (where al.estado in ('pendiente','notificada') and al.severidad = 'critica') as alertas_criticas,
  count(distinct co.id) filter (
    where co.fecha_salida is not null and co.fecha_salida > (current_date - interval '12 months')
  ) as salidas_ultimo_anio,
  count(distinct co.id) filter (
    where co.fecha_salida is not null and co.fecha_salida > (current_date - interval '12 months')
      and co.motivo_salida = 'renuncia_voluntaria'
  ) as salidas_voluntarias_ultimo_anio,
  count(distinct co.id) filter (
    where co.fecha_ingreso <= (current_date - interval '12 months')
      and (co.fecha_salida is null or co.fecha_salida > (current_date - interval '12 months'))
  ) as activos_hace_12_meses,
  round(
    100.0 * count(distinct co.id) filter (
      where co.fecha_salida is not null and co.fecha_salida > (current_date - interval '12 months')
    )
    / nullif(count(distinct co.id) filter (
        where co.fecha_ingreso <= (current_date - interval '12 months')
          and (co.fecha_salida is null or co.fecha_salida > (current_date - interval '12 months'))
      ), 0),
    1
  ) as tasa_rotacion_anual,
  round(
    100.0 * count(distinct co.id) filter (
      where co.fecha_salida is not null and co.fecha_salida > (current_date - interval '12 months')
        and co.motivo_salida = 'renuncia_voluntaria'
    )
    / nullif(count(distinct co.id) filter (
        where co.fecha_ingreso <= (current_date - interval '12 months')
          and (co.fecha_salida is null or co.fecha_salida > (current_date - interval '12 months'))
      ), 0),
    1
  ) as tasa_rotacion_voluntaria
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
where co.es_externo = false
group by co.empresa_id;

comment on view v_indicadores_empresa is 'Reporte gerencial consolidado por dimensión: alineación talento-rol, brechas de formación, cumplimiento, coherencia cultural, y rotación (últimos 12 meses, total y voluntaria) (secc. 12.3).';

-- ── Tendencia mensual de salidas (para el gráfico de los últimos 12 meses) ──
create or replace view v_rotacion_mensual as
select
  co.empresa_id,
  date_trunc('month', co.fecha_salida)::date as mes,
  count(*) as salidas,
  count(*) filter (where co.motivo_salida = 'renuncia_voluntaria') as salidas_voluntarias
from colaboradores co
where co.fecha_salida is not null
  and co.fecha_salida > (current_date - interval '12 months')
  and co.es_externo = false
group by co.empresa_id, date_trunc('month', co.fecha_salida)
order by mes;

comment on view v_rotacion_mensual is 'Salidas por mes en los últimos 12 meses, total y voluntarias — alimenta el gráfico de tendencia de rotación en Indicadores.';
