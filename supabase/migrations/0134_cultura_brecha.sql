-- Informe de Luisa 6.6: encuesta de brecha cultural.
-- Para cada comportamiento deseable la persona responde «con qué frecuencia ocurre hoy» y «con qué frecuencia debería ocurrir»
-- (1 a 5). Brecha = deseada - actual, agrupada por dimensión cultural. Anónima: la participación (quién respondió) va en una
-- tabla y las respuestas en otra, sin columna que las una; solo se guarda una copia del área, la sede y el líder. Idempotente.

create table if not exists cultura_comportamientos (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  dimension text not null check (length(trim(dimension)) > 0),
  enunciado text not null check (length(trim(enunciado)) > 0),
  activo boolean not null default true,
  orden integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists idx_cultura_comp_empresa on cultura_comportamientos(empresa_id);

create table if not exists cultura_rondas (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  nombre text not null,
  estado text not null default 'abierta' check (estado in ('abierta', 'cerrada')),
  fecha_apertura date not null default current_date,
  fecha_cierre date,
  created_at timestamptz not null default now()
);
create unique index if not exists idx_cultura_rondas_una_abierta on cultura_rondas(empresa_id) where estado = 'abierta';

create table if not exists cultura_participaciones (
  id uuid primary key default gen_random_uuid(),
  ronda_id uuid not null references cultura_rondas(id) on delete cascade,
  colaborador_id uuid not null references colaboradores(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (ronda_id, colaborador_id)
);

create table if not exists cultura_respuestas (
  id uuid primary key default gen_random_uuid(),
  ronda_id uuid not null references cultura_rondas(id) on delete cascade,
  envio_id uuid not null, -- número al azar por envío, solo para contar cuántas personas respondieron; no identifica a nadie
  comportamiento_id uuid not null references cultura_comportamientos(id) on delete cascade,
  actual smallint not null check (actual between 1 and 5),
  deseada smallint not null check (deseada between 1 and 5),
  area text,
  sede_id uuid references sedes(id) on delete set null,
  equipo_lider_id uuid references colaboradores(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists idx_cultura_resp_ronda on cultura_respuestas(ronda_id);

alter table cultura_comportamientos enable row level security;
alter table cultura_rondas enable row level security;
alter table cultura_participaciones enable row level security;
alter table cultura_respuestas enable row level security;

drop policy if exists "cultura_comp: lectura empresa" on cultura_comportamientos;
create policy "cultura_comp: lectura empresa" on cultura_comportamientos for select using (empresa_id = fn_mi_empresa_id());
drop policy if exists "cultura_comp: admin_th administra" on cultura_comportamientos;
create policy "cultura_comp: admin_th administra" on cultura_comportamientos for all
  using (empresa_id = fn_mi_empresa_id() and fn_mi_rol() = 'admin_th')
  with check (empresa_id = fn_mi_empresa_id() and fn_mi_rol() = 'admin_th');

drop policy if exists "cultura_rondas: lectura empresa" on cultura_rondas;
create policy "cultura_rondas: lectura empresa" on cultura_rondas for select using (empresa_id = fn_mi_empresa_id());
drop policy if exists "cultura_rondas: admin_th administra" on cultura_rondas;
create policy "cultura_rondas: admin_th administra" on cultura_rondas for all
  using (empresa_id = fn_mi_empresa_id() and fn_mi_rol() = 'admin_th')
  with check (empresa_id = fn_mi_empresa_id() and fn_mi_rol() = 'admin_th');

drop policy if exists "cultura_part: registra la suya" on cultura_participaciones;
create policy "cultura_part: registra la suya" on cultura_participaciones for insert
  with check (
    colaborador_id = fn_mi_colaborador_id()
    and exists (select 1 from cultura_rondas r where r.id = ronda_id and r.empresa_id = fn_mi_empresa_id() and r.estado = 'abierta')
  );
drop policy if exists "cultura_part: ve la suya o admin_th" on cultura_participaciones;
create policy "cultura_part: ve la suya o admin_th" on cultura_participaciones for select
  using (
    colaborador_id = fn_mi_colaborador_id()
    or (fn_mi_rol() = 'admin_th' and exists (select 1 from cultura_rondas r where r.id = ronda_id and r.empresa_id = fn_mi_empresa_id()))
  );

drop policy if exists "cultura_resp: registra respuestas" on cultura_respuestas;
create policy "cultura_resp: registra respuestas" on cultura_respuestas for insert
  with check (
    fn_mi_colaborador_id() is not null
    and exists (select 1 from cultura_rondas r where r.id = ronda_id and r.empresa_id = fn_mi_empresa_id() and r.estado = 'abierta')
  );
drop policy if exists "cultura_resp: admin_th y gerencia leen" on cultura_respuestas;
create policy "cultura_resp: admin_th y gerencia leen" on cultura_respuestas for select
  using (
    fn_mi_rol() in ('admin_th', 'gerencia')
    and exists (select 1 from cultura_rondas r where r.id = ronda_id and r.empresa_id = fn_mi_empresa_id())
  );
