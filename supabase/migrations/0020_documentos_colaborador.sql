-- ============================================================================
-- Gestión documental del colaborador (backlog 2.1): datos legales de la
-- empresa para el certificado laboral, y hoja de vida + contrato (con
-- salario) por colaborador, en un bucket privado nuevo.
-- ============================================================================

alter table empresas add column if not exists nit text;
alter table empresas add column if not exists direccion text;
alter table empresas add column if not exists telefono text;
alter table empresas add column if not exists ciudad text;
alter table empresas add column if not exists firmante_nombre text;
alter table empresas add column if not exists firmante_cargo text;

comment on column empresas.firmante_nombre is 'Nombre de quien firma el certificado laboral generado por el sistema.';
comment on column empresas.firmante_cargo is 'Cargo de quien firma el certificado laboral generado por el sistema.';

alter table colaboradores add column if not exists hoja_vida_url text;
alter table colaboradores add column if not exists contrato_url text;
alter table colaboradores add column if not exists salario numeric;

comment on column colaboradores.hoja_vida_url is 'Ruta del archivo en el bucket privado documentos-colaborador (no URL pública).';
comment on column colaboradores.contrato_url is 'Ruta del archivo en el bucket privado documentos-colaborador (no URL pública).';
comment on column colaboradores.salario is 'Salario real del colaborador, tomado del contrato cargado. Fuente para el certificado laboral. Dato sensible: solo admin_th y el propio colaborador lo ven (ni el líder).';

-- ── Bucket privado ───────────────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('documentos-colaborador', 'documentos-colaborador', false)
on conflict (id) do nothing;

-- Ruta: empresa_id/colaborador_id/tipo/archivo.ext — tipo es 'hoja-vida' o
-- 'contrato', para poder aplicar reglas de lectura distintas: el contrato
-- (con el salario) es más sensible que la hoja de vida.
create policy "documentos-colaborador: admin_th sube" on storage.objects for insert
  with check (bucket_id = 'documentos-colaborador' and public.fn_mi_rol() = 'admin_th');

create policy "documentos-colaborador: admin_th reemplaza" on storage.objects for update
  using (bucket_id = 'documentos-colaborador' and public.fn_mi_rol() = 'admin_th');

create policy "documentos-colaborador: lectura hoja de vida" on storage.objects for select
  using (
    bucket_id = 'documentos-colaborador'
    and (storage.foldername(name))[3] = 'hoja-vida'
    and (
      public.fn_mi_rol() = 'admin_th'
      or (storage.foldername(name))[2]::uuid = public.fn_mi_colaborador_id()
      or public.fn_es_mi_equipo((storage.foldername(name))[2]::uuid)
    )
  );

create policy "documentos-colaborador: lectura contrato" on storage.objects for select
  using (
    bucket_id = 'documentos-colaborador'
    and (storage.foldername(name))[3] = 'contrato'
    and (
      public.fn_mi_rol() = 'admin_th'
      or (storage.foldername(name))[2]::uuid = public.fn_mi_colaborador_id()
    )
  );
