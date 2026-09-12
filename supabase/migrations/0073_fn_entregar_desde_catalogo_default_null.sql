-- ============================================================================
-- 0073_fn_entregar_desde_catalogo_default_null.sql
-- p_fecha_vencimiento sin default quedaba tipado como NOT NULL en los tipos
-- generados para TypeScript, aunque la columna sí acepta null (uniformes sin
-- fecha de renovación). Se agrega "default null" para que el parámetro sea
-- opcional/nulo de verdad, sin cambiar ningún otro comportamiento.
-- ============================================================================

create or replace function fn_entregar_desde_catalogo(
  p_articulo_talla_id uuid,
  p_colaborador_id uuid,
  p_categoria categoria_dotacion,
  p_cantidad int,
  p_fecha_entrega date,
  p_fecha_vencimiento date default null
) returns uuid
language plpgsql
security definer
as $$
declare
  v_mi_empresa uuid := fn_mi_empresa_id();
  v_talla text;
  v_nombre text;
  v_stock int;
  v_entrega_id uuid;
begin
  if fn_mi_rol() <> 'admin_th' then
    raise exception 'No autorizado';
  end if;
  if p_cantidad <= 0 then
    raise exception 'La cantidad debe ser mayor a 0';
  end if;

  select ct.talla, ca.nombre, ct.stock_disponible
  into v_talla, v_nombre, v_stock
  from dotacion_catalogo_tallas ct
  join dotacion_catalogo_articulos ca on ca.id = ct.articulo_id
  where ct.id = p_articulo_talla_id and ca.empresa_id = v_mi_empresa
  for update of ct;

  if not found then
    raise exception 'Artículo/talla no encontrado en el catálogo';
  end if;
  if v_stock < p_cantidad then
    raise exception 'No hay suficiente stock disponible (quedan %, se pidieron %)', v_stock, p_cantidad;
  end if;

  update dotacion_catalogo_tallas set stock_disponible = stock_disponible - p_cantidad where id = p_articulo_talla_id;

  insert into dotacion_entregas (
    empresa_id, colaborador_id, categoria, nombre_elemento, talla, cantidad,
    fecha_entrega, fecha_vencimiento, articulo_talla_id, entregado_por
  )
  values (
    v_mi_empresa, p_colaborador_id, p_categoria, v_nombre, v_talla, p_cantidad,
    p_fecha_entrega, p_fecha_vencimiento, p_articulo_talla_id, (select id from perfiles_usuario where id = auth.uid())
  )
  returning id into v_entrega_id;

  return v_entrega_id;
end;
$$;
