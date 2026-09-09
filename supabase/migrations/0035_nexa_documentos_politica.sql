-- ============================================================================
-- 0035_nexa_documentos_politica.sql
-- Base documental de políticas propias para el asistente de IA de Nexa
-- (punto 4 del plan de diferenciación pendiente). Hasta hoy el asistente
-- solo usaba como contexto el propósito/valores/principios de Identidad
-- Organizacional — no podía resolver dudas normativas reales (reglamento
-- SST, manual interno) porque no había ningún mecanismo para cargarlas.
--
-- RAG básico por búsqueda de texto (no vectores/embeddings): con el
-- volumen de documentos que maneja una sola empresa (unas pocas decenas
-- como mucho), una búsqueda de texto completo de Postgres sobre el
-- contenido ya extraído es suficiente y evita la infraestructura extra
-- de pgvector + un proveedor de embeddings para este alcance.
-- ============================================================================

create table nexa_documentos_politica (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  titulo text not null,
  categoria text not null default 'otro' check (categoria in ('sst', 'politicas', 'procedimientos', 'otro')),
  contenido text not null, -- texto ya extraído (del PDF subido o pegado directamente) — lo que efectivamente lee el asistente
  archivo_url text, -- ruta del PDF original en el bucket privado documentos-politica, si se subió uno
  activo boolean not null default true,
  subido_por uuid references perfiles_usuario(id) on delete set null,
  created_at timestamptz not null default now()
);

comment on table nexa_documentos_politica is 'Documentos de políticas/procedimientos propios que usa el asistente de IA de Nexa como contexto. El texto ya viene extraído en `contenido` (RAG básico por búsqueda de texto completo de Postgres, no embeddings).';

create index idx_documentos_politica_busqueda on nexa_documentos_politica using gin (to_tsvector('spanish', titulo || ' ' || contenido));

alter table nexa_documentos_politica enable row level security;

create policy "documentos_politica: lectura empresa" on nexa_documentos_politica for select
  using (empresa_id = fn_mi_empresa_id());
create policy "documentos_politica: admin_th administra" on nexa_documentos_politica for all
  using (empresa_id = fn_mi_empresa_id() and fn_mi_rol() = 'admin_th');

-- ── Bucket privado para los PDF originales (solo referencia/descarga; lo
-- que lee el asistente es la columna `contenido` de la tabla) ─────────────
insert into storage.buckets (id, name, public)
values ('documentos-politica', 'documentos-politica', false)
on conflict (id) do nothing;

create policy "documentos-politica: admin_th sube" on storage.objects for insert
  with check (bucket_id = 'documentos-politica' and public.fn_mi_rol() = 'admin_th');
create policy "documentos-politica: admin_th elimina" on storage.objects for delete
  using (bucket_id = 'documentos-politica' and public.fn_mi_rol() = 'admin_th');
create policy "documentos-politica: lectura empresa" on storage.objects for select
  using (
    bucket_id = 'documentos-politica'
    and (storage.foldername(name))[1]::uuid = public.fn_mi_empresa_id()
  );
