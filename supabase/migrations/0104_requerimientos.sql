-- ============================================================================
-- 0104_requerimientos.sql
-- Requerimientos que los usuarios envían desde el Centro de Ayuda cuando el
-- manual no responde lo que necesitan. Se guardan siempre, aunque el correo no
-- se pueda enviar. Solo los lee y actualiza el equipo proveedor (service role).
-- ============================================================================

create table if not exists requerimientos (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  usuario_id uuid references perfiles_usuario(id) on delete set null,
  nombre_usuario text not null,
  correo_usuario text not null,
  pagina text,
  que_pasa text not null,
  que_esperaba text not null,
  solucion_imaginada text not null,
  estado text not null default 'nuevo' check (estado in ('nuevo', 'en_revision', 'resuelto', 'descartado')),
  correo_enviado boolean not null default false,
  creado_en timestamptz not null default now()
);

comment on table requerimientos is 'Requerimientos enviados desde el Centro de Ayuda: qué pasa, qué se esperaba y cómo imagina la solución quien escribe.';

create index if not exists idx_requerimientos_estado on requerimientos(estado, creado_en desc);

alter table requerimientos enable row level security;
