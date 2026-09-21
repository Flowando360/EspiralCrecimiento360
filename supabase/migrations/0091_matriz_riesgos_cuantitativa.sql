-- ============================================================================
-- 0091_matriz_riesgos_cuantitativa.sql
-- Reemplaza la matriz de riesgos y oportunidades de texto libre (baja/media/
-- alta, bajo/medio/alto elegidos a mano) por la metodología cuantitativa
-- real de Diana (Documentos/GC-MT-005 Matriz de riesgos y oportunidades.xlsx
-- + GC-PL-002 Política de gestión de riesgos y oportunidades):
--   - Impacto y probabilidad en escala 1-3 (antes texto).
--   - Riesgo/oportunidad inherente = impacto × probabilidad (1-9) — se
--     calcula en código (src/lib/calculos/matriz-riesgos.ts), no se
--     almacena, para que nunca quede desincronizado del cálculo real.
--   - Efectividad del control en escala 0-5 (nueva), con su factor de
--     reducción también en código.
--   - Riesgo/oportunidad residual = inherente × (1 - factor de reducción)
--     — antes se elegía a mano, ahora se calcula siempre.
--   - Categoría fija (Estratégico/Operativo/Financiero/Legal/Reputacional),
--     antes texto libre.
--   - Se agregan "consecuencia" y "acciones_a_realizar", que su matriz real
--     trae como columnas separadas de "riesgo" (que pasa a representar la
--     "Descripción" de su hoja) y "control".
--
-- Migración de datos existentes (confirmado con Diana: conversión
-- automática, no borrar lo que ya había):
--   probabilidad baja/media/alta -> grado_probabilidad 1/2/3
--   impacto bajo/medio/alto -> grado_impacto 1/2/3
--   categoria_riesgo (texto libre) -> categoria (se intenta mapear por
--     palabra clave; si no matchea ninguna, cae en 'operativo' por defecto)
--   riesgo_residual (elegido a mano) se descarta: de ahora en adelante se
--     calcula siempre con la fórmula real, no se vuelve a guardar a mano.
--
-- Escrita con ADD COLUMN IF NOT EXISTS / DROP CONSTRAINT IF EXISTS para
-- poder correrse más de una vez sin error.
-- ============================================================================

alter table matriz_riesgos_controles
  add column if not exists categoria text,
  add column if not exists consecuencia text,
  add column if not exists acciones_a_realizar text,
  add column if not exists grado_impacto int,
  add column if not exists grado_probabilidad int,
  add column if not exists grado_efectividad_control int;

-- Migrar datos existentes antes de aplicar los constraints nuevos.
update matriz_riesgos_controles set grado_probabilidad = case probabilidad when 'baja' then 1 when 'media' then 2 when 'alta' then 3 end where probabilidad is not null and grado_probabilidad is null;
update matriz_riesgos_controles set grado_impacto = case impacto when 'bajo' then 1 when 'medio' then 2 when 'alto' then 3 end where impacto is not null and grado_impacto is null;

update matriz_riesgos_controles set categoria = case
  when categoria is not null then categoria
  when categoria_riesgo ilike '%legal%' or categoria_riesgo ilike '%normativ%' or categoria_riesgo ilike '%dato%personal%' or categoria_riesgo ilike '%proteccion de datos%' then 'legal'
  when categoria_riesgo ilike '%financ%' or categoria_riesgo ilike '%presupuest%' then 'financiero'
  when categoria_riesgo ilike '%reputac%' or categoria_riesgo ilike '%imagen%' then 'reputacional'
  when categoria_riesgo ilike '%estrateg%' then 'estrategico'
  else 'operativo'
end
where categoria is null;

-- Todo riesgo/oportunidad necesita categoría, impacto y probabilidad para
-- que el cálculo funcione — los que quedaron sin dato (nunca se habían
-- calificado) caen en el punto medio (2) para no bloquear el guardado.
update matriz_riesgos_controles set categoria = 'operativo' where categoria is null;
update matriz_riesgos_controles set grado_impacto = 2 where grado_impacto is null;
update matriz_riesgos_controles set grado_probabilidad = 2 where grado_probabilidad is null;

-- Enriquecimiento puntual de los 4 riesgos/oportunidades demo (0082) con
-- consecuencia, categoría correcta y efectividad del control — ya tenían un
-- control descrito en texto, así que dejarlos en "0 = No existe control"
-- (el default) sería inconsistente con su propio dato.
update matriz_riesgos_controles set categoria = 'operativo', consecuencia = 'Pérdida de conocimiento crítico y continuidad operativa afectada.', grado_efectividad_control = 3
  where id = '22000000-0000-0000-0000-000000000001';
update matriz_riesgos_controles set categoria = 'legal', consecuencia = 'Sanciones del Ministerio de Trabajo y exposición a incidentes laborales.', grado_efectividad_control = 3
  where id = '22000000-0000-0000-0000-000000000002';
update matriz_riesgos_controles set categoria = 'operativo', consecuencia = 'Reducción del tiempo de selección y mejor experiencia del candidato.'
  where id = '22000000-0000-0000-0000-000000000003';
update matriz_riesgos_controles set categoria = 'legal', consecuencia = 'Sanciones bajo la Ley 1581 de 2012 (protección de datos personales) y pérdida de confianza de los candidatos.', grado_efectividad_control = 4
  where id = '22000000-0000-0000-0000-000000000004';

alter table matriz_riesgos_controles alter column categoria set not null;
alter table matriz_riesgos_controles alter column grado_impacto set not null;
alter table matriz_riesgos_controles alter column grado_probabilidad set not null;
alter table matriz_riesgos_controles alter column categoria set default 'operativo';
alter table matriz_riesgos_controles alter column grado_impacto set default 2;
alter table matriz_riesgos_controles alter column grado_probabilidad set default 2;

alter table matriz_riesgos_controles drop constraint if exists matriz_riesgos_controles_categoria_check;
alter table matriz_riesgos_controles add constraint matriz_riesgos_controles_categoria_check
  check (categoria in ('estrategico', 'operativo', 'financiero', 'legal', 'reputacional'));

alter table matriz_riesgos_controles drop constraint if exists matriz_riesgos_controles_grado_impacto_check;
alter table matriz_riesgos_controles add constraint matriz_riesgos_controles_grado_impacto_check check (grado_impacto between 1 and 3);

alter table matriz_riesgos_controles drop constraint if exists matriz_riesgos_controles_grado_probabilidad_check;
alter table matriz_riesgos_controles add constraint matriz_riesgos_controles_grado_probabilidad_check check (grado_probabilidad between 1 and 3);

alter table matriz_riesgos_controles drop constraint if exists matriz_riesgos_controles_grado_efectividad_control_check;
alter table matriz_riesgos_controles add constraint matriz_riesgos_controles_grado_efectividad_control_check check (grado_efectividad_control between 0 and 5);

-- Columnas viejas: quedan en desuso, se retiran (ya migradas arriba).
alter table matriz_riesgos_controles drop column if exists probabilidad;
alter table matriz_riesgos_controles drop column if exists impacto;
alter table matriz_riesgos_controles drop column if exists categoria_riesgo;
alter table matriz_riesgos_controles drop column if exists riesgo_residual;

comment on column matriz_riesgos_controles.riesgo is 'La "Descripción" de la hoja real GC-MT-005 (qué es el riesgo/oportunidad) — el nombre de la columna se mantiene por compatibilidad con el resto del código.';
comment on column matriz_riesgos_controles.consecuencia is 'Consecuencia positiva (oportunidad) o negativa (riesgo) de que se materialice.';
comment on column matriz_riesgos_controles.categoria is 'Categoría fija: Estratégico, Operativo, Financiero, Legal o Reputacional (ver GC-MT-005).';
comment on column matriz_riesgos_controles.grado_impacto is 'Escala 1-3. Riesgo: 1=Menor, 2=Moderado, 3=Catastrófico. Oportunidad: 1=Beneficio mínimo, 2=relevante, 3=alto.';
comment on column matriz_riesgos_controles.grado_probabilidad is 'Escala 1-3. Riesgo: 1=Inusual, 2=Probable, 3=Muy posible. Oportunidad: 1=Difícil de lograr, 2=Probable, 3=Factible.';
comment on column matriz_riesgos_controles.grado_efectividad_control is 'Escala 0-5 (0=No existe control … 5=Eficaz), solo aplica a riesgos. La valoración/evaluación inherente y residual se calculan en código (src/lib/calculos/matriz-riesgos.ts), no se almacenan.';
comment on column matriz_riesgos_controles.acciones_a_realizar is 'Nota de acción rápida sobre el riesgo/oportunidad — distinta de una ACPM formal (ver módulo ACPM para el ciclo completo con validación de eficacia).';
