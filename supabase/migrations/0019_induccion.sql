-- ============================================================================
-- Plan de inducción por cargo (backlog 2.5): plantilla de puntos a cubrir
-- (comunes a toda la empresa + específicos por cargo, generados a partir del
-- perfil de cargo y de la Identidad Organizacional) y el checklist real de
-- cada colaborador con quién marcó cada punto como cumplido y cuándo.
-- ============================================================================

create type categoria_induccion as enum (
  'proposito_organizacional',
  'funciones',
  'riesgos_sst',
  'epp',
  'examenes_medicos',
  'formacion',
  'otro'
);

-- ── Plantilla ────────────────────────────────────────────────────────────
create table induccion_items (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  cargo_id uuid references cargos(id) on delete cascade, -- null = común a todos los cargos
  categoria categoria_induccion not null default 'otro',
  titulo text not null,
  descripcion text,
  orden int default 0,
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

comment on table induccion_items is 'Plantilla del plan de inducción: puntos comunes (cargo_id null) generados desde Identidad Organizacional, y puntos específicos por cargo generados desde su perfil (funciones, riesgos, EPP, exámenes de ingreso, formación mínima). Editable por admin_th.';

create index idx_induccion_items_cargo on induccion_items(cargo_id);
create index idx_induccion_items_empresa on induccion_items(empresa_id);

-- ── Checklist real por colaborador ──────────────────────────────────────
create table colaborador_induccion_items (
  id uuid primary key default gen_random_uuid(),
  colaborador_id uuid not null references colaboradores(id) on delete cascade,
  item_id uuid not null references induccion_items(id) on delete cascade,
  completado boolean not null default false,
  completado_en timestamptz,
  completado_por uuid references perfiles_usuario(id) on delete set null,
  notas text,
  asignado_en timestamptz not null default now(),
  unique(colaborador_id, item_id)
);

comment on table colaborador_induccion_items is 'Copia por colaborador de los puntos de induccion_items que le aplican (comunes + los de su cargo). Se marca completado por el líder directo o admin_th, quedando registrado quién y cuándo.';

create index idx_colab_induccion_colaborador on colaborador_induccion_items(colaborador_id);

-- ── RLS ──────────────────────────────────────────────────────────────────
alter table induccion_items enable row level security;
alter table colaborador_induccion_items enable row level security;

create policy "induccion_items: lectura empresa" on induccion_items for select
  using (empresa_id = fn_mi_empresa_id());
create policy "induccion_items: admin_th administra" on induccion_items for insert
  with check (empresa_id = fn_mi_empresa_id() and fn_mi_rol() = 'admin_th');
create policy "induccion_items: admin_th actualiza" on induccion_items for update
  using (empresa_id = fn_mi_empresa_id() and fn_mi_rol() = 'admin_th');
create policy "induccion_items: admin_th elimina" on induccion_items for delete
  using (empresa_id = fn_mi_empresa_id() and fn_mi_rol() = 'admin_th');

create policy "colab_induccion: admin_th todo" on colaborador_induccion_items for all
  using (exists(select 1 from colaboradores co where co.id = colaborador_id and co.empresa_id = fn_mi_empresa_id()) and fn_mi_rol() = 'admin_th');
create policy "colab_induccion: lider ve su equipo" on colaborador_induccion_items for select
  using (fn_es_mi_equipo(colaborador_id));
create policy "colab_induccion: lider marca cumplido en su equipo" on colaborador_induccion_items for update
  using (fn_es_mi_equipo(colaborador_id));
create policy "colab_induccion: colaborador ve la propia" on colaborador_induccion_items for select
  using (colaborador_id = fn_mi_colaborador_id());
