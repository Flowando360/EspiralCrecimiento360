-- ============================================================================
-- 0143_ser_conteo_aspectos_descritos.sql
--
-- v_ser_promedio contaba como «aspectos calificados» cualquier fila de ser_puntajes, incluidos los restos de
-- cuando el Ser tenía puntaje (filas con número pero sin título ni descripción). Desde la 0142 el Ser es un
-- esquema descriptivo: un aspecto cuenta solo si tiene título o descripción. Así la ficha («N aspectos
-- descritos») y el informe de Brechas («personas con Ser») dicen la verdad.
-- Mismas columnas que antes (colaborador_id, promedio_ser, total_aspectos_calificados). Idempotente.
-- ============================================================================

create or replace view v_ser_promedio as
select
  g.colaborador_id,
  round(avg(sp.puntaje)::numeric, 2) as promedio_ser,
  count(sp.id) filter (where sp.nota is not null or sp.descripcion is not null) as total_aspectos_calificados
from guia_del_flow g
join ser_puntajes sp on sp.guia_del_flow_id = g.id
join ser_aspectos a on a.id = sp.aspecto_id and a.sensible = false
where g.id in (
  select distinct on (colaborador_id) id
  from guia_del_flow
  order by colaborador_id, fecha_aplicacion desc, created_at desc
)
group by g.colaborador_id;

-- La vista debe seguir respetando las políticas de quien consulta (0063).
alter view v_ser_promedio set (security_invoker = on);

comment on view v_ser_promedio is 'Una fila por colaborador con su Guía del Flow más reciente. total_aspectos_calificados = aspectos del esquema del Ser con título o descripción (no sensibles). promedio_ser es obsoleto: el Ser no se califica.';
