-- ============================================================================
-- 0061_seleccion_items_evaluacion_por_cargo.sql
--
-- Le permite a admin_th elegir, por cargo, cuáles competencias y funciones
-- principales se incluyen al generar las evaluaciones de ese período —
-- pedido explícito (ver captura de referencia: "Selección de ítems").
--
-- Modelo de EXCLUSIÓN, no de inclusión: una fila acá significa "este ítem
-- NO se incluye para este cargo". Vacío = se incluyen todos por defecto
-- (mismo comportamiento del ejemplo: "Si no guardas ninguna selección, se
-- incluyen todos por defecto") — así un cargo nuevo no necesita que nadie
-- configure nada para funcionar como hoy.
-- ============================================================================

create table cargo_items_evaluacion_excluidos (
  id uuid primary key default gen_random_uuid(),
  cargo_id uuid not null references cargos(id) on delete cascade,
  competencia_id uuid references competencias(id) on delete cascade,
  cargo_funcion_id uuid references cargo_funciones_principales(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint chk_un_solo_tipo_de_item check (
    (competencia_id is not null and cargo_funcion_id is null)
    or (competencia_id is null and cargo_funcion_id is not null)
  )
);

comment on table cargo_items_evaluacion_excluidos is 'Ítems (competencia o función principal) que TH decidió NO incluir al generar evaluaciones para este cargo. Ver /api/evaluaciones, que filtra por esto al armar evaluacion_items.';

create unique index uq_cargo_items_excl_competencia on cargo_items_evaluacion_excluidos(cargo_id, competencia_id) where competencia_id is not null;
create unique index uq_cargo_items_excl_funcion on cargo_items_evaluacion_excluidos(cargo_id, cargo_funcion_id) where cargo_funcion_id is not null;

alter table cargo_items_evaluacion_excluidos enable row level security;

create policy "exclusiones: lectura empresa" on cargo_items_evaluacion_excluidos for select
  using (exists(select 1 from cargos c where c.id = cargo_id and c.empresa_id = fn_mi_empresa_id()));

create policy "exclusiones: admin_th edita" on cargo_items_evaluacion_excluidos for all
  using (
    fn_mi_rol() = 'admin_th'
    and exists(select 1 from cargos c where c.id = cargo_id and c.empresa_id = fn_mi_empresa_id())
  );
