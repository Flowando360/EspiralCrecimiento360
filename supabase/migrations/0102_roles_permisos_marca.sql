-- ============================================================================
-- 0102_roles_permisos_marca.sql
-- Multiempresa con roles configurables y marca propia por empresa:
--   · Cada empresa tiene su administrador (admin_th), que crea roles y decide,
--     por módulo, si el rol puede leer, escribir o borrar.
--   · Cada empresa tiene su marca: nombre, logo y colores.
--   · La empresa demo pasa a llamarse CONVERGIA.
-- Los roles de sistema (admin_th, lider, colaborador, gerencia, auditor_externo)
-- siguen funcionando igual; un rol personalizado solo se aplica a quien se le asigne.
-- ============================================================================

-- ── 1. Roles personalizados por empresa ─────────────────────────────────────
create table if not exists roles_empresa (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  nombre text not null,
  descripcion text,
  created_at timestamptz not null default now(),
  unique (empresa_id, nombre)
);

comment on table roles_empresa is 'Roles que el administrador de cada empresa define además de los de sistema. Su permiso efectivo está en permisos_rol.';

create table if not exists permisos_rol (
  rol_id uuid not null references roles_empresa(id) on delete cascade,
  modulo text not null check (modulo in ('inicio', 'mi_perfil', 'espiral_360', 'reclutamiento', 'nexa', 'procesos', 'informes', 'dotaciones', 'administracion')),
  leer boolean not null default false,
  escribir boolean not null default false,
  borrar boolean not null default false,
  primary key (rol_id, modulo),
  -- Escribir requiere leer, y borrar requiere escribir: no se puede borrar lo que no se ve ni se puede editar.
  check (not escribir or leer),
  check (not borrar or escribir)
);

comment on table permisos_rol is 'Matriz de permisos de un rol personalizado: por módulo, si puede leer, escribir y borrar.';

alter table perfiles_usuario
  add column if not exists rol_personalizado_id uuid references roles_empresa(id) on delete set null;

comment on column perfiles_usuario.rol_personalizado_id is 'Rol personalizado de la empresa asignado a este usuario. Si es null, aplica el rol de sistema (campo rol).';

alter table roles_empresa enable row level security;
alter table permisos_rol enable row level security;

create policy "roles_empresa: empresa lee" on roles_empresa for select
  using (empresa_id = fn_mi_empresa_id());
create policy "roles_empresa: admin_th administra" on roles_empresa for all
  using (empresa_id = fn_mi_empresa_id() and fn_mi_rol() = 'admin_th')
  with check (empresa_id = fn_mi_empresa_id() and fn_mi_rol() = 'admin_th');

create policy "permisos_rol: empresa lee" on permisos_rol for select
  using (exists (select 1 from roles_empresa r where r.id = permisos_rol.rol_id and r.empresa_id = fn_mi_empresa_id()));
create policy "permisos_rol: admin_th administra" on permisos_rol for all
  using (exists (select 1 from roles_empresa r where r.id = permisos_rol.rol_id and r.empresa_id = fn_mi_empresa_id()) and fn_mi_rol() = 'admin_th')
  with check (exists (select 1 from roles_empresa r where r.id = permisos_rol.rol_id and r.empresa_id = fn_mi_empresa_id()) and fn_mi_rol() = 'admin_th');

-- ── 2. Marca por empresa ────────────────────────────────────────────────────
alter table empresas
  add column if not exists color_secundario text not null default '#1E3A8A',
  add column if not exists color_acento text not null default '#16A34A';

comment on column empresas.color_marca is 'Color principal de la marca (botones y acentos). Lo define el administrador de la empresa.';
comment on column empresas.color_secundario is 'Color secundario de la marca (encabezados y barra de navegación).';
comment on column empresas.color_acento is 'Color de acento de la marca (indicadores y estados destacados).';

-- ── 3. Empresa demo → CONVERGIA ─────────────────────────────────────────────
-- Los datos actuales de la copia demo quedan asociados a CONVERGIA.
update empresas
set nombre = 'CONVERGIA',
    slug = 'convergia',
    color_marca = '#7AC70C',
    color_secundario = '#0E1F5B',
    color_acento = '#6B2BD9',
    logo_url = '/logos/convergia.webp'
where id = '00000000-0000-0000-0000-000000000001';
