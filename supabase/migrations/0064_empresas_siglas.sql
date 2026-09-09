-- ============================================================================
-- 0064_empresas_siglas.sql
--
-- Siglas cortas de la empresa (ej. "FNV" para Flow, Nexus y Visión) --
-- las pide Guía del Flow (proyecto hermano, mismo Supabase) para nombrar los
-- PDF de la descarga masiva desde su /panel: "GF_nombre_SiglasEmpresa.pdf".
-- Editable desde Administración > Configuración igual que nit/dirección/etc.
-- ============================================================================

alter table empresas add column if not exists siglas text;

comment on column empresas.siglas is 'Siglas cortas de la empresa (ej. "FNV"). Se usan en Guía del Flow para nombrar los PDF de la descarga masiva -- si está vacío, esa pantalla usa "PS".';

update empresas set siglas = 'FNV' where nombre = 'Flow, Nexus y Visión' and siglas is null;
