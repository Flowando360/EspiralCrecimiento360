-- ============================================================================
-- 0004_nexa.sql
-- Módulo Nexa: formación gamificada, comunicación corporativa, reconocimiento
-- y asistente IA. Se integra por EVENTOS con el Espiral de Crecimiento
-- (ver Propuesta de Alianza Flowando × Nexus, secc. 8, Tabla 4).
-- ============================================================================

-- ── Feed corporativo ────────────────────────────────────────────────────────
create type tipo_publicacion as enum ('anuncio', 'politica_sst', 'reconocimiento', 'logro', 'general');

create table nexa_feed_publicaciones (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  autor_id uuid references perfiles_usuario(id),
  tipo tipo_publicacion not null default 'general',
  titulo text not null,
  contenido text,
  imagen_url text,
  fijado boolean not null default false,
  created_at timestamptz not null default now()
);

create table nexa_feed_reacciones (
  id uuid primary key default gen_random_uuid(),
  publicacion_id uuid not null references nexa_feed_publicaciones(id) on delete cascade,
  usuario_id uuid not null references perfiles_usuario(id) on delete cascade,
  tipo text not null default 'like',
  created_at timestamptz not null default now(),
  unique(publicacion_id, usuario_id)
);

-- ── Rutas de aprendizaje / cursos gamificados ──────────────────────────────
create type nivel_riesgo_cargo as enum ('alto', 'medio', 'bajo');

create table nexa_cursos (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  titulo text not null,
  descripcion text,
  categoria text check (categoria in ('induccion_sst','alturas','manejo_cargas','epp','protocolos_emergencia','cultura','tecnico','otro')),
  duracion_minutos int,
  puntos_otorgados int not null default 0,
  contenido_url text,
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

comment on table nexa_cursos is 'Cursos y formación gamificada de Nexa: inducción SST, alturas, manejo de cargas, EPP, protocolos de emergencia (Tabla 3 de la propuesta de alianza).';

-- Asignación de cursos por cargo (rutas de aprendizaje diferenciadas por riesgo)
create table nexa_rutas_por_cargo (
  id uuid primary key default gen_random_uuid(),
  cargo_id uuid not null references cargos(id) on delete cascade,
  curso_id uuid not null references nexa_cursos(id) on delete cascade,
  nivel_riesgo nivel_riesgo_cargo not null default 'medio',
  obligatorio boolean not null default true,
  unique(cargo_id, curso_id)
);

-- Asignación y avance individual (dispara desde alertas de Saber/SST vencidas)
create type estado_curso_colaborador as enum ('asignado', 'en_curso', 'completado', 'vencido');

create table nexa_rutas_formacion (
  id uuid primary key default gen_random_uuid(),
  colaborador_id uuid not null references colaboradores(id) on delete cascade,
  curso_id uuid not null references nexa_cursos(id) on delete cascade,
  -- disparador: qué evento del Espiral de Crecimiento generó esta asignación
  alerta_origen_id uuid references alertas(id) on delete set null,
  verificacion_saber_origen_id uuid references verificaciones_saber(id) on delete set null,
  asignado_en timestamptz not null default now(),
  estado estado_curso_colaborador not null default 'asignado',
  fecha_limite date,
  progreso_pct numeric(5,2) not null default 0,
  completado_en timestamptz,
  evidencia_url text
);

comment on table nexa_rutas_formacion is 'Instancia de curso asignado a una persona. alerta_origen_id conecta este registro con la alerta del Espiral de Crecimiento que lo disparó (integración funcional, Tabla 4 de la propuesta de alianza).';

-- Añadimos la FK diferida de alertas -> nexa_rutas_formacion (definida como uuid suelto en 0003)
alter table alertas
  add constraint fk_alertas_nexa_ruta
  foreign key (nexa_ruta_formacion_disparada_id) references nexa_rutas_formacion(id) on delete set null;

-- Simulacros y dinámicas en vivo
create table nexa_simulacros (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  titulo text not null,
  descripcion text,
  fecha date,
  participantes_esperados int,
  created_at timestamptz not null default now()
);

create table nexa_simulacro_participantes (
  id uuid primary key default gen_random_uuid(),
  simulacro_id uuid not null references nexa_simulacros(id) on delete cascade,
  colaborador_id uuid not null references colaboradores(id) on delete cascade,
  asistio boolean not null default false,
  calificacion_desempeno int check (calificacion_desempeno between 1 and 5),
  unique(simulacro_id, colaborador_id)
);

-- ── Gamificación: puntos, insignias, reconocimiento social ─────────────────
create table nexa_insignias (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  nombre text not null,
  descripcion text,
  icono text,
  criterio_otorgamiento text -- ej. "Resultado Referente en Espiral de Crecimiento"
);

create table nexa_reconocimientos (
  id uuid primary key default gen_random_uuid(),
  colaborador_id uuid not null references colaboradores(id) on delete cascade,
  insignia_id uuid references nexa_insignias(id),
  puntos int not null default 0,
  motivo text,
  -- si el reconocimiento nace de un resultado destacado del ciclo (Tabla 4)
  evaluacion_origen_id uuid references evaluaciones(id) on delete set null,
  otorgado_por uuid references perfiles_usuario(id),
  otorgado_en timestamptz not null default now()
);

comment on table nexa_reconocimientos is 'Refuerza resultados positivos del Espiral de Crecimiento con reconocimiento social, insignias y visibilidad en el feed (Tabla 4 de la propuesta de alianza).';

-- ── Asistente IA (historial de conversaciones, entrenado con políticas) ───
create table nexa_asistente_conversaciones (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references perfiles_usuario(id) on delete cascade,
  pregunta text not null,
  respuesta text,
  categoria text check (categoria in ('sst','politicas','procedimientos','otro')),
  util boolean,
  created_at timestamptz not null default now()
);

-- ── Networking empresarial (directorio de aliados: ARL, asesores SST...) ──
create table nexa_directorio_aliados (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  nombre text not null,
  tipo text check (tipo in ('arl','asesor_sst','proveedor_formacion','otro')),
  contacto text,
  notas text
);
