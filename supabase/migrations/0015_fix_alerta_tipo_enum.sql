-- ============================================================================
-- 0015_fix_alerta_tipo_enum.sql
-- Corrige un bug preexistente (desde 0006_triggers_calculo_tiempo_real.sql)
-- en el trigger que genera alertas de vencimiento al guardar
-- hoja_vida_formacion. La expresión CASE resolvía a texto plano en vez del
-- tipo enumerado tipo_alerta, y Postgres no lo castea implícitamente:
--
--   ERROR: 42804: column "tipo" is of type tipo_alerta but expression is
--   of type text
--
-- Nunca se había disparado porque hasta ahora nadie había guardado una
-- certificación con fecha de vencimiento a través de la app ni por SQL.
-- ============================================================================

create or replace function fn_generar_alerta_vencimiento_formacion()
returns trigger
language plpgsql
security definer
as $$
declare
  v_empresa_id uuid;
begin
  if new.fecha_vencimiento is not null then
    select empresa_id into v_empresa_id from colaboradores where id = new.colaborador_id;

    insert into alertas (empresa_id, colaborador_id, tipo, severidad, titulo, descripcion, fecha_objetivo, dias_anticipacion, hoja_vida_formacion_id)
    values (
      v_empresa_id,
      new.colaborador_id,
      case when new.tipo = 'certificacion' then 'sst_certificacion'::tipo_alerta else 'formacion_vencimiento'::tipo_alerta end,
      'atencion',
      'Vencimiento: ' || new.titulo,
      'Certificación/formación próxima a vencer, verificar renovación.',
      new.fecha_vencimiento,
      30,
      new.id
    )
    on conflict do nothing;
  end if;
  return new;
end;
$$;
