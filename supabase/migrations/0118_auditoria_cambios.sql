-- Informe de pruebas (Luisa), 7.3/7.4: registro de auditoría de cambios de configuración
-- (permisos, alta/baja/cambio de usuarios, datos de la empresa, ponderaciones…): quién, cuándo, qué módulo y qué cambió.
-- Es de solo agregar: ninguna política permite modificar ni borrar un registro.

create table if not exists auditoria_cambios (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  usuario_id uuid references perfiles_usuario(id) on delete set null,
  -- Copia del nombre y rol al momento del cambio (si la cuenta se elimina, el registro sigue siendo legible)
  usuario_nombre text,
  usuario_rol text,
  modulo text not null,
  accion text not null,
  objeto_tipo text,
  objeto_id text,
  resumen text not null,
  detalle jsonb,
  creado_en timestamptz not null default now()
);

comment on table auditoria_cambios is 'Bitácora inmutable de cambios de configuración de la empresa (usuarios, roles y permisos, datos de la empresa, ponderaciones, parámetros legales, competencias, cargos). Solo se inserta; no se edita ni se borra.';

create index if not exists idx_auditoria_cambios_empresa_fecha on auditoria_cambios(empresa_id, creado_en desc);

alter table auditoria_cambios enable row level security;

-- Lectura: solo el administrador de la empresa.
drop policy if exists "auditoria_cambios: admin_th lee" on auditoria_cambios;
create policy "auditoria_cambios: admin_th lee" on auditoria_cambios for select
  using (empresa_id = fn_mi_empresa_id() and fn_mi_rol() = 'admin_th');

-- Inserción: cada quien solo puede registrar cambios a su nombre y en su empresa (no se puede falsificar el autor).
drop policy if exists "auditoria_cambios: registra el propio usuario" on auditoria_cambios;
create policy "auditoria_cambios: registra el propio usuario" on auditoria_cambios for insert
  with check (empresa_id = fn_mi_empresa_id() and usuario_id = auth.uid());

-- Sin políticas de update ni delete: el registro es inmutable para los usuarios de la aplicación.
