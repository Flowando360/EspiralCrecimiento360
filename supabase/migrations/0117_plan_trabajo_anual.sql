-- Informe de pruebas (Luisa), 9.2: registro unificado de actividades y plan de trabajo anual de Gestión Humana
-- (Planear). Una sola fuente para el plan de trabajo, el plan de formación y las estadísticas de cumplimiento.

create table if not exists plan_trabajo_actividades (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  nombre text not null,
  tipo text not null default 'otra' check (tipo in (
    'simulacro', 'pausa_activa', 'inspeccion', 'capacitacion', 'bienestar',
    'induccion_reinduccion', 'auditoria_interna', 'reunion_revision', 'comite', 'medicion', 'otra'
  )),
  -- A qué sistema de gestión aporta
  sistema text not null default 'otro' check (sistema in ('sg_sst', 'iso_9001', 'bienestar_clima', 'formacion', 'otro')),
  fecha_programada date not null,
  fecha_ejecutada date,
  responsable_id uuid references colaboradores(id) on delete set null,
  -- Población objetivo
  poblacion_tipo text not null default 'todos' check (poblacion_tipo in ('todos', 'area', 'cargo')),
  poblacion_detalle text,
  personas_objetivo int check (personas_objetivo is null or personas_objetivo >= 0),
  personas_alcanzadas int check (personas_alcanzadas is null or personas_alcanzadas >= 0),
  horas numeric(6,1) check (horas is null or horas >= 0),
  presupuesto_estimado numeric(14,2) check (presupuesto_estimado is null or presupuesto_estimado >= 0),
  presupuesto_ejecutado numeric(14,2) check (presupuesto_ejecutado is null or presupuesto_ejecutado >= 0),
  -- Proveedor o aliado que la ejecuta (Directorio de aliados de Nexa)
  aliado_id uuid references nexa_directorio_aliados(id) on delete set null,
  estado text not null default 'programada' check (estado in ('programada', 'en_curso', 'ejecutada', 'cancelada', 'reprogramada')),
  -- Calificación de los participantes / NPS del evento
  calificacion numeric(4,1) check (calificacion is null or (calificacion >= 0 and calificacion <= 10)),
  notas text,
  -- Evidencias: [{ nombre, ruta, tipo, tamano }] en el bucket privado "plan-trabajo".
  adjuntos jsonb not null default '[]'::jsonb,
  -- Si la actividad reveló un hallazgo, la acción ACPM que se generó
  acpm_id uuid references acpm(id) on delete set null,
  creado_por uuid references perfiles_usuario(id) on delete set null,
  created_at timestamptz not null default now()
);

comment on table plan_trabajo_actividades is 'Programación anual de actividades de Gestión Humana (SST, bienestar, formación, sistemas de gestión) con ejecución, cobertura, presupuesto y evidencias. Fuente única del plan de trabajo, del plan de formación y de sus indicadores.';

create index if not exists idx_plan_trabajo_empresa_fecha on plan_trabajo_actividades(empresa_id, fecha_programada);

alter table plan_trabajo_actividades enable row level security;

drop policy if exists "plan_trabajo: lectura empresa" on plan_trabajo_actividades;
create policy "plan_trabajo: lectura empresa" on plan_trabajo_actividades for select
  using (empresa_id = fn_mi_empresa_id());

drop policy if exists "plan_trabajo: admin_th administra" on plan_trabajo_actividades;
create policy "plan_trabajo: admin_th administra" on plan_trabajo_actividades for all
  using (empresa_id = fn_mi_empresa_id() and fn_mi_rol() = 'admin_th')
  with check (empresa_id = fn_mi_empresa_id() and fn_mi_rol() = 'admin_th');

-- Una ACPM puede nacer de una actividad del plan
alter table acpm drop constraint if exists acpm_origen_tipo_check;
alter table acpm add constraint acpm_origen_tipo_check
  check (origen_tipo in ('hallazgo_auditoria', 'riesgo', 'contexto', 'revision_proceso', 'indicador', 'pqrs', 'mejora_propia', 'simulacro', 'plan_trabajo'));

-- Bucket privado de evidencias (fotos, listas de asistencia, actas). Ruta: empresa_id/actividad_id/archivo.
insert into storage.buckets (id, name, public)
values ('plan-trabajo', 'plan-trabajo', false)
on conflict (id) do nothing;

drop policy if exists "plan-trabajo: admin_th sube" on storage.objects;
create policy "plan-trabajo: admin_th sube" on storage.objects for insert
  with check (bucket_id = 'plan-trabajo' and public.fn_mi_rol() = 'admin_th' and (storage.foldername(name))[1] = public.fn_mi_empresa_id()::text);

drop policy if exists "plan-trabajo: admin_th borra" on storage.objects;
create policy "plan-trabajo: admin_th borra" on storage.objects for delete
  using (bucket_id = 'plan-trabajo' and public.fn_mi_rol() = 'admin_th' and (storage.foldername(name))[1] = public.fn_mi_empresa_id()::text);

drop policy if exists "plan-trabajo: lectura empresa" on storage.objects;
create policy "plan-trabajo: lectura empresa" on storage.objects for select
  using (bucket_id = 'plan-trabajo' and (storage.foldername(name))[1] = public.fn_mi_empresa_id()::text);
