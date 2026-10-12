-- ============================================================================
-- 0101_reclutamiento_normativa.sql
-- Reclutamiento y selección, según la reunión y la Ley 1581 de 2012 (datos personales):
--   · Flujo de tres pasos: Talento Humano filtra → el líder evalúa → Talento Humano cierra.
--   · Visibilidad: Talento Humano ve todo; el líder solo ve los candidatos asignados,
--     y solo durante un plazo.
--   · Autorización previa, informada y demostrable del tratamiento de datos.
--   · Banco de candidatos con disponibilidad para otros cargos y plazo de conservación.
--   · Canal para que el titular ejerza sus derechos (acceso, corrección, revocación, supresión).
-- ============================================================================

-- ── 1. Etapas del flujo de tres pasos ───────────────────────────────────────
alter type etapa_postulacion add value if not exists 'evaluacion_lider';
alter type etapa_postulacion add value if not exists 'devuelto_th';

-- ── 2. Evaluación del líder y disponibilidad en el banco ────────────────────
alter table postulaciones
  add column if not exists evaluacion_lider text,
  add column if not exists evaluacion_lider_en timestamptz;

comment on column postulaciones.evaluacion_lider is 'Apreciaciones del líder sobre el candidato. Solo las escribe el líder asignado, mientras la asignación esté vigente.';

alter table candidatos
  add column if not exists autorizacion_banco boolean not null default false,
  add column if not exists disponible_otros_cargos boolean not null default false,
  add column if not exists conservar_hasta date;

comment on column candidatos.autorizacion_banco is 'El candidato autorizó conservar sus datos en el banco de talento para futuras vacantes.';
comment on column candidatos.conservar_hasta is 'Fecha hasta la que se conservan los datos. Al vencer, el candidato debe ser revisado o suprimido.';

-- ── 3. Asignación al líder (visibilidad por tiempo limitado) ────────────────
create table if not exists asignaciones_evaluacion_lider (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  postulacion_id uuid not null references postulaciones(id) on delete cascade,
  lider_id uuid not null references colaboradores(id) on delete cascade,
  asignado_en timestamptz not null default now(),
  vence_en date not null default (current_date + 30),
  created_at timestamptz not null default now()
);

comment on table asignaciones_evaluacion_lider is 'Qué candidato le asigna Talento Humano a un líder para evaluar, y hasta cuándo puede verlo. Es lo que da visibilidad al líder.';

create index if not exists idx_asignaciones_lider on asignaciones_evaluacion_lider(lider_id, vence_en);
create index if not exists idx_asignaciones_postulacion on asignaciones_evaluacion_lider(postulacion_id);

alter table asignaciones_evaluacion_lider enable row level security;

create policy "asignaciones: admin_th administra" on asignaciones_evaluacion_lider for all
  using (empresa_id = fn_mi_empresa_id() and fn_mi_rol() = 'admin_th')
  with check (empresa_id = fn_mi_empresa_id() and fn_mi_rol() = 'admin_th');
create policy "asignaciones: el líder ve las suyas vigentes" on asignaciones_evaluacion_lider for select
  using (lider_id = fn_mi_colaborador_id() and vence_en >= current_date);

-- Un candidato es visible para el líder solo si tiene una asignación suya vigente.
create or replace function fn_lider_ve_postulacion(p_postulacion_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from asignaciones_evaluacion_lider a
    where a.postulacion_id = p_postulacion_id
      and a.lider_id = fn_mi_colaborador_id()
      and a.vence_en >= current_date
  )
$$;

-- Función auxiliar para la policy de postulaciones (la empresa viene de la vacante).
create or replace function empresa_id_de_vacante(p_vacante_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select empresa_id from vacantes where id = p_vacante_id
$$;

-- ── 4. Visibilidad: reemplaza la lectura amplia que tenía el líder ─────────
drop policy if exists "candidatos: lectura empresa (admin_th, lider)" on candidatos;
create policy "candidatos: el líder ve los asignados vigentes" on candidatos for select
  using (
    empresa_id = fn_mi_empresa_id()
    and fn_mi_rol() = 'lider'
    and exists (
      select 1 from postulaciones p
      where p.candidato_id = candidatos.id and fn_lider_ve_postulacion(p.id)
    )
  );

drop policy if exists "postulaciones: lectura empresa (admin_th, lider)" on postulaciones;
create policy "postulaciones: el líder ve las asignadas vigentes" on postulaciones for select
  using (empresa_id_de_vacante(vacante_id) = fn_mi_empresa_id() and fn_mi_rol() = 'lider' and fn_lider_ve_postulacion(id));
create policy "postulaciones: el líder devuelve su evaluación" on postulaciones for update
  using (fn_mi_rol() = 'lider' and fn_lider_ve_postulacion(id) and etapa = 'evaluacion_lider')
  with check (fn_mi_rol() = 'lider' and fn_lider_ve_postulacion(id));

drop policy if exists "entrevistas: lectura empresa (admin_th, lider)" on entrevistas;
create policy "entrevistas: el líder ve las de sus asignados" on entrevistas for select
  using (fn_mi_rol() = 'lider' and fn_lider_ve_postulacion(postulacion_id));

drop policy if exists "referencias: lectura empresa (admin_th, lider)" on referencias_candidato;
create policy "referencias: el líder ve las de sus asignados" on referencias_candidato for select
  using (fn_mi_rol() = 'lider' and exists (
    select 1 from postulaciones p where p.candidato_id = referencias_candidato.candidato_id and fn_lider_ve_postulacion(p.id)
  ));

-- El líder solo puede tocar la evaluación y pasar el candidato de 'evaluacion_lider' a 'devuelto_th'.
create or replace function fn_restringir_postulacion_lider()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if fn_mi_rol() = 'lider' then
    if new.vacante_id is distinct from old.vacante_id
      or new.candidato_id is distinct from old.candidato_id
      or new.calificacion is distinct from old.calificacion
      or new.notas is distinct from old.notas
      or new.descartado_motivo is distinct from old.descartado_motivo
      or new.orden is distinct from old.orden then
      raise exception 'El líder solo puede registrar su evaluación del candidato.';
    end if;
    if new.etapa is distinct from old.etapa and not (old.etapa = 'evaluacion_lider' and new.etapa = 'devuelto_th') then
      raise exception 'El líder solo puede devolver el candidato a Talento Humano.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_postulacion_restringir_lider on postulaciones;
create trigger trg_postulacion_restringir_lider
  before update on postulaciones
  for each row execute function fn_restringir_postulacion_lider();

-- ── 5. Autorización de tratamiento de datos (evidencia demostrable) ─────────
create table if not exists autorizaciones_tratamiento (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  candidato_id uuid not null references candidatos(id) on delete cascade,
  vacante_id uuid references vacantes(id) on delete set null,
  version_politica text not null,
  finalidades text[] not null,
  acepto_banco boolean not null default false,
  aceptada_en timestamptz not null default now(),
  canal text not null default 'formulario_publico'
);

comment on table autorizaciones_tratamiento is 'Evidencia de la autorización previa, informada y demostrable que dio el candidato. Registro de solo inserción: no se edita ni se borra desde la aplicación.';

create index if not exists idx_autorizaciones_candidato on autorizaciones_tratamiento(candidato_id);

alter table autorizaciones_tratamiento enable row level security;

create policy "autorizaciones: admin_th lee" on autorizaciones_tratamiento for select
  using (empresa_id = fn_mi_empresa_id() and fn_mi_rol() = 'admin_th');

-- ── 6. Derechos del titular (acceso, corrección, revocación, supresión) ─────
create table if not exists solicitudes_titular (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  tipo text not null check (tipo in ('consulta', 'correccion', 'revocacion', 'supresion')),
  nombre_titular text not null,
  numero_documento text,
  correo text,
  detalle text not null,
  estado text not null default 'recibida' check (estado in ('recibida', 'atendida')),
  recibida_en timestamptz not null default now(),
  atendida_en timestamptz
);

comment on table solicitudes_titular is 'Solicitudes de los titulares de datos. Talento Humano debe responderlas dentro del plazo que fija la ley.';

alter table solicitudes_titular enable row level security;

create policy "solicitudes_titular: admin_th administra" on solicitudes_titular for all
  using (empresa_id = fn_mi_empresa_id() and fn_mi_rol() = 'admin_th')
  with check (empresa_id = fn_mi_empresa_id() and fn_mi_rol() = 'admin_th');
