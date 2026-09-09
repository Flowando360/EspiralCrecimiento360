-- ============================================================================
-- 0054_guia_del_flow_invitaciones.sql
--
-- Antes, la única forma de conectar una Guía del Flow (generada en
-- guiadelflow) con un colaborador de aquí era que la persona escribiera,
-- al registrarse, el mismo correo que tiene cargado en su ficha — un dato
-- libre que puede tener un error de tipeo o venir de un correo personal en
-- vez del corporativo. Emparejar por nombre sería peor (nombres repetidos
-- o parecidos entre colaboradores reales — ya pasó con dos personas con
-- el mismo primer nombre en Flow, Nexus y Visión).
--
-- Esta tabla resuelve el problema de raíz: admin_th elige explícitamente
-- A QUIÉN le manda el link, desde la ficha de esa persona. El link lleva
-- un token único ligado a ese colaborador_id exacto — la asociación deja
-- de depender de que alguien escriba bien un correo o un nombre.
-- ============================================================================

create table guia_del_flow_invitaciones (
  id uuid primary key default gen_random_uuid(),
  colaborador_id uuid not null references colaboradores(id) on delete cascade,
  token uuid not null default gen_random_uuid(),
  creado_por uuid references perfiles_usuario(id) on delete set null,
  created_at timestamptz not null default now(),
  usado_at timestamptz,
  -- id de auth.users/flow_perfiles en guiadelflow (mismo proyecto de
  -- Supabase, pero esa tabla es del dominio de ese repo) que consumió esta
  -- invitación al registrarse. Sin FK a propósito: no es nuestra tabla.
  usado_por_usuario_flow_id uuid
);

create unique index uq_guia_del_flow_invitaciones_token on guia_del_flow_invitaciones(token);

comment on table guia_del_flow_invitaciones is 'Invitaciones a generar la Guía del Flow, una por link enviado. Consumida por guiadelflow (src/lib/circulo/invitacion.ts en ese repo) cuando la persona se registra con el token en la URL — deja colaborador_circulo_id en flow_perfiles, y sincronizar.ts lo usa en vez de emparejar por correo.';

alter table guia_del_flow_invitaciones enable row level security;

create policy "invitaciones: admin_th lee las de su empresa" on guia_del_flow_invitaciones for select
  using (
    fn_mi_rol() = 'admin_th'
    and exists(select 1 from colaboradores co where co.id = colaborador_id and co.empresa_id = fn_mi_empresa_id())
  );

create policy "invitaciones: admin_th crea para su empresa" on guia_del_flow_invitaciones for insert
  with check (
    fn_mi_rol() = 'admin_th'
    and exists(select 1 from colaboradores co where co.id = colaborador_id and co.empresa_id = fn_mi_empresa_id())
  );

-- Sin policy de update/delete: usado_at/usado_por_usuario_flow_id los
-- marca guiadelflow con su service_role (bypassa RLS), nunca esta app.
