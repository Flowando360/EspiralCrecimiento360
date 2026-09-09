-- ============================================================================
-- 0017_feed_adjuntos.sql
-- Amplía nexa_feed_publicaciones para soportar adjuntos (documento, link con
-- vista previa, video/imagen), según docs/especificacion-feed-comunicados.md.
-- Reutiliza la columna "contenido" existente como el cuerpo del mensaje
-- (no se crea una columna duplicada "contenido_texto").
--
-- Crea también el bucket privado "feed-adjuntos" para los archivos: el feed
-- es visible para toda la empresa, así que la policy de lectura se basa en
-- la empresa (primer segmento de la ruta), igual que empresa_id en la fila.
-- ============================================================================

create type tipo_adjunto_feed as enum ('ninguno', 'documento', 'link', 'video_imagen');

alter table nexa_feed_publicaciones
  add column tipo_adjunto tipo_adjunto_feed not null default 'ninguno',
  add column archivo_url text,
  add column archivo_nombre text,
  add column archivo_tamano_bytes bigint,
  add column link_url text,
  add column link_preview_titulo text,
  add column link_preview_imagen text,
  add column link_preview_descripcion text;

insert into storage.buckets (id, name, public)
values ('feed-adjuntos', 'feed-adjuntos', false)
on conflict (id) do nothing;

-- Ruta de cada archivo: "empresa_id/publicacion-<random>/archivo.ext".
create policy "feed-adjuntos: admin_th y lider suben" on storage.objects for insert
  with check (
    bucket_id = 'feed-adjuntos'
    and public.fn_mi_rol() in ('admin_th', 'lider')
    and (storage.foldername(name))[1]::uuid = public.fn_mi_empresa_id()
  );

create policy "feed-adjuntos: lectura de toda la empresa" on storage.objects for select
  using (
    bucket_id = 'feed-adjuntos'
    and (storage.foldername(name))[1]::uuid = public.fn_mi_empresa_id()
  );
