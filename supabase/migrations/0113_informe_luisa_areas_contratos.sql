-- Informe de pruebas (Luisa, 2026-11-11): normaliza el campo Área y amplía tipos de contrato.

-- 6.4 Áreas escritas con variantes ("administrativo", "Administrativo", "ADMINISTRATIVO"):
-- se unifican en la variante mejor escrita (mixta) o, si no hay, con Mayúscula inicial.
with base as (
  select id, empresa_id, proceso_area,
         lower(regexp_replace(translate(trim(proceso_area), 'ÁÉÍÓÚÜÑáéíóúüñ', 'AEIOUUNaeiouun'), '\s+', ' ', 'g')) as clave,
         (trim(proceso_area) <> upper(trim(proceso_area)) and trim(proceso_area) <> lower(trim(proceso_area))) as mixta
  from cargos
  where proceso_area is not null and trim(proceso_area) <> ''
),
canon as (
  select empresa_id, clave,
         coalesce(
           (array_agg(regexp_replace(trim(proceso_area), '\s+', ' ', 'g') order by proceso_area) filter (where mixta))[1],
           upper(left(trim(min(proceso_area)), 1)) || lower(substr(trim(min(proceso_area)), 2))
         ) as nombre
  from base group by empresa_id, clave
)
update cargos c
set proceso_area = canon.nombre
from base join canon on canon.empresa_id = base.empresa_id and canon.clave = base.clave
where c.id = base.id and c.proceso_area is distinct from canon.nombre;

-- 4.4 Tipos de contrato faltantes en Colombia.
alter type tipo_contrato add value if not exists 'empleado_mision';
alter type tipo_contrato add value if not exists 'aprendizaje_lectiva';
alter type tipo_contrato add value if not exists 'aprendizaje_productiva';
alter type tipo_contrato add value if not exists 'pasantia';
