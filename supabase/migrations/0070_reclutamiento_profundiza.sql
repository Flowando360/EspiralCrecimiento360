-- ============================================================================
-- 0070_reclutamiento_profundiza.sql
-- Profundiza Reclutamiento y Selección a pedido del usuario:
--   1. Panel de Vacantes: líder solicitante + presupuesto salarial, y el
--      estado "Cerrada" se reemplaza por dos estados explícitos ("Cancelada"
--      / "Cubierta") — más claro para quien mira el panel de un vistazo.
--   2. Tablero Kanban: la etapa nueva 'preseleccionado' (agregada en 0069) ya
--      queda disponible para usarse aquí.
--   3. Calificación de candidatos: pasa de un número libre 0-10 a un
--      sistema de 1 a 5 estrellas (entero) — se reescalan los datos que ya
--      existan, no se pierden.
-- ============================================================================

alter table vacantes add column if not exists lider_solicitante_id uuid references colaboradores(id) on delete set null;
alter table vacantes add column if not exists presupuesto_salarial numeric;

comment on column vacantes.lider_solicitante_id is 'Líder del área que solicita cubrir esta vacante (puede ser distinto de quien la crea en el sistema).';
comment on column vacantes.presupuesto_salarial is 'Presupuesto salarial mensual aprobado para el cargo, en COP — dato de referencia para negociar la oferta, el sistema no lo calcula ni lo valida contra nada.';

-- "Cerrada" (genérico) se reemplaza por "Cubierta" (se contrató a alguien) —
-- es la lectura correcta para casi todo el histórico real; una vacante que
-- se cerró por decisión de negocio sin contratar a nadie es la excepción, y
-- admin_th puede recategorizarla a mano a "Cancelada" si corresponde.
update vacantes set estado = 'cubierta' where estado = 'cerrada';

alter table postulaciones drop constraint if exists postulaciones_calificacion_check;
update postulaciones set calificacion = least(5, greatest(1, round(calificacion / 2))) where calificacion is not null;
alter table postulaciones alter column calificacion type int using calificacion::int;
alter table postulaciones add constraint postulaciones_calificacion_check check (calificacion is null or (calificacion >= 1 and calificacion <= 5));

comment on column postulaciones.calificacion is 'Calificación interna del candidato para esta vacante, 1 a 5 estrellas.';
