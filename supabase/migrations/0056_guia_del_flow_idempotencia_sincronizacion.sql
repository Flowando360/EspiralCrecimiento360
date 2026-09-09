-- ============================================================================
-- 0056_guia_del_flow_idempotencia_sincronizacion.sql
--
-- El botón "Crear Guía del Flow" ya no crea duplicados (0.tsx, migración
-- de la sesión de hoy), pero la sincronización automática en sí no tenía
-- ninguna protección: si sincronizar.ts se dispara dos veces para el
-- mismo cuestionario de guiadelflow (doble clic en "Generar mi Guía",
-- reintento de red), creaba una segunda fila real en guia_del_flow con
-- los mismos datos. Esta columna + índice único cierran esa causa.
-- ============================================================================

alter table guia_del_flow add column cuestionario_flow_id uuid;

comment on column guia_del_flow.cuestionario_flow_id is 'id de flow_cuestionarios (guiadelflow, mismo proyecto de Supabase) que originó esta aplicación, cuando se cargó por la sincronización automática. Sin FK a propósito: esa tabla es del dominio de guiadelflow. Null en las aplicaciones cargadas a mano. El índice único de abajo es lo que de verdad impide duplicar: si sincronizar.ts se dispara dos veces para el mismo cuestionario, la segunda inserción falla y el código la trata como "ya estaba sincronizado" en vez de crear una fila nueva.';

create unique index uq_guia_del_flow_cuestionario_flow_id on guia_del_flow(cuestionario_flow_id) where cuestionario_flow_id is not null;
