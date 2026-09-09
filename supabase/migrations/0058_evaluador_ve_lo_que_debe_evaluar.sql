-- ============================================================================
-- 0058_evaluador_ve_lo_que_debe_evaluar.sql
--
-- Encontrado al construir la pantalla de "Encuentros de Crecimiento
-- pendientes": las políticas de evaluaciones/colaboradores/evaluacion_items
-- solo dejaban ver esos datos a admin_th, al líder del evaluado, o al
-- propio evaluado. Un "par" (compañero) o un "colaborador a cargo"
-- asignado como evaluador —sin ser el líder ni el evaluado mismo— no
-- podía leer NI el nombre de a quién debía evaluar NI las preguntas del
-- formulario. No era solo que faltara la pantalla de acceso: la
-- valoración en sí estaba bloqueada por RLS para esos dos tipos de
-- evaluador.
-- ============================================================================

create policy "evaluaciones: veo las que debo evaluar" on evaluaciones for select
  using (
    exists(
      select 1 from evaluacion_tareas et
      where et.evaluacion_id = evaluaciones.id and et.evaluador_colaborador_id = fn_mi_colaborador_id()
    )
  );

create policy "colaboradores: veo a quien debo evaluar" on colaboradores for select
  using (
    exists(
      select 1
      from evaluacion_tareas et
      join evaluaciones e on e.id = et.evaluacion_id
      where e.colaborador_evaluado_id = colaboradores.id and et.evaluador_colaborador_id = fn_mi_colaborador_id()
    )
  );

drop policy "items: lider y propio colaborador ven" on evaluacion_items;
create policy "items: lider, propio colaborador y evaluador asignado ven" on evaluacion_items for select
  using (
    exists(
      select 1 from evaluaciones e
      where e.id = evaluacion_items.evaluacion_id
        and (
          fn_es_mi_equipo(e.colaborador_evaluado_id)
          or e.colaborador_evaluado_id = fn_mi_colaborador_id()
          or exists(
            select 1 from evaluacion_tareas et
            where et.evaluacion_id = e.id and et.evaluador_colaborador_id = fn_mi_colaborador_id()
          )
        )
    )
  );
