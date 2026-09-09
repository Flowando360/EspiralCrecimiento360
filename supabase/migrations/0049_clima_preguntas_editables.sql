-- ============================================================================
-- 0049_clima_preguntas_editables.sql
-- Permite a admin_th editar el texto de cada pregunta de la encuesta de
-- Clima Organizacional (0047), sin tocar cómo se guardan las respuestas: las
-- 6 dimensiones + eNPS se mantienen fijas (así el índice de clima se puede
-- seguir comparando ronda a ronda), pero el enunciado que ve el colaborador
-- se puede adaptar al lenguaje de cada empresa. NULL = usa el texto por
-- defecto que trae el formulario.
-- ============================================================================

alter table empresas add column if not exists clima_pregunta_enps text;
alter table empresas add column if not exists clima_pregunta_reconocimiento text;
alter table empresas add column if not exists clima_pregunta_liderazgo text;
alter table empresas add column if not exists clima_pregunta_desarrollo text;
alter table empresas add column if not exists clima_pregunta_comunicacion text;
alter table empresas add column if not exists clima_pregunta_condiciones text;
alter table empresas add column if not exists clima_pregunta_pertenencia text;

comment on column empresas.clima_pregunta_enps is 'Texto personalizado de la pregunta eNPS en Clima Organizacional. NULL = usa el texto por defecto.';
comment on column empresas.clima_pregunta_reconocimiento is 'Texto personalizado de la afirmación de "reconocimiento" en Clima Organizacional. NULL = usa el texto por defecto.';
comment on column empresas.clima_pregunta_liderazgo is 'Texto personalizado de la afirmación de "liderazgo" en Clima Organizacional. NULL = usa el texto por defecto.';
comment on column empresas.clima_pregunta_desarrollo is 'Texto personalizado de la afirmación de "desarrollo" en Clima Organizacional. NULL = usa el texto por defecto.';
comment on column empresas.clima_pregunta_comunicacion is 'Texto personalizado de la afirmación de "comunicación" en Clima Organizacional. NULL = usa el texto por defecto.';
comment on column empresas.clima_pregunta_condiciones is 'Texto personalizado de la afirmación de "condiciones" en Clima Organizacional. NULL = usa el texto por defecto.';
comment on column empresas.clima_pregunta_pertenencia is 'Texto personalizado de la afirmación de "pertenencia" en Clima Organizacional. NULL = usa el texto por defecto.';
