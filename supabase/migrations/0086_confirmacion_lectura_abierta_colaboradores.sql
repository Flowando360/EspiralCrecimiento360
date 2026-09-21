-- ============================================================================
-- 0086_confirmacion_lectura_abierta_colaboradores.sql
-- Punto 3.2 del alcance de fase 2/3: abrir la confirmación de lectura a
-- TODOS los colaboradores, no solo a quienes ya tienen acceso al módulo de
-- Procesos (admin_th/líder/gerencia) — sin abrir el módulo completo.
--
-- Decisión de diseño (recomendación aceptada): no se amplían los permisos
-- de lectura del módulo de Procesos ni de las tablas de auditorías/ACPM/
-- gestión de cambio. Solo se amplía el INSERT de confirmaciones_lectura, y
-- se agrega una pantalla angosta y de un solo propósito
-- (/procesos-gestion/documentos/[id]/confirmar) fuera del gate de rol que
-- protege el resto del módulo — ver 0076 para las policies de select de
-- documentos_proceso y confirmaciones_lectura, que ya no tenían restricción
-- de rol y por eso no hace falta tocarlas aquí.
--
-- Escrita con DROP POLICY IF EXISTS para poder correrse más de una vez sin
-- error, igual que las migraciones anteriores de este módulo.
-- ============================================================================

drop policy if exists "confirmaciones_lectura: confirma quien tiene acceso al módulo" on confirmaciones_lectura;
drop policy if exists "confirmaciones_lectura: confirma cualquier colaborador de la empresa" on confirmaciones_lectura;
create policy "confirmaciones_lectura: confirma cualquier colaborador de la empresa" on confirmaciones_lectura for insert
  with check (
    fn_mi_rol() in ('admin_th', 'lider', 'gerencia', 'colaborador')
    and exists (
      select 1 from documentos_proceso dp join procesos_gestion pg on pg.id = dp.proceso_id
      where dp.id = confirmaciones_lectura.documento_id and pg.empresa_id = fn_mi_empresa_id()
    )
  );
