-- ============================================================================
-- 0032_tipo_alerta_fechas_personales_enum.sql
-- Nuevos valores de tipo_alerta para completar las fechas personales
-- sensibles (punto 2 del plan de diferenciación, docs/notas-proyecto-
-- decisiones-y-backlog.md secc. 2.2): aniversario de bodas y baby shower.
-- Van en su propio archivo porque Postgres no permite usar un valor de
-- enum nuevo en la misma transacción en la que se agrega — mismo patrón
-- que 0027_rol_auditor_externo_enum.sql / 0028_rol_auditor_externo_rls.sql.
-- El embarazo (fecha probable de parto) NO se modela como alerta: es un
-- dato sensible de salud que solo debe ver admin_th y la propia persona,
-- y el mecanismo de alertas ya es visible para el líder de equipo — ver
-- 0033_fechas_personales_colaborador.sql.
-- ============================================================================

alter type tipo_alerta add value if not exists 'aniversario_bodas';
alter type tipo_alerta add value if not exists 'baby_shower';
