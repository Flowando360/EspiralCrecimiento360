-- ============================================================================
-- 0065_tipo_alerta_dotacion_enum.sql
-- Nuevo valor de tipo_alerta para el módulo de Gestión de Dotaciones
-- (0067_dotacion.sql): vencimiento/renovación de un elemento entregado.
-- Va en su propio archivo porque Postgres no permite usar un valor de enum
-- nuevo en la misma transacción en la que se agrega — mismo patrón que
-- 0027_rol_auditor_externo_enum.sql y 0032_tipo_alerta_fechas_personales_enum.sql.
-- ============================================================================

alter type tipo_alerta add value if not exists 'dotacion_vencimiento';
