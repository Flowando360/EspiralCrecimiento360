-- ============================================================================
-- 0105_requerimientos_tipo.sql
-- Cada requerimiento indica qué quiere la persona:
--   · mejora: la función existe y quiere que se fortalezca.
--   · nueva_funcion: no encontró cómo hacerlo o la función no existe.
--   · falla: algo no funciona como debería.
-- Y guarda lo que buscó y la página de ayuda que se le mostró.
-- Aplicar después de 0104_requerimientos.sql.
-- ============================================================================

alter table requerimientos
  add column if not exists tipo text not null default 'nueva_funcion'
    check (tipo in ('mejora', 'nueva_funcion', 'falla')),
  add column if not exists consulta text,
  add column if not exists respuesta_mostrada text;

comment on column requerimientos.tipo is 'mejora = la función existe y se quiere fortalecer; nueva_funcion = no encontró cómo hacerlo o no existe; falla = no funciona como debería.';
