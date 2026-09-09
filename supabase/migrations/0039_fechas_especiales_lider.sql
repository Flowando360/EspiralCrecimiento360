-- ============================================================================
-- 0039_fechas_especiales_lider.sql
-- Extiende quién puede registrar fechas especiales: ahora también el líder
-- directo del colaborador (antes solo admin_th y el propio colaborador).
-- Reutiliza fn_es_mi_equipo(), el mismo helper que ya usa el líder para VER
-- las alertas de su equipo -- aquí se usa además para escritura, que es
-- justo el caso que 0021_fix_rls_lider_colaboradores.sql dejó documentado a
-- propósito ("si en el futuro se necesita que el líder edite algo puntual,
-- se agrega una policy nueva y específica") en vez de reabrir el UPDATE
-- amplio y sin restricción de columnas que se le quitó a `colaboradores`.
-- ============================================================================

create policy "fechas_especiales: lider administra la de su equipo" on fechas_especiales_colaborador for all
  using (fn_es_mi_equipo(colaborador_id));
