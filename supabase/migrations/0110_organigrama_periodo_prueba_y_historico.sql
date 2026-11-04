-- ============================================================================
-- 0110_organigrama_periodo_prueba_y_historico.sql
-- Surgió de la inducción con Mármoles (2026-11-04):
--   1. Las personas en "periodo_prueba" (p. ej. los líderes recién ingresados)
--      no aparecían en el organigrama ni en la arquitectura de evaluadores
--      porque las vistas solo contaban a quienes están en estado 'activo'.
--      Ahora "vigente" = activo + periodo_prueba.
--   2. Al eliminar una ficha de colaborador se guarda antes un registro en un
--      histórico (quién pasó por la empresa y cuál fue su historia), por si
--      algún día vuelve o hay que consultarlo.
-- ============================================================================

-- ── 1. Vistas del organigrama con "vigentes" (activo + periodo_prueba) ──────
create or replace view v_organigrama_pares as
select
  c1.id as colaborador_id,
  c2.id as par_id
from colaboradores c1
join colaboradores c2
  on c1.lider_id is not distinct from c2.lider_id
  and c1.id <> c2.id
  and c1.lider_id is not null
where c1.estado in ('activo', 'periodo_prueba') and c2.estado in ('activo', 'periodo_prueba')
  and c1.es_externo = false and c2.es_externo = false;

create or replace view v_organigrama_colaboradores_a_cargo as
select
  lider.id as colaborador_id,
  subordinado.id as colaborador_a_cargo_id
from colaboradores lider
join colaboradores subordinado on subordinado.lider_id = lider.id
where lider.estado in ('activo', 'periodo_prueba')
  and subordinado.estado in ('activo', 'periodo_prueba')
  and subordinado.es_externo = false;

create or replace view v_lideres_de_linea_sin_lider_interno as
select distinct c.id as colaborador_id
from colaboradores c
where c.lider_id is null
  and c.estado in ('activo', 'periodo_prueba')
  and c.es_externo = false
  and exists (select 1 from colaboradores sub where sub.lider_id = c.id);

create or replace view v_organigrama_evaluadores as
select id as colaborador_id, 'lider'::tipo_evaluador as tipo_evaluador, lider_id as evaluador_id
from colaboradores
where lider_id is not null and estado in ('activo', 'periodo_prueba') and es_externo = false
union all
select colaborador_id, 'par'::tipo_evaluador, par_id
from v_organigrama_pares
union all
select colaborador_id, 'colaborador_a_cargo'::tipo_evaluador, colaborador_a_cargo_id
from v_organigrama_colaboradores_a_cargo
union all
select id as colaborador_id, 'autoevaluacion'::tipo_evaluador, id
from colaboradores where estado in ('activo', 'periodo_prueba') and es_externo = false
union all
select c1.colaborador_id, 'par'::tipo_evaluador, c2.colaborador_id
from v_lideres_de_linea_sin_lider_interno c1
join v_lideres_de_linea_sin_lider_interno c2 on c1.colaborador_id <> c2.colaborador_id;

-- ── 2. Histórico de colaboradores eliminados ────────────────────────────────
create table if not exists colaboradores_historico (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  colaborador_id_original uuid,
  nombre_completo text not null,
  numero_documento text,
  email text,
  cargo_nombre text,
  lider_nombre text,
  fecha_ingreso date,
  fecha_salida date,
  estado_al_eliminar text,
  motivo text,
  resumen jsonb not null default '{}'::jsonb,
  eliminado_por uuid references perfiles_usuario(id) on delete set null,
  eliminado_en timestamptz not null default now()
);

comment on table colaboradores_historico is 'Registro que queda cuando Talento Humano elimina una ficha: quién pasó por la empresa, con qué cargo y por qué se eliminó. No se borra solo.';

create index if not exists idx_colaboradores_historico_empresa on colaboradores_historico(empresa_id, eliminado_en desc);

alter table colaboradores_historico enable row level security;

create policy "colaboradores_historico: admin_th lee" on colaboradores_historico for select
  using (empresa_id = fn_mi_empresa_id() and fn_mi_rol() = 'admin_th');
create policy "colaboradores_historico: admin_th registra" on colaboradores_historico for insert
  with check (empresa_id = fn_mi_empresa_id() and fn_mi_rol() = 'admin_th');
