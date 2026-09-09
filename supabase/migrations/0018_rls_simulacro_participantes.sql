-- ============================================================================
-- 0018_rls_simulacro_participantes.sql
-- nexa_simulacro_participantes solo tenia policy de lectura: nadie (ni
-- admin_th) podia registrar asistencia ni calificacion desde la app. Se
-- agrega la policy de administracion, igual al patron ya usado en
-- nexa_rutas_por_cargo (se valida la empresa a traves de la tabla padre,
-- porque esta tabla no tiene su propia columna empresa_id).
-- ============================================================================

create policy "nexa_simulacro_participantes: admin_th administra" on nexa_simulacro_participantes for all
  using (
    fn_mi_rol() = 'admin_th'
    and exists(select 1 from nexa_simulacros s where s.id = simulacro_id and s.empresa_id = fn_mi_empresa_id())
  )
  with check (
    fn_mi_rol() = 'admin_th'
    and exists(select 1 from nexa_simulacros s where s.id = simulacro_id and s.empresa_id = fn_mi_empresa_id())
  );
