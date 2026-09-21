-- ============================================================================
-- 0092_matriz_legal.sql
-- Módulo nuevo: Matriz de requisitos legales (Documentos/Matriz legal.xlsx,
-- código GC-MT-001) — registro de normas/leyes/reglamentos aplicables por
-- proceso, con su artículo, si se cumple, el soporte, acciones a seguir si
-- no cumple, y fecha de última revisión. Distinto de la matriz de riesgos
-- (que gestiona riesgos/oportunidades, no el cumplimiento de una norma
-- puntual) y del checklist de cumplimiento (que es por marco normativo
-- genérico, no por norma/artículo específico).
--
-- Escrita con IF NOT EXISTS / DROP POLICY IF EXISTS para poder correrse más
-- de una vez sin error, igual que las migraciones anteriores del módulo.
-- ============================================================================

create table if not exists requisitos_legales (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  proceso_id uuid references procesos_gestion(id) on delete set null,
  norma text not null,
  anio int,
  entidad_emisora text,
  asunto text,
  articulo text,
  nombre_articulo text,
  descripcion_articulo text,
  cumple boolean,
  soporte_cumplimiento text,
  acciones_a_seguir text,
  observaciones text,
  fecha_ultima_revision date,
  responsable_id uuid references colaboradores(id) on delete set null,
  created_at timestamptz not null default now()
);

comment on table requisitos_legales is 'Matriz de requisitos legales (GC-MT-001): normas/leyes/reglamentos aplicables por proceso, con su artículo, estado de cumplimiento, soporte y acciones a seguir si no cumple.';
comment on column requisitos_legales.cumple is 'null = sin evaluar todavía; true = cumple; false = no cumple (requiere acciones_a_seguir).';

create index if not exists idx_requisitos_legales_empresa on requisitos_legales(empresa_id);
create index if not exists idx_requisitos_legales_proceso on requisitos_legales(proceso_id);

alter table requisitos_legales enable row level security;

drop policy if exists "requisitos_legales: lectura empresa" on requisitos_legales;
create policy "requisitos_legales: lectura empresa" on requisitos_legales for select
  using (empresa_id = fn_mi_empresa_id());
drop policy if exists "requisitos_legales: admin_th administra" on requisitos_legales;
create policy "requisitos_legales: admin_th administra" on requisitos_legales for all
  using (empresa_id = fn_mi_empresa_id() and fn_mi_rol() = 'admin_th');
