-- ============================================================================
-- 0040_perfiles_usuario_visibilidad_empresa.sql
-- Hasta hoy solo admin_th podía ver los perfiles de sus compañeros de
-- empresa (además de cada quien ver el suyo propio) — lider/colaborador/
-- gerencia no tenían ninguna policy de SELECT sobre perfiles ajenos. Esto
-- rompía en silencio la Mensajería directa (0023_mensajeria_directa.sql,
-- pensada a propósito para que "cualquiera pueda escribirle a cualquiera
-- dentro de su empresa"): el selector de "Nuevo mensaje" consulta
-- perfiles_usuario con el cliente normal (RLS aplicado), así que para
-- cualquier rol distinto de admin_th la lista de destinatarios llegaba
-- vacía, y el nombre de la otra persona en una conversación ya existente
-- se perdía (quedaba "Usuario" por el fallback del código).
--
-- Se agrega una policy amplia de SELECT por empresa. Las dos policies de
-- SELECT que ya existían (admin_th ve todos / cada quien ve el suyo)
-- quedan redundantes pero no se tocan -- Postgres combina policies
-- permisivas del mismo comando con OR, así que esta simplemente amplía el
-- acceso sin quitarle nada a nadie. No se toca la policy "admin_th
-- administra usuarios" (for all), que sigue siendo la única que permite
-- INSERT/UPDATE/DELETE sobre perfiles ajenos.
-- ============================================================================

create policy "perfiles: cualquiera ve los de su empresa" on perfiles_usuario for select
  using (empresa_id = fn_mi_empresa_id());
