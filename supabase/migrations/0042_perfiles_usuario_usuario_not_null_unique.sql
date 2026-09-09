-- ============================================================================
-- 0042_perfiles_usuario_usuario_not_null_unique.sql
-- Cierra 0041: ya con las 38 cuentas existentes backfillenadas (script de
-- una sola vez, fuera de las migraciones), la columna usuario pasa a ser
-- obligatoria y única -- toda cuenta nueva debe traer un usuario desde el
-- momento en que se crea (ver crearCuentaUsuario en
-- administracion/usuarios/actions.ts).
-- ============================================================================

alter table perfiles_usuario alter column usuario set not null;
alter table perfiles_usuario add constraint perfiles_usuario_usuario_key unique (usuario);
