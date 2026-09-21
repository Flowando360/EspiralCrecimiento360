-- ============================================================================
-- 0076_procesos_gestion_documental.sql
-- Módulo de Gestión de Procesos — Flujo diferenciador 1: Gestión Documental.
-- Digitaliza el GC-PO-001 (Procedimiento Gestión Documental) que hoy vive en
-- correos: solicitud de crear/actualizar/anular un documento → aprobación →
-- publicación con código y versión automáticos → difusión con confirmación
-- de lectura, exportable como acta para auditoría (numeral 7.5.3 ISO 9001).
--
-- Cuatro piezas:
--   1. documentos_proceso: el documento vigente (Listado Maestro).
--   2. documentos_historial_version: versiones anteriores, archivadas.
--   3. solicitudes_documento: el flujo de aprobación (crear/actualizar/anular).
--   4. confirmaciones_lectura: quién leyó cada documento y cuándo — la base
--      del acta de difusión.
--
-- Reglas de negocio confirmadas con el cliente:
--   - El código se autogenera en la app (no lo digita el usuario).
--   - Solo la versión vigente es visible para toda la empresa; los
--     obsoletos quedan en una carpeta del bucket que solo admin_th puede
--     leer (mismo criterio de 0026 para evidencia-procesos).
--   - La confirmación de lectura es obligatoria solo para 'procedimiento' y
--     'politica' (columna requiere_confirmacion, default true — se marca
--     false al crear formatos/instructivos).
--   - El umbral de "difusión completa" es configurable por empresa
--     (empresas.documental_umbral_difusion_pct), no fijo en 100%.
--
-- Escrita para poder correrse más de una vez sin error (IF NOT EXISTS / DROP
-- POLICY IF EXISTS en todo lo creado) — ver nota de la 0074.
-- ============================================================================

alter table empresas add column if not exists documental_umbral_difusion_pct int not null default 100;

do $$ begin
  alter table empresas add constraint empresas_documental_umbral_difusion_pct_check check (documental_umbral_difusion_pct between 1 and 100);
exception when duplicate_object then null;
end $$;

comment on column empresas.documental_umbral_difusion_pct is 'Porcentaje de confirmaciones de lectura para considerar "completa" la difusión de un documento del módulo de Procesos. Configurable en Administración → Configuración.';

create table if not exists documentos_proceso (
  id uuid primary key default gen_random_uuid(),
  proceso_id uuid not null references procesos_gestion(id) on delete cascade,
  codigo text not null,
  nombre text not null,
  tipo_documento text not null check (tipo_documento in ('procedimiento', 'politica', 'formato', 'instructivo')),
  version_vigente text not null default 'v001',
  estado text not null default 'vigente' check (estado in ('vigente', 'obsoleto')),
  archivo_url text,
  requiere_confirmacion boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (proceso_id, codigo)
);

comment on table documentos_proceso is 'Listado Maestro auto-gestionado: un documento por fila, siempre con su versión vigente al frente. Se crea/actualiza/anula únicamente a través de solicitudes_documento aprobadas — nunca directo.';

create table if not exists documentos_historial_version (
  id uuid primary key default gen_random_uuid(),
  documento_id uuid not null references documentos_proceso(id) on delete cascade,
  version text not null,
  archivo_url text not null,
  resumen_cambio text,
  responsable_id uuid references colaboradores(id) on delete set null,
  fecha timestamptz not null default now()
);

comment on table documentos_historial_version is 'Versiones archivadas (obsoletas) de un documento — pestaña "Historial". Solo admin_th puede leer los archivos de esta tabla en el bucket.';

create table if not exists solicitudes_documento (
  id uuid primary key default gen_random_uuid(),
  proceso_id uuid not null references procesos_gestion(id) on delete cascade,
  documento_id uuid references documentos_proceso(id) on delete cascade,
  tipo_solicitud text not null check (tipo_solicitud in ('crear', 'actualizar', 'anular')),
  nombre_documento text,
  tipo_documento text check (tipo_documento in ('procedimiento', 'politica', 'formato', 'instructivo')),
  archivo_propuesto_url text,
  justificacion text,
  solicitante_id uuid references colaboradores(id) on delete set null,
  estado text not null default 'pendiente' check (estado in ('pendiente', 'aprobado', 'rechazado')),
  comentarios_aprobador text,
  aprobador_id uuid references colaboradores(id) on delete set null,
  fecha_solicitud timestamptz not null default now(),
  fecha_resolucion timestamptz,
  check (tipo_solicitud = 'crear' or documento_id is not null)
);

comment on table solicitudes_documento is 'Flujo de Control Documental: Solicitante crea un requerimiento (crear/actualizar/anular) → Líder revisa y aprueba/rechaza. Al aprobar, publica la nueva versión y archiva la anterior en documentos_historial_version. Trazabilidad completa: quién pidió, quién aprobó, cuándo.';

create table if not exists confirmaciones_lectura (
  id uuid primary key default gen_random_uuid(),
  documento_id uuid not null references documentos_proceso(id) on delete cascade,
  colaborador_id uuid not null references colaboradores(id) on delete cascade,
  comentario text,
  confirmado_at timestamptz not null default now(),
  unique (documento_id, colaborador_id)
);

comment on table confirmaciones_lectura is 'Quién confirmó haber leído la versión vigente de un documento, y cuándo — base del acta de difusión exportable. En este release, quienes tienen acceso al módulo (admin_th/líder/gerencia); abrirlo a todos los colaboradores vía Feed queda para una siguiente fase.';

create index if not exists idx_documentos_proceso_proceso on documentos_proceso(proceso_id);
create index if not exists idx_documentos_historial_documento on documentos_historial_version(documento_id);
create index if not exists idx_solicitudes_documento_proceso on solicitudes_documento(proceso_id);
create index if not exists idx_solicitudes_documento_estado on solicitudes_documento(estado);
create index if not exists idx_confirmaciones_lectura_documento on confirmaciones_lectura(documento_id);

alter table documentos_proceso enable row level security;
alter table documentos_historial_version enable row level security;
alter table solicitudes_documento enable row level security;
alter table confirmaciones_lectura enable row level security;

drop policy if exists "documentos_proceso: lectura empresa" on documentos_proceso;
create policy "documentos_proceso: lectura empresa" on documentos_proceso for select
  using (exists (select 1 from procesos_gestion pg where pg.id = documentos_proceso.proceso_id and pg.empresa_id = fn_mi_empresa_id()));
drop policy if exists "documentos_proceso: admin_th administra" on documentos_proceso;
create policy "documentos_proceso: admin_th administra" on documentos_proceso for all
  using (
    fn_mi_rol() = 'admin_th'
    and exists (select 1 from procesos_gestion pg where pg.id = documentos_proceso.proceso_id and pg.empresa_id = fn_mi_empresa_id())
  );

drop policy if exists "documentos_historial_version: lectura empresa" on documentos_historial_version;
create policy "documentos_historial_version: lectura empresa" on documentos_historial_version for select
  using (exists (
    select 1 from documentos_proceso dp join procesos_gestion pg on pg.id = dp.proceso_id
    where dp.id = documentos_historial_version.documento_id and pg.empresa_id = fn_mi_empresa_id()
  ));
drop policy if exists "documentos_historial_version: admin_th administra" on documentos_historial_version;
create policy "documentos_historial_version: admin_th administra" on documentos_historial_version for all
  using (
    fn_mi_rol() = 'admin_th'
    and exists (
      select 1 from documentos_proceso dp join procesos_gestion pg on pg.id = dp.proceso_id
      where dp.id = documentos_historial_version.documento_id and pg.empresa_id = fn_mi_empresa_id()
    )
  );

drop policy if exists "solicitudes_documento: lectura empresa" on solicitudes_documento;
create policy "solicitudes_documento: lectura empresa" on solicitudes_documento for select
  using (exists (select 1 from procesos_gestion pg where pg.id = solicitudes_documento.proceso_id and pg.empresa_id = fn_mi_empresa_id()));
drop policy if exists "solicitudes_documento: admin_th y lider solicitan" on solicitudes_documento;
create policy "solicitudes_documento: admin_th y lider solicitan" on solicitudes_documento for insert
  with check (
    fn_mi_rol() in ('admin_th', 'lider')
    and exists (select 1 from procesos_gestion pg where pg.id = solicitudes_documento.proceso_id and pg.empresa_id = fn_mi_empresa_id())
  );
drop policy if exists "solicitudes_documento: admin_th resuelve" on solicitudes_documento;
create policy "solicitudes_documento: admin_th resuelve" on solicitudes_documento for update
  using (
    fn_mi_rol() = 'admin_th'
    and exists (select 1 from procesos_gestion pg where pg.id = solicitudes_documento.proceso_id and pg.empresa_id = fn_mi_empresa_id())
  );
drop policy if exists "solicitudes_documento: admin_th elimina" on solicitudes_documento;
create policy "solicitudes_documento: admin_th elimina" on solicitudes_documento for delete
  using (
    fn_mi_rol() = 'admin_th'
    and exists (select 1 from procesos_gestion pg where pg.id = solicitudes_documento.proceso_id and pg.empresa_id = fn_mi_empresa_id())
  );

drop policy if exists "confirmaciones_lectura: lectura empresa" on confirmaciones_lectura;
create policy "confirmaciones_lectura: lectura empresa" on confirmaciones_lectura for select
  using (exists (
    select 1 from documentos_proceso dp join procesos_gestion pg on pg.id = dp.proceso_id
    where dp.id = confirmaciones_lectura.documento_id and pg.empresa_id = fn_mi_empresa_id()
  ));
drop policy if exists "confirmaciones_lectura: confirma quien tiene acceso al módulo" on confirmaciones_lectura;
create policy "confirmaciones_lectura: confirma quien tiene acceso al módulo" on confirmaciones_lectura for insert
  with check (
    fn_mi_rol() in ('admin_th', 'lider', 'gerencia')
    and exists (
      select 1 from documentos_proceso dp join procesos_gestion pg on pg.id = dp.proceso_id
      where dp.id = confirmaciones_lectura.documento_id and pg.empresa_id = fn_mi_empresa_id()
    )
  );

-- ── Bucket privado para documentos del SGC (borradores, vigentes y obsoletos) ──
insert into storage.buckets (id, name, public)
values ('documentos-procesos', 'documentos-procesos', false)
on conflict (id) do nothing;

-- Ruta: empresa_id/vigentes/archivo.ext | empresa_id/obsoletos/archivo.ext |
-- empresa_id/borradores/archivo.ext — el segundo nivel de carpeta decide
-- quién puede leer: obsoletos solo admin_th, el resto toda la empresa.
drop policy if exists "documentos-procesos: admin_th y lider suben" on storage.objects;
create policy "documentos-procesos: admin_th y lider suben" on storage.objects for insert
  with check (bucket_id = 'documentos-procesos' and public.fn_mi_rol() in ('admin_th', 'lider'));

drop policy if exists "documentos-procesos: admin_th reemplaza" on storage.objects;
create policy "documentos-procesos: admin_th reemplaza" on storage.objects for update
  using (bucket_id = 'documentos-procesos' and public.fn_mi_rol() = 'admin_th');

drop policy if exists "documentos-procesos: admin_th elimina" on storage.objects;
create policy "documentos-procesos: admin_th elimina" on storage.objects for delete
  using (bucket_id = 'documentos-procesos' and public.fn_mi_rol() = 'admin_th');

drop policy if exists "documentos-procesos: lectura vigente empresa, obsoletos solo admin_th" on storage.objects;
create policy "documentos-procesos: lectura vigente empresa, obsoletos solo admin_th" on storage.objects for select
  using (
    bucket_id = 'documentos-procesos'
    and (storage.foldername(name))[1]::uuid = public.fn_mi_empresa_id()
    and ((storage.foldername(name))[2] <> 'obsoletos' or public.fn_mi_rol() = 'admin_th')
  );
