-- ============================================================================
-- 0031_procesos_gestion_tablero.sql
-- Tablero kanban parametrizable por proceso (inspirado en el pipeline visual
-- de un ATS de referencia: columnas = etapas del proceso, tarjetas = casos
-- reales moviéndose por ellas). Convierte procesos_gestion de "documento
-- estático + PDF de flujograma" a "proceso vivo y visual":
--   1. etapas_proceso: columnas del tablero, configurables por admin_th por
--      cada proceso (nombre, color, orden) — no son un enum fijo porque cada
--      proceso de la empresa cliente puede tener su propio flujo.
--   2. casos_proceso: las tarjetas — una instancia real del proceso (una
--      solicitud, un trámite, una compra) en una etapa dada.
-- Mismo alcance de permisos que el resto de procesos_gestion: admin_th
-- administra, lider y gerencia solo consultan.
-- ============================================================================

create table etapas_proceso (
  id uuid primary key default gen_random_uuid(),
  proceso_id uuid not null references procesos_gestion(id) on delete cascade,
  nombre text not null,
  color text not null default 'flow' check (color in ('flow', 'saber', 'hacer', 'deber', 'alto', 'medio', 'bajo', 'marmol')),
  orden int not null default 0,
  created_at timestamptz not null default now()
);

comment on table etapas_proceso is 'Columnas del tablero kanban de un proceso, configurables por admin_th (nombre, color, orden) — no es un enum fijo porque cada proceso documentado en procesos_gestion puede tener su propio flujo.';

create table casos_proceso (
  id uuid primary key default gen_random_uuid(),
  proceso_id uuid not null references procesos_gestion(id) on delete cascade,
  etapa_id uuid not null references etapas_proceso(id) on delete cascade,
  titulo text not null,
  descripcion text,
  responsable_id uuid references colaboradores(id) on delete set null,
  prioridad text not null default 'media' check (prioridad in ('baja', 'media', 'alta')),
  fecha_limite date,
  orden int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table casos_proceso is 'Tarjetas del tablero kanban: una instancia real de un proceso (solicitud, trámite, caso) en una etapa dada. Mover una tarjeta de columna es la acción de negocio, no solo un reporte.';

create index idx_etapas_proceso_proceso on etapas_proceso(proceso_id);
create index idx_casos_proceso_proceso on casos_proceso(proceso_id);
create index idx_casos_proceso_etapa on casos_proceso(etapa_id);
create index idx_casos_proceso_responsable on casos_proceso(responsable_id);

alter table etapas_proceso enable row level security;
alter table casos_proceso enable row level security;

create policy "etapas_proceso: lectura empresa" on etapas_proceso for select
  using (exists (
    select 1 from procesos_gestion pg where pg.id = etapas_proceso.proceso_id and pg.empresa_id = fn_mi_empresa_id()
  ));
create policy "etapas_proceso: admin_th administra" on etapas_proceso for all
  using (
    fn_mi_rol() = 'admin_th'
    and exists (select 1 from procesos_gestion pg where pg.id = etapas_proceso.proceso_id and pg.empresa_id = fn_mi_empresa_id())
  );

create policy "casos_proceso: lectura empresa" on casos_proceso for select
  using (exists (
    select 1 from procesos_gestion pg where pg.id = casos_proceso.proceso_id and pg.empresa_id = fn_mi_empresa_id()
  ));
create policy "casos_proceso: admin_th administra" on casos_proceso for all
  using (
    fn_mi_rol() = 'admin_th'
    and exists (select 1 from procesos_gestion pg where pg.id = casos_proceso.proceso_id and pg.empresa_id = fn_mi_empresa_id())
  );

create or replace function fn_tocar_updated_at_casos_proceso() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_casos_proceso_updated_at
  before update on casos_proceso
  for each row execute function fn_tocar_updated_at_casos_proceso();
