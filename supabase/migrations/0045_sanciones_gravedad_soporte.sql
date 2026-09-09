-- ============================================================================
-- 0045_sanciones_gravedad_soporte.sql
-- Refuerza el registro de sanciones (docs/Requerimientos.docx, secc. 7
-- "Gestión de procesos disciplinarios y descargos") -- hasta hoy
-- historial_movimientos.tipo='sancion' solo tenía fecha + descripción
-- libre, sin gravedad ni forma de adjuntar el soporte/descargo firmado.
--
-- Ambas columnas quedan disponibles para cualquier tipo de movimiento (no
-- solo sanción) por si en el futuro hace falta adjuntar algo a otro tipo,
-- pero por ahora solo se usan desde la UI para sanciones.
-- ============================================================================

alter table historial_movimientos add column if not exists gravedad text check (gravedad in ('leve', 'grave', 'gravisima'));
alter table historial_movimientos add column if not exists soporte_url text;

comment on column historial_movimientos.gravedad is 'Solo aplica a tipo=sancion: leve, grave o gravísima, según el reglamento interno de trabajo.';
comment on column historial_movimientos.soporte_url is 'Ruta del soporte/descargo adjunto en el bucket privado documentos-colaborador (carpeta "sancion"), no una URL pública.';

-- Mismo nivel de visibilidad que el resto del Historial (0007_rls_policies:
-- admin_th todo, líder ve el de su equipo) -- no se restringe más que eso,
-- a diferencia de "contrato" (que sí es exclusivo admin_th + propio por
-- traer el salario).
create policy "documentos-colaborador: lectura sancion" on storage.objects for select
  using (
    bucket_id = 'documentos-colaborador'
    and (storage.foldername(name))[3] = 'sancion'
    and (
      public.fn_mi_rol() = 'admin_th'
      or (storage.foldername(name))[2]::uuid = public.fn_mi_colaborador_id()
      or public.fn_es_mi_equipo((storage.foldername(name))[2]::uuid)
    )
  );
