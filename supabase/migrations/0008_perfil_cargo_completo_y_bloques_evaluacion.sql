-- ============================================================================
-- 0008_perfil_cargo_completo_y_bloques_evaluacion.sql
-- Amplía el modelo para no perder NADA del formato real de perfil de cargo
-- de Flow, Nexus y Visión (FORSST 61) y reorganiza la evaluación en los
-- 5 bloques pedidos: Competencias Organizacionales, Funcionales, Liderazgo,
-- Roles y Funciones (desde el perfil de cargo) y Cultura.
-- ============================================================================

-- ============================================================================
-- PARTE 1 — Perfil de cargo completo (todo lo que trae el FORSST 61)
-- ============================================================================

alter table cargos add column if not exists codigo_documento text;              -- "FORSST 61"
alter table cargos add column if not exists version_documento text;
alter table cargos add column if not exists fecha_documento date;
alter table cargos add column if not exists tipo_area text check (tipo_area in ('administrativa','operativa'));
alter table cargos add column if not exists genero_requerido text default 'Indiferente';
alter table cargos add column if not exists edad_minima int;
alter table cargos add column if not exists edad_maxima int;
alter table cargos add column if not exists salario text;                       -- suele ser "A convenir" o rango, se deja texto
alter table cargos add column if not exists competencias_cardinales text;       -- texto libre, lista separada por comas en el documento
alter table cargos add column if not exists cargos_a_los_que_reporta text;      -- texto (redundante con lider_id pero se conserva tal cual el documento)
alter table cargos add column if not exists cargos_que_le_reportan text;
alter table cargos add column if not exists manejo_dinero text;
alter table cargos add column if not exists toma_decisiones_organizacionales text;
alter table cargos add column if not exists cambios_documentales text;
alter table cargos add column if not exists responsabilidad_bienes_servicios nivel_esperado;
alter table cargos add column if not exists responsabilidad_informacion nivel_esperado;
alter table cargos add column if not exists responsabilidad_relaciones_interpersonales nivel_esperado;
alter table cargos add column if not exists responsabilidad_direccion_coordinacion nivel_esperado;
alter table cargos add column if not exists sgsst_responsabilidades_generales text;   -- numeral largo del documento
alter table cargos add column if not exists sgsst_responsabilidades_campo text;
alter table cargos add column if not exists sgsst_rendicion_cuentas text;
alter table cargos add column if not exists sgsst_autoridad text;
alter table cargos add column if not exists recursos_seleccion text;            -- "Examen médico, Entrevista, Hoja de vida..."
alter table cargos add column if not exists documento_perfil_url text;          -- PDF/Excel original adjunto en Storage

comment on column cargos.competencias_cardinales is 'Texto tal como viene en el perfil de cargo (ej. "Aprendizaje continuo, planeación y organización...").';

-- ── Funciones principales del cargo — ESTE ES EL BLOQUE "Roles y Funciones" ──
-- (coincide exactamente con la tabla que ya maneja FNV: Función/Tipo/Periodicidad/Herramientas,
-- y con el formato de la captura "Roles y Responsabilidades" con Resultado Esperado + Calificación)
create table cargo_funciones_principales (
  id uuid primary key default gen_random_uuid(),
  cargo_id uuid not null references cargos(id) on delete cascade,
  proceso text,                          -- ej. "Operaciones", "Producción"
  funcion text not null,                 -- la descripción larga de la función
  resultado_esperado text,               -- lo que en la evaluación se compara contra el resultado real
  tipo_phva text check (tipo_phva in ('P','H','V','A')),  -- Planear/Hacer/Verificar/Actuar
  periodicidad text check (periodicidad in ('Ocasional','Diaria','Semanal','Quincenal','Mensual','Trimestral','Anual')),
  herramientas text,
  orden int default 0
);

comment on table cargo_funciones_principales is 'Roles y funciones del cargo, tal como vienen en el perfil (FORSST 61) y en el formato de evaluación de Roles y Responsabilidades. Es la fuente del bloque 4 de la evaluación.';

-- ── Decisiones que puede tomar el cargo ────────────────────────────────────
create table cargo_decisiones (
  id uuid primary key default gen_random_uuid(),
  cargo_id uuid not null references cargos(id) on delete cascade,
  descripcion text not null,
  periodicidad text,
  orden int default 0
);

-- ── Factores de riesgo (SST) ────────────────────────────────────────────────
create table cargo_factores_riesgo (
  id uuid primary key default gen_random_uuid(),
  cargo_id uuid not null references cargos(id) on delete cascade,
  factor text not null,             -- "QUÍMICO: Exposición a material particulado..."
  categoria text check (categoria in ('quimico','mecanico','locativo','ergonomico','psicosocial','fisico','biologico','seguridad_transito','seguridad_almacenamiento','otro')),
  efectos_posibles text,
  orden int default 0
);

-- ── Exámenes médicos ocupacionales — alimenta alertas SST automáticamente ──
create table cargo_examenes_medicos (
  id uuid primary key default gen_random_uuid(),
  cargo_id uuid not null references cargos(id) on delete cascade,
  momento text not null check (momento in ('ingreso','periodico','retiro')),
  nombre_examen text not null,
  orden int default 0
);

comment on table cargo_examenes_medicos is 'Exámenes requeridos por cargo (ingreso/periódico/retiro). Al asignar un cargo a un colaborador, estos generan automáticamente las alertas SST correspondientes.';

-- ── Elementos de protección personal y dotación ────────────────────────────
create table cargo_epp (
  id uuid primary key default gen_random_uuid(),
  cargo_id uuid not null references cargos(id) on delete cascade,
  item text not null,
  orden int default 0
);

-- ============================================================================
-- PARTE 2 — Identidad organizacional (Propósito, Visión, Valores, Principios)
-- ============================================================================
create table empresa_identidad (
  empresa_id uuid primary key references empresas(id) on delete cascade,
  proposito_superior text,         -- Misión
  declaracion_creencias text,      -- "Aquello en lo que creemos"
  vision text,
  updated_at timestamptz not null default now(),
  updated_by uuid references perfiles_usuario(id)
);

create type tipo_elemento_identidad as enum ('principio', 'valor');

create table empresa_identidad_elementos (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  tipo tipo_elemento_identidad not null,
  nombre text not null,
  descripcion text,
  orden int default 0
);

comment on table empresa_identidad_elementos is 'Lista de Principios y Valores (cada uno como fila, con su descripción), editable desde Administración → Identidad Organizacional.';

-- ============================================================================
-- PARTE 3 — Reorganizar competencias en los 5 bloques pedidos
-- ============================================================================
create type bloque_evaluacion as enum (
  'competencias_organizacionales',
  'competencias_funcionales',
  'competencias_liderazgo',
  'roles_y_funciones',
  'cultura'
);

alter table competencias add column if not exists bloque bloque_evaluacion;

-- Necesario para que los INSERT ... ON CONFLICT DO NOTHING de más abajo
-- funcionen (evita duplicar competencias si esta migración se corre dos veces).
create unique index if not exists uq_competencias_empresa_nombre on competencias(empresa_id, nombre);

-- Migrar lo existente: Resultados/Puntualidad/Estrategia/Autogestión -> funcionales,
-- Liderazgo -> liderazgo, y las 4 de Deber -> cultura (conserva el histórico).
update competencias set bloque = 'competencias_liderazgo' where nombre = 'Liderazgo';
update competencias set bloque = 'cultura' where dimension = 'deber' and nombre <> 'Liderazgo';
update competencias set bloque = 'competencias_funcionales' where dimension = 'hacer' and nombre <> 'Liderazgo';

-- ── Catálogo ampliado: Competencias Organizacionales (nuevas, aplican a TODOS los cargos) ──
insert into competencias (empresa_id, dimension, bloque, nombre, descripcion_que_evalua, peso_relativo, orden) values
('00000000-0000-0000-0000-000000000001','hacer','competencias_organizacionales','Orientación al resultado','Enfoque en cumplir metas y generar impacto medible en la organización.',1.0,100),
('00000000-0000-0000-0000-000000000001','hacer','competencias_organizacionales','Comunicación','Claridad, oportunidad y efectividad al transmitir información.',1.0,101),
('00000000-0000-0000-0000-000000000001','deber','competencias_organizacionales','Trabajo en equipo y cooperación','Disposición para colaborar y construir con otros hacia un objetivo común.',1.0,102),
('00000000-0000-0000-0000-000000000001','hacer','competencias_organizacionales','Servicio al cliente','Orientación a satisfacer las necesidades del cliente interno y externo.',1.0,103)
on conflict do nothing;

-- ── Catálogo ampliado: Competencias Funcionales del Cargo ──────────────────
insert into competencias (empresa_id, dimension, bloque, nombre, descripcion_que_evalua, peso_relativo, orden) values
('00000000-0000-0000-0000-000000000001','hacer','competencias_funcionales','Productividad personal','Capacidad de generar resultados de forma eficiente con los recursos disponibles.',1.0,110),
('00000000-0000-0000-0000-000000000001','hacer','competencias_funcionales','Proactividad','Anticipación a problemas y oportunidades sin necesidad de instrucción constante.',1.0,111),
('00000000-0000-0000-0000-000000000001','hacer','competencias_funcionales','Capacidad de aprendizaje continuo','Disposición para aprender, actualizarse y aplicar nuevo conocimiento al rol.',1.0,112),
('00000000-0000-0000-0000-000000000001','hacer','competencias_funcionales','Persistencia y constancia','Sostenimiento del esfuerzo y la calidad en el tiempo, incluso ante obstáculos.',1.0,113),
('00000000-0000-0000-0000-000000000001','deber','competencias_funcionales','Empatía y relaciones interpersonales','Capacidad de comprender a otros y construir relaciones de trabajo sanas.',1.0,114),
('00000000-0000-0000-0000-000000000001','hacer','competencias_funcionales','Planeación y organización técnica','Capacidad de estructurar el trabajo propio del cargo de forma ordenada y anticipada.',1.0,115)
on conflict do nothing;

-- ── Catálogo ampliado: Competencias de Liderazgo (solo cargos con personal a cargo) ──
insert into competencias (empresa_id, dimension, bloque, nombre, descripcion_que_evalua, solo_con_personal_a_cargo, peso_relativo, orden) values
('00000000-0000-0000-0000-000000000001','hacer','competencias_liderazgo','Visión estratégica','Capacidad de proyectar el rumbo del equipo/área más allá de lo inmediato.', true, 1.0, 120),
('00000000-0000-0000-0000-000000000001','hacer','competencias_liderazgo','Desarrollo de personas','Capacidad de formar, delegar y hacer crecer al equipo.', true, 1.0, 121),
('00000000-0000-0000-0000-000000000001','hacer','competencias_liderazgo','Gestión del cambio','Capacidad de liderar al equipo a través de transiciones y ajustes.', true, 1.0, 122),
('00000000-0000-0000-0000-000000000001','hacer','competencias_liderazgo','Toma de decisiones','Capacidad de decidir con criterio, oportunidad y responsabilidad.', true, 1.0, 123)
on conflict do nothing;

-- La competencia "Liderazgo" original (sección 7.2 del documento base) se conserva
-- también dentro de competencias_liderazgo para no perder el histórico ya calificado.
update competencias set bloque = 'competencias_liderazgo' where nombre = 'Liderazgo' and bloque is null;

-- ── Catálogo de Cultura ya existente se completa con el nombre pedido explícitamente ──
-- (Trabajo en Equipo, Compromiso, Calidez Humana, Actitud de Servicio ya están;
--  se agregan Responsabilidad, Respeto, Disciplina, Comunicación si no existen con ese nombre exacto)
insert into competencias (empresa_id, dimension, bloque, nombre, descripcion_que_evalua, peso_relativo, orden) values
('00000000-0000-0000-0000-000000000001','deber','cultura','Responsabilidad','Cumplimiento consistente de lo que se compromete, con o sin supervisión.',1.0,130),
('00000000-0000-0000-0000-000000000001','deber','cultura','Respeto','Trato considerado hacia compañeros, líderes, clientes y normas de la organización.',1.0,131),
('00000000-0000-0000-0000-000000000001','deber','cultura','Disciplina','Apego consistente a procesos, horarios y estándares establecidos.',1.0,132)
on conflict do nothing;
-- "Comunicación" y "Compromiso" ya existen (uno en organizacionales, otro en cultura); no se duplican.

-- ============================================================================
-- PARTE 4 — Evaluación instanciada y editable por evaluación (no solo catálogo)
-- ============================================================================
-- Hoy, evaluacion_tareas + respuestas_evaluacion asumen que TODAS las
-- competencias activas de la empresa aplican. Ahora Talento Humano necesita
-- poder agregar/quitar ítems puntuales EN UNA EVALUACIÓN YA GENERADA, sin
-- afectar el catálogo general ni otras evaluaciones. Se resuelve con una
-- tabla de "ítems" propia de cada evaluación, poblada al generarla.

create type origen_item_evaluacion as enum ('competencia', 'funcion_cargo');

create table evaluacion_items (
  id uuid primary key default gen_random_uuid(),
  evaluacion_id uuid not null references evaluaciones(id) on delete cascade,
  bloque bloque_evaluacion not null,
  origen origen_item_evaluacion not null default 'competencia',
  competencia_id uuid references competencias(id),                        -- si origen = 'competencia'
  cargo_funcion_id uuid references cargo_funciones_principales(id),        -- si origen = 'funcion_cargo'
  -- snapshot de texto (para que el ítem se conserve legible aunque el
  -- catálogo o el perfil de cargo cambien después de generada la evaluación)
  titulo text not null,
  descripcion text,
  activo boolean not null default true,      -- Talento Humano puede desactivar un ítem sin borrar el histórico
  agregado_manualmente boolean not null default false,
  orden int default 0,
  created_at timestamptz not null default now(),
  unique(evaluacion_id, competencia_id),
  unique(evaluacion_id, cargo_funcion_id)
);

comment on table evaluacion_items is 'Los ítems reales a evaluar EN ESTA evaluación puntual. Se generan automáticamente al crear la evaluación (desde el catálogo de competencias aplicables + las funciones del cargo), y Talento Humano puede agregar ítems libres o desactivar (no borrar) los que no apliquen — sin tocar el catálogo general ni otras evaluaciones.';

create index idx_evaluacion_items_evaluacion on evaluacion_items(evaluacion_id);

-- ── Respuestas ahora apuntan a evaluacion_items (no directo a competencias) ──
-- Se agrega la columna nueva y se deja la anterior por compatibilidad histórica.
alter table respuestas_evaluacion add column if not exists evaluacion_item_id uuid references evaluacion_items(id) on delete cascade;
alter table respuestas_evaluacion add column if not exists resultado_real text;        -- lo que el evaluador observó (para el bloque Roles y Funciones)
alter table respuestas_evaluacion add column if not exists observacion text;           -- TODOS los ítems piden poder agregar observación

-- Permite upsert por (tarea, ítem) ahora que las respuestas se guardan contra
-- evaluacion_items en lugar de competencias directamente.
create unique index if not exists uq_respuesta_tarea_item on respuestas_evaluacion(evaluacion_tarea_id, evaluacion_item_id) where evaluacion_item_id is not null;

comment on column respuestas_evaluacion.observacion is 'Campo de observación libre, disponible en cualquier ítem de cualquier bloque (pedido explícito: "Todas las opciones deben tener posibilidad de colocar una observación").';

-- ============================================================================
-- PARTE 5 — Guía del Flow: adjuntar el PDF ya diseñado por FlowAndo
-- ============================================================================
alter table guia_del_flow add column if not exists documento_pdf_url text;
alter table guia_del_flow add column if not exists origen_flow date;   -- fecha de nacimiento, tal como aparece en la portada de la guía

comment on column guia_del_flow.documento_pdf_url is 'PDF de la Guía del Flow diseñada por FlowAndo (Storage), para consulta directa sin tener que re-digitar su contenido narrativo.';
