-- ============================================================================
-- 0107_reclutamiento_ia_match.sql
-- Completa Reclutamiento y Selección según el documento "Requerimientos del
-- Módulo de Selección y Reclutamiento con IA" (v1.0, 15-oct-2026). Lo que
-- ya existía (vacantes, candidatos, postulaciones, entrevistas, referencias,
-- flujo de tres pasos con líder, autorizaciones y derechos del titular) se
-- conserva; aquí se agrega:
--   1. Hoja de vida versionada y trabajos de extracción con IA (idempotentes).
--   2. Ficha estructurada del candidato: formación, experiencia, competencias,
--      idiomas y certificaciones, cada dato con su procedencia y evidencia.
--   3. Historial de validaciones y correcciones manuales (solo inserción).
--   4. Criterios de evaluación por vacante (derivados del perfil de cargo y
--      ajustables) y evaluaciones de correspondencia (match) con su detalle
--      por criterio. Las evaluaciones antiguas se conservan (vigente = false).
-- ============================================================================

-- ── 1. Tipos ─────────────────────────────────────────────────────────────────
create type estado_procesamiento_ia as enum ('pendiente', 'procesando', 'completado', 'requiere_revision', 'error');
create type procedencia_dato as enum ('extraido', 'normalizado', 'inferido', 'declarado', 'verificado', 'no_informado', 'en_conflicto');
create type categoria_criterio as enum ('formacion', 'experiencia', 'competencia_tecnica', 'competencia_conductual', 'certificacion_idioma', 'requisito_adicional');
create type tipo_criterio as enum ('obligatorio', 'deseable', 'informativo');
create type resultado_criterio as enum ('cumple', 'cumple_parcialmente', 'no_cumple', 'no_informado', 'contradictorio', 'pendiente_validacion');

-- ── 2. Campos nuevos en tablas existentes ────────────────────────────────────
alter table candidatos
  add column if not exists ciudad text,
  add column if not exists pais text,
  add column if not exists profesion text,
  add column if not exists resumen_profesional text,
  add column if not exists anios_experiencia_total numeric(4,1),
  add column if not exists anios_experiencia_relevante numeric(4,1);

comment on column candidatos.anios_experiencia_total is 'Años de experiencia laboral documentada (periodos fusionados, sin contar dos veces los simultáneos). Se recalcula con cada extracción o corrección.';

-- Perfil de cargo usado al crear la vacante: queda guardado en la vacante para
-- que los resultados históricos sigan pudiendo explicarse aunque el perfil cambie.
alter table vacantes add column if not exists perfil_version text;

-- ── 3. Hoja de vida versionada ───────────────────────────────────────────────
create table candidato_documentos (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  candidato_id uuid not null references candidatos(id) on delete cascade,
  postulacion_id uuid references postulaciones(id) on delete set null,
  version int not null default 1,
  storage_path text not null,
  nombre_original text not null,
  mime_type text,
  tamano_bytes int not null check (tamano_bytes > 0),
  sha256 text not null,
  created_at timestamptz not null default now(),
  -- Mismo archivo para el mismo candidato = un solo documento (no se duplica al reintentar).
  unique (candidato_id, sha256)
);

comment on table candidato_documentos is 'Archivos originales de hojas de vida. Se conservan siempre: la ficha estructurada no reemplaza al documento. El hash evita duplicados y hace idempotente el procesamiento.';

-- ── 4. Trabajos de extracción con IA y su resultado ──────────────────────────
create table ai_processing_jobs (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  candidato_id uuid not null references candidatos(id) on delete cascade,
  documento_id uuid not null references candidato_documentos(id) on delete cascade,
  estado estado_procesamiento_ia not null default 'pendiente',
  intentos int not null default 0,
  max_intentos int not null default 3,
  -- documento (sha256) + versión del esquema: un mismo archivo no se procesa dos veces con el mismo esquema.
  clave_idempotencia text not null unique,
  esquema_version text not null,
  modelo text,
  prompt_version text,
  ultimo_error text,
  iniciado_en timestamptz,
  terminado_en timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table ai_processing_jobs is 'Cola de extracción de hojas de vida. Estados: pendiente, procesando, completado, requiere_revision, error. Los fallidos se reintentan hasta max_intentos.';

create table ai_extraction_results (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  job_id uuid not null unique references ai_processing_jobs(id) on delete cascade,
  candidato_id uuid not null references candidatos(id) on delete cascade,
  documento_id uuid not null references candidato_documentos(id) on delete cascade,
  esquema_version text not null,
  payload jsonb not null,
  campos_confianza jsonb not null default '{}'::jsonb,
  campos_faltantes text[] not null default '{}',
  conflictos jsonb not null default '[]'::jsonb,
  revision_requerida boolean not null default false,
  created_at timestamptz not null default now()
);

comment on table ai_extraction_results is 'Salida estructurada y validada contra el esquema de la extracción. Inmutable: una nueva extracción crea otro registro y no sobrescribe el anterior.';

-- ── 5. Ficha estructurada del candidato ──────────────────────────────────────
-- Cada fila lleva procedencia (extraído, declarado, verificado, etc.), evidencia
-- textual del documento y si requiere revisión humana. "activo" marca las filas
-- de la extracción vigente; las de extracciones anteriores quedan para trazabilidad.

create table candidato_educacion (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  candidato_id uuid not null references candidatos(id) on delete cascade,
  resultado_id uuid references ai_extraction_results(id) on delete set null,
  nivel text check (nivel in ('bachillerato', 'tecnico', 'tecnologo', 'universitario', 'especializacion', 'maestria', 'doctorado', 'certificacion_corta', 'otro')),
  titulo text not null,
  area text,
  institucion text,
  fecha_inicio date,
  fecha_fin date,
  precision_fecha text check (precision_fecha in ('anio', 'mes', 'dia')),
  estado text not null default 'no_determinado' check (estado in ('finalizado', 'en_curso', 'no_determinado')),
  procedencia procedencia_dato not null default 'extraido',
  evidencia text,
  requiere_revision boolean not null default false,
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

create table candidato_experiencia (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  candidato_id uuid not null references candidatos(id) on delete cascade,
  resultado_id uuid references ai_extraction_results(id) on delete set null,
  organizacion text,
  cargo text,
  sector text,
  fecha_inicio date,
  fecha_fin date,
  precision_fecha text check (precision_fecha in ('anio', 'mes', 'dia')),
  en_curso boolean not null default false,
  funciones text,
  logros text,
  herramientas text[] not null default '{}',
  competencias text[] not null default '{}',
  procedencia procedencia_dato not null default 'extraido',
  evidencia text,
  requiere_revision boolean not null default false,
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

create table candidato_competencias (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  candidato_id uuid not null references candidatos(id) on delete cascade,
  resultado_id uuid references ai_extraction_results(id) on delete set null,
  tipo text not null check (tipo in ('tecnica', 'funcional', 'conductual', 'herramienta')),
  nombre text not null,
  nivel text check (nivel in ('basico', 'intermedio', 'avanzado')),
  procedencia procedencia_dato not null default 'extraido',
  evidencia text,
  requiere_revision boolean not null default false,
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

create table candidato_idiomas (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  candidato_id uuid not null references candidatos(id) on delete cascade,
  resultado_id uuid references ai_extraction_results(id) on delete set null,
  idioma text not null,
  nivel text check (nivel in ('basico', 'intermedio', 'avanzado', 'nativo')),
  procedencia procedencia_dato not null default 'extraido',
  evidencia text,
  requiere_revision boolean not null default false,
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

create table candidato_certificaciones (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  candidato_id uuid not null references candidatos(id) on delete cascade,
  resultado_id uuid references ai_extraction_results(id) on delete set null,
  nombre text not null,
  entidad text,
  fecha_expedicion date,
  vigente_hasta date,
  procedencia procedencia_dato not null default 'extraido',
  evidencia text,
  requiere_revision boolean not null default false,
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

comment on table candidato_educacion is 'Formación académica estructurada. Una fila por título o programa. Sin fecha de fin o sin estado claro, estado = no_determinado (nunca se asume que terminó).';

-- Historial de validaciones: solo inserción desde la aplicación.
create table candidato_validaciones (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  candidato_id uuid not null references candidatos(id) on delete cascade,
  tabla text not null check (tabla in ('candidato_educacion', 'candidato_experiencia', 'candidato_competencias', 'candidato_idiomas', 'candidato_certificaciones', 'candidatos')),
  registro_id uuid not null,
  campo text not null,
  valor_anterior jsonb,
  valor_nuevo jsonb,
  accion text not null check (accion in ('corregir', 'aceptar', 'no_verificable')),
  usuario_id uuid references perfiles_usuario(id) on delete set null,
  created_at timestamptz not null default now()
);

comment on table candidato_validaciones is 'Trazabilidad de cada corrección o aceptación manual de un dato extraído: valor anterior, valor nuevo, usuario y fecha. No se edita ni se borra desde la aplicación.';

-- ── 6. Criterios de evaluación de la vacante ─────────────────────────────────
create table criterios_evaluacion (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  vacante_id uuid not null references vacantes(id) on delete cascade,
  origen text not null default 'vacante' check (origen in ('perfil', 'vacante')),
  cargo_habilidad_id uuid references cargo_habilidades(id) on delete set null,
  categoria categoria_criterio not null,
  tipo tipo_criterio not null default 'deseable',
  descripcion text not null,
  -- Valor contra el que se compara la evidencia: palabras clave separadas por coma
  -- (herramientas, funciones, títulos), o un nivel (idioma, competencia).
  valor_requerido text,
  nivel_requerido text check (nivel_requerido in ('basico', 'intermedio', 'avanzado', 'nativo')),
  meses_requeridos int check (meses_requeridos is null or meses_requeridos >= 0),
  peso numeric(6,2) not null default 0 check (peso >= 0 and peso <= 100),
  activo boolean not null default true,
  perfil_version text,
  created_at timestamptz not null default now()
);

comment on table criterios_evaluacion is 'Criterios con los que se mide la correspondencia de los candidatos con la vacante. Se copian del perfil de cargo al crear la vacante (origen = perfil) y la empresa puede agregar o ajustar los suyos (origen = vacante). La IA nunca modifica estos criterios ni sus pesos.';

-- ── 7. Evaluaciones de correspondencia (match) ───────────────────────────────
create table match_evaluaciones (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  postulacion_id uuid not null references postulaciones(id) on delete cascade,
  vacante_id uuid not null references vacantes(id) on delete cascade,
  puntaje numeric(5,2) check (puntaje is null or (puntaje >= 0 and puntaje <= 100)),
  cobertura numeric(5,2) not null check (cobertura >= 0 and cobertura <= 100),
  clasificacion text not null check (clasificacion in ('alta', 'buena', 'parcial', 'baja', 'sin_evaluar')),
  provisional boolean not null default true,
  obligatorios_estado text not null check (obligatorios_estado in ('cumple', 'pendiente', 'no_cumple', 'sin_criterios')),
  fortalezas jsonb not null default '[]'::jsonb,
  brechas jsonb not null default '[]'::jsonb,
  version_reglas text not null,
  version_perfil text,
  vigente boolean not null default true,
  calculada_por uuid references perfiles_usuario(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Solo una evaluación vigente por postulación; las demás quedan como historial.
create unique index idx_match_vigente_por_postulacion on match_evaluaciones(postulacion_id) where vigente;

create table match_evaluacion_detalles (
  id uuid primary key default gen_random_uuid(),
  evaluacion_id uuid not null references match_evaluaciones(id) on delete cascade,
  criterio_id uuid references criterios_evaluacion(id) on delete set null,
  descripcion_criterio text not null,
  categoria categoria_criterio not null,
  tipo tipo_criterio not null,
  peso numeric(6,2) not null,
  resultado resultado_criterio not null,
  puntaje numeric(5,2) check (puntaje is null or (puntaje >= 0 and puntaje <= 100)),
  evidencia text,
  motivo text,
  created_at timestamptz not null default now()
);

create index idx_criterios_vacante on criterios_evaluacion(vacante_id);
create index idx_candidato_documentos_candidato on candidato_documentos(candidato_id);
create index idx_ai_jobs_estado on ai_processing_jobs(estado, empresa_id);
create index idx_ai_jobs_candidato on ai_processing_jobs(candidato_id);
create index idx_candidato_educacion_candidato on candidato_educacion(candidato_id);
create index idx_candidato_experiencia_candidato on candidato_experiencia(candidato_id);
create index idx_candidato_competencias_candidato on candidato_competencias(candidato_id);
create index idx_candidato_idiomas_candidato on candidato_idiomas(candidato_id);
create index idx_candidato_certificaciones_candidato on candidato_certificaciones(candidato_id);
create index idx_candidato_validaciones_candidato on candidato_validaciones(candidato_id);
create index idx_match_postulacion on match_evaluaciones(postulacion_id);
create index idx_match_detalles_evaluacion on match_evaluacion_detalles(evaluacion_id);

-- ── 8. Funciones de visibilidad para el líder ───────────────────────────────
-- Mismo criterio que fn_lider_ve_postulacion (0101): el líder solo ve al
-- candidato si tiene una asignación suya vigente para alguna de sus postulaciones.
create or replace function fn_lider_ve_candidato(p_candidato_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from postulaciones p
    where p.candidato_id = p_candidato_id and fn_lider_ve_postulacion(p.id)
  )
$$;

-- ── 9. RLS ───────────────────────────────────────────────────────────────────
alter table candidato_documentos enable row level security;
alter table ai_processing_jobs enable row level security;
alter table ai_extraction_results enable row level security;
alter table candidato_educacion enable row level security;
alter table candidato_experiencia enable row level security;
alter table candidato_competencias enable row level security;
alter table candidato_idiomas enable row level security;
alter table candidato_certificaciones enable row level security;
alter table candidato_validaciones enable row level security;
alter table criterios_evaluacion enable row level security;
alter table match_evaluaciones enable row level security;
alter table match_evaluacion_detalles enable row level security;

-- Documentos, trabajos de IA y resultados crudos: solo admin_th (son el archivo y la lectura automática de la persona).
create policy "candidato_documentos: admin_th administra" on candidato_documentos for all
  using (empresa_id = fn_mi_empresa_id() and fn_mi_rol() = 'admin_th')
  with check (empresa_id = fn_mi_empresa_id() and fn_mi_rol() = 'admin_th');

create policy "ai_processing_jobs: admin_th administra" on ai_processing_jobs for all
  using (empresa_id = fn_mi_empresa_id() and fn_mi_rol() = 'admin_th')
  with check (empresa_id = fn_mi_empresa_id() and fn_mi_rol() = 'admin_th');

create policy "ai_extraction_results: admin_th administra" on ai_extraction_results for all
  using (empresa_id = fn_mi_empresa_id() and fn_mi_rol() = 'admin_th')
  with check (empresa_id = fn_mi_empresa_id() and fn_mi_rol() = 'admin_th');

-- Ficha estructurada: admin_th administra; el líder la lee solo de sus candidatos asignados vigentes.
create policy "candidato_educacion: admin_th administra" on candidato_educacion for all
  using (empresa_id = fn_mi_empresa_id() and fn_mi_rol() = 'admin_th')
  with check (empresa_id = fn_mi_empresa_id() and fn_mi_rol() = 'admin_th');
create policy "candidato_educacion: el líder lee sus asignados" on candidato_educacion for select
  using (fn_mi_rol() = 'lider' and fn_lider_ve_candidato(candidato_id));

create policy "candidato_experiencia: admin_th administra" on candidato_experiencia for all
  using (empresa_id = fn_mi_empresa_id() and fn_mi_rol() = 'admin_th')
  with check (empresa_id = fn_mi_empresa_id() and fn_mi_rol() = 'admin_th');
create policy "candidato_experiencia: el líder lee sus asignados" on candidato_experiencia for select
  using (fn_mi_rol() = 'lider' and fn_lider_ve_candidato(candidato_id));

create policy "candidato_competencias: admin_th administra" on candidato_competencias for all
  using (empresa_id = fn_mi_empresa_id() and fn_mi_rol() = 'admin_th')
  with check (empresa_id = fn_mi_empresa_id() and fn_mi_rol() = 'admin_th');
create policy "candidato_competencias: el líder lee sus asignados" on candidato_competencias for select
  using (fn_mi_rol() = 'lider' and fn_lider_ve_candidato(candidato_id));

create policy "candidato_idiomas: admin_th administra" on candidato_idiomas for all
  using (empresa_id = fn_mi_empresa_id() and fn_mi_rol() = 'admin_th')
  with check (empresa_id = fn_mi_empresa_id() and fn_mi_rol() = 'admin_th');
create policy "candidato_idiomas: el líder lee sus asignados" on candidato_idiomas for select
  using (fn_mi_rol() = 'lider' and fn_lider_ve_candidato(candidato_id));

create policy "candidato_certificaciones: admin_th administra" on candidato_certificaciones for all
  using (empresa_id = fn_mi_empresa_id() and fn_mi_rol() = 'admin_th')
  with check (empresa_id = fn_mi_empresa_id() and fn_mi_rol() = 'admin_th');
create policy "candidato_certificaciones: el líder lee sus asignados" on candidato_certificaciones for select
  using (fn_mi_rol() = 'lider' and fn_lider_ve_candidato(candidato_id));

-- Historial de validaciones: admin_th lee e inserta; nunca actualiza ni borra.
create policy "candidato_validaciones: admin_th lee" on candidato_validaciones for select
  using (empresa_id = fn_mi_empresa_id() and fn_mi_rol() = 'admin_th');
create policy "candidato_validaciones: admin_th registra" on candidato_validaciones for insert
  with check (empresa_id = fn_mi_empresa_id() and fn_mi_rol() = 'admin_th');

-- Criterios: admin_th administra; el líder los lee en las vacantes donde tiene candidatos asignados.
create policy "criterios_evaluacion: admin_th administra" on criterios_evaluacion for all
  using (empresa_id = fn_mi_empresa_id() and fn_mi_rol() = 'admin_th')
  with check (empresa_id = fn_mi_empresa_id() and fn_mi_rol() = 'admin_th');
create policy "criterios_evaluacion: el líder lee de sus vacantes asignadas" on criterios_evaluacion for select
  using (fn_mi_rol() = 'lider' and exists (
    select 1 from postulaciones p where p.vacante_id = criterios_evaluacion.vacante_id and fn_lider_ve_postulacion(p.id)
  ));

-- Match: admin_th administra; el líder ve la evaluación de sus postulaciones asignadas.
create policy "match_evaluaciones: admin_th administra" on match_evaluaciones for all
  using (empresa_id = fn_mi_empresa_id() and fn_mi_rol() = 'admin_th')
  with check (empresa_id = fn_mi_empresa_id() and fn_mi_rol() = 'admin_th');
create policy "match_evaluaciones: el líder ve las de sus asignados" on match_evaluaciones for select
  using (fn_mi_rol() = 'lider' and fn_lider_ve_postulacion(postulacion_id));

create policy "match_evaluacion_detalles: admin_th administra" on match_evaluacion_detalles for all
  using (fn_mi_rol() = 'admin_th' and exists (
    select 1 from match_evaluaciones m where m.id = match_evaluacion_detalles.evaluacion_id and m.empresa_id = fn_mi_empresa_id()
  ))
  with check (fn_mi_rol() = 'admin_th' and exists (
    select 1 from match_evaluaciones m where m.id = match_evaluacion_detalles.evaluacion_id and m.empresa_id = fn_mi_empresa_id()
  ));
create policy "match_evaluacion_detalles: el líder ve los de sus asignados" on match_evaluacion_detalles for select
  using (fn_mi_rol() = 'lider' and exists (
    select 1 from match_evaluaciones m where m.id = match_evaluacion_detalles.evaluacion_id and fn_lider_ve_postulacion(m.postulacion_id)
  ));

-- ── 10. Bucket: los archivos de hoja de vida ya son privados (0066). Se conserva el nombre y la ruta <empresa>/<archivo>.
