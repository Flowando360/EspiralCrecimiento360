-- ============================================================================
-- 0027_rol_auditor_externo_enum.sql
-- Nuevo valor del enum rol_usuario para auditores/aliados externos
-- invitados (Portafolio Nexus: auditorías ISO 9001, SARLAFT/SAGRILAFT).
--
-- Va en su propio archivo, sin ninguna otra sentencia: Postgres no permite
-- usar un valor de enum recién agregado dentro de la MISMA transacción en
-- que se agregó (ALTER TYPE ... ADD VALUE debe quedar confirmado antes de
-- referenciarse en una policy). Las políticas que lo usan van en
-- 0028_rol_auditor_externo_rls.sql.
-- ============================================================================

alter type rol_usuario add value if not exists 'auditor_externo';

comment on type rol_usuario is 'admin_th = Talento Humano (todo). lider = su equipo. colaborador = a sí mismo. gerencia = agregados sin detalle individual. auditor_externo = solo lectura de evidencia de auditoría (SST/ISO 9001/SARLAFT-SAGRILAFT), sin acceso a ningún otro módulo.';
