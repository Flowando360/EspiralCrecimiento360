-- ============================================================================
-- 0083_indicadores_proceso.sql
-- Matriz de indicadores por proceso — pieza que faltaba del plan original
-- (Nexus la mencionó junto a Matriz de riesgos y Matriz ACM) y que además
-- es uno de los 5 criterios del Índice de Madurez.
--
-- Dos piezas:
--   1. indicadores_proceso: la ficha del indicador (fórmula, meta, sentido).
--   2. mediciones_indicador: el histórico de valores medidos en el tiempo.
--
-- Escrita con IF NOT EXISTS / DROP POLICY IF EXISTS para poder correrse más
-- de una vez sin error, igual que las migraciones anteriores de este módulo.
-- ============================================================================

create table if not exists indicadores_proceso (
  id uuid primary key default gen_random_uuid(),
  proceso_id uuid not null references procesos_gestion(id) on delete cascade,
  nombre text not null,
  formula text,
  meta numeric,
  unidad text not null default 'numero' check (unidad in ('numero', 'porcentaje', 'dias', 'moneda')),
  sentido text not null default 'mayor_mejor' check (sentido in ('mayor_mejor', 'menor_mejor')),
  frecuencia_medicion text check (frecuencia_medicion in ('mensual', 'trimestral', 'semestral', 'anual')),
  responsable_id uuid references colaboradores(id) on delete set null,
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

comment on table indicadores_proceso is 'Matriz de indicadores por proceso: fórmula, meta y sentido de mejora (mayor es mejor / menor es mejor). Un indicador con medición en los últimos 6 meses cuenta para el Índice de Madurez del proceso.';

create table if not exists mediciones_indicador (
  id uuid primary key default gen_random_uuid(),
  indicador_id uuid not null references indicadores_proceso(id) on delete cascade,
  periodo text not null,
  valor numeric not null,
  fecha_medicion date not null default current_date,
  observaciones text,
  created_at timestamptz not null default now()
);

comment on table mediciones_indicador is 'Histórico de valores medidos de un indicador (una fila por período: "2026-Q3", "Septiembre 2026", etc. — texto libre para no forzar una sola granularidad).';

create index if not exists idx_indicadores_proceso_proceso on indicadores_proceso(proceso_id);
create index if not exists idx_mediciones_indicador_indicador on mediciones_indicador(indicador_id);
create index if not exists idx_mediciones_indicador_fecha on mediciones_indicador(fecha_medicion);

alter table indicadores_proceso enable row level security;
alter table mediciones_indicador enable row level security;

drop policy if exists "indicadores_proceso: lectura empresa" on indicadores_proceso;
create policy "indicadores_proceso: lectura empresa" on indicadores_proceso for select
  using (exists (select 1 from procesos_gestion pg where pg.id = indicadores_proceso.proceso_id and pg.empresa_id = fn_mi_empresa_id()));
drop policy if exists "indicadores_proceso: admin_th administra" on indicadores_proceso;
create policy "indicadores_proceso: admin_th administra" on indicadores_proceso for all
  using (
    fn_mi_rol() = 'admin_th'
    and exists (select 1 from procesos_gestion pg where pg.id = indicadores_proceso.proceso_id and pg.empresa_id = fn_mi_empresa_id())
  );

drop policy if exists "mediciones_indicador: lectura empresa" on mediciones_indicador;
create policy "mediciones_indicador: lectura empresa" on mediciones_indicador for select
  using (exists (
    select 1 from indicadores_proceso ip join procesos_gestion pg on pg.id = ip.proceso_id
    where ip.id = mediciones_indicador.indicador_id and pg.empresa_id = fn_mi_empresa_id()
  ));
drop policy if exists "mediciones_indicador: admin_th administra" on mediciones_indicador;
create policy "mediciones_indicador: admin_th administra" on mediciones_indicador for all
  using (
    fn_mi_rol() = 'admin_th'
    and exists (
      select 1 from indicadores_proceso ip join procesos_gestion pg on pg.id = ip.proceso_id
      where ip.id = mediciones_indicador.indicador_id and pg.empresa_id = fn_mi_empresa_id()
    )
  );
