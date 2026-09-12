-- ============================================================================
-- 0069_reclutamiento_dotacion_enums.sql
-- Nuevos valores de enum para profundizar Reclutamiento (tablero Kanban real
-- con columna "Filtrados/Preseleccionados", y estados "Cancelada"/"Cubierta"
-- para la vacante en vez de un solo "Cerrada" genérico). Van en su propio
-- archivo porque Postgres no permite usar un valor de enum nuevo en la misma
-- transacción en la que se agrega — mismo patrón que
-- 0065_tipo_alerta_dotacion_enum.sql.
-- ============================================================================

alter type etapa_postulacion add value if not exists 'preseleccionado' after 'recibido';
alter type estado_vacante add value if not exists 'cancelada';
alter type estado_vacante add value if not exists 'cubierta';
