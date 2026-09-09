-- ============================================================================
-- 0057_sincronizaciones_sin_autorizacion.sql
--
-- Nuevo valor de resultado para guia_del_flow_sincronizaciones: la persona
-- generó su Guía en guiadelflow pero no marcó el checkbox de autorización
-- explícita para compartir un resumen con su empresa (nuevo desde hoy,
-- ver registro/page.tsx en guiadelflow). Antes de esta migración no existía
-- ese checkbox, así que este caso no podía pasar — ahora sí.
-- ============================================================================

alter table guia_del_flow_sincronizaciones drop constraint guia_del_flow_sincronizaciones_resultado_check;
alter table guia_del_flow_sincronizaciones add constraint guia_del_flow_sincronizaciones_resultado_check
  check (resultado = any (array['vinculado', 'sin_colaborador', 'correo_ambiguo', 'sin_autorizacion', 'error']));
