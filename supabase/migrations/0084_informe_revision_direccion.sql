-- ============================================================================
-- 0084_informe_revision_direccion.sql
-- Informe de Revisión por la Dirección — auto-generado cruzando datos de
-- todo el módulo de Procesos (y de Nexa/Espiral de Crecimiento cuando
-- aplica), tal como se diseñó con Nexus: la plataforma arma ~80-90% del
-- informe solo; las únicas secciones que requieren texto humano son los
-- cambios de contexto y las decisiones/acuerdos de la reunión — eso es lo
-- único que esta tabla guarda, ligado al período del informe. El resto se
-- calcula en vivo cada vez que se abre el informe, nunca se guarda una
-- copia — así siempre refleja el estado actual de los datos.
--
-- Escrita con IF NOT EXISTS / DROP POLICY IF EXISTS para poder correrse más
-- de una vez sin error, igual que las migraciones anteriores de este módulo.
-- ============================================================================

create table if not exists informes_revision_direccion (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  periodo_inicio date not null,
  periodo_fin date not null,
  cambios_contexto text,
  decisiones text,
  updated_at timestamptz not null default now(),
  unique (empresa_id, periodo_inicio, periodo_fin)
);

comment on table informes_revision_direccion is 'Las dos únicas secciones manuales del Informe de Revisión por la Dirección (cambios de contexto, decisiones y acuerdos), guardadas por período — el resto del informe se calcula en vivo, nunca se guarda una copia.';

alter table informes_revision_direccion enable row level security;

drop policy if exists "informes_revision_direccion: lectura empresa" on informes_revision_direccion;
create policy "informes_revision_direccion: lectura empresa" on informes_revision_direccion for select
  using (empresa_id = fn_mi_empresa_id());
drop policy if exists "informes_revision_direccion: admin_th administra" on informes_revision_direccion;
create policy "informes_revision_direccion: admin_th administra" on informes_revision_direccion for all
  using (empresa_id = fn_mi_empresa_id() and fn_mi_rol() = 'admin_th');
