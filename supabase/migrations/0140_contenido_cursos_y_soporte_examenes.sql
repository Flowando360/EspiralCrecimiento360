-- Informe de Luisa 4.18.3 y 4.10.3 (cierre):
--  · Cursos con contenido propio: un archivo (video, presentación o documento) además del enlace externo.
--    Bucket privado «cursos-contenido»; ruta: empresa_id/curso_id/archivo. Lo sube Talento Humano y lo lee toda la empresa.
--  · Exámenes médicos con soporte adjunto, en la carpeta «examen» del bucket «documentos-colaborador», con la misma
--    privacidad que las incapacidades (Talento Humano y la propia persona). Idempotente.

alter table nexa_cursos add column if not exists contenido_archivo_path text;
alter table nexa_cursos add column if not exists contenido_archivo_nombre text;

insert into storage.buckets (id, name, public)
values ('cursos-contenido', 'cursos-contenido', false)
on conflict (id) do nothing;

drop policy if exists "cursos-contenido: admin_th sube" on storage.objects;
create policy "cursos-contenido: admin_th sube" on storage.objects for insert
  with check (bucket_id = 'cursos-contenido' and public.fn_mi_rol() = 'admin_th' and (storage.foldername(name))[1] = public.fn_mi_empresa_id()::text);

drop policy if exists "cursos-contenido: admin_th reemplaza" on storage.objects;
create policy "cursos-contenido: admin_th reemplaza" on storage.objects for update
  using (bucket_id = 'cursos-contenido' and public.fn_mi_rol() = 'admin_th' and (storage.foldername(name))[1] = public.fn_mi_empresa_id()::text);

drop policy if exists "cursos-contenido: admin_th borra" on storage.objects;
create policy "cursos-contenido: admin_th borra" on storage.objects for delete
  using (bucket_id = 'cursos-contenido' and public.fn_mi_rol() = 'admin_th' and (storage.foldername(name))[1] = public.fn_mi_empresa_id()::text);

drop policy if exists "cursos-contenido: lectura empresa" on storage.objects;
create policy "cursos-contenido: lectura empresa" on storage.objects for select
  using (bucket_id = 'cursos-contenido' and (storage.foldername(name))[1] = public.fn_mi_empresa_id()::text);

alter table examenes_medicos_colaborador add column if not exists soporte_url text;

drop policy if exists "documentos-colaborador: lectura examen" on storage.objects;
create policy "documentos-colaborador: lectura examen" on storage.objects for select
  using (
    bucket_id = 'documentos-colaborador'
    and (storage.foldername(name))[3] = 'examen'
    and (
      public.fn_mi_rol() = 'admin_th'
      or (storage.foldername(name))[2]::uuid = public.fn_mi_colaborador_id()
    )
  );
