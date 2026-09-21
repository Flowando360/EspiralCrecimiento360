-- ============================================================================
-- 0079_auditorias_internas.sql
-- Fase 2 del módulo de Procesos — Auditorías internas y sus hallazgos.
-- Distinto del informe "Evidencia de auditoría" (que empaqueta evidencia
-- PARA un auditor externo): esto es el proceso de auditar internamente —
-- planear la auditoría, ejecutarla sobre uno o más procesos, y registrar
-- los hallazgos con su ciclo de tratamiento (tablero kanban).
--
-- Tres piezas:
--   1. auditorias_internas: la auditoría (alcance, auditor, fechas, estado).
--   2. auditoria_procesos: qué procesos cubre (una auditoría puede cubrir
--      varios).
--   3. hallazgos_auditoria: no conformidades/observaciones/oportunidades de
--      mejora detectadas, con su propio ciclo de tratamiento — tablero con
--      5 columnas fijas (no configurables como las de etapas_proceso,
--      porque este ciclo es siempre el mismo sin importar el proceso).
--
-- Escrita con IF NOT EXISTS / DROP POLICY IF EXISTS para poder correrse más
-- de una vez sin error, igual que 0074-0076.
-- ============================================================================

create table if not exists auditorias_internas (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  codigo text,
  objetivo text,
  alcance text,
  marco_normativo text check (marco_normativo in ('iso_9001', 'sst', 'sarlaft_sagrilaft', 'ptee', 'interno')),
  auditor_id uuid references colaboradores(id) on delete set null,
  auditor_externo_nombre text,
  fecha_planeada date,
  fecha_ejecutada date,
  estado text not null default 'planeada' check (estado in ('planeada', 'en_curso', 'cerrada')),
  created_at timestamptz not null default now()
);

comment on table auditorias_internas is 'Auditoría interna: quién audita, cuándo, con qué alcance y contra qué marco normativo. Distinta del paquete de Evidencia de auditoría (0028), que es el empaquetado para el auditor externo.';

create unique index if not exists idx_auditorias_internas_codigo_empresa on auditorias_internas(empresa_id, codigo) where codigo is not null;

create table if not exists auditoria_procesos (
  id uuid primary key default gen_random_uuid(),
  auditoria_id uuid not null references auditorias_internas(id) on delete cascade,
  proceso_id uuid not null references procesos_gestion(id) on delete cascade,
  unique (auditoria_id, proceso_id)
);

comment on table auditoria_procesos is 'Procesos cubiertos por una auditoría interna — una auditoría puede auditar varios procesos a la vez (ej. una auditoría integral).';

create table if not exists hallazgos_auditoria (
  id uuid primary key default gen_random_uuid(),
  auditoria_id uuid not null references auditorias_internas(id) on delete cascade,
  proceso_id uuid references procesos_gestion(id) on delete set null,
  codigo text,
  tipo text not null default 'observacion' check (tipo in ('no_conformidad_mayor', 'no_conformidad_menor', 'observacion', 'oportunidad_mejora')),
  descripcion text not null,
  requisito_incumplido text,
  responsable_id uuid references colaboradores(id) on delete set null,
  estado text not null default 'abierto' check (estado in ('abierto', 'analisis_causa', 'plan_accion', 'seguimiento', 'cerrado')),
  fecha_deteccion date not null default current_date,
  fecha_cierre date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table hallazgos_auditoria is 'Hallazgo de una auditoría interna (NC mayor/menor, observación u oportunidad de mejora), con su propio ciclo de tratamiento — tablero de 5 columnas fijas: Abierto → Análisis de causa → Plan de acción → Seguimiento → Cerrado. Un hallazgo puede dar origen a una ACPM (ver 0080).';

create index if not exists idx_hallazgos_auditoria_auditoria on hallazgos_auditoria(auditoria_id);
create index if not exists idx_hallazgos_auditoria_proceso on hallazgos_auditoria(proceso_id);
create index if not exists idx_hallazgos_auditoria_estado on hallazgos_auditoria(estado);

create or replace function fn_tocar_updated_at_hallazgos_auditoria() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_hallazgos_auditoria_updated_at on hallazgos_auditoria;
create trigger trg_hallazgos_auditoria_updated_at
  before update on hallazgos_auditoria
  for each row execute function fn_tocar_updated_at_hallazgos_auditoria();

alter table auditorias_internas enable row level security;
alter table auditoria_procesos enable row level security;
alter table hallazgos_auditoria enable row level security;

drop policy if exists "auditorias_internas: lectura empresa" on auditorias_internas;
create policy "auditorias_internas: lectura empresa" on auditorias_internas for select
  using (empresa_id = fn_mi_empresa_id());
drop policy if exists "auditorias_internas: admin_th administra" on auditorias_internas;
create policy "auditorias_internas: admin_th administra" on auditorias_internas for all
  using (empresa_id = fn_mi_empresa_id() and fn_mi_rol() = 'admin_th');

drop policy if exists "auditoria_procesos: lectura empresa" on auditoria_procesos;
create policy "auditoria_procesos: lectura empresa" on auditoria_procesos for select
  using (exists (select 1 from auditorias_internas ai where ai.id = auditoria_procesos.auditoria_id and ai.empresa_id = fn_mi_empresa_id()));
drop policy if exists "auditoria_procesos: admin_th administra" on auditoria_procesos;
create policy "auditoria_procesos: admin_th administra" on auditoria_procesos for all
  using (
    fn_mi_rol() = 'admin_th'
    and exists (select 1 from auditorias_internas ai where ai.id = auditoria_procesos.auditoria_id and ai.empresa_id = fn_mi_empresa_id())
  );

drop policy if exists "hallazgos_auditoria: lectura empresa" on hallazgos_auditoria;
create policy "hallazgos_auditoria: lectura empresa" on hallazgos_auditoria for select
  using (exists (select 1 from auditorias_internas ai where ai.id = hallazgos_auditoria.auditoria_id and ai.empresa_id = fn_mi_empresa_id()));
drop policy if exists "hallazgos_auditoria: admin_th administra" on hallazgos_auditoria;
create policy "hallazgos_auditoria: admin_th administra" on hallazgos_auditoria for all
  using (
    fn_mi_rol() = 'admin_th'
    and exists (select 1 from auditorias_internas ai where ai.id = hallazgos_auditoria.auditoria_id and ai.empresa_id = fn_mi_empresa_id())
  );
