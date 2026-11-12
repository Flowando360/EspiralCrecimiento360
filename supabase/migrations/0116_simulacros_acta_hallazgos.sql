-- Informe de pruebas (Luisa), 9.1: el simulacro debe registrar el EVENTO (acta), no solo la asistencia,
-- y sus hallazgos deben poder convertirse en una acción ACPM con trazabilidad (Res. 0312 de 2019).

-- ── Datos del acta ──────────────────────────────────────────────────────────
alter table nexa_simulacros add column if not exists tipo text
  check (tipo is null or tipo in ('incendio', 'sismo', 'evacuacion', 'derrame', 'otro'));
alter table nexa_simulacros add column if not exists sede text;
alter table nexa_simulacros add column if not exists escenario text;
alter table nexa_simulacros add column if not exists duracion_minutos numeric(6,1) check (duracion_minutos is null or duracion_minutos >= 0);
alter table nexa_simulacros add column if not exists tiempo_evacuacion_esperado_min numeric(6,1) check (tiempo_evacuacion_esperado_min is null or tiempo_evacuacion_esperado_min >= 0);
alter table nexa_simulacros add column if not exists tiempo_evacuacion_real_min numeric(6,1) check (tiempo_evacuacion_real_min is null or tiempo_evacuacion_real_min >= 0);
alter table nexa_simulacros add column if not exists brigadistas_participantes int check (brigadistas_participantes is null or brigadistas_participantes >= 0);
alter table nexa_simulacros add column if not exists observaciones_brigada text;
-- Archivos: [{ nombre, ruta, tipo, tamano }]. Viven en el bucket privado "simulacros".
alter table nexa_simulacros add column if not exists adjuntos jsonb not null default '[]'::jsonb;

-- ── Hallazgos del simulacro ─────────────────────────────────────────────────
create table if not exists nexa_simulacro_hallazgos (
  id uuid primary key default gen_random_uuid(),
  simulacro_id uuid not null references nexa_simulacros(id) on delete cascade,
  descripcion text not null,
  categoria text not null default 'no_conformidad' check (categoria in ('no_conformidad', 'oportunidad_mejora', 'observacion')),
  severidad text not null default 'media' check (severidad in ('baja', 'media', 'alta', 'critica')),
  acpm_id uuid references acpm(id) on delete set null,
  creado_en timestamptz not null default now()
);

create index if not exists idx_simulacro_hallazgos_simulacro on nexa_simulacro_hallazgos(simulacro_id);

alter table nexa_simulacro_hallazgos enable row level security;

drop policy if exists "nexa_simulacro_hallazgos: lectura empresa" on nexa_simulacro_hallazgos;
create policy "nexa_simulacro_hallazgos: lectura empresa" on nexa_simulacro_hallazgos for select
  using (exists(select 1 from nexa_simulacros s where s.id = simulacro_id and s.empresa_id = fn_mi_empresa_id()));

drop policy if exists "nexa_simulacro_hallazgos: admin_th administra" on nexa_simulacro_hallazgos;
create policy "nexa_simulacro_hallazgos: admin_th administra" on nexa_simulacro_hallazgos for all
  using (fn_mi_rol() = 'admin_th' and exists(select 1 from nexa_simulacros s where s.id = simulacro_id and s.empresa_id = fn_mi_empresa_id()))
  with check (fn_mi_rol() = 'admin_th' and exists(select 1 from nexa_simulacros s where s.id = simulacro_id and s.empresa_id = fn_mi_empresa_id()));

-- ── Una ACPM puede nacer de un simulacro ────────────────────────────────────
alter table acpm drop constraint if exists acpm_origen_tipo_check;
alter table acpm add constraint acpm_origen_tipo_check
  check (origen_tipo in ('hallazgo_auditoria', 'riesgo', 'contexto', 'revision_proceso', 'indicador', 'pqrs', 'mejora_propia', 'simulacro'));

-- ── Bucket privado para fotos, acta firmada y listas de asistencia escaneadas ──
-- Ruta: empresa_id/simulacro_id/archivo. Solo admin_th escribe; cualquiera de la empresa lee.
insert into storage.buckets (id, name, public)
values ('simulacros', 'simulacros', false)
on conflict (id) do nothing;

drop policy if exists "simulacros: admin_th sube" on storage.objects;
create policy "simulacros: admin_th sube" on storage.objects for insert
  with check (bucket_id = 'simulacros' and public.fn_mi_rol() = 'admin_th' and (storage.foldername(name))[1] = public.fn_mi_empresa_id()::text);

drop policy if exists "simulacros: admin_th borra" on storage.objects;
create policy "simulacros: admin_th borra" on storage.objects for delete
  using (bucket_id = 'simulacros' and public.fn_mi_rol() = 'admin_th' and (storage.foldername(name))[1] = public.fn_mi_empresa_id()::text);

drop policy if exists "simulacros: lectura empresa" on storage.objects;
create policy "simulacros: lectura empresa" on storage.objects for select
  using (bucket_id = 'simulacros' and (storage.foldername(name))[1] = public.fn_mi_empresa_id()::text);
