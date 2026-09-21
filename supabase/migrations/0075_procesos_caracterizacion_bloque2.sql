-- ============================================================================
-- 0075_procesos_caracterizacion_bloque2.sql
-- Módulo de Gestión de Procesos, Bloque 2 (Caracterización) — la ficha SIPOC
-- de cada proceso (entradas/actividades/salidas), en el mismo formato que ya
-- usa el cliente en su plantilla real (ver C-DO-01 Gestión de desarrollo
-- organizacional.pptx): entradas, actividades y salidas con, cuando aplica,
-- el proceso del que vienen o al que van.
--
-- Vive aparte del wizard de creación del Bloque 1 a propósito — el cliente
-- pidió explícitamente no repetir alcance/entradas/salidas en dos pantallas
-- distintas.
-- ============================================================================

create table if not exists elementos_proceso (
  id uuid primary key default gen_random_uuid(),
  proceso_id uuid not null references procesos_gestion(id) on delete cascade,
  tipo text not null check (tipo in ('entrada', 'actividad', 'salida')),
  descripcion text not null,
  proceso_relacionado_id uuid references procesos_gestion(id) on delete set null,
  orden int not null default 0,
  created_at timestamptz not null default now()
);

comment on table elementos_proceso is 'Ficha de caracterización SIPOC de un proceso: entradas, actividades y salidas, con el proceso relacionado cuando aplica ("viene del proceso" / "va para el proceso"). Formato calcado de la plantilla real del cliente (C-DO-01).';

create index if not exists idx_elementos_proceso_proceso on elementos_proceso(proceso_id);
create index if not exists idx_elementos_proceso_relacionado on elementos_proceso(proceso_relacionado_id);

alter table elementos_proceso enable row level security;

drop policy if exists "elementos_proceso: lectura empresa" on elementos_proceso;
create policy "elementos_proceso: lectura empresa" on elementos_proceso for select
  using (exists (select 1 from procesos_gestion pg where pg.id = elementos_proceso.proceso_id and pg.empresa_id = fn_mi_empresa_id()));
drop policy if exists "elementos_proceso: admin_th administra" on elementos_proceso;
create policy "elementos_proceso: admin_th administra" on elementos_proceso for all
  using (
    fn_mi_rol() = 'admin_th'
    and exists (select 1 from procesos_gestion pg where pg.id = elementos_proceso.proceso_id and pg.empresa_id = fn_mi_empresa_id())
  );
