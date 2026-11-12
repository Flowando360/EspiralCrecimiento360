-- Modelo integral (§7.2 y §9.2), Fase 1 parte 3: evidencias adjuntas en cada ítem de Hacer y Deber.
-- «Toda calificación debe contar con comentarios y evidencia proporcional a la importancia del criterio» (§6.5).
-- Cada respuesta puede llevar hasta 5 archivos (fotos, PDF, documentos) que sustentan la nota.

alter table respuestas_evaluacion add column if not exists adjuntos jsonb not null default '[]'::jsonb;

comment on column respuestas_evaluacion.adjuntos is 'Evidencias que sustentan la nota: [{ nombre, ruta, tipo, tamano }]. Los archivos viven en el bucket privado "evidencias-valoracion" (ruta: empresa_id/tarea_id/item_id/archivo).';

-- Bucket privado. Quien valora sube y quita archivos MIENTRAS su valoración siga en borrador; después quedan fijos.
-- La lectura directa es solo del evaluador y de admin_th; los demás las ven a través de la aplicación, que decide
-- quién puede (p. ej. el líder y la persona valorada ven las de la autoevaluación y del líder, nunca las de pares).
insert into storage.buckets (id, name, public)
values ('evidencias-valoracion', 'evidencias-valoracion', false)
on conflict (id) do nothing;

drop policy if exists "evidencias-valoracion: evaluador sube" on storage.objects;
create policy "evidencias-valoracion: evaluador sube" on storage.objects for insert
  with check (
    bucket_id = 'evidencias-valoracion'
    and exists (
      select 1 from evaluacion_tareas t
      where t.id::text = (storage.foldername(name))[2]
        and t.evaluador_colaborador_id = public.fn_mi_colaborador_id()
        and t.completada = false
    )
  );

drop policy if exists "evidencias-valoracion: evaluador borra" on storage.objects;
create policy "evidencias-valoracion: evaluador borra" on storage.objects for delete
  using (
    bucket_id = 'evidencias-valoracion'
    and exists (
      select 1 from evaluacion_tareas t
      where t.id::text = (storage.foldername(name))[2]
        and t.evaluador_colaborador_id = public.fn_mi_colaborador_id()
        and t.completada = false
    )
  );

drop policy if exists "evidencias-valoracion: evaluador y admin_th leen" on storage.objects;
create policy "evidencias-valoracion: evaluador y admin_th leen" on storage.objects for select
  using (
    bucket_id = 'evidencias-valoracion'
    and (storage.foldername(name))[1] = public.fn_mi_empresa_id()::text
    and (
      public.fn_mi_rol() = 'admin_th'
      or exists (
        select 1 from evaluacion_tareas t
        where t.id::text = (storage.foldername(name))[2]
          and t.evaluador_colaborador_id = public.fn_mi_colaborador_id()
      )
    )
  );
