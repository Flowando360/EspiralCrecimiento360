-- Informe de pruebas (Luisa), 9.3: el FODA deja de ser cuatro cajas de texto. Se agrega la priorización
-- de factores (impacto x probabilidad), las estrategias cruzadas (matriz TOWS: FO, FA, DO, DA) y la
-- conexión con riesgos formales y con el plan de trabajo anual. La IA solo propone; la persona decide.

-- ── Priorización de cada factor (misma escala 1-3 que la matriz de riesgos) ─────────────────────────
alter table contexto_items add column if not exists impacto smallint check (impacto is null or impacto between 1 and 3);
alter table contexto_items add column if not exists probabilidad smallint check (probabilidad is null or probabilidad between 1 and 3);
alter table contexto_items add column if not exists sugerencia_ia text;
-- Si el factor ya se convirtió en un riesgo u oportunidad formal de la matriz de Riesgos y oportunidades
alter table contexto_items add column if not exists riesgo_id uuid references matriz_riesgos_controles(id) on delete set null;

comment on column contexto_items.sugerencia_ia is 'Sugerencia de la IA sobre qué hacer con el factor (convertir en riesgo, acción del plan o seguimiento) y por qué. Es una propuesta, no una decisión.';

-- ── Estrategias cruzadas (TOWS / CAME) ──────────────────────────────────────────────────────────────
create table if not exists contexto_estrategias (
  id uuid primary key default gen_random_uuid(),
  analisis_id uuid not null references analisis_contexto(id) on delete cascade,
  -- FO: fortalezas que aprovechan oportunidades · FA: fortalezas que enfrentan amenazas
  -- DO: superar debilidades aprovechando oportunidades · DA: reducir debilidades y evitar amenazas
  tipo text not null check (tipo in ('fo', 'fa', 'do', 'da')),
  descripcion text not null,
  -- Factores del FODA que la estrategia cruza
  item_ids uuid[] not null default '{}',
  origen text not null default 'manual' check (origen in ('manual', 'ia')),
  estado text not null default 'propuesta' check (estado in ('propuesta', 'aprobada', 'descartada')),
  -- Actividad del plan de trabajo anual en que se convirtió
  actividad_id uuid references plan_trabajo_actividades(id) on delete set null,
  created_at timestamptz not null default now()
);

comment on table contexto_estrategias is 'Estrategias que salen de cruzar los factores del FODA (matriz TOWS). Las propuestas por IA nacen en estado «propuesta» hasta que Talento Humano las aprueba o descarta.';

create index if not exists idx_contexto_estrategias_analisis on contexto_estrategias(analisis_id);

alter table contexto_estrategias enable row level security;

drop policy if exists "contexto_estrategias: lectura empresa" on contexto_estrategias;
create policy "contexto_estrategias: lectura empresa" on contexto_estrategias for select
  using (exists (select 1 from analisis_contexto a where a.id = contexto_estrategias.analisis_id and a.empresa_id = fn_mi_empresa_id()));

drop policy if exists "contexto_estrategias: admin_th administra" on contexto_estrategias;
create policy "contexto_estrategias: admin_th administra" on contexto_estrategias for all
  using (fn_mi_rol() = 'admin_th' and exists (select 1 from analisis_contexto a where a.id = contexto_estrategias.analisis_id and a.empresa_id = fn_mi_empresa_id()))
  with check (fn_mi_rol() = 'admin_th' and exists (select 1 from analisis_contexto a where a.id = contexto_estrategias.analisis_id and a.empresa_id = fn_mi_empresa_id()));
