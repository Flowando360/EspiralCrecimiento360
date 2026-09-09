-- ============================================================================
-- 0030_respuestas_evaluacion_competencia_id_opcional.sql
-- Corrige un bug que impedía guardar CUALQUIER respuesta de evaluación
-- (Hacer/Deber) en toda la app.
--
-- Desde 0008_perfil_cargo_completo_y_bloques_evaluacion.sql, las respuestas
-- se guardan contra evaluacion_items (columna evaluacion_item_id) en vez de
-- directo contra competencias, y guardarRespuesta() (evaluar/actions.ts)
-- dejó de enviar competencia_id. Pero la columna original
-- respuestas_evaluacion.competencia_id seguía siendo "not null" desde
-- 0002_circulo_crecimiento.sql y nunca se relajó — el comentario de 0008
-- decía "se deja la anterior por compatibilidad histórica" pero nadie quitó
-- el not null. Resultado: todo insert nuevo fallaba con
-- "null value in column competencia_id violates not-null constraint"
-- (confirmado en vivo contra la base real).
--
-- El cálculo de resultados (fn_recalcular_resultados_evaluacion, ver
-- 0010/0025) ya no depende de respuestas_evaluacion.competencia_id — usa
-- evaluacion_items.competencia_id en su lugar — así que relajar esta
-- columna es seguro y no rompe el recálculo de índices.
-- ============================================================================

alter table respuestas_evaluacion alter column competencia_id drop not null;

comment on column respuestas_evaluacion.competencia_id is 'Columna legacy (pre evaluacion_items, ver 0008). Ya no la escribe la app — las respuestas nuevas se guardan solo con evaluacion_item_id. Se conserva por compatibilidad histórica con datos previos a 0008, ahora como columna opcional (antes bloqueaba todo insert nuevo por ser not null).';
