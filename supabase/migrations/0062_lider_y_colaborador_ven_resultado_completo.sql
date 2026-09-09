-- ============================================================================
-- 0062_lider_y_colaborador_ven_resultado_completo.sql
--
-- Para la nueva pantalla de resultado (resumen tipo "Auto vs Líder" con
-- subtotales por bloque), el líder necesita poder leer TODAS las
-- respuestas de la evaluación de su equipo (incluida la autoevaluación
-- del colaborador, que no es su propia respuesta) — hoy RLS solo deja a
-- cada evaluador leer lo que él mismo respondió. Mismo caso para que el
-- propio colaborador vea su resultado completo.
--
-- No se exponen respuestas individuales de pares/colaboradores a cargo en
-- ninguna pantalla nueva (se protege el anonimato del rater, buena
-- práctica de evaluación 360) — esta policy SÍ las deja leer a nivel de
-- base de datos (es lo más simple y consistente con lo que admin_th ya
-- puede ver hoy), pero la UI solo muestra Auto y Líder. Anonimizar de
-- verdad a nivel de RLS (con umbral mínimo, como Clima Organizacional) es
-- una mejora más grande, pendiente si se necesita más adelante.
-- ============================================================================

create or replace function fn_puedo_ver_respuestas_de(p_evaluacion_tarea_id uuid)
returns boolean
language sql
stable security definer
as $$
  select exists(
    select 1
    from evaluacion_tareas et
    join evaluaciones e on e.id = et.evaluacion_id
    where et.id = p_evaluacion_tarea_id
      and (fn_es_mi_equipo(e.colaborador_evaluado_id) or e.colaborador_evaluado_id = fn_mi_colaborador_id())
  );
$$;

create policy "respuestas: lider y propio colaborador ven el resultado" on respuestas_evaluacion for select
  using (fn_puedo_ver_respuestas_de(evaluacion_tarea_id));
