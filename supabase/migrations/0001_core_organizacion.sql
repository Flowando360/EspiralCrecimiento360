-- ============================================================================
-- 0001_core_organizacion.sql
-- Núcleo: empresas cliente, cargos, colaboradores y organigrama.
-- Flow, Nexus y Visión es la primera fila de "empresas" (empresa piloto).
-- Diseñado multi-tenant desde el día 1 porque FlowAndo venderá esto a más
-- clientes (ver Propuesta de Alianza Flowando × Nexus, secc. 10 y 11).
-- ============================================================================

create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ── Empresas cliente (multi-tenant) ────────────────────────────────────────
create table empresas (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  slug text not null unique,
  logo_url text,
  color_marca text default '#7c3aed',
  fecha_fundacion date,
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

comment on table empresas is 'Empresas cliente de FlowAndo. Flow, Nexus y Visión es la empresa piloto.';

-- ── Roles del sistema ───────────────────────────────────────────────────────
create type rol_usuario as enum ('admin_th', 'lider', 'colaborador', 'gerencia');

-- ── Usuarios (extiende auth.users de Supabase) ─────────────────────────────
create table perfiles_usuario (
  id uuid primary key references auth.users(id) on delete cascade,
  empresa_id uuid not null references empresas(id) on delete cascade,
  rol rol_usuario not null default 'colaborador',
  nombre_completo text not null,
  email text not null,
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

comment on table perfiles_usuario is 'Rol de cada usuario autenticado. admin_th = Talento Humano (ve/edita todo). lider = ve su equipo. colaborador = se ve a sí mismo. gerencia = reportes agregados sin detalle individual fuera de su línea.';

-- ── Cargos: la plantilla que sostiene la dimensión SABER ───────────────────
-- (Sección 6 del Espiral de Crecimiento: perfil de cargo = plantilla estándar)
create table cargos (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  nombre text not null,
  proceso_area text,
  objetivo_cargo text,
  tiene_personal_a_cargo boolean not null default false,
  -- Formación académica requerida
  formacion_nivel text check (formacion_nivel in ('ninguno','bachillerato','tecnico','tecnologo','universitario','empirico')),
  formacion_titulo_especifico text,
  -- Experiencia y destrezas físicas (secc. 6.1)
  experiencia_minima_meses int,
  formacion_minima_induccion text,
  destreza_fisica boolean default false,
  destreza_auditiva boolean default false,
  destreza_visual boolean default false,
  destreza_manual boolean default false,
  destreza_coordinacion_motora boolean default false,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table cargos is 'Plantilla de perfil de cargo (dimensión SABER). Basada en el perfil de Auxiliar de Inventarios usado como referencia estándar.';

-- Habilidades funcionales y técnicas de cada cargo, con nivel esperado
create type nivel_esperado as enum ('bajo', 'medio', 'alto');
create type tipo_habilidad as enum ('funcional', 'tecnica');

create table cargo_habilidades (
  id uuid primary key default gen_random_uuid(),
  cargo_id uuid not null references cargos(id) on delete cascade,
  tipo tipo_habilidad not null,
  nombre text not null, -- ej. "Negociación", "Interpretación de datos de proceso"
  nivel_esperado nivel_esperado not null,
  orden int default 0
);

comment on table cargo_habilidades is 'Habilidades funcionales (negociación, autonomía, liderazgo...) y técnicas (manejo de herramientas, análisis de rendimiento...) esperadas por cargo, con su nivel esperado.';

-- ── Colaboradores: la ficha 360° central ───────────────────────────────────
create type estado_colaborador as enum ('activo', 'inactivo', 'en_proceso_salida', 'periodo_prueba');
create type tipo_contrato as enum ('indefinido', 'fijo', 'obra_labor', 'prestacion_servicios', 'aprendizaje', 'externo');

create table colaboradores (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  usuario_id uuid references perfiles_usuario(id) on delete set null, -- null hasta que tenga login
  cargo_id uuid not null references cargos(id),

  -- Datos base
  nombre_completo text not null,
  numero_documento text,
  email text,
  telefono text,
  foto_url text,

  -- Organigrama (secc. 9): el líder es la fuente de verdad; pares y
  -- colaboradores a cargo se DEDUCEN, no se digitan (ver vista v_organigrama_evaluadores)
  lider_id uuid references colaboradores(id),
  es_externo boolean not null default false, -- Revisor Fiscal, asesores freelance, etc. (secc 9.3)

  -- Ciclo de vida laboral
  fecha_ingreso date not null,
  fecha_salida date,
  motivo_salida text,
  estado estado_colaborador not null default 'activo',
  tipo_contrato tipo_contrato not null default 'indefinido',

  -- Metadatos
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table colaboradores is 'Ficha 360° de cada persona: acompaña desde el ingreso hasta la salida. lider_id alimenta la resolución automática de evaluadores (organigrama).';

create index idx_colaboradores_lider on colaboradores(lider_id);
create index idx_colaboradores_empresa on colaboradores(empresa_id);
create index idx_colaboradores_cargo on colaboradores(cargo_id);

-- ── Hoja de vida digital ────────────────────────────────────────────────────
create table hoja_vida_formacion (
  id uuid primary key default gen_random_uuid(),
  colaborador_id uuid not null references colaboradores(id) on delete cascade,
  tipo text check (tipo in ('academica','certificacion','curso','experiencia_laboral')),
  titulo text not null,
  institucion text,
  fecha_inicio date,
  fecha_fin date,
  fecha_vencimiento date, -- clave para certificaciones (alturas, montacargas, etc.)
  documento_url text, -- Supabase Storage
  verificado boolean not null default false,
  verificado_por uuid references perfiles_usuario(id),
  created_at timestamptz not null default now()
);

comment on table hoja_vida_formacion is 'Hoja de vida digital: formación académica, certificaciones (con vencimiento -> dispara alertas SST/Saber), cursos y experiencia previa.';

create index idx_hv_vencimiento on hoja_vida_formacion(fecha_vencimiento) where fecha_vencimiento is not null;

-- ── Movimientos internos (promociones, cambios de área) ────────────────────
create table historial_movimientos (
  id uuid primary key default gen_random_uuid(),
  colaborador_id uuid not null references colaboradores(id) on delete cascade,
  tipo text check (tipo in ('ingreso','promocion','cambio_area','cambio_lider','aumento_salarial','sancion','reconocimiento','salida')),
  cargo_anterior_id uuid references cargos(id),
  cargo_nuevo_id uuid references cargos(id),
  descripcion text,
  fecha date not null default current_date,
  registrado_por uuid references perfiles_usuario(id),
  created_at timestamptz not null default now()
);

comment on table historial_movimientos is 'Línea de tiempo del ciclo de vida del colaborador: ingreso, promociones, cambios, hasta la salida.';

-- ── Entrevista de salida (offboarding) ─────────────────────────────────────
create table entrevistas_salida (
  id uuid primary key default gen_random_uuid(),
  colaborador_id uuid not null unique references colaboradores(id) on delete cascade,
  fecha date not null default current_date,
  motivo_categoria text check (motivo_categoria in ('renuncia_voluntaria','despido','fin_contrato','mutuo_acuerdo','jubilacion','otro')),
  motivo_detalle text,
  recomendaria_empresa boolean,
  comentarios text,
  realizada_por uuid references perfiles_usuario(id),
  created_at timestamptz not null default now()
);
