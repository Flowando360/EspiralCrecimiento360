-- ============================================================================
-- 0071_dotacion_catalogo_inventario.sql
-- Amplía Dotación con inventario real de bodega — a pedido explícito del
-- usuario, cruzando a propósito la frontera documentada en 0067_dotacion.sql
-- ("NO cubre inventario de bodega / compras a proveedor"), confirmado antes
-- de construirlo (ver fase38 en la memoria del proyecto).
--
-- Catálogo de artículos (categoría libre: Calzado, Camisas, Cascos...) con
-- stock por talla y un mínimo configurable para saber cuándo va quedando
-- bajo. Las entregas existentes (dotacion_entregas) siguen funcionando en
-- texto libre si no vienen del catálogo (articulo_talla_id null) — no se
-- obliga a re-catalogar el histórico.
-- ============================================================================

create table dotacion_catalogo_articulos (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  categoria text not null, -- agrupador visual libre: "Calzado", "Camisas", "Cascos", "Gafas de seguridad"...
  nombre text not null, -- ej. "Bota de seguridad dieléctrica"
  requiere_talla boolean not null default true,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table dotacion_catalogo_articulos is 'Catálogo de artículos de dotación que la empresa maneja en bodega (secc. 1 del pedido de profundización de Dotación) — distinto de dotacion_entregas, que es el registro de a quién se le entregó cada cosa.';

create table dotacion_catalogo_tallas (
  id uuid primary key default gen_random_uuid(),
  articulo_id uuid not null references dotacion_catalogo_articulos(id) on delete cascade,
  talla text not null default 'Única', -- "S"/"M"/"L", numérica ("38","40"), o "Única" si requiere_talla=false
  stock_disponible int not null default 0 check (stock_disponible >= 0),
  stock_minimo int not null default 0 check (stock_minimo >= 0),
  updated_at timestamptz not null default now(),
  unique (articulo_id, talla)
);

comment on table dotacion_catalogo_tallas is 'Existencias por talla de cada artículo. stock_disponible baja automáticamente al registrar una entrega desde el catálogo (fn_entregar_desde_catalogo) y sube al registrar una recepción de bodega (fn_recibir_en_catalogo). stock_disponible <= stock_minimo es la señal de "inventario bajo" que muestra la pantalla — no dispara correo/alerta aparte, es una bandera visual en vivo.';

create index idx_dotacion_catalogo_articulos_empresa on dotacion_catalogo_articulos(empresa_id);
create index idx_dotacion_catalogo_tallas_articulo on dotacion_catalogo_tallas(articulo_id);

create or replace function fn_tocar_updated_at_dotacion_catalogo() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_dotacion_catalogo_articulos_updated_at
  before update on dotacion_catalogo_articulos
  for each row execute function fn_tocar_updated_at_dotacion_catalogo();
create trigger trg_dotacion_catalogo_tallas_updated_at
  before update on dotacion_catalogo_tallas
  for each row execute function fn_tocar_updated_at_dotacion_catalogo();

-- ── Vincula las entregas al catálogo (opcional) y agrega el acta física ────
alter table dotacion_entregas add column if not exists articulo_talla_id uuid references dotacion_catalogo_tallas(id) on delete set null;
alter table dotacion_entregas add column if not exists acta_firmada_url text; -- foto/escaneo del acta física, alternativa a la firma digital (firma_confirmada)

comment on column dotacion_entregas.articulo_talla_id is 'Si la entrega salió del catálogo, referencia la talla exacta (para poder descontar y luego reponer el stock). Null si se registró en texto libre, como antes de que existiera el catálogo.';
comment on column dotacion_entregas.acta_firmada_url is 'Ruta en storage de la foto/escaneo del acta de entrega firmada en papel — alternativa a firma_confirmada cuando la persona firma físicamente en vez de confirmar desde la app.';

-- ── Descontar/reponer stock de forma atómica (evita condiciones de carrera
-- entre dos entregas simultáneas del mismo artículo) ───────────────────────
create or replace function fn_entregar_desde_catalogo(
  p_articulo_talla_id uuid,
  p_colaborador_id uuid,
  p_categoria categoria_dotacion,
  p_cantidad int,
  p_fecha_entrega date,
  p_fecha_vencimiento date
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
  -- security definer se salta RLS, así que la función valida el permiso
  -- ella misma en vez de depender de una policy.
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
  for update of ct; -- bloquea la fila para que dos entregas simultáneas no dejen el stock en negativo

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

comment on function fn_entregar_desde_catalogo is 'Descuenta stock y crea la entrega en una sola operación atómica (bloqueo de fila) — evita que dos entregas simultáneas del mismo artículo dejen el stock en negativo. Valida admin_th y la empresa del que llama ella misma, porque security definer se salta RLS.';

create or replace function fn_recibir_en_catalogo(p_articulo_talla_id uuid, p_cantidad int) returns void
language plpgsql
security definer
as $$
begin
  if fn_mi_rol() <> 'admin_th' then
    raise exception 'No autorizado';
  end if;
  if p_cantidad <= 0 then
    raise exception 'La cantidad recibida debe ser mayor a 0';
  end if;
  update dotacion_catalogo_tallas ct
  set stock_disponible = stock_disponible + p_cantidad
  from dotacion_catalogo_articulos ca
  where ca.id = ct.articulo_id and ct.id = p_articulo_talla_id and ca.empresa_id = fn_mi_empresa_id();
  if not found then
    raise exception 'Artículo/talla no encontrado en el catálogo';
  end if;
end;
$$;

comment on function fn_recibir_en_catalogo is 'Registra entrada de bodega (compra a proveedor) sumando al stock disponible de una talla del catálogo. Valida admin_th y la empresa del que llama ella misma, porque security definer se salta RLS.';

-- ── RLS: mismo criterio que el resto de Dotación — admin_th administra,
-- el resto de la empresa puede consultar (para saber qué hay disponible al
-- pedir una entrega, o para que un líder vea qué queda) ────────────────────
alter table dotacion_catalogo_articulos enable row level security;
alter table dotacion_catalogo_tallas enable row level security;

create policy "dotacion_catalogo_articulos: lectura de la empresa" on dotacion_catalogo_articulos for select
  using (empresa_id = fn_mi_empresa_id());
create policy "dotacion_catalogo_articulos: admin_th administra" on dotacion_catalogo_articulos for all
  using (empresa_id = fn_mi_empresa_id() and fn_mi_rol() = 'admin_th');

create policy "dotacion_catalogo_tallas: lectura de la empresa" on dotacion_catalogo_tallas for select
  using (exists(select 1 from dotacion_catalogo_articulos a where a.id = articulo_id and a.empresa_id = fn_mi_empresa_id()));
create policy "dotacion_catalogo_tallas: admin_th administra" on dotacion_catalogo_tallas for all
  using (exists(select 1 from dotacion_catalogo_articulos a where a.id = articulo_id and a.empresa_id = fn_mi_empresa_id() and fn_mi_rol() = 'admin_th'));

-- Las funciones son security definer (necesario para el bloqueo de fila
-- atómico), así que validan admin_th ellas mismas en vez de depender de RLS.
revoke execute on function fn_entregar_desde_catalogo from public;
revoke execute on function fn_recibir_en_catalogo from public;
grant execute on function fn_entregar_desde_catalogo to authenticated;
grant execute on function fn_recibir_en_catalogo to authenticated;
