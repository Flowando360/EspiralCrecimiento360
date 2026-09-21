-- ============================================================================
-- 0080_acpm.sql
-- Fase 2 del módulo de Procesos — ACPM (Acciones Correctivas, Preventivas y
-- de Mejora), diseñada en la conversación con Nexus con ciclo completo de
-- eficacia (no solo "tareas completadas"): Registro → Análisis de causa →
-- Plan de acción → Seguimiento → Validación de eficacia → Cerrada efectiva
-- (o Reabierta si la causa no se eliminó). Tablero de 7 columnas fijas.
--
-- Puede originarse en un hallazgo de auditoría (0079) o un riesgo de la
-- matriz (0026/0078), o registrarse manualmente (indicador fuera de meta,
-- PQRS, mejora propia) — origen_detalle cubre esos casos en texto libre
-- porque los módulos de indicadores y PQRS todavía no existen.
--
-- Dos piezas:
--   1. acpm: la acción en sí, con su estado en el ciclo.
--   2. tareas_acpm: el plan de acción (tareas, responsables, fechas).
--
-- Escrita con IF NOT EXISTS / DROP POLICY IF EXISTS para poder correrse más
-- de una vez sin error, igual que 0074-0076.
-- ============================================================================

create table if not exists acpm (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  proceso_id uuid references procesos_gestion(id) on delete set null,
  codigo text,
  origen_tipo text not null default 'mejora_propia' check (origen_tipo in ('hallazgo_auditoria', 'riesgo', 'indicador', 'pqrs', 'mejora_propia')),
  origen_hallazgo_id uuid references hallazgos_auditoria(id) on delete set null,
  origen_riesgo_id uuid references matriz_riesgos_controles(id) on delete set null,
  origen_detalle text,
  tipo_accion text not null default 'correctiva' check (tipo_accion in ('correctiva', 'preventiva', 'mejora')),
  descripcion text not null,
  metodologia_causa text check (metodologia_causa in ('cinco_porques', 'ishikawa', 'libre')),
  analisis_causa text,
  responsable_id uuid references colaboradores(id) on delete set null,
  estado text not null default 'registrada' check (estado in ('registrada', 'analisis_causa', 'plan_accion', 'seguimiento', 'validacion_eficacia', 'cerrada_efectiva', 'reabierta')),
  fecha_registro date not null default current_date,
  fecha_compromiso date,
  eficaz boolean,
  evidencia_eficacia_url text,
  fecha_cierre date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table acpm is 'Acción correctiva, preventiva o de mejora, con ciclo completo de eficacia (Registro → Análisis de causa → Plan de acción → Seguimiento → Validación de eficacia → Cerrada efectiva / Reabierta). Puede originarse en un hallazgo de auditoría, un riesgo, o registrarse manualmente.';

create unique index if not exists idx_acpm_codigo_empresa on acpm(empresa_id, codigo) where codigo is not null;
create index if not exists idx_acpm_proceso on acpm(proceso_id);
create index if not exists idx_acpm_estado on acpm(estado);
create index if not exists idx_acpm_origen_hallazgo on acpm(origen_hallazgo_id);
create index if not exists idx_acpm_origen_riesgo on acpm(origen_riesgo_id);

create table if not exists tareas_acpm (
  id uuid primary key default gen_random_uuid(),
  acpm_id uuid not null references acpm(id) on delete cascade,
  descripcion text not null,
  responsable_id uuid references colaboradores(id) on delete set null,
  fecha_limite date,
  completada boolean not null default false,
  orden int not null default 0,
  created_at timestamptz not null default now()
);

comment on table tareas_acpm is 'Plan de acción de una ACPM: tareas concretas con responsable y fecha límite.';

create index if not exists idx_tareas_acpm_acpm on tareas_acpm(acpm_id);

create or replace function fn_tocar_updated_at_acpm() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_acpm_updated_at on acpm;
create trigger trg_acpm_updated_at
  before update on acpm
  for each row execute function fn_tocar_updated_at_acpm();

alter table acpm enable row level security;
alter table tareas_acpm enable row level security;

drop policy if exists "acpm: lectura empresa" on acpm;
create policy "acpm: lectura empresa" on acpm for select
  using (empresa_id = fn_mi_empresa_id());
drop policy if exists "acpm: admin_th administra" on acpm;
create policy "acpm: admin_th administra" on acpm for all
  using (empresa_id = fn_mi_empresa_id() and fn_mi_rol() = 'admin_th');

drop policy if exists "tareas_acpm: lectura empresa" on tareas_acpm;
create policy "tareas_acpm: lectura empresa" on tareas_acpm for select
  using (exists (select 1 from acpm a where a.id = tareas_acpm.acpm_id and a.empresa_id = fn_mi_empresa_id()));
drop policy if exists "tareas_acpm: admin_th administra" on tareas_acpm;
create policy "tareas_acpm: admin_th administra" on tareas_acpm for all
  using (
    fn_mi_rol() = 'admin_th'
    and exists (select 1 from acpm a where a.id = tareas_acpm.acpm_id and a.empresa_id = fn_mi_empresa_id())
  );
