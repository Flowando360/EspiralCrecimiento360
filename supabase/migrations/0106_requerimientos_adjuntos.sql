-- ============================================================================
-- 0106_requerimientos_adjuntos.sql
-- Archivos que el usuario adjunta a su requerimiento (imágenes, PDF, Word,
-- texto, hojas de cálculo). Se guardan en un bucket privado; solo el servicio
-- los lee y genera enlaces temporales para el equipo proveedor.
-- Aplicar después de 0105_requerimientos_tipo.sql.
-- ============================================================================

alter table requerimientos
  add column if not exists adjuntos jsonb not null default '[]'::jsonb;

comment on column requerimientos.adjuntos is 'Lista de archivos adjuntos: [{ nombre, ruta, tipo, tamano }]. La ruta apunta al bucket privado "requerimientos".';

insert into storage.buckets (id, name, public)
values ('requerimientos', 'requerimientos', false)
on conflict (id) do nothing;
