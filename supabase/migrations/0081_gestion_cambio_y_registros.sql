-- ============================================================================
-- 0081_gestion_cambio_y_registros.sql
-- Fase 2 del módulo de Procesos — dos piezas más del mapa mental del
-- cliente que no estaban cubiertas:
--   1. Gestión de cambio (ISO 9001 numeral 6.3): un flujo de solicitud →
--      evaluación de impacto → aprobación/rechazo → implementación, para
--      cambios a un proceso, documento, sistema o estructura — distinto de
--      Control documental (que versiona UN documento), esto evalúa el
--      impacto de un cambio antes de aprobarlo.
--   2. "Registro" como tipo de documento aparte de "Formato": el cliente
--      distingue la plantilla en blanco (Formato) del registro diligenciado
--      (Registro) — hoy documentos_proceso solo tenía procedimiento,
--      política, formato e instructivo.
--
-- Escrita con IF NOT EXISTS / DROP POLICY IF EXISTS para poder correrse más
-- de una vez sin error, igual que 0074-0076.
-- ============================================================================

create table if not exists solicitudes_cambio (
  id uuid primary key default gen_random_uuid(),
  proceso_id uuid not null references procesos_gestion(id) on delete cascade,
  codigo text,
  titulo text not null,
  descripcion text not null,
  tipo_cambio text not null default 'proceso' check (tipo_cambio in ('proceso', 'documento', 'sistema', 'estructura', 'otro')),
  motivo text,
  impacto text check (impacto in ('bajo', 'medio', 'alto')),
  evaluacion text,
  solicitante_id uuid references colaboradores(id) on delete set null,
  aprobador_id uuid references colaboradores(id) on delete set null,
  estado text not null default 'solicitado' check (estado in ('solicitado', 'en_evaluacion', 'aprobado', 'rechazado', 'implementado')),
  fecha_solicitud timestamptz not null default now(),
  fecha_resolucion timestamptz,
  fecha_implementacion date
);

comment on table solicitudes_cambio is 'Gestión de cambio (ISO 9001 6.3): evalúa el impacto de un cambio a un proceso/documento/sistema/estructura antes de aprobarlo e implementarlo. Distinto de solicitudes_documento (0076), que versiona un documento puntual.';

create unique index if not exists idx_solicitudes_cambio_codigo_proceso on solicitudes_cambio(proceso_id, codigo) where codigo is not null;
create index if not exists idx_solicitudes_cambio_estado on solicitudes_cambio(estado);

alter table solicitudes_cambio enable row level security;

drop policy if exists "solicitudes_cambio: lectura empresa" on solicitudes_cambio;
create policy "solicitudes_cambio: lectura empresa" on solicitudes_cambio for select
  using (exists (select 1 from procesos_gestion pg where pg.id = solicitudes_cambio.proceso_id and pg.empresa_id = fn_mi_empresa_id()));
drop policy if exists "solicitudes_cambio: admin_th y lider solicitan" on solicitudes_cambio;
create policy "solicitudes_cambio: admin_th y lider solicitan" on solicitudes_cambio for insert
  with check (
    fn_mi_rol() in ('admin_th', 'lider')
    and exists (select 1 from procesos_gestion pg where pg.id = solicitudes_cambio.proceso_id and pg.empresa_id = fn_mi_empresa_id())
  );
drop policy if exists "solicitudes_cambio: admin_th resuelve" on solicitudes_cambio;
create policy "solicitudes_cambio: admin_th resuelve" on solicitudes_cambio for update
  using (
    fn_mi_rol() = 'admin_th'
    and exists (select 1 from procesos_gestion pg where pg.id = solicitudes_cambio.proceso_id and pg.empresa_id = fn_mi_empresa_id())
  );
drop policy if exists "solicitudes_cambio: admin_th elimina" on solicitudes_cambio;
create policy "solicitudes_cambio: admin_th elimina" on solicitudes_cambio for delete
  using (
    fn_mi_rol() = 'admin_th'
    and exists (select 1 from procesos_gestion pg where pg.id = solicitudes_cambio.proceso_id and pg.empresa_id = fn_mi_empresa_id())
  );

-- ── "Registro" como tipo de documento (distinto de "Formato") ─────────────
alter table documentos_proceso drop constraint if exists documentos_proceso_tipo_documento_check;
alter table documentos_proceso add constraint documentos_proceso_tipo_documento_check
  check (tipo_documento in ('procedimiento', 'politica', 'formato', 'instructivo', 'registro'));

alter table solicitudes_documento drop constraint if exists solicitudes_documento_tipo_documento_check;
alter table solicitudes_documento add constraint solicitudes_documento_tipo_documento_check
  check (tipo_documento in ('procedimiento', 'politica', 'formato', 'instructivo', 'registro'));
