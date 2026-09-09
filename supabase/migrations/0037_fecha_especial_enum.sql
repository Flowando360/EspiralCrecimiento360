-- ============================================================================
-- 0037_fecha_especial_enum.sql
-- Nuevo valor de tipo_alerta para las fechas especiales personalizadas
-- (0038_fechas_especiales_colaborador.sql). Va en su propia migración
-- porque Postgres no permite usar un valor de enum recién agregado dentro
-- de la misma transacción que lo crea (mismo patrón que 0027→0028 y
-- 0032→0033).
-- ============================================================================

alter type tipo_alerta add value if not exists 'fecha_especial';
