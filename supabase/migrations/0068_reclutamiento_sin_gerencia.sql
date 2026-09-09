-- ============================================================================
-- 0068_reclutamiento_sin_gerencia.sql
-- Corrige un descuido de 0066_reclutamiento.sql: la policy de lectura de
-- vacantes incluía a gerencia, pero candidatos/postulaciones/entrevistas/
-- referencias_candidato nunca la incluyeron (a propósito, por ser datos
-- individuales de personas que ni siquiera son colaboradores todavía —
-- mismo criterio que hoja_vida_formacion/entrevistas_salida, que tampoco
-- incluyen gerencia). Con la policy vieja, gerencia podía abrir el detalle
-- de una vacante y ver "0 candidatos" — no porque no los haya, sino porque
-- RLS los filtraba en silencio. Eso es peor que no mostrar la pantalla:
-- parece un reporte real y no lo es. Se quita gerencia también de vacantes
-- para que el alcance sea consistente en todo el módulo.
-- ============================================================================

drop policy "vacantes: lectura empresa (admin_th, lider, gerencia)" on vacantes;

create policy "vacantes: lectura empresa (admin_th, lider)" on vacantes for select
  using (empresa_id = fn_mi_empresa_id() and fn_mi_rol() in ('admin_th', 'lider'));
