-- ============================================================================
-- 0041_perfiles_usuario_usuario_login.sql
-- Separa el "usuario" de login del correo de la cuenta: hasta hoy, para
-- entrar sin escribir el correo completo (ver login/actions.ts,
-- resolverCorreo) se usaba la parte antes del "@" del correo real — lo que
-- fallaba en cuanto el correo no seguía el patrón nombre.apellido (ej. una
-- cuenta creada a mano con un correo personal, como un auditor externo que
-- no tiene correo de la empresa).
--
-- A partir de ahora `usuario` es su propia columna, siempre
-- primernombre.primerapellido derivado del nombre de la persona —
-- independiente de cuál sea su correo real. Se agrega nullable en esta
-- migración; el backfill de las cuentas ya existentes se hace por fuera
-- (script de una sola vez, igual que en las fases 15/17) porque necesita la
-- misma normalización de nombres (quitar tildes, desambiguar choques) que
-- ya vive en código de aplicación (src/lib/utils.ts, usuarioSugerido) — no
-- tiene sentido duplicar esa lógica en SQL. El NOT NULL + UNIQUE se agregan
-- en la migración siguiente (0042), después de correr el backfill.
-- ============================================================================

alter table perfiles_usuario add column usuario text;

comment on column perfiles_usuario.usuario is 'Nombre de usuario para iniciar sesión sin escribir el correo completo (ver login/actions.ts). Siempre primernombre.primerapellido, generado del nombre de la persona -- independiente de cuál sea su correo real.';
