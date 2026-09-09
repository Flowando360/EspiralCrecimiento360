-- ============================================================================
-- 0047_clima_organizacional.sql
-- Módulo de clima organizacional / compromiso (eNPS + 6 dimensiones), por
-- rondas. Hoy el sistema solo mide desempeño (cómo lo está haciendo cada
-- persona); esto mide cómo se siente la gente, la otra mitad de una
-- gestión de talento fuerte.
--
-- Diseño de privacidad (deliberado, no un descuido):
-- - "clima_participaciones" identifica QUIÉN respondió (para permitir una
--   sola respuesta por persona por ronda y calcular % de participación),
--   pero NO qué respondió.
-- - "clima_respuestas" guarda QUÉ se respondió, sin ninguna columna que
--   apunte a colaborador_id — solo un snapshot del líder directo de esa
--   persona al momento de responder (equipo_lider_id), para poder mostrarle
--   a cada líder el clima de su propio equipo. No hay forma de unir ambas
--   tablas entre sí.
-- - Todo resultado agregado (empresa o equipo) se oculta mientras haya
--   menos de UMBRAL_ANONIMATO respuestas en ese grupo, para que nunca sea
--   posible inferir la respuesta de una sola persona en un equipo pequeño.
--   El umbral está aplicado dos veces: en las vistas (SQL) y otra vez en la
--   pantalla (defensa en profundidad).
-- - Los comentarios de texto libre (el dato más re-identificable) solo los
--   ve admin_th, nunca líder ni gerencia.
-- ============================================================================

create type estado_ronda_clima as enum ('abierta', 'cerrada');

create table clima_rondas (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  nombre text not null,
  estado estado_ronda_clima not null default 'abierta',
  fecha_apertura date not null default current_date,
  fecha_cierre date,
  creada_por uuid references perfiles_usuario(id) on delete set null,
  created_at timestamptz not null default now()
);

comment on table clima_rondas is 'Una medición de clima/compromiso abierta por admin_th. Solo puede haber una ronda abierta a la vez por empresa.';

-- Solo una ronda "abierta" por empresa a la vez.
create unique index idx_clima_rondas_una_abierta on clima_rondas(empresa_id) where estado = 'abierta';

alter table clima_rondas enable row level security;

create policy "clima_rondas: lectura de la empresa" on clima_rondas for select
  using (empresa_id = fn_mi_empresa_id());
create policy "clima_rondas: admin_th crea" on clima_rondas for insert
  with check (empresa_id = fn_mi_empresa_id() and fn_mi_rol() = 'admin_th');
create policy "clima_rondas: admin_th actualiza (cerrar)" on clima_rondas for update
  using (empresa_id = fn_mi_empresa_id() and fn_mi_rol() = 'admin_th');

-- ── Participación: identifica quién respondió, no qué respondió ───────────
create table clima_participaciones (
  id uuid primary key default gen_random_uuid(),
  ronda_id uuid not null references clima_rondas(id) on delete cascade,
  colaborador_id uuid not null references colaboradores(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (ronda_id, colaborador_id)
);

comment on table clima_participaciones is 'Registro de quién ya respondió cada ronda (para no dejar responder dos veces y calcular % de participación) — deliberadamente separada de clima_respuestas, sin ninguna forma de unir ambas.';

alter table clima_participaciones enable row level security;

create policy "clima_participaciones: colaborador registra la suya" on clima_participaciones for insert
  with check (colaborador_id = fn_mi_colaborador_id());
create policy "clima_participaciones: colaborador ve la suya" on clima_participaciones for select
  using (colaborador_id = fn_mi_colaborador_id());
create policy "clima_participaciones: admin_th ve las de su empresa" on clima_participaciones for select
  using (
    fn_mi_rol() = 'admin_th'
    and exists (select 1 from clima_rondas r where r.id = ronda_id and r.empresa_id = fn_mi_empresa_id())
  );

-- ── Respuestas: anónimas, sin colaborador_id ───────────────────────────────
create table clima_respuestas (
  id uuid primary key default gen_random_uuid(),
  ronda_id uuid not null references clima_rondas(id) on delete cascade,
  equipo_lider_id uuid references colaboradores(id) on delete set null, -- snapshot del líder directo al responder; solo para poder agregar por equipo
  enps smallint not null check (enps between 0 and 10),
  reconocimiento smallint not null check (reconocimiento between 1 and 5),
  liderazgo smallint not null check (liderazgo between 1 and 5),
  desarrollo smallint not null check (desarrollo between 1 and 5),
  comunicacion smallint not null check (comunicacion between 1 and 5),
  condiciones smallint not null check (condiciones between 1 and 5),
  pertenencia smallint not null check (pertenencia between 1 and 5),
  comentario text,
  created_at timestamptz not null default now()
);

comment on table clima_respuestas is 'Respuestas anónimas de la medición de clima: eNPS (0-10) + 6 dimensiones (1-5). Sin colaborador_id — equipo_lider_id es solo un snapshot para poder agregar por equipo, nunca identifica a la persona que respondió.';

create index idx_clima_respuestas_ronda on clima_respuestas(ronda_id);
create index idx_clima_respuestas_equipo on clima_respuestas(ronda_id, equipo_lider_id);

alter table clima_respuestas enable row level security;

create policy "clima_respuestas: colaborador registra la suya" on clima_respuestas for insert
  with check (
    fn_mi_colaborador_id() is not null
    and exists (select 1 from clima_rondas r where r.id = ronda_id and r.empresa_id = fn_mi_empresa_id() and r.estado = 'abierta')
  );
create policy "clima_respuestas: admin_th y gerencia ven las de su empresa" on clima_respuestas for select
  using (
    fn_mi_rol() in ('admin_th', 'gerencia')
    and exists (select 1 from clima_rondas r where r.id = ronda_id and r.empresa_id = fn_mi_empresa_id())
  );
create policy "clima_respuestas: lider ve las de su propio equipo" on clima_respuestas for select
  using (equipo_lider_id = fn_mi_colaborador_id());

-- ── Umbral de anonimato: por debajo de 5 respuestas, ningún agregado se
-- calcula (queda null) — ni a nivel empresa ni a nivel equipo.
--
-- IMPORTANTE: en Postgres/Supabase, una vista corre con los privilegios de
-- su dueño, NO con la RLS del que consulta (ver el mismo comentario en
-- v_nexa_curso_opciones, 0034) — así que estas dos vistas repiten a mano
-- el filtro de empresa (para no filtrar entre empresas) y, en el caso de
-- equipo, el filtro de "es tu propio equipo" (para que un líder no pueda
-- ver el de otro líder), en vez de depender de la RLS de clima_respuestas.
create or replace view v_clima_ronda_resumen as
select
  rda.id as ronda_id,
  rda.empresa_id,
  rda.nombre,
  rda.estado,
  rda.fecha_apertura,
  rda.fecha_cierre,
  count(resp.id) as num_respuestas,
  case when fn_mi_rol() in ('admin_th', 'gerencia') and count(resp.id) >= 5 then
    round(100.0 * (count(*) filter (where resp.enps >= 9) - count(*) filter (where resp.enps <= 6)) / nullif(count(resp.id), 0))
  end as enps,
  case when fn_mi_rol() in ('admin_th', 'gerencia') and count(resp.id) >= 5 then round(avg(resp.reconocimiento), 2) end as prom_reconocimiento,
  case when fn_mi_rol() in ('admin_th', 'gerencia') and count(resp.id) >= 5 then round(avg(resp.liderazgo), 2) end as prom_liderazgo,
  case when fn_mi_rol() in ('admin_th', 'gerencia') and count(resp.id) >= 5 then round(avg(resp.desarrollo), 2) end as prom_desarrollo,
  case when fn_mi_rol() in ('admin_th', 'gerencia') and count(resp.id) >= 5 then round(avg(resp.comunicacion), 2) end as prom_comunicacion,
  case when fn_mi_rol() in ('admin_th', 'gerencia') and count(resp.id) >= 5 then round(avg(resp.condiciones), 2) end as prom_condiciones,
  case when fn_mi_rol() in ('admin_th', 'gerencia') and count(resp.id) >= 5 then round(avg(resp.pertenencia), 2) end as prom_pertenencia,
  case when fn_mi_rol() in ('admin_th', 'gerencia') and count(resp.id) >= 5 then
    round(avg((resp.reconocimiento + resp.liderazgo + resp.desarrollo + resp.comunicacion + resp.condiciones + resp.pertenencia) / 6.0), 2)
  end as indice_clima_general
from clima_rondas rda
left join clima_respuestas resp on resp.ronda_id = rda.id
where rda.empresa_id = fn_mi_empresa_id()
group by rda.id, rda.empresa_id, rda.nombre, rda.estado, rda.fecha_apertura, rda.fecha_cierre;

comment on view v_clima_ronda_resumen is 'Resumen de una ronda de clima a nivel empresa (eNPS + 6 dimensiones + índice general). La fila (metadatos de la ronda) la ve cualquiera de la empresa, para saber si hay una ronda abierta; los números agregados solo se calculan para admin_th/gerencia y solo con al menos 5 respuestas.';

create or replace view v_clima_equipo_resumen as
select
  resp.equipo_lider_id as lider_id,
  resp.ronda_id,
  rda.empresa_id,
  count(*) as num_respuestas,
  case when count(*) >= 5 then
    round(100.0 * (count(*) filter (where resp.enps >= 9) - count(*) filter (where resp.enps <= 6)) / nullif(count(*), 0))
  end as enps,
  case when count(*) >= 5 then
    round(avg((resp.reconocimiento + resp.liderazgo + resp.desarrollo + resp.comunicacion + resp.condiciones + resp.pertenencia) / 6.0), 2)
  end as indice_clima_general
from clima_respuestas resp
join clima_rondas rda on rda.id = resp.ronda_id
where resp.equipo_lider_id is not null
  and rda.empresa_id = fn_mi_empresa_id()
  and (fn_mi_rol() in ('admin_th', 'gerencia') or resp.equipo_lider_id = fn_mi_colaborador_id())
group by resp.equipo_lider_id, resp.ronda_id, rda.empresa_id;

comment on view v_clima_equipo_resumen is 'Resumen de una ronda por equipo (agrupado por líder directo). El filtro de fila (no solo de valores) ya deja ver únicamente: admin_th/gerencia ven todos los equipos, un líder solo ve la fila de su propio equipo. Por debajo de 5 respuestas en ese equipo, los números quedan en null.';
