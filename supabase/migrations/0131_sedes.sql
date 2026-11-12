-- Modelo integral (§9), Fase 3 parte 6: sedes en la estructura de la empresa.
-- Cada empresa define sus sedes (planta, oficina, bodega…) y cada persona puede tener una sede. Es opcional: sin sedes
-- todo sigue igual. Permite agrupar informes por sede. Idempotente.

create table if not exists sedes (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  nombre text not null check (length(trim(nombre)) > 0),
  ciudad text,
  direccion text,
  activa boolean not null default true,
  created_at timestamptz not null default now()
);

create unique index if not exists idx_sedes_empresa_nombre on sedes(empresa_id, lower(trim(nombre)));

comment on table sedes is 'Sedes de la empresa (planta, oficina, bodega…). Cada colaborador puede pertenecer a una (colaboradores.sede_id).';

alter table colaboradores add column if not exists sede_id uuid references sedes(id) on delete set null;
create index if not exists idx_colaboradores_sede on colaboradores(sede_id);

alter table sedes enable row level security;

drop policy if exists "sedes: lectura empresa" on sedes;
create policy "sedes: lectura empresa" on sedes for select
  using (empresa_id = fn_mi_empresa_id());

drop policy if exists "sedes: admin_th administra" on sedes;
create policy "sedes: admin_th administra" on sedes for all
  using (empresa_id = fn_mi_empresa_id() and fn_mi_rol() = 'admin_th')
  with check (empresa_id = fn_mi_empresa_id() and fn_mi_rol() = 'admin_th');
