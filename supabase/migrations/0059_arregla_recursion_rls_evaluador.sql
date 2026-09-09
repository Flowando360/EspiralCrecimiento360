-- ============================================================================
-- 0059_arregla_recursion_rls_evaluador.sql
--
-- La migración anterior (0058) rompió el flujo de evaluación por completo:
-- "evaluaciones: veo las que debo evaluar" consulta evaluacion_tareas
-- directamente, y evaluacion_tareas YA tenía una policy que consulta
-- evaluaciones ("tareas: lider ve avance de su equipo") — ciclo infinito
-- que Postgres detecta y rechaza con error 42P17 en CUALQUIER lectura de
-- evaluacion_tareas (por eso Diana Zapata no veía nada: la consulta
-- fallaba entera, no que estuviera vacía).
--
-- Arreglo: una función SECURITY DEFINER (mismo patrón que fn_es_mi_equipo)
-- que resuelve "¿soy evaluador de esta evaluación?" con privilegios
-- elevados, sin volver a disparar las policies de evaluacion_tareas desde
-- adentro — rompe el ciclo igual que ya hacía fn_es_mi_equipo para
-- colaboradores/evaluaciones.
-- ============================================================================

create or replace function fn_soy_evaluador_de(p_evaluacion_id uuid)
returns boolean
language sql
stable security definer
as $$
  select exists(
    select 1 from evaluacion_tareas et
    where et.evaluacion_id = p_evaluacion_id and et.evaluador_colaborador_id = fn_mi_colaborador_id()
  );
$$;

drop policy "evaluaciones: veo las que debo evaluar" on evaluaciones;
create policy "evaluaciones: veo las que debo evaluar" on evaluaciones for select
  using (fn_soy_evaluador_de(id));

drop policy "colaboradores: veo a quien debo evaluar" on colaboradores;
create policy "colaboradores: veo a quien debo evaluar" on colaboradores for select
  using (
    exists(
      select 1 from evaluaciones e
      where e.colaborador_evaluado_id = colaboradores.id and fn_soy_evaluador_de(e.id)
    )
  );

drop policy "items: lider, propio colaborador y evaluador asignado ven" on evaluacion_items;
create policy "items: lider, propio colaborador y evaluador asignado ven" on evaluacion_items for select
  using (
    exists(
      select 1 from evaluaciones e
      where e.id = evaluacion_items.evaluacion_id
        and (
          fn_es_mi_equipo(e.colaborador_evaluado_id)
          or e.colaborador_evaluado_id = fn_mi_colaborador_id()
          or fn_soy_evaluador_de(e.id)
        )
    )
  );
