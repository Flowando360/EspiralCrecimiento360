-- ============================================================================
-- 0095_contexto_y_trazabilidad.sql
--
-- A partir de "Especificaciones_Mejoras_Aplicativo_Procesos_Sistemas_Gestion"
-- (revisión con la consultora Claudia, 25/09/2026): el módulo debe funcionar
-- como un sistema de relaciones, no solo formularios sueltos. Dos piezas:
--
--   1. Módulo nuevo CONTEXTO (análisis FODA), estructurado -- no un simple
--      archivo adjunto -- para que cada debilidad/oportunidad pueda generar
--      una acción trazable en ACPM, igual que ya pasa con un riesgo o un
--      hallazgo de auditoría (ver 0080).
--   2. Trazabilidad de origen ampliada: ACPM ahora también puede originarse
--      en un ítem de contexto, y Gestión del cambio (0081) gana un origen
--      opcional (riesgo, contexto u otro) -- la conversación fue explícita
--      en que esto NO debe ser obligatorio, un cambio puede no venir de
--      ningún origen puntual.
--
-- Escrita con IF NOT EXISTS / DROP POLICY IF EXISTS / bloques
-- "exception when duplicate_object" para poder correrse más de una vez sin
-- error, igual que las migraciones anteriores del módulo (ver
-- [[supabase-db-push-workflow]]).
-- ============================================================================

-- ── 1. Análisis de contexto (encabezado de una "corrida" del FODA) ─────────
create table if not exists analisis_contexto (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  fecha date not null default current_date,
  responsable_id uuid references colaboradores(id) on delete set null,
  notas text,
  created_at timestamptz not null default now()
);

comment on table analisis_contexto is 'Una corrida del análisis de contexto (FODA) de la empresa -- puede haber varias en el tiempo (la especificación recomienda al menos una vez al año), para comparar cómo cambia el contexto.';

create index if not exists idx_analisis_contexto_empresa on analisis_contexto(empresa_id);

-- ── 2. Ítems del FODA dentro de una corrida ────────────────────────────────
create table if not exists contexto_items (
  id uuid primary key default gen_random_uuid(),
  analisis_id uuid not null references analisis_contexto(id) on delete cascade,
  tipo text not null check (tipo in ('debilidad', 'oportunidad', 'fortaleza', 'amenaza')),
  descripcion text not null,
  orden int not null default 0,
  created_at timestamptz not null default now()
);

comment on table contexto_items is 'Un ítem (debilidad/oportunidad/fortaleza/amenaza) dentro de una corrida de análisis de contexto. Estructurado -- no un archivo adjunto -- para poder generar una acción trazable en ACPM (ver origen_contexto_item_id en acpm).';

create index if not exists idx_contexto_items_analisis on contexto_items(analisis_id);
create index if not exists idx_contexto_items_tipo on contexto_items(tipo);

alter table analisis_contexto enable row level security;
alter table contexto_items enable row level security;

drop policy if exists "analisis_contexto: lectura empresa" on analisis_contexto;
create policy "analisis_contexto: lectura empresa" on analisis_contexto for select
  using (empresa_id = fn_mi_empresa_id());
drop policy if exists "analisis_contexto: admin_th administra" on analisis_contexto;
create policy "analisis_contexto: admin_th administra" on analisis_contexto for all
  using (empresa_id = fn_mi_empresa_id() and fn_mi_rol() = 'admin_th');

drop policy if exists "contexto_items: lectura empresa" on contexto_items;
create policy "contexto_items: lectura empresa" on contexto_items for select
  using (exists (select 1 from analisis_contexto a where a.id = contexto_items.analisis_id and a.empresa_id = fn_mi_empresa_id()));
drop policy if exists "contexto_items: admin_th administra" on contexto_items;
create policy "contexto_items: admin_th administra" on contexto_items for all
  using (
    fn_mi_rol() = 'admin_th'
    and exists (select 1 from analisis_contexto a where a.id = contexto_items.analisis_id and a.empresa_id = fn_mi_empresa_id())
  );

-- ── 3. ACPM: nuevo origen posible "contexto" ───────────────────────────────
alter table acpm add column if not exists origen_contexto_item_id uuid references contexto_items(id) on delete set null;
create index if not exists idx_acpm_origen_contexto on acpm(origen_contexto_item_id);

alter table acpm drop constraint if exists acpm_origen_tipo_check;
alter table acpm add constraint acpm_origen_tipo_check
  check (origen_tipo in ('hallazgo_auditoria', 'riesgo', 'contexto', 'indicador', 'pqrs', 'mejora_propia'));

-- ── 4. Gestión del cambio: origen opcional (nunca obligatorio) ─────────────
alter table solicitudes_cambio add column if not exists origen_tipo text check (origen_tipo in ('riesgo', 'contexto', 'otro'));
alter table solicitudes_cambio add column if not exists origen_riesgo_id uuid references matriz_riesgos_controles(id) on delete set null;
alter table solicitudes_cambio add column if not exists origen_contexto_item_id uuid references contexto_items(id) on delete set null;

comment on column solicitudes_cambio.origen_tipo is 'Opcional -- la especificación es explícita en que no toda gestión del cambio tiene que venir de un riesgo o del contexto.';

create index if not exists idx_solicitudes_cambio_origen_riesgo on solicitudes_cambio(origen_riesgo_id);
create index if not exists idx_solicitudes_cambio_origen_contexto on solicitudes_cambio(origen_contexto_item_id);
