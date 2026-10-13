-- ============================================================================
-- 0103_proveedor_separado.sql
-- El equipo proveedor de Espiral (Flowando / Nexus / V&E) deja de vivir dentro
-- de perfiles_usuario. Esos perfiles son solo de las empresas clientes.
--   · proveedores: cuentas del proveedor, con su propia autenticación y sin empresa.
--   · bitacora_proveedor: registro de cada acción que el proveedor hace sobre una empresa.
--   · Se retira perfiles_usuario.es_superadmin (los superadmin actuales pasan a proveedores).
-- Las tablas no tienen policies: solo las lee y escribe el servicio (service role),
-- nunca una sesión de empresa.
-- ============================================================================

-- ── 1. Cuentas del proveedor ────────────────────────────────────────────────
create table if not exists proveedores (
  id uuid primary key references auth.users(id) on delete cascade,
  nombre text not null,
  email text not null unique,
  -- propietario: todo, incluido gestionar otros proveedores.
  -- operador: opera empresas, sin gestionar el equipo proveedor.
  rol text not null default 'operador' check (rol in ('propietario', 'operador')),
  activo boolean not null default true,
  creado_en timestamptz not null default now(),
  ultimo_acceso_en timestamptz
);

comment on table proveedores is 'Cuentas del equipo proveedor de Espiral. No pertenecen a ninguna empresa cliente.';

alter table proveedores enable row level security;

-- ── 2. Bitácora de acciones del proveedor ──────────────────────────────────
create table if not exists bitacora_proveedor (
  id bigint generated always as identity primary key,
  proveedor_id uuid references proveedores(id) on delete set null,
  accion text not null,
  empresa_id uuid references empresas(id) on delete set null,
  detalle jsonb not null default '{}'::jsonb,
  creado_en timestamptz not null default now()
);

comment on table bitacora_proveedor is 'Qué hizo cada proveedor sobre qué empresa y cuándo. Registro de solo inserción.';

create index if not exists idx_bitacora_proveedor_empresa on bitacora_proveedor(empresa_id, creado_en desc);

alter table bitacora_proveedor enable row level security;

-- ── 3. Migrar los superusuarios actuales al nuevo lugar ────────────────────
-- Quien hoy tiene es_superadmin = true pasa a ser propietario del proveedor,
-- para que no pierda acceso al cambiar el modelo.
insert into proveedores (id, nombre, email, rol)
select id, nombre_completo, email, 'propietario'
from perfiles_usuario
where es_superadmin
on conflict (id) do nothing;

-- ── 4. Retirar la marca de superusuario de las cuentas de empresa ──────────
alter table perfiles_usuario drop column if exists es_superadmin;
