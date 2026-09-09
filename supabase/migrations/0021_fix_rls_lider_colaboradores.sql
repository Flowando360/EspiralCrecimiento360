-- ============================================================================
-- Cierra un hueco de RLS: la policy "colaboradores: lider actualiza datos
-- basicos de su equipo" permitía a un líder actualizar CUALQUIER columna de
-- un colaborador de su equipo (cargo_id, lider_id, tipo_contrato, estado,
-- salario, hoja_vida_url, contrato_url...), no solo "datos básicos" — no
-- tenía with check ni restricción de columnas, solo de filas.
--
-- Se confirmó que ningún código de la aplicación ejerce hoy esta policy
-- como líder (todas las escrituras reales sobre colaboradores están
-- protegidas aparte, a nivel de aplicación, exigiendo admin_th). Es decir,
-- es un permiso de base de datos más amplio que cualquier caso de uso real
-- actual. Se elimina en vez de acotarla a columnas específicas que hoy
-- nadie necesita — si en el futuro se necesita que el líder edite algo
-- puntual (ej. teléfono), se agrega una policy nueva y específica para eso.
-- ============================================================================

drop policy if exists "colaboradores: lider actualiza datos basicos de su equipo" on colaboradores;
