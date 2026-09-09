-- ============================================================================
-- 0048_clima_comentarios_solo_admin_th.sql
-- Corrige una discrepancia entre el diseño de privacidad documentado en
-- 0047 y las policies tal como quedaron escritas: el comentario dice
-- "los comentarios de texto libre solo los ve admin_th, nunca líder ni
-- gerencia", pero la policy de select en clima_respuestas le daba lectura
-- de la tabla completa (incluido el comentario) tanto a gerencia como a
-- cada líder sobre su equipo.
--
-- Los resúmenes agregados que sí necesitan gerencia y líder (eNPS, promedios
-- por dimensión) ya vienen de v_clima_ronda_resumen / v_clima_equipo_resumen,
-- que corren con privilegios del dueño de la vista y no dependen de estas
-- policies (ver comentario en 0047) — así que quitarles acceso directo a la
-- tabla no afecta esas pantallas, solo cierra el acceso a la fila cruda
-- (con comentario) por fuera de la UI prevista.
-- ============================================================================

drop policy "clima_respuestas: admin_th y gerencia ven las de su empresa" on clima_respuestas;
drop policy "clima_respuestas: lider ve las de su propio equipo" on clima_respuestas;

create policy "clima_respuestas: solo admin_th ve las filas crudas" on clima_respuestas for select
  using (
    fn_mi_rol() = 'admin_th'
    and exists (select 1 from clima_rondas r where r.id = ronda_id and r.empresa_id = fn_mi_empresa_id())
  );
