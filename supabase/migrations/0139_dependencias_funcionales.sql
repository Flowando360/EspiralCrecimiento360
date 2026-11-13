-- Informe de Luisa 4.16: organigrama matricial.
-- Una persona sigue teniendo UN líder directo (colaboradores.lider_id, de quien depende su valoración 40/30/30 y la
-- arquitectura de acompañantes), pero puede tener además uno o varios líderes funcionales o de proyecto. Esta tabla
-- los registra: aparecen en el organigrama con línea punteada y en la ficha. No cambian los permisos ni los pesos de
-- la valoración (para que un líder funcional valore, se usa la invitación de clientes internos). Idempotente.

create table if not exists dependencias_funcionales (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  colaborador_id uuid not null references colaboradores(id) on delete cascade,
  lider_funcional_id uuid not null references colaboradores(id) on delete cascade,
  tipo text not null default 'funcional' check (tipo in ('funcional', 'proyecto', 'otro')),
  detalle text, -- por ejemplo el nombre del proyecto o el área funcional
  created_at timestamptz not null default now(),
  unique (colaborador_id, lider_funcional_id),
  constraint dependencia_distinta check (colaborador_id <> lider_funcional_id)
);

create index if not exists idx_dep_funcionales_lider on dependencias_funcionales(lider_funcional_id);
create index if not exists idx_dep_funcionales_empresa on dependencias_funcionales(empresa_id);

alter table dependencias_funcionales enable row level security;

drop policy if exists "dep_funcionales: lectura empresa" on dependencias_funcionales;
create policy "dep_funcionales: lectura empresa" on dependencias_funcionales for select
  using (empresa_id = fn_mi_empresa_id());

drop policy if exists "dep_funcionales: admin_th administra" on dependencias_funcionales;
create policy "dep_funcionales: admin_th administra" on dependencias_funcionales for all
  using (empresa_id = fn_mi_empresa_id() and fn_mi_rol() = 'admin_th')
  with check (empresa_id = fn_mi_empresa_id() and fn_mi_rol() = 'admin_th');
