-- ============================================================================
-- 0036_perfiles_usuario_nombre_preferido.sql
-- Nombre preferido / apodo: cómo le gusta a cada persona que le llamen en el
-- aplicativo (saludo, encabezado), en vez de forzar siempre el primer nombre
-- legal derivado de nombre_completo. Lo puede fijar admin_th al editar la
-- cuenta desde Administración → Usuarios, o la propia persona desde Mi Perfil.
-- Si queda vacío, se sigue usando el primer nombre de nombre_completo.
-- ============================================================================

alter table perfiles_usuario add column nombre_preferido text;

comment on column perfiles_usuario.nombre_preferido is 'Apodo o diminutivo que la persona prefiere que se use para dirigirse a ella en el aplicativo. Si es null, se usa el primer nombre de nombre_completo.';
