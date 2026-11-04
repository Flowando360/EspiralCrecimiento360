-- ============================================================================
-- 0112_brief_ser_saber.sql
-- Surgió de la inducción con Mármoles (2026-11-04): el Brief de
-- retroalimentación debe reunir las cuatro dimensiones. Se agregan los
-- resúmenes de Ser (Guía del Flow) y de Saber (hoja de vida, cursos y
-- cumplimiento del cargo), y se guarda cómo se generó el borrador.
-- ============================================================================

alter table briefs_retroalimentacion
  add column if not exists resumen_ser text,
  add column if not exists resumen_saber text,
  add column if not exists fuente_borrador text check (fuente_borrador in ('manual', 'automatico', 'ia'));

comment on column briefs_retroalimentacion.resumen_ser is 'Resumen de Ser (Guía del Flow, solo aspectos de relevancia laboral) para preparar la retroalimentación.';
comment on column briefs_retroalimentacion.resumen_saber is 'Resumen de Saber: cumplimiento del cargo, hoja de vida, certificaciones y cursos realizados.';
comment on column briefs_retroalimentacion.fuente_borrador is 'Cómo se generó el borrador guardado: manual (escrito por el líder), automatico (cruce de datos) o ia (redacción mejorada con IA).';
