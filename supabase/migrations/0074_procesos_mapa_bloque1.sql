-- ============================================================================
-- 0074_procesos_mapa_bloque1.sql
-- Módulo de Gestión de Procesos, Bloque 1 (Mapa de procesos) — diseñado en
-- conversación con Nexus (ver ModuloProcesos.docx) y validado con el
-- cliente: EXTIENDE procesos_gestion (0026) en vez de crear tablas
-- paralelas, para no duplicar el catálogo de procesos que ya existe.
--
-- Añade:
--   1. A procesos_gestion: tipo (Estratégico/Misional/Apoyo/Evaluación),
--      código visible (PE-1, PM-2…), objetivo y estado.
--   2. proceso_marcos_normativos: los marcos normativos de cada proceso son
--      multi-etiqueta (un proceso puede ser ISO 9001 + SST a la vez), así
--      que van en tabla hija — igual que el resto del esquema usa tablas
--      hijas en vez de arrays.
--   3. interacciones_proceso: declaraciones proveedor→cliente entre
--      procesos ("quién me entrega, qué me entrega"), de las que la
--      pantalla de mapa genera las flechas automáticamente — nadie dibuja
--      el mapa a mano.
--   4. Se añade 'sst' al vocabulario de marco_normativo de
--      matriz_riesgos_controles y checklist_cumplimiento (0026), que hoy
--      no lo tenían aunque el módulo siempre se pensó para SST + ISO 9001
--      + SARLAFT/SAGRILAFT.
--
-- Escrita para poder correrse más de una vez sin error (IF NOT EXISTS / DROP
-- POLICY IF EXISTS en todo lo creado): un intento anterior de aplicar esta
-- migración se interrumpió a mitad de camino, dejando columnas ya creadas en
-- la base remota sin que el historial de migraciones de Supabase las
-- registrara como aplicadas.
-- ============================================================================

alter table procesos_gestion
  add column if not exists tipo text check (tipo in ('estrategico', 'misional', 'apoyo', 'evaluacion')),
  add column if not exists codigo text,
  add column if not exists objetivo text;

alter table procesos_gestion
  add column if not exists estado text not null default 'vigente';

do $$ begin
  alter table procesos_gestion add constraint procesos_gestion_estado_check check (estado in ('vigente', 'en_definicion', 'obsoleto'));
exception when duplicate_object then null;
end $$;

comment on column procesos_gestion.tipo is 'Clasificación del mapa de procesos (Estratégico/Misional/Apoyo/Evaluación). Nullable: los procesos documentados antes de este bloque quedan "sin clasificar" hasta que alguien los ubique en el mapa.';
comment on column procesos_gestion.codigo is 'Código visible del mapa (ej. PE-1, PM-2, PA-3), autogenerado por tipo al crear el proceso desde el wizard.';

create unique index if not exists idx_procesos_gestion_codigo_empresa on procesos_gestion(empresa_id, codigo) where codigo is not null;

create table if not exists proceso_marcos_normativos (
  id uuid primary key default gen_random_uuid(),
  proceso_id uuid not null references procesos_gestion(id) on delete cascade,
  marco_normativo text not null check (marco_normativo in ('iso_9001', 'sst', 'sarlaft_sagrilaft', 'ptee', 'interno')),
  created_at timestamptz not null default now(),
  unique (proceso_id, marco_normativo)
);

comment on table proceso_marcos_normativos is 'Marcos normativos de cada proceso (multi-etiqueta: un proceso puede ser ISO 9001 + SST a la vez). El usuario filtra el mapa por marco para ver solo lo que le compete.';

create table if not exists interacciones_proceso (
  id uuid primary key default gen_random_uuid(),
  proceso_origen_id uuid not null references procesos_gestion(id) on delete cascade,
  proceso_destino_id uuid not null references procesos_gestion(id) on delete cascade,
  tipo text not null default 'entrada' check (tipo in ('entrada', 'apoyo')),
  descripcion text,
  created_at timestamptz not null default now(),
  check (proceso_origen_id <> proceso_destino_id)
);

comment on table interacciones_proceso is 'Declaraciones proveedor→cliente entre procesos ("qué le entrego a quién"). El mapa convierte esto en flechas automáticamente: entrada (teal, flujo de valor) o apoyo (morado punteado).';

create index if not exists idx_interacciones_proceso_origen on interacciones_proceso(proceso_origen_id);
create index if not exists idx_interacciones_proceso_destino on interacciones_proceso(proceso_destino_id);

alter table proceso_marcos_normativos enable row level security;
alter table interacciones_proceso enable row level security;

drop policy if exists "proceso_marcos_normativos: lectura empresa" on proceso_marcos_normativos;
create policy "proceso_marcos_normativos: lectura empresa" on proceso_marcos_normativos for select
  using (exists (select 1 from procesos_gestion pg where pg.id = proceso_marcos_normativos.proceso_id and pg.empresa_id = fn_mi_empresa_id()));
drop policy if exists "proceso_marcos_normativos: admin_th administra" on proceso_marcos_normativos;
create policy "proceso_marcos_normativos: admin_th administra" on proceso_marcos_normativos for all
  using (
    fn_mi_rol() = 'admin_th'
    and exists (select 1 from procesos_gestion pg where pg.id = proceso_marcos_normativos.proceso_id and pg.empresa_id = fn_mi_empresa_id())
  );

drop policy if exists "interacciones_proceso: lectura empresa" on interacciones_proceso;
create policy "interacciones_proceso: lectura empresa" on interacciones_proceso for select
  using (exists (select 1 from procesos_gestion pg where pg.id = interacciones_proceso.proceso_origen_id and pg.empresa_id = fn_mi_empresa_id()));
drop policy if exists "interacciones_proceso: admin_th administra" on interacciones_proceso;
create policy "interacciones_proceso: admin_th administra" on interacciones_proceso for all
  using (
    fn_mi_rol() = 'admin_th'
    and exists (select 1 from procesos_gestion pg where pg.id = interacciones_proceso.proceso_origen_id and pg.empresa_id = fn_mi_empresa_id())
  );

-- ── Añade 'sst' al vocabulario de marco normativo del resto del módulo ────
alter table matriz_riesgos_controles drop constraint if exists matriz_riesgos_controles_marco_normativo_check;
alter table matriz_riesgos_controles add constraint matriz_riesgos_controles_marco_normativo_check
  check (marco_normativo in ('iso_9001', 'sst', 'sarlaft_sagrilaft', 'ptee', 'interno'));

alter table checklist_cumplimiento drop constraint if exists checklist_cumplimiento_marco_normativo_check;
alter table checklist_cumplimiento add constraint checklist_cumplimiento_marco_normativo_check
  check (marco_normativo in ('iso_9001', 'sst', 'sarlaft_sagrilaft', 'ptee'));
