-- ============================================================================
-- 0016_bucket_guias_flow.sql
-- Crea el bucket "guias-flow" (PRIVADO) para el PDF de la Guía del Flow, con
-- las políticas de Storage que el código siempre asumió que existían pero
-- nunca se crearon: solo admin_th sube/reemplaza; solo admin_th, el líder
-- del colaborador o el propio colaborador pueden leer el archivo.
--
-- Al ser privado, el código de subida (guia-flow/actions.ts y
-- guias-colaboradores/actions.ts) debe guardar la RUTA del archivo en
-- documento_pdf_url (no una URL pública), y quien lo muestre debe generar
-- un signed URL temporal en el momento — ver ese cambio en el mismo commit.
-- ============================================================================

insert into storage.buckets (id, name, public)
values ('guias-flow', 'guias-flow', false)
on conflict (id) do nothing;

create policy "guias-flow: admin_th sube" on storage.objects for insert
  with check (bucket_id = 'guias-flow' and public.fn_mi_rol() = 'admin_th');

create policy "guias-flow: admin_th reemplaza" on storage.objects for update
  using (bucket_id = 'guias-flow' and public.fn_mi_rol() = 'admin_th');

-- La ruta de cada archivo es "empresa_id/colaborador_id/archivo.pdf", así
-- que el segundo segmento de carpeta es el colaborador_id.
create policy "guias-flow: lectura de las partes involucradas" on storage.objects for select
  using (
    bucket_id = 'guias-flow'
    and (
      public.fn_mi_rol() = 'admin_th'
      or (storage.foldername(name))[2]::uuid = public.fn_mi_colaborador_id()
      or public.fn_es_mi_equipo((storage.foldername(name))[2]::uuid)
    )
  );
