-- ============================================================================
-- 0087_enlaces_evidencia_auditoria.sql
-- Enlace temporal de solo lectura al paquete de Evidencia de auditoría, para
-- compartir con un auditor externo puntual sin tener que darlo de alta con
-- el rol auditor_externo (ese rol se mantiene para auditores recurrentes —
-- este enlace es un complemento, no un reemplazo; diseño confirmado con
-- Diana el 2026-09-21).
--
-- El token se resuelve con el cliente admin (sin sesión) desde una ruta
-- pública fuera del dashboard — por eso no hay política de "lectura
-- pública": la validación de expiración/estado la hace la app, no RLS.
--
-- Escrita con IF NOT EXISTS / DROP POLICY IF EXISTS para poder correrse más
-- de una vez sin error, igual que las migraciones anteriores del módulo.
-- ============================================================================

create table if not exists enlaces_evidencia_auditoria (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  token uuid not null default gen_random_uuid(),
  tipo_paquete text not null default 'todos' check (tipo_paquete in ('todos', 'sst', 'iso_9001', 'sarlaft_sagrilaft', 'ptee')),
  creado_por uuid references colaboradores(id) on delete set null,
  nota text,
  expira_en timestamptz not null,
  activo boolean not null default true,
  veces_consultado int not null default 0,
  ultima_consulta_en timestamptz,
  created_at timestamptz not null default now()
);

comment on table enlaces_evidencia_auditoria is 'Enlace temporal de solo lectura al paquete de Evidencia de auditoría, para compartir con un auditor externo sin cuenta en la plataforma. Complementa (no reemplaza) el rol auditor_externo.';
comment on column enlaces_evidencia_auditoria.token is 'Identificador impredecible que va en la URL pública (/auditoria/[token]) — no es la primary key para poder rotarlo sin cambiar el id.';
comment on column enlaces_evidencia_auditoria.activo is 'Revocación manual, independiente de la expiración por fecha.';

create unique index if not exists idx_enlaces_evidencia_auditoria_token on enlaces_evidencia_auditoria(token);
create index if not exists idx_enlaces_evidencia_auditoria_empresa on enlaces_evidencia_auditoria(empresa_id);

alter table enlaces_evidencia_auditoria enable row level security;

drop policy if exists "enlaces_evidencia_auditoria: admin_th y gerencia administran" on enlaces_evidencia_auditoria;
create policy "enlaces_evidencia_auditoria: admin_th y gerencia administran" on enlaces_evidencia_auditoria for all
  using (empresa_id = fn_mi_empresa_id() and fn_mi_rol() in ('admin_th', 'gerencia'));
