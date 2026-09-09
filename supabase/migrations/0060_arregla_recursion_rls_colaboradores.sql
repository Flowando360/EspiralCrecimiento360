-- ============================================================================
-- 0060_arregla_recursion_rls_colaboradores.sql
--
-- La 0059 no fue suficiente: "colaboradores: veo a quien debo evaluar"
-- sigue leyendo evaluaciones directamente (sin pasar por una función
-- SECURITY DEFINER), y "evaluaciones: admin_th todo" ya leía colaboradores
-- directamente desde antes — otro ciclo de 2 saltos (colaboradores ->
-- evaluaciones -> colaboradores), error 42P17 de nuevo.
--
-- Arreglo: una sola función SECURITY DEFINER que resuelve todo el chequeo
-- (evaluacion_tareas + evaluaciones) de una vez, sin que la policy de
-- colaboradores toque evaluaciones directamente en ningún punto.
-- ============================================================================

create or replace function fn_debo_evaluar_a(p_colaborador_id uuid)
returns boolean
language sql
stable security definer
as $$
  select exists(
    select 1
    from evaluacion_tareas et
    join evaluaciones e on e.id = et.evaluacion_id
    where e.colaborador_evaluado_id = p_colaborador_id and et.evaluador_colaborador_id = fn_mi_colaborador_id()
  );
$$;

drop policy "colaboradores: veo a quien debo evaluar" on colaboradores;
create policy "colaboradores: veo a quien debo evaluar" on colaboradores for select
  using (fn_debo_evaluar_a(id));
