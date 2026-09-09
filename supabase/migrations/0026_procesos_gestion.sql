-- ============================================================================
-- 0026_procesos_gestion.sql
-- Módulo de Procesos y Sistemas de Gestión (aporte de V&E a la alianza,
-- Modelo de Negocio Espiral Evolutiva secc. 1: "los procesos y sistemas de
-- gestión de la empresa cliente quedan documentados y alineados con la
-- plataforma... lo que agiliza la implementación y facilita auditorías y
-- certificaciones"). Tres piezas:
--   1. procesos_gestion: catálogo de procesos documentados por área.
--   2. matriz_riesgos_controles: riesgos y controles, marcados por marco
--      normativo (ISO 9001, SARLAFT/SAGRILAFT, PTEE).
--   3. checklist_cumplimiento: checklist de verificación por marco
--      normativo, con evidencia — insumo directo del paquete de evidencia
--      de auditoría (ver 0028).
-- Alcance de empresa completa (no por equipo): solo admin_th administra;
-- lider y gerencia solo consultan, igual que empresa_identidad.
-- ============================================================================

create table procesos_gestion (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  area_proceso text not null,
  nombre text not null,
  descripcion text,
  flujograma_url text, -- ruta en el bucket privado evidencia-procesos
  version text,
  responsable_id uuid references colaboradores(id) on delete set null,
  fecha_actualizacion date not null default current_date,
  created_at timestamptz not null default now()
);

comment on table procesos_gestion is 'Catálogo de procesos y flujogramas documentados por empresa (aporte V&E). Base para auditorías ISO 9001 y para agilizar la implementación de sistemas de gestión.';

create table matriz_riesgos_controles (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  proceso_id uuid references procesos_gestion(id) on delete set null,
  marco_normativo text not null check (marco_normativo in ('iso_9001', 'sarlaft_sagrilaft', 'ptee', 'interno')),
  riesgo text not null,
  categoria_riesgo text,
  probabilidad text check (probabilidad in ('baja', 'media', 'alta')),
  impacto text check (impacto in ('bajo', 'medio', 'alto')),
  control text,
  responsable_id uuid references colaboradores(id) on delete set null,
  estado text not null default 'vigente' check (estado in ('vigente', 'en_implementacion', 'desactualizado')),
  created_at timestamptz not null default now()
);

comment on table matriz_riesgos_controles is 'Matriz de riesgos y controles por marco normativo (ISO 9001, SARLAFT/SAGRILAFT, PTEE), aporte de V&E — insumo de auditorías de cumplimiento y riesgos.';

create table checklist_cumplimiento (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  marco_normativo text not null check (marco_normativo in ('iso_9001', 'sarlaft_sagrilaft', 'ptee')),
  item text not null,
  descripcion text,
  estado text not null default 'no_cumple' check (estado in ('cumple', 'cumple_parcial', 'no_cumple', 'no_aplica')),
  evidencia_url text, -- ruta en el bucket privado evidencia-procesos
  responsable_id uuid references colaboradores(id) on delete set null,
  fecha_verificacion date not null default current_date,
  observaciones text,
  created_at timestamptz not null default now()
);

comment on table checklist_cumplimiento is 'Checklist de cumplimiento normativo por marco (ISO 9001 / SARLAFT-SAGRILAFT / PTEE), con evidencia adjunta — insumo directo del paquete de evidencia de auditoría (0028).';

alter table procesos_gestion enable row level security;
alter table matriz_riesgos_controles enable row level security;
alter table checklist_cumplimiento enable row level security;

create policy "procesos_gestion: lectura empresa" on procesos_gestion for select
  using (empresa_id = fn_mi_empresa_id());
create policy "procesos_gestion: admin_th administra" on procesos_gestion for all
  using (empresa_id = fn_mi_empresa_id() and fn_mi_rol() = 'admin_th');

create policy "matriz_riesgos: lectura empresa" on matriz_riesgos_controles for select
  using (empresa_id = fn_mi_empresa_id());
create policy "matriz_riesgos: admin_th administra" on matriz_riesgos_controles for all
  using (empresa_id = fn_mi_empresa_id() and fn_mi_rol() = 'admin_th');

create policy "checklist_cumplimiento: lectura empresa" on checklist_cumplimiento for select
  using (empresa_id = fn_mi_empresa_id());
create policy "checklist_cumplimiento: admin_th administra" on checklist_cumplimiento for all
  using (empresa_id = fn_mi_empresa_id() and fn_mi_rol() = 'admin_th');

-- ── Bucket privado para flujogramas y evidencia de cumplimiento ────────────
insert into storage.buckets (id, name, public)
values ('evidencia-procesos', 'evidencia-procesos', false)
on conflict (id) do nothing;

-- Ruta: empresa_id/archivo.ext — el marco normativo (ISO/SARLAFT/PTEE) y el
-- carácter sensible de estos documentos son de cumplimiento interno, no de
-- confidencialidad de datos personales, así que basta con validar la
-- empresa (segundo nivel de carpeta) y el rol.
create policy "evidencia-procesos: admin_th sube" on storage.objects for insert
  with check (bucket_id = 'evidencia-procesos' and public.fn_mi_rol() = 'admin_th');

create policy "evidencia-procesos: admin_th reemplaza" on storage.objects for update
  using (bucket_id = 'evidencia-procesos' and public.fn_mi_rol() = 'admin_th');

create policy "evidencia-procesos: admin_th elimina" on storage.objects for delete
  using (bucket_id = 'evidencia-procesos' and public.fn_mi_rol() = 'admin_th');

create policy "evidencia-procesos: lectura empresa" on storage.objects for select
  using (
    bucket_id = 'evidencia-procesos'
    and (storage.foldername(name))[1]::uuid = public.fn_mi_empresa_id()
  );
