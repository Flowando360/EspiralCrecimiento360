-- ============================================================================
-- 0028_rol_auditor_externo_rls.sql
-- Políticas de solo lectura para el rol auditor_externo (ver 0027). Acceso
-- mínimo: su propio perfil (ya cubierto por "perfiles: cualquiera ve su
-- propio perfil"), nombre/cargo de colaboradores (para poner nombre a la
-- evidencia), certificaciones SST, y las tres tablas del módulo de procesos
-- y sistemas de gestión (0026) que YA tienen "lectura empresa" sin
-- restricción de rol — este archivo solo agrega lo que faltaba:
-- hoja_vida_formacion (certificaciones) y colaboradores (nombres/cargos).
-- Cualquier otro módulo (evaluaciones, PDI, feed, mensajes, salario, etc.)
-- sigue sin política para este rol, así que RLS lo bloquea por defecto.
-- ============================================================================

create policy "colaboradores: auditor_externo lee para evidencia" on colaboradores for select
  using (empresa_id = fn_mi_empresa_id() and fn_mi_rol() = 'auditor_externo');

create policy "hoja_vida: auditor_externo lee para evidencia" on hoja_vida_formacion for select
  using (
    fn_mi_rol() = 'auditor_externo'
    and exists(select 1 from colaboradores co where co.id = colaborador_id and co.empresa_id = fn_mi_empresa_id())
  );

-- Lectura del bucket de hoja de vida/certificaciones (no del contrato, que
-- sigue restringido a admin_th y al propio colaborador).
create policy "documentos-colaborador: auditor_externo lee hoja de vida" on storage.objects for select
  using (
    bucket_id = 'documentos-colaborador'
    and (storage.foldername(name))[3] = 'hoja-vida'
    and public.fn_mi_rol() = 'auditor_externo'
    and (storage.foldername(name))[1]::uuid = public.fn_mi_empresa_id()
  );
