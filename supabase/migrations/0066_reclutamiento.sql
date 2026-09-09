-- ============================================================================
-- 0066_reclutamiento.sql
-- Módulo de Reclutamiento y Selección — comprometido en la propuesta piloto
-- Sky2B (docs/Propuesta_Comercial_Piloto_Espiral.docx, sección 04): banco de
-- candidatos con hoja de vida, postulación por vacante vinculada al Perfil
-- de Cargo, comparación/calificación de candidatos, agendamiento de
-- entrevistas y verificación de referencias. El "candidato seleccionado"
-- pasa directo a colaboradores/nuevo (sin migración de datos: el flujo de
-- la app prellena el formulario con los datos ya capturados aquí).
--
-- Distinto del Tablero de Procesos genérico (0031): ahí una tarjeta solo
-- tiene título/descripción/responsable/prioridad/fecha límite. Aquí el
-- candidato es una entidad propia (banco reutilizable entre vacantes, con
-- hoja de vida, correo, teléfono) y el pipeline (postulaciones) tiene
-- campos propios de selección: etapa, calificación, entrevistas, referencias.
--
-- Alcance de permisos: admin_th administra el proceso completo (como el
-- resto de RRHH sensible: hoja_vida_formacion, entrevistas_salida). Líder
-- solo lee — puede necesitar ver el pipeline si va a entrevistar — salvo en
-- sus propias entrevistas asignadas, donde puede registrar el resultado.
-- Colaborador no tiene acceso: esto es contratación de personas que aún no
-- son colaboradores, no un dato propio de su ficha.
-- ============================================================================

create type estado_vacante as enum ('abierta', 'pausada', 'cerrada');
create type etapa_postulacion as enum ('recibido', 'entrevista', 'prueba', 'oferta', 'contratado', 'descartado');
create type modalidad_entrevista as enum ('presencial', 'virtual', 'telefonica');
create type estado_entrevista as enum ('programada', 'realizada', 'cancelada');

create table vacantes (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  cargo_id uuid not null references cargos(id) on delete restrict,
  titulo text not null,
  descripcion text,
  estado estado_vacante not null default 'abierta',
  fecha_apertura date not null default current_date,
  fecha_cierre date,
  creado_por uuid references perfiles_usuario(id) on delete set null,
  created_at timestamptz not null default now()
);

comment on table vacantes is 'Vacantes abiertas por la empresa, vinculadas a un Perfil de Cargo existente. Base del formulario público de postulación (/postular/[vacante_id]).';

create table candidatos (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  nombre_completo text not null,
  numero_documento text,
  correo text,
  telefono text,
  hoja_vida_url text, -- ruta en el bucket privado hojas-vida-candidatos
  linkedin_url text,
  origen text not null default 'manual' check (origen in ('postulacion_publica', 'manual')),
  notas text,
  created_at timestamptz not null default now()
);

comment on table candidatos is 'Banco de candidatos de la empresa — persiste entre vacantes (un candidato puede postularse a varias). No son colaboradores todavía; al ser seleccionado, sus datos prellenan el formulario de Nuevo Colaborador.';

create table postulaciones (
  id uuid primary key default gen_random_uuid(),
  vacante_id uuid not null references vacantes(id) on delete cascade,
  candidato_id uuid not null references candidatos(id) on delete cascade,
  etapa etapa_postulacion not null default 'recibido',
  calificacion numeric(3,1) check (calificacion is null or (calificacion >= 0 and calificacion <= 10)),
  notas text,
  descartado_motivo text,
  orden int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (vacante_id, candidato_id)
);

comment on table postulaciones is 'El proceso de selección de un candidato para una vacante puntual: etapa (pipeline), calificación comparativa entre candidatos de la misma vacante, notas. Un mismo candidato puede tener una fila por cada vacante a la que se postule.';

create table entrevistas (
  id uuid primary key default gen_random_uuid(),
  postulacion_id uuid not null references postulaciones(id) on delete cascade,
  entrevistador_id uuid references colaboradores(id) on delete set null,
  fecha_hora timestamptz not null,
  modalidad modalidad_entrevista not null default 'virtual',
  estado estado_entrevista not null default 'programada',
  notas text,
  created_at timestamptz not null default now()
);

comment on table entrevistas is 'Entrevistas agendadas dentro de un proceso de selección. El entrevistador (un colaborador, típicamente el líder de la vacante) registra el resultado en notas al marcarla realizada.';

create table referencias_candidato (
  id uuid primary key default gen_random_uuid(),
  candidato_id uuid not null references candidatos(id) on delete cascade,
  nombre_referencia text not null,
  telefono_referencia text,
  relacion text, -- ej: jefe anterior, colega, cliente
  verificada boolean not null default false,
  notas text,
  verificado_por uuid references perfiles_usuario(id) on delete set null,
  verificado_en timestamptz,
  created_at timestamptz not null default now()
);

comment on table referencias_candidato is 'Referencias laborales/personales del candidato y su estado de verificación.';

create index idx_vacantes_empresa on vacantes(empresa_id);
create index idx_vacantes_cargo on vacantes(cargo_id);
create index idx_candidatos_empresa on candidatos(empresa_id);
create index idx_postulaciones_vacante on postulaciones(vacante_id);
create index idx_postulaciones_candidato on postulaciones(candidato_id);
create index idx_entrevistas_postulacion on entrevistas(postulacion_id);
create index idx_entrevistas_entrevistador on entrevistas(entrevistador_id);
create index idx_referencias_candidato on referencias_candidato(candidato_id);

create or replace function fn_tocar_updated_at_postulaciones() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_postulaciones_updated_at
  before update on postulaciones
  for each row execute function fn_tocar_updated_at_postulaciones();

-- ── RLS ──────────────────────────────────────────────────────────────────
alter table vacantes enable row level security;
alter table candidatos enable row level security;
alter table postulaciones enable row level security;
alter table entrevistas enable row level security;
alter table referencias_candidato enable row level security;

create policy "vacantes: lectura empresa (admin_th, lider, gerencia)" on vacantes for select
  using (empresa_id = fn_mi_empresa_id() and fn_mi_rol() in ('admin_th', 'lider', 'gerencia'));
create policy "vacantes: admin_th administra" on vacantes for all
  using (empresa_id = fn_mi_empresa_id() and fn_mi_rol() = 'admin_th');

create policy "candidatos: lectura empresa (admin_th, lider)" on candidatos for select
  using (empresa_id = fn_mi_empresa_id() and fn_mi_rol() in ('admin_th', 'lider'));
create policy "candidatos: admin_th administra" on candidatos for all
  using (empresa_id = fn_mi_empresa_id() and fn_mi_rol() = 'admin_th');

create policy "postulaciones: lectura empresa (admin_th, lider)" on postulaciones for select
  using (exists (
    select 1 from vacantes v where v.id = postulaciones.vacante_id
      and v.empresa_id = fn_mi_empresa_id() and fn_mi_rol() in ('admin_th', 'lider')
  ));
create policy "postulaciones: admin_th administra" on postulaciones for all
  using (
    fn_mi_rol() = 'admin_th'
    and exists (select 1 from vacantes v where v.id = postulaciones.vacante_id and v.empresa_id = fn_mi_empresa_id())
  );

create policy "entrevistas: lectura empresa (admin_th, lider)" on entrevistas for select
  using (exists (
    select 1 from postulaciones p join vacantes v on v.id = p.vacante_id
    where p.id = entrevistas.postulacion_id and v.empresa_id = fn_mi_empresa_id()
      and fn_mi_rol() in ('admin_th', 'lider')
  ));
create policy "entrevistas: admin_th administra" on entrevistas for all
  using (
    fn_mi_rol() = 'admin_th'
    and exists (
      select 1 from postulaciones p join vacantes v on v.id = p.vacante_id
      where p.id = entrevistas.postulacion_id and v.empresa_id = fn_mi_empresa_id()
    )
  );
create policy "entrevistas: lider registra la suya" on entrevistas for update
  using (fn_mi_rol() = 'lider' and entrevistador_id = fn_mi_colaborador_id());

create policy "referencias: lectura empresa (admin_th, lider)" on referencias_candidato for select
  using (exists (
    select 1 from candidatos c where c.id = referencias_candidato.candidato_id
      and c.empresa_id = fn_mi_empresa_id() and fn_mi_rol() in ('admin_th', 'lider')
  ));
create policy "referencias: admin_th administra" on referencias_candidato for all
  using (
    fn_mi_rol() = 'admin_th'
    and exists (select 1 from candidatos c where c.id = referencias_candidato.candidato_id and c.empresa_id = fn_mi_empresa_id())
  );

-- ── Bucket privado para hojas de vida de candidatos ─────────────────────────
-- La postulación pública (/postular/[vacante_id]) no escribe aquí con el
-- rol anónimo: pasa por una ruta de servidor (service_role) que valida que
-- la vacante esté abierta antes de insertar, así que no hace falta una
-- policy de insert pública. Solo hace falta lectura para admin_th.
insert into storage.buckets (id, name, public)
values ('hojas-vida-candidatos', 'hojas-vida-candidatos', false)
on conflict (id) do nothing;

create policy "hojas-vida-candidatos: admin_th lee" on storage.objects for select
  using (
    bucket_id = 'hojas-vida-candidatos'
    and (storage.foldername(name))[1]::uuid = public.fn_mi_empresa_id()
    and public.fn_mi_rol() = 'admin_th'
  );

create policy "hojas-vida-candidatos: admin_th administra" on storage.objects for all
  using (
    bucket_id = 'hojas-vida-candidatos'
    and (storage.foldername(name))[1]::uuid = public.fn_mi_empresa_id()
    and public.fn_mi_rol() = 'admin_th'
  );
