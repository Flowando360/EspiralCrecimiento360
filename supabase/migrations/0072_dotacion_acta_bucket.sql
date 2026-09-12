-- ============================================================================
-- 0072_dotacion_acta_bucket.sql
-- Bucket privado para la foto/escaneo del acta de entrega de dotación
-- firmada en papel (columna dotacion_entregas.acta_firmada_url, agregada en
-- 0071) — alternativa a la firma digital (firma_confirmada) cuando la
-- persona firma físicamente. admin_th administra; el propio colaborador
-- puede ver (y subir) el acta de sus propias entregas, igual que ya puede
-- confirmar su firma digital.
-- ============================================================================

insert into storage.buckets (id, name, public)
values ('actas-dotacion', 'actas-dotacion', false)
on conflict (id) do nothing;

create policy "actas-dotacion: admin_th administra" on storage.objects for all
  using (
    bucket_id = 'actas-dotacion'
    and (storage.foldername(name))[1]::uuid = public.fn_mi_empresa_id()
    and public.fn_mi_rol() = 'admin_th'
  );

create policy "actas-dotacion: colaborador ve y sube la propia" on storage.objects for all
  using (
    bucket_id = 'actas-dotacion'
    and (storage.foldername(name))[1]::uuid = public.fn_mi_empresa_id()
    and (storage.foldername(name))[2]::uuid = public.fn_mi_colaborador_id()
  );
