-- ============================================================================
-- 0094_nexa_makigami.sql
-- Nexa · Cacería Makigami: un reto colaborativo de mejora de procesos
-- administrativos (metodología Lean Makigami) convertido en dinámica de
-- formación gamificada.
--
-- Ciclo de un reto (columna estado):
--   mapeo      → el facilitador (admin_th o el líder que lo creó) dibuja el
--                proceso actual: carriles (roles/áreas) y pasos con tiempos.
--   caceria    → toda la empresa "caza" desperdicios Lean sobre los pasos.
--   rediseno   → se proponen mejoras, se votan y el facilitador aprueba.
--   cerrado    → resultados: tiempo antes vs. después, publicado en el Feed.
--
-- Los puntos NO viven aquí: se otorgan al pool existente nexa_reconocimientos
-- (src/lib/nexa/gamificacion.ts), igual que el resto de la gamificación.
--
-- Escrita con IF NOT EXISTS / DROP POLICY IF EXISTS / ON CONFLICT para poder
-- correrse más de una vez sin error.
-- ============================================================================

create table if not exists nexa_makigami_retos (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  proceso_id uuid references procesos_gestion(id) on delete set null,
  titulo text not null,
  descripcion text,
  inicio_proceso text,
  fin_proceso text,
  estado text not null default 'mapeo',
  fecha_limite date,
  creado_por uuid references colaboradores(id) on delete set null,
  cerrado_en timestamptz,
  created_at timestamptz not null default now()
);

do $$ begin
  alter table nexa_makigami_retos add constraint nexa_makigami_retos_estado_check
    check (estado in ('mapeo', 'caceria', 'rediseno', 'cerrado'));
exception when duplicate_object then null; end $$;

-- Los puntos de cazar/proponer se entregan en lote al cerrar cada fase (no al
-- marcar), para que marcar-desmarcar-volver a marcar no regale puntos. Estas
-- banderas evitan entregarlos dos veces si el facilitador retrocede de fase.
alter table nexa_makigami_retos add column if not exists puntos_caceria_otorgados boolean not null default false;
alter table nexa_makigami_retos add column if not exists puntos_rediseno_otorgados boolean not null default false;

comment on table nexa_makigami_retos is 'Cacería Makigami (Nexa): reto colaborativo para mapear un proceso administrativo, cazar desperdicios Lean y rediseñarlo.';

create table if not exists nexa_makigami_carriles (
  id uuid primary key default gen_random_uuid(),
  reto_id uuid not null references nexa_makigami_retos(id) on delete cascade,
  nombre text not null,
  orden int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists nexa_makigami_pasos (
  id uuid primary key default gen_random_uuid(),
  reto_id uuid not null references nexa_makigami_retos(id) on delete cascade,
  carril_id uuid not null references nexa_makigami_carriles(id) on delete cascade,
  orden int not null default 0,
  descripcion text not null,
  tiempo_trabajo_min numeric not null default 0,
  tiempo_espera_min numeric not null default 0,
  documento_sistema text,
  clasificacion text,
  created_at timestamptz not null default now()
);

do $$ begin
  alter table nexa_makigami_pasos add constraint nexa_makigami_pasos_clasificacion_check
    check (clasificacion is null or clasificacion in ('agrega_valor', 'necesaria', 'desperdicio'));
exception when duplicate_object then null; end $$;

comment on column nexa_makigami_pasos.orden is 'Posición en la secuencia del proceso (columna del Makigami). Un paso por columna.';
comment on column nexa_makigami_pasos.clasificacion is 'Clasificación Lean del facilitador: agrega_valor (AV), necesaria (NAV-N, p.ej. normativa) o desperdicio (NAV). null = sin clasificar (se trata como necesaria).';

create table if not exists nexa_makigami_cazas (
  id uuid primary key default gen_random_uuid(),
  reto_id uuid not null references nexa_makigami_retos(id) on delete cascade,
  paso_id uuid not null references nexa_makigami_pasos(id) on delete cascade,
  colaborador_id uuid not null references colaboradores(id) on delete cascade,
  tipo_desperdicio text not null,
  comentario text,
  created_at timestamptz not null default now(),
  unique (paso_id, colaborador_id, tipo_desperdicio)
);

do $$ begin
  alter table nexa_makigami_cazas add constraint nexa_makigami_cazas_tipo_check
    check (tipo_desperdicio in ('esperas', 'traspasos', 'sobreprocesamiento', 'defectos', 'movimiento', 'inventario', 'sobreproduccion', 'talento'));
exception when duplicate_object then null; end $$;

comment on table nexa_makigami_cazas is 'Cada desperdicio Lean que un colaborador "cazó" en un paso. El primero en cazar un (paso, tipo) es el pionero; con 3 cazadores el hallazgo queda validado por el equipo.';

create table if not exists nexa_makigami_propuestas (
  id uuid primary key default gen_random_uuid(),
  reto_id uuid not null references nexa_makigami_retos(id) on delete cascade,
  paso_id uuid references nexa_makigami_pasos(id) on delete set null,
  colaborador_id uuid not null references colaboradores(id) on delete cascade,
  accion text not null default 'simplificar',
  descripcion text not null,
  ahorro_estimado_min numeric not null default 0,
  estado text not null default 'propuesta',
  acpm_id uuid references acpm(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table nexa_makigami_propuestas add column if not exists puntos_aprobacion_otorgados boolean not null default false;

do $$ begin
  alter table nexa_makigami_propuestas add constraint nexa_makigami_propuestas_accion_check
    check (accion in ('eliminar', 'simplificar', 'automatizar', 'combinar', 'otro'));
exception when duplicate_object then null; end $$;
do $$ begin
  alter table nexa_makigami_propuestas add constraint nexa_makigami_propuestas_estado_check
    check (estado in ('propuesta', 'aprobada', 'descartada'));
exception when duplicate_object then null; end $$;

create table if not exists nexa_makigami_votos (
  propuesta_id uuid not null references nexa_makigami_propuestas(id) on delete cascade,
  colaborador_id uuid not null references colaboradores(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (propuesta_id, colaborador_id)
);

create index if not exists idx_makigami_retos_empresa on nexa_makigami_retos(empresa_id);
create index if not exists idx_makigami_carriles_reto on nexa_makigami_carriles(reto_id);
create index if not exists idx_makigami_pasos_reto on nexa_makigami_pasos(reto_id);
create index if not exists idx_makigami_cazas_reto on nexa_makigami_cazas(reto_id);
create index if not exists idx_makigami_cazas_colaborador on nexa_makigami_cazas(colaborador_id);
create index if not exists idx_makigami_propuestas_reto on nexa_makigami_propuestas(reto_id);

-- ----------------------------------------------------------------------------
-- RLS
-- Facilitador de un reto = admin_th (cualquiera) o el líder que lo creó.
-- ----------------------------------------------------------------------------
create or replace function fn_makigami_puedo_facilitar(p_reto_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from nexa_makigami_retos r
    where r.id = p_reto_id
      and r.empresa_id = fn_mi_empresa_id()
      and (fn_mi_rol() = 'admin_th' or (fn_mi_rol() = 'lider' and r.creado_por = fn_mi_colaborador_id()))
  );
$$;

create or replace function fn_makigami_reto_de_mi_empresa(p_reto_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from nexa_makigami_retos r where r.id = p_reto_id and r.empresa_id = fn_mi_empresa_id());
$$;

alter table nexa_makigami_retos enable row level security;
alter table nexa_makigami_carriles enable row level security;
alter table nexa_makigami_pasos enable row level security;
alter table nexa_makigami_cazas enable row level security;
alter table nexa_makigami_propuestas enable row level security;
alter table nexa_makigami_votos enable row level security;

drop policy if exists "makigami_retos: lectura empresa" on nexa_makigami_retos;
create policy "makigami_retos: lectura empresa" on nexa_makigami_retos for select
  using (empresa_id = fn_mi_empresa_id());
drop policy if exists "makigami_retos: crear admin_th o lider" on nexa_makigami_retos;
create policy "makigami_retos: crear admin_th o lider" on nexa_makigami_retos for insert
  with check (empresa_id = fn_mi_empresa_id() and fn_mi_rol() in ('admin_th', 'lider'));
drop policy if exists "makigami_retos: facilitador edita" on nexa_makigami_retos;
create policy "makigami_retos: facilitador edita" on nexa_makigami_retos for update
  using (fn_makigami_puedo_facilitar(id));
drop policy if exists "makigami_retos: facilitador elimina" on nexa_makigami_retos;
create policy "makigami_retos: facilitador elimina" on nexa_makigami_retos for delete
  using (fn_makigami_puedo_facilitar(id));

drop policy if exists "makigami_carriles: lectura empresa" on nexa_makigami_carriles;
create policy "makigami_carriles: lectura empresa" on nexa_makigami_carriles for select
  using (fn_makigami_reto_de_mi_empresa(reto_id));
drop policy if exists "makigami_carriles: facilitador administra" on nexa_makigami_carriles;
create policy "makigami_carriles: facilitador administra" on nexa_makigami_carriles for all
  using (fn_makigami_puedo_facilitar(reto_id)) with check (fn_makigami_puedo_facilitar(reto_id));

drop policy if exists "makigami_pasos: lectura empresa" on nexa_makigami_pasos;
create policy "makigami_pasos: lectura empresa" on nexa_makigami_pasos for select
  using (fn_makigami_reto_de_mi_empresa(reto_id));
drop policy if exists "makigami_pasos: facilitador administra" on nexa_makigami_pasos;
create policy "makigami_pasos: facilitador administra" on nexa_makigami_pasos for all
  using (fn_makigami_puedo_facilitar(reto_id)) with check (fn_makigami_puedo_facilitar(reto_id));

drop policy if exists "makigami_cazas: lectura empresa" on nexa_makigami_cazas;
create policy "makigami_cazas: lectura empresa" on nexa_makigami_cazas for select
  using (fn_makigami_reto_de_mi_empresa(reto_id));
drop policy if exists "makigami_cazas: cada quien caza" on nexa_makigami_cazas;
create policy "makigami_cazas: cada quien caza" on nexa_makigami_cazas for insert
  with check (colaborador_id = fn_mi_colaborador_id() and fn_makigami_reto_de_mi_empresa(reto_id));
drop policy if exists "makigami_cazas: cada quien retira la suya" on nexa_makigami_cazas;
create policy "makigami_cazas: cada quien retira la suya" on nexa_makigami_cazas for delete
  using (colaborador_id = fn_mi_colaborador_id());

drop policy if exists "makigami_propuestas: lectura empresa" on nexa_makigami_propuestas;
create policy "makigami_propuestas: lectura empresa" on nexa_makigami_propuestas for select
  using (fn_makigami_reto_de_mi_empresa(reto_id));
drop policy if exists "makigami_propuestas: cada quien propone" on nexa_makigami_propuestas;
create policy "makigami_propuestas: cada quien propone" on nexa_makigami_propuestas for insert
  with check (colaborador_id = fn_mi_colaborador_id() and fn_makigami_reto_de_mi_empresa(reto_id));
drop policy if exists "makigami_propuestas: facilitador resuelve" on nexa_makigami_propuestas;
create policy "makigami_propuestas: facilitador resuelve" on nexa_makigami_propuestas for update
  using (fn_makigami_puedo_facilitar(reto_id));
drop policy if exists "makigami_propuestas: autor o facilitador elimina" on nexa_makigami_propuestas;
create policy "makigami_propuestas: autor o facilitador elimina" on nexa_makigami_propuestas for delete
  using ((colaborador_id = fn_mi_colaborador_id() and estado = 'propuesta') or fn_makigami_puedo_facilitar(reto_id));

drop policy if exists "makigami_votos: lectura empresa" on nexa_makigami_votos;
create policy "makigami_votos: lectura empresa" on nexa_makigami_votos for select
  using (exists (select 1 from nexa_makigami_propuestas p where p.id = propuesta_id and fn_makigami_reto_de_mi_empresa(p.reto_id)));
drop policy if exists "makigami_votos: cada quien vota" on nexa_makigami_votos;
create policy "makigami_votos: cada quien vota" on nexa_makigami_votos for insert
  with check (
    colaborador_id = fn_mi_colaborador_id()
    and exists (select 1 from nexa_makigami_propuestas p where p.id = propuesta_id and fn_makigami_reto_de_mi_empresa(p.reto_id))
  );
drop policy if exists "makigami_votos: cada quien retira su voto" on nexa_makigami_votos;
create policy "makigami_votos: cada quien retira su voto" on nexa_makigami_votos for delete
  using (colaborador_id = fn_mi_colaborador_id());

-- ----------------------------------------------------------------------------
-- Datos demo (empresa piloto): un reto sobre Reclutamiento y Selección, ya en
-- fase de cacería, para que el módulo se vea funcionando desde el primer día.
-- ----------------------------------------------------------------------------
insert into nexa_makigami_retos (id, empresa_id, proceso_id, titulo, descripcion, inicio_proceso, fin_proceso, estado, fecha_limite)
select '32000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001',
  (select id from procesos_gestion where id = '20000000-0000-0000-0000-000000000006'),
  'De la vacante a la contratación',
  '¿Por qué cubrir una vacante nos toma casi un mes? Mapeamos el proceso real de Reclutamiento y Selección — ahora ayúdanos a encontrar dónde se nos va el tiempo.',
  'El líder detecta la necesidad de una vacante', 'El nuevo colaborador firma su contrato',
  'caceria', current_date + 10
where exists (select 1 from empresas where id = '00000000-0000-0000-0000-000000000001')
on conflict (id) do nothing;

insert into nexa_makigami_carriles (id, reto_id, nombre, orden)
select v.id::uuid, '32000000-0000-0000-0000-000000000001', v.nombre, v.orden
from (values
  ('32100000-0000-0000-0000-000000000001', 'Líder del área', 1),
  ('32100000-0000-0000-0000-000000000002', 'Talento Humano', 2),
  ('32100000-0000-0000-0000-000000000003', 'Gerencia', 3),
  ('32100000-0000-0000-0000-000000000004', 'Candidato', 4)
) as v(id, nombre, orden)
where exists (select 1 from nexa_makigami_retos where id = '32000000-0000-0000-0000-000000000001')
on conflict (id) do nothing;

insert into nexa_makigami_pasos (id, reto_id, carril_id, orden, descripcion, tiempo_trabajo_min, tiempo_espera_min, documento_sistema, clasificacion)
select v.id::uuid, '32000000-0000-0000-0000-000000000001', v.carril::uuid, v.orden, v.descripcion, v.trabajo, v.espera, v.doc, v.clasif
from (values
  ('32200000-0000-0000-0000-000000000001', '32100000-0000-0000-0000-000000000001', 1, 'Diligencia la solicitud de vacante en Excel y la envía por correo', 45, 120, 'Formato Excel + correo', 'necesaria'),
  ('32200000-0000-0000-0000-000000000002', '32100000-0000-0000-0000-000000000002', 2, 'Revisa la solicitud y la transcribe al formato oficial de requisición', 40, 1440, 'Formato de requisición', 'desperdicio'),
  ('32200000-0000-0000-0000-000000000003', '32100000-0000-0000-0000-000000000003', 3, 'Aprueba la requisición y el presupuesto del cargo', 15, 4320, 'Firma física', 'necesaria'),
  ('32200000-0000-0000-0000-000000000004', '32100000-0000-0000-0000-000000000002', 4, 'Publica la vacante en portales de empleo', 60, 7200, 'Portales de empleo', 'agrega_valor'),
  ('32200000-0000-0000-0000-000000000005', '32100000-0000-0000-0000-000000000002', 5, 'Filtra hojas de vida una por una', 240, 1440, 'Correo + carpeta compartida', 'necesaria'),
  ('32200000-0000-0000-0000-000000000006', '32100000-0000-0000-0000-000000000001', 6, 'Revisa las hojas de vida preseleccionadas (de nuevo)', 90, 2880, 'Correo', 'desperdicio'),
  ('32200000-0000-0000-0000-000000000007', '32100000-0000-0000-0000-000000000004', 7, 'Presenta entrevista y pruebas psicotécnicas', 180, 2880, 'Agenda + pruebas en papel', 'agrega_valor'),
  ('32200000-0000-0000-0000-000000000008', '32100000-0000-0000-0000-000000000002', 8, 'Verifica referencias laborales por teléfono', 60, 1440, 'Teléfono', 'necesaria'),
  ('32200000-0000-0000-0000-000000000009', '32100000-0000-0000-0000-000000000003', 9, 'Aprueba al candidato final', 15, 2880, 'Firma física', 'desperdicio'),
  ('32200000-0000-0000-0000-000000000010', '32100000-0000-0000-0000-000000000004', 10, 'Entrega documentos y firma el contrato', 60, 1440, 'Documentos físicos', 'agrega_valor')
) as v(id, carril, orden, descripcion, trabajo, espera, doc, clasif)
where exists (select 1 from nexa_makigami_carriles where id = '32100000-0000-0000-0000-000000000001')
on conflict (id) do nothing;

-- Algunas cazas de ejemplo repartidas entre los primeros colaboradores
-- internos de la empresa piloto (solo si el reto demo todavía no tiene cazas).
do $$
declare
  v_colabs uuid[];
begin
  if not exists (select 1 from nexa_makigami_retos where id = '32000000-0000-0000-0000-000000000001') then return; end if;
  if exists (select 1 from nexa_makigami_cazas where reto_id = '32000000-0000-0000-0000-000000000001') then return; end if;

  select array_agg(id order by nombre_completo) into v_colabs
  from (
    select id, nombre_completo from colaboradores
    where empresa_id = '00000000-0000-0000-0000-000000000001' and es_externo = false
    order by nombre_completo limit 4
  ) c;
  if v_colabs is null or array_length(v_colabs, 1) < 3 then return; end if;

  insert into nexa_makigami_cazas (reto_id, paso_id, colaborador_id, tipo_desperdicio, comentario, created_at) values
    ('32000000-0000-0000-0000-000000000001', '32200000-0000-0000-0000-000000000002', v_colabs[1], 'sobreprocesamiento', 'Se digita dos veces la misma información: primero en Excel y luego en el formato oficial.', now() - interval '3 days'),
    ('32000000-0000-0000-0000-000000000001', '32200000-0000-0000-0000-000000000002', v_colabs[2], 'sobreprocesamiento', null, now() - interval '2 days'),
    ('32000000-0000-0000-0000-000000000001', '32200000-0000-0000-0000-000000000002', v_colabs[3], 'sobreprocesamiento', null, now() - interval '1 day'),
    ('32000000-0000-0000-0000-000000000001', '32200000-0000-0000-0000-000000000003', v_colabs[2], 'esperas', 'La requisición espera 3 días la firma de Gerencia.', now() - interval '2 days'),
    ('32000000-0000-0000-0000-000000000001', '32200000-0000-0000-0000-000000000003', v_colabs[1], 'esperas', null, now() - interval '1 day'),
    ('32000000-0000-0000-0000-000000000001', '32200000-0000-0000-0000-000000000006', v_colabs[3], 'sobreprocesamiento', 'El líder vuelve a filtrar lo que TH ya filtró.', now() - interval '2 days'),
    ('32000000-0000-0000-0000-000000000001', '32200000-0000-0000-0000-000000000006', v_colabs[1], 'traspasos', null, now() - interval '1 day'),
    ('32000000-0000-0000-0000-000000000001', '32200000-0000-0000-0000-000000000009', v_colabs[2], 'sobreprocesamiento', 'Gerencia ya aprobó el cargo; una segunda firma no agrega valor.', now() - interval '1 day'),
    ('32000000-0000-0000-0000-000000000001', '32200000-0000-0000-0000-000000000005', v_colabs[3], 'movimiento', 'Buscar hojas de vida entre correo y carpeta compartida.', now() - interval '12 hours'),
    ('32000000-0000-0000-0000-000000000001', '32200000-0000-0000-0000-000000000007', v_colabs[1], 'defectos', 'Las pruebas en papel se califican a mano y a veces se pierden.', now() - interval '6 hours')
  on conflict do nothing;
end $$;
