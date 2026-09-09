-- ============================================================================
-- 0014_ser_aspectos_puntajes.sql
-- Reemplaza a 0013 (nunca aplicada). En vez de un solo puntaje 1-5 para
-- toda la dimensión Ser, se modela con el mismo patrón catálogo+respuestas
-- que ya usa Hacer/Deber (competencias + evaluacion_items + respuestas),
-- para que el puntaje se pueda desglosar por cada uno de los aspectos
-- reales de la Guía del Flow (Esencia, Emociones, Pertenencia y
-- Compromiso, Desafíos — ver docs/ejemplo-guia-del-flow.pdf) y quede
-- estructurado desde ya para cuando se automatice su generación completa.
--
-- admin_th carga el puntaje oficial de cada aspecto (viene del resultado
-- que genera Flowando). El colaborador solo puede leer sus puntajes y
-- dejar su propio comentario/reflexión — nunca modificar el puntaje — por
-- eso el comentario vive en una tabla aparte (ser_comentarios_colaborador),
-- con su propia policy de escritura, en vez de una columna más en
-- ser_puntajes que sería más difícil de proteger con RLS.
-- ============================================================================

create type bloque_ser as enum ('esencia', 'emociones', 'pertenencia_compromiso', 'desafios');

create table ser_aspectos (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  bloque bloque_ser not null,
  nombre text not null,
  orden int default 0
);

comment on table ser_aspectos is 'Catálogo fijo de los ~30 aspectos que mide la Guía del Flow (metodología de Flowando), agrupados en 4 bloques. Igual para toda empresa cliente.';

-- Necesario para que el ON CONFLICT DO NOTHING del seed de más abajo sea
-- idempotente (evita duplicar si esta migración se corre dos veces).
create unique index uq_ser_aspectos_empresa_nombre on ser_aspectos(empresa_id, nombre);

create table ser_puntajes (
  id uuid primary key default gen_random_uuid(),
  guia_del_flow_id uuid not null references guia_del_flow(id) on delete cascade,
  aspecto_id uuid not null references ser_aspectos(id) on delete cascade,
  puntaje int not null check (puntaje between 1 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (guia_del_flow_id, aspecto_id)
);

comment on table ser_puntajes is 'Puntaje 1-5 (misma escala que Hacer/Deber) de cada aspecto de Ser, cargado por admin_th. Un snapshot por aplicación de la Guía del Flow (guia_del_flow_id), no directo al colaborador, para conservar el histórico si se repite más adelante.';

create table ser_comentarios_colaborador (
  id uuid primary key default gen_random_uuid(),
  guia_del_flow_id uuid not null references guia_del_flow(id) on delete cascade,
  aspecto_id uuid references ser_aspectos(id) on delete cascade, -- null = comentario general sobre el conjunto
  colaborador_id uuid not null references colaboradores(id) on delete cascade,
  comentario text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (guia_del_flow_id, aspecto_id)
);

create unique index uq_ser_comentario_general on ser_comentarios_colaborador(guia_del_flow_id) where aspecto_id is null;

comment on table ser_comentarios_colaborador is 'Reflexión personal del propio colaborador sobre un aspecto puntual (aspecto_id) o sobre el conjunto de su Guía del Flow (aspecto_id null). Nunca modifica ser_puntajes.';

-- ── Promedio de Ser (1-5) por colaborador, para el Informe de brechas ──────
-- Solo la aplicación (guia_del_flow) más reciente de cada colaborador.
create or replace view v_ser_promedio as
select
  g.colaborador_id,
  round(avg(sp.puntaje)::numeric, 2) as promedio_ser,
  count(sp.id) as total_aspectos_calificados
from guia_del_flow g
join ser_puntajes sp on sp.guia_del_flow_id = g.id
where g.id in (
  select distinct on (colaborador_id) id
  from guia_del_flow
  order by colaborador_id, fecha_aplicacion desc, created_at desc
)
group by g.colaborador_id;

comment on view v_ser_promedio is 'Promedio 1-5 de los aspectos de Ser de la aplicación más reciente de cada colaborador. Usado por el Informe de brechas por dimensión.';

-- ── RLS ──────────────────────────────────────────────────────────────────
alter table ser_aspectos enable row level security;
alter table ser_puntajes enable row level security;
alter table ser_comentarios_colaborador enable row level security;

-- Catálogo: mismo patrón que competencias/escala_niveles.
create policy "ser_aspectos: lectura empresa" on ser_aspectos for select
  using (empresa_id = fn_mi_empresa_id());
create policy "ser_aspectos: admin_th edita" on ser_aspectos for all
  using (empresa_id = fn_mi_empresa_id() and fn_mi_rol() = 'admin_th');

-- Puntajes: admin_th todo; líder y colaborador SOLO lectura (nunca insert/update/delete).
create policy "ser_puntajes: admin_th todo" on ser_puntajes for all
  using (
    exists(
      select 1 from guia_del_flow g join colaboradores co on co.id = g.colaborador_id
      where g.id = guia_del_flow_id and co.empresa_id = fn_mi_empresa_id()
    ) and fn_mi_rol() = 'admin_th'
  );
create policy "ser_puntajes: colaborador ve el propio" on ser_puntajes for select
  using (exists(select 1 from guia_del_flow g where g.id = guia_del_flow_id and g.colaborador_id = fn_mi_colaborador_id()));
create policy "ser_puntajes: lider ve el de su equipo" on ser_puntajes for select
  using (exists(select 1 from guia_del_flow g where g.id = guia_del_flow_id and fn_es_mi_equipo(g.colaborador_id)));

-- Comentarios del colaborador: el propio colaborador administra el suyo; admin_th todo; líder solo lee.
create policy "ser_comentarios: admin_th todo" on ser_comentarios_colaborador for all
  using (
    exists(select 1 from colaboradores co where co.id = colaborador_id and co.empresa_id = fn_mi_empresa_id())
    and fn_mi_rol() = 'admin_th'
  );
create policy "ser_comentarios: propio colaborador administra el suyo" on ser_comentarios_colaborador for all
  using (colaborador_id = fn_mi_colaborador_id());
create policy "ser_comentarios: lider ve el de su equipo" on ser_comentarios_colaborador for select
  using (fn_es_mi_equipo(colaborador_id));

-- ── Catálogo fijo: los 30 aspectos reales de la Guía del Flow ──────────────
-- (docs/ejemplo-guia-del-flow.pdf — plantilla estándar de Flowando, igual
-- para toda empresa cliente; sembrado aquí para la empresa piloto).
insert into ser_aspectos (empresa_id, bloque, nombre, orden) values
('00000000-0000-0000-0000-000000000001','esencia','Carácter',1),
('00000000-0000-0000-0000-000000000001','esencia','Temperamento',2),
('00000000-0000-0000-0000-000000000001','esencia','Talentos innatos',3),
('00000000-0000-0000-0000-000000000001','esencia','Talentos para potenciar',4),
('00000000-0000-0000-0000-000000000001','esencia','Propósito – Intuición',5),
('00000000-0000-0000-0000-000000000001','esencia','Propósito – Equilibrio',6),
('00000000-0000-0000-0000-000000000001','esencia','Liderazgo – Inspirar',7),
('00000000-0000-0000-0000-000000000001','esencia','Liderazgo – Transformacional',8),
('00000000-0000-0000-0000-000000000001','esencia','Comunicación',9),
('00000000-0000-0000-0000-000000000001','esencia','Inteligencia musical',10),
('00000000-0000-0000-0000-000000000001','esencia','Inteligencia naturaleza',11),
('00000000-0000-0000-0000-000000000001','esencia','Inteligencia expresiva',12),
('00000000-0000-0000-0000-000000000001','esencia','Ecos infancia',13),

('00000000-0000-0000-0000-000000000001','emociones','El pasado',1),
('00000000-0000-0000-0000-000000000001','emociones','Tolerancia a la frustración',2),
('00000000-0000-0000-0000-000000000001','emociones','Estabilidad emocional',3),
('00000000-0000-0000-0000-000000000001','emociones','Felicidad',4),

('00000000-0000-0000-0000-000000000001','pertenencia_compromiso','Dependencia',1),
('00000000-0000-0000-0000-000000000001','pertenencia_compromiso','Pertenencia',2),
('00000000-0000-0000-0000-000000000001','pertenencia_compromiso','Trabajo en equipo',3),
('00000000-0000-0000-0000-000000000001','pertenencia_compromiso','Responsabilidad',4),

('00000000-0000-0000-0000-000000000001','desafios','Etapa del Flow',1),
('00000000-0000-0000-0000-000000000001','desafios','Retos internos',2),
('00000000-0000-0000-0000-000000000001','desafios','Desafíos de sanación',3),
('00000000-0000-0000-0000-000000000001','desafios','Balance',4),
('00000000-0000-0000-0000-000000000001','desafios','Tu mente faro',5),
('00000000-0000-0000-0000-000000000001','desafios','Compromiso',6),
('00000000-0000-0000-0000-000000000001','desafios','Adaptación al cambio',7),
('00000000-0000-0000-0000-000000000001','desafios','Negociación',8),
('00000000-0000-0000-0000-000000000001','desafios','Recursividad',9)
on conflict do nothing;
