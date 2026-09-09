-- ============================================================================
-- 0002_circulo_crecimiento.sql
-- El modelo Ser · Saber · Hacer · Deber completo:
-- competencias, ciclos de evaluación, arquitectura de evaluadores,
-- respuestas, cálculo de índices, Guía del Flow, verificación de Saber y PDI.
-- ============================================================================

-- ── Catálogo de competencias (Hacer y Deber) ───────────────────────────────
create type dimension_competencia as enum ('hacer', 'deber');

create table competencias (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  dimension dimension_competencia not null,
  nombre text not null, -- Resultados, Puntualidad, Estrategia, Autogestión, Liderazgo / Trabajo en Equipo, Compromiso, Calidez Humana, Actitud de Servicio
  descripcion_que_evalua text,
  solo_con_personal_a_cargo boolean not null default false, -- true únicamente para "Liderazgo"
  peso_relativo numeric(4,2) not null default 1.0, -- Resultados pesa el doble (secc. 10.1)
  orden int default 0,
  activo boolean not null default true
);

comment on table competencias is 'Las 9 competencias del Espiral de Crecimiento, ya construidas por FNV: 5 de Hacer (Resultados x2, Puntualidad, Estrategia, Autogestión, Liderazgo) y 4 de Deber (Trabajo en Equipo, Compromiso, Calidez Humana, Actitud de Servicio).';

-- Los 5 niveles de la escala (Crítico..Referente), iguales para toda competencia
create table escala_niveles (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  nivel int not null check (nivel between 1 and 5),
  etiqueta text not null, -- Crítico, En Desarrollo, Esperado, Destacado, Referente
  descripcion_general text,
  unique(empresa_id, nivel)
);

-- Criterio específico de cada nivel, por competencia (la "guía de valoración")
create table competencia_criterios (
  id uuid primary key default gen_random_uuid(),
  competencia_id uuid not null references competencias(id) on delete cascade,
  nivel int not null check (nivel between 1 and 5),
  criterio text not null,
  unique(competencia_id, nivel)
);

-- ── Ciclos de evaluación ────────────────────────────────────────────────────
create type estado_ciclo as enum ('planeado', 'abierto', 'en_consolidacion', 'publicado', 'cerrado');

create table ciclos_evaluacion (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  nombre text not null, -- "2026 - Semestre 1"
  fecha_apertura date not null,
  fecha_cierre_respuestas date not null,
  fecha_publicacion date,
  estado estado_ciclo not null default 'planeado',
  -- Pesos de ponderación vigentes para ESTE ciclo (parametrizable, secc. 10.2)
  peso_lider_con_equipo numeric(4,2) not null default 0.40,
  peso_pares_con_equipo numeric(4,2) not null default 0.30,
  peso_colaboradores_con_equipo numeric(4,2) not null default 0.30,
  peso_lider_sin_equipo numeric(4,2) not null default 0.60,
  peso_pares_sin_equipo numeric(4,2) not null default 0.40,
  created_at timestamptz not null default now()
);

comment on table ciclos_evaluacion is 'Ciclo semestral de evaluación Hacer+Deber. Los pesos son editables por Talento Humano sin tocar fórmulas (secc. 13.1).';

-- ── Arquitectura de evaluadores por ciclo ──────────────────────────────────
-- Se genera automáticamente al abrir un ciclo, a partir de colaboradores.lider_id.
-- (Ver también la vista v_organigrama_evaluadores en 0005 para la lógica en vivo)
create type tipo_evaluador as enum ('autoevaluacion', 'lider', 'par', 'colaborador_a_cargo');

create table evaluaciones (
  id uuid primary key default gen_random_uuid(),
  ciclo_id uuid not null references ciclos_evaluacion(id) on delete cascade,
  colaborador_evaluado_id uuid not null references colaboradores(id) on delete cascade,
  -- snapshot de si en este ciclo activa Liderazgo/colaboradores a cargo
  tenia_personal_a_cargo boolean not null default false,
  -- estado agregado de esta evaluación (todas las fuentes)
  porcentaje_avance numeric(5,2) not null default 0,
  publicado boolean not null default false,
  created_at timestamptz not null default now(),
  unique(ciclo_id, colaborador_evaluado_id)
);

create table evaluacion_tareas (
  -- una "tarea" = una persona concreta debe calificar a otra concreta en este ciclo
  id uuid primary key default gen_random_uuid(),
  evaluacion_id uuid not null references evaluaciones(id) on delete cascade,
  evaluador_colaborador_id uuid not null references colaboradores(id) on delete cascade,
  tipo_evaluador tipo_evaluador not null,
  completada boolean not null default false,
  fecha_completada timestamptz,
  notificado_en timestamptz,
  recordatorios_enviados int not null default 0,
  unique(evaluacion_id, evaluador_colaborador_id)
);

comment on table evaluacion_tareas is 'Cola de trabajo: quién debe evaluar a quién en este ciclo. Generada automáticamente desde el organigrama (secc. 9.2 y 13.4 paso 2).';

-- ── Respuestas individuales (una calificación por competencia) ────────────
create table respuestas_evaluacion (
  id uuid primary key default gen_random_uuid(),
  evaluacion_tarea_id uuid not null references evaluacion_tareas(id) on delete cascade,
  competencia_id uuid not null references competencias(id),
  nota int not null check (nota between 1 and 5),
  comentario text,
  created_at timestamptz not null default now(),
  unique(evaluacion_tarea_id, competencia_id)
);

comment on table respuestas_evaluacion is 'Cada calificación puntual. Al insertarse, un trigger recalcula los índices de la persona evaluada (tiempo real, secc. 13.6).';

-- ── Resultados calculados (cache materializada, recalculada por trigger) ──
create table resultados_evaluacion (
  evaluacion_id uuid primary key references evaluaciones(id) on delete cascade,
  indice_hacer numeric(3,2),
  indice_deber numeric(3,2),
  semaforo_hacer text check (semaforo_hacer in ('alto','medio','bajo')),
  semaforo_deber text check (semaforo_deber in ('alto','medio','bajo')),
  -- brecha = promedio(terceros) - autoevaluación, por dimensión
  brecha_hacer numeric(3,2),
  brecha_deber numeric(3,2),
  detalle_por_competencia jsonb, -- [{competencia_id, promedio_lider, promedio_pares, promedio_colab, autoeval}]
  actualizado_en timestamptz not null default now()
);

comment on table resultados_evaluacion is 'Cache de resultados recalculada en tiempo real. El semáforo: Alto >=4.0, Medio 3.5-4.0, Bajo <3.5 (secc. 10.3).';

-- ============================================================================
-- DIMENSIÓN SER — Guía del Flow
-- ============================================================================
create table guia_del_flow (
  id uuid primary key default gen_random_uuid(),
  colaborador_id uuid not null references colaboradores(id) on delete cascade,
  fecha_aplicacion date not null default current_date,
  -- Resultado narrativo, no numérico (secc. 5.4: nunca se mezcla con el índice)
  talentos_naturales text,
  temperamento text,
  motivaciones_profundas text,
  manejo_emocional text,
  etapa_evolucion_personal text,
  proposito text,
  perfil_narrativo_completo text, -- texto largo generado/consolidado
  -- Señales de apoyo cruzadas con Hacer/Deber para el PDI (secc. 5.3)
  senales_apoyo jsonb,
  respuestas_cuestionario jsonb, -- respuestas crudas del cuestionario digital
  created_at timestamptz not null default now()
);

comment on table guia_del_flow is 'Dimensión SER. Cuestionario digital de autoconocimiento, asincrónico, individual. Vive como ficha de talento, fuera del cálculo del Índice 360°.';

-- ============================================================================
-- DIMENSIÓN SABER — Verificación del perfil de cargo
-- ============================================================================
create type estado_verificacion as enum ('cumple', 'cumple_parcial', 'no_cumple_pendiente');
create type bloque_saber as enum ('formacion_academica', 'habilidades_funcionales_tecnicas', 'certificaciones', 'experiencia');

create table verificaciones_saber (
  id uuid primary key default gen_random_uuid(),
  colaborador_id uuid not null references colaboradores(id) on delete cascade,
  ciclo_id uuid references ciclos_evaluacion(id), -- null = verificación ad-hoc por novedad
  bloque bloque_saber not null,
  item_evaluado text not null, -- ej. "Título Técnico en Logística", "Certificación de alturas"
  estado estado_verificacion not null default 'no_cumple_pendiente',
  evidencia_url text,
  certificado_por uuid references perfiles_usuario(id),
  observaciones text,
  fecha_verificacion date not null default current_date,
  created_at timestamptz not null default now()
);

comment on table verificaciones_saber is 'Checklist de verificación de Saber por bloque (secc. 6.2). El % de cumplimiento se calcula en v_saber_cumplimiento.';

-- ============================================================================
-- PLAN DE DESARROLLO INDIVIDUAL (PDI) — el entregable central
-- ============================================================================
create type origen_pdi as enum ('hacer', 'deber', 'saber', 'ser', 'mixto');
create type estado_pdi as enum ('pendiente', 'en_curso', 'cumplido', 'vencido');

create table planes_desarrollo (
  id uuid primary key default gen_random_uuid(),
  colaborador_id uuid not null references colaboradores(id) on delete cascade,
  ciclo_origen_id uuid references ciclos_evaluacion(id),
  origen origen_pdi not null default 'mixto',
  brecha_detectada text not null, -- descripción de la brecha que originó la acción
  accion text not null,
  responsable_id uuid references colaboradores(id),
  fecha_compromiso date,
  estado estado_pdi not null default 'pendiente',
  fecha_cumplimiento date,
  evidencia_url text,
  notas text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table planes_desarrollo is 'PDI: el fin último del modelo. Distingue si la brecha es de actitud (Deber), formación (Saber) o alineación de talento (Ser).';

-- ── Brief de preparación para el líder ─────────────────────────────────────
create table briefs_retroalimentacion (
  id uuid primary key default gen_random_uuid(),
  evaluacion_id uuid not null references evaluaciones(id) on delete cascade,
  talento_central text,
  resumen_hacer text,
  resumen_deber text,
  sugerencias_enfoque text,
  generado_en timestamptz not null default now()
);

comment on table briefs_retroalimentacion is 'Documento breve pre-generado para el líder antes de la reunión de retroalimentación (secc. 12.1, punto 5).';

-- ── Acuerdo de crecimiento (firma digital / registro de compromiso) ───────
create table acuerdos_crecimiento (
  id uuid primary key default gen_random_uuid(),
  evaluacion_id uuid not null references evaluaciones(id) on delete cascade,
  compromisos_colaborador text,
  compromisos_empresa text,
  firmado_colaborador boolean not null default false,
  firmado_lider boolean not null default false,
  fecha_firma_colaborador timestamptz,
  fecha_firma_lider timestamptz,
  created_at timestamptz not null default now()
);
