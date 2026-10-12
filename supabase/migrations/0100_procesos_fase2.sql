-- ============================================================================
-- 0100_procesos_fase2.sql
-- Módulo de Procesos, según la reunión y los formatos del SIG (GC-MT-001 a 006):
--   · ACM: prioridad, corrección inmediata y conclusión de causa raíz.
--   · Indicadores (cuadro de mando GC-MT-004): objetivo del indicador y recursos.
--   · Control documental: elaboró, revisó, ubicación, formato y fecha de emisión.
--   · Matriz de comunicaciones (nueva, fase Planear).
-- ============================================================================

-- ── 1. ACM: prioridad y análisis ─────────────────────────────────────────────
alter table acpm
  add column if not exists prioridad text not null default 'media'
    check (prioridad in ('baja', 'media', 'alta', 'critica')),
  add column if not exists correccion_inmediata text,
  add column if not exists conclusion_causa_raiz text;

comment on column acpm.prioridad is 'Prioridad de atención: baja, media, alta o crítica. Define el orden de atención en el tablero.';
comment on column acpm.correccion_inmediata is 'Acción inmediata para contener la no conformidad antes de analizar la causa (ej. retirar el producto, reprocesar).';
comment on column acpm.conclusion_causa_raiz is 'Conclusión del análisis de causa raíz, o justificación si no aplica el análisis.';

-- ── 2. Indicadores: objetivo y recursos (cuadro de mando) ────────────────────
alter table indicadores_proceso
  add column if not exists objetivo text,
  add column if not exists recursos text;

comment on column indicadores_proceso.objetivo is 'Qué se quiere lograr con el indicador (GC-MT-004: objetivo del indicador).';
comment on column indicadores_proceso.recursos is 'Recursos necesarios para medirlo y cumplir la meta (GC-MT-004: recursos).';

-- ── 3. Control documental: datos de elaboración y ubicación ──────────────────
alter table documentos_proceso
  add column if not exists elaborado_por text,
  add column if not exists revisado_por text,
  add column if not exists ubicacion text,
  add column if not exists formato text,
  add column if not exists fecha_emision date;

comment on column documentos_proceso.ubicacion is 'Dónde está el documento vigente (carpeta, sistema o enlace). Lo que pide el control documental.';
comment on column documentos_proceso.formato is 'Formato en que está el documento (ej. Word, Excel, PDF, físico).';

alter table solicitudes_documento
  add column if not exists elaborado_por text,
  add column if not exists revisado_por text,
  add column if not exists ubicacion text,
  add column if not exists formato text;

-- ── 4. Matriz de comunicaciones (planear) ───────────────────────────────────
create table if not exists matriz_comunicaciones (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  proceso_id uuid references procesos_gestion(id) on delete set null,
  que_comunicar text not null,
  a_quien text not null,
  como text not null, -- canal: correo, cartelera, reunión, WhatsApp, intranet…
  frecuencia text,
  responsable_id uuid references colaboradores(id) on delete set null,
  ultima_fecha date,
  observaciones text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table matriz_comunicaciones is 'Qué se comunica, a quién, por qué canal, con qué frecuencia y quién responde. Requisito 7.4 de ISO 9001 (comunicación).';

create index if not exists idx_matriz_comunicaciones_empresa on matriz_comunicaciones(empresa_id);

alter table matriz_comunicaciones enable row level security;

create policy "matriz_comunicaciones: lectura empresa" on matriz_comunicaciones for select
  using (empresa_id = fn_mi_empresa_id());
create policy "matriz_comunicaciones: admin_th administra" on matriz_comunicaciones for all
  using (empresa_id = fn_mi_empresa_id() and fn_mi_rol() = 'admin_th')
  with check (empresa_id = fn_mi_empresa_id() and fn_mi_rol() = 'admin_th');

create trigger trg_matriz_comunicaciones_updated_at
  before update on matriz_comunicaciones
  for each row execute function fn_tocar_updated_at_dotacion();
