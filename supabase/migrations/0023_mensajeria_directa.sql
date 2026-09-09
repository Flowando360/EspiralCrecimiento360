-- ============================================================================
-- Mensajería directa (backlog: especificacion-funcional.md 4.7, "distinto
-- del feed broadcast"): mensajes 1:1 entre cualquier par de personas de la
-- misma empresa. No hay restricción de organigrama a propósito (no era un
-- requisito concreto) — cualquiera puede escribirle a cualquiera dentro de
-- su empresa.
-- ============================================================================

create table mensajes_directos (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  remitente_id uuid not null references perfiles_usuario(id) on delete cascade,
  destinatario_id uuid not null references perfiles_usuario(id) on delete cascade,
  contenido text not null,
  leido boolean not null default false,
  leido_en timestamptz,
  created_at timestamptz not null default now()
);

comment on table mensajes_directos is 'Mensajería 1:1 entre usuarios de la misma empresa, distinta del feed corporativo (broadcast).';

create index idx_mensajes_directos_remitente on mensajes_directos(remitente_id, created_at);
create index idx_mensajes_directos_destinatario on mensajes_directos(destinatario_id, created_at);

alter table mensajes_directos enable row level security;

create policy "mensajes_directos: remitente o destinatario ven" on mensajes_directos for select
  using (remitente_id = auth.uid() or destinatario_id = auth.uid());

create policy "mensajes_directos: se envia dentro de la empresa" on mensajes_directos for insert
  with check (
    remitente_id = auth.uid()
    and empresa_id = public.fn_mi_empresa_id()
    and exists (select 1 from perfiles_usuario pu where pu.id = destinatario_id and pu.empresa_id = public.fn_mi_empresa_id())
  );

create policy "mensajes_directos: destinatario marca leido" on mensajes_directos for update
  using (destinatario_id = auth.uid());
