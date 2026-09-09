-- ============================================================================
-- 0011_briefs_retroalimentacion_editable.sql
-- Habilita guardar/actualizar el Brief de retroalimentación. Hasta ahora
-- (0007_rls_policies.sql) solo existía la política de SELECT, así que ni
-- siquiera admin_th podía insertar una fila con RLS activo. Se agrega
-- también una restricción única por evaluación, para que exista un solo
-- brief por evaluación y se pueda guardar con upsert (evaluacion_id).
-- ============================================================================

alter table briefs_retroalimentacion add constraint uq_brief_evaluacion unique (evaluacion_id);

create policy "briefs: admin_th y lider insertan" on briefs_retroalimentacion for insert
  with check (exists(select 1 from evaluaciones e where e.id = evaluacion_id and (fn_es_mi_equipo(e.colaborador_evaluado_id) or fn_mi_rol() = 'admin_th')));

create policy "briefs: admin_th y lider actualizan" on briefs_retroalimentacion for update
  using (exists(select 1 from evaluaciones e where e.id = evaluacion_id and (fn_es_mi_equipo(e.colaborador_evaluado_id) or fn_mi_rol() = 'admin_th')))
  with check (exists(select 1 from evaluaciones e where e.id = evaluacion_id and (fn_es_mi_equipo(e.colaborador_evaluado_id) or fn_mi_rol() = 'admin_th')));
