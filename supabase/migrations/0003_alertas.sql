-- ============================================================================
-- 0003_alertas.sql
-- Módulo transversal de fechas clave: contrato, SST, formación, ciclo, cultura.
-- Es el puente entre el Espiral de Crecimiento y Nexa: una alerta vencida
-- puede disparar automáticamente una ruta de formación (ver 0004_nexa.sql).
-- ============================================================================

create type tipo_alerta as enum (
  'contrato_vencimiento',
  'periodo_prueba_fin',
  'sst_examen_medico',
  'sst_certificacion',
  'sst_induccion',
  'sst_epp',
  'formacion_vencimiento',
  'ciclo_evaluacion',
  'cumpleanos',
  'aniversario_ingreso',
  'otro'
);

create type severidad_alerta as enum ('info', 'atencion', 'critica');
create type estado_alerta as enum ('pendiente', 'notificada', 'resuelta', 'vencida', 'descartada');

create table alertas (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  colaborador_id uuid references colaboradores(id) on delete cascade,
  tipo tipo_alerta not null,
  severidad severidad_alerta not null default 'info',
  titulo text not null,
  descripcion text,
  fecha_objetivo date not null, -- fecha del vencimiento / evento
  dias_anticipacion int not null default 15, -- cuándo empezar a notificar
  estado estado_alerta not null default 'pendiente',
  -- referencia opcional al origen (certificación, contrato, ciclo...)
  hoja_vida_formacion_id uuid references hoja_vida_formacion(id) on delete cascade,
  ciclo_evaluacion_id uuid references ciclos_evaluacion(id) on delete cascade,
  -- disparo hacia Nexa (se completa cuando existe integración, ver 0004)
  nexa_ruta_formacion_disparada_id uuid,
  resuelta_por uuid references perfiles_usuario(id),
  resuelta_en timestamptz,
  created_at timestamptz not null default now()
);

comment on table alertas is 'Calendario vivo de fechas clave: contratos, SST (exámenes, certificaciones, inducción, EPP), formación, ciclos, cumpleaños y aniversarios. Motor de generación en supabase/functions y trigger sobre hoja_vida_formacion.';

create index idx_alertas_fecha on alertas(fecha_objetivo);
create index idx_alertas_estado on alertas(estado);
create index idx_alertas_colaborador on alertas(colaborador_id);

-- ── Registro de notificaciones enviadas ────────────────────────────────────
create type canal_notificacion as enum ('email', 'whatsapp', 'in_app');

create table notificaciones (
  id uuid primary key default gen_random_uuid(),
  destinatario_usuario_id uuid references perfiles_usuario(id) on delete cascade,
  alerta_id uuid references alertas(id) on delete cascade,
  evaluacion_tarea_id uuid references evaluacion_tareas(id) on delete cascade,
  canal canal_notificacion not null default 'email',
  asunto text,
  cuerpo text,
  enviado boolean not null default false,
  enviado_en timestamptz,
  leido boolean not null default false,
  leido_en timestamptz,
  created_at timestamptz not null default now()
);

comment on table notificaciones is 'Centro de notificaciones: formularios pendientes, cierre de ciclo, publicación de resultados, alertas de fecha clave. Fase 1: email (Resend). Fase 2: WhatsApp empresarial.';
