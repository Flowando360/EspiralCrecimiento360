-- ============================================================================
-- 0055_lider_gestiona_guia_flow.sql
--
-- El líder debe poder hacer con sus propios colaboradores lo mismo que
-- admin_th: generar invitaciones, cargar puntajes de los 18 aspectos
-- seguros, crear una aplicación manual y generar los informes por IA.
-- No cambia nada de la frontera de privacidad (sigue sin poder tocar los
-- 12 aspectos sensibles, ni el PDF) — solo iguala quién puede operar el
-- flujo dentro de lo que ya era seguro para el líder.
-- ============================================================================

-- ── ser_puntajes: líder también puede escribir, no solo leer ──────────────
drop policy "ser_puntajes: lider ve el de su equipo (no sensibles)" on ser_puntajes;
create policy "ser_puntajes: lider gestiona el de su equipo (no sensibles)" on ser_puntajes for all
  using (
    exists(
      select 1
      from guia_del_flow g
      join ser_aspectos a on a.id = aspecto_id
      where g.id = guia_del_flow_id and fn_es_mi_equipo(g.colaborador_id) and a.sensible = false
    )
  );

-- ── guia_del_flow: líder también puede crear una aplicación ───────────────
drop policy "ser: lider ve la de su equipo" on guia_del_flow;
create policy "ser: lider gestiona la de su equipo" on guia_del_flow for all
  using (fn_es_mi_equipo(colaborador_id));

-- ── guia_del_flow_invitaciones: líder también puede invitar a su equipo ───
create policy "invitaciones: lider lee las de su equipo" on guia_del_flow_invitaciones for select
  using (fn_mi_rol() = 'lider' and fn_es_mi_equipo(colaborador_id));

create policy "invitaciones: lider crea para su equipo" on guia_del_flow_invitaciones for insert
  with check (fn_mi_rol() = 'lider' and fn_es_mi_equipo(colaborador_id));
