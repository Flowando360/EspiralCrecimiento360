-- ============================================================================
-- 0098_dotacion_normativa.sql
-- Refleja en Dotación las reglas del Código Sustantivo del Trabajo que
-- aparecen en la referencia normativa del módulo:
--   · Elegibilidad: salario ≤ 2 SMLMV del año y más de 3 meses de antigüedad
--     continua a la fecha de la entrega.
--   · Tres cortes obligatorios al año: 30 abr, 31 ago y 20 dic.
--   · Prohibido compensar en dinero: solo se admite "bono de vestuario" y
--     únicamente para artículos marcados como vestuario/calzado.
--   · Uso obligatorio: si el trabajador no usó la dotación del periodo
--     anterior, el empleador queda eximido de entregarla en el siguiente.
--
-- Alcance: las reglas aplican a categoria = 'elemento_personal' (dotación).
-- Los 'equipo_trabajo' (herramienta, cómputo, celular) no se validan aquí.
-- ============================================================================

-- ── 1. Parámetros legales por empresa y año ─────────────────────────────────
create table if not exists parametros_legales (
  empresa_id uuid not null references empresas(id) on delete cascade,
  anio int not null check (anio between 2000 and 2100),
  smlmv numeric(14,2) not null check (smlmv > 0), -- salario mínimo legal mensual vigente de ese año
  updated_at timestamptz not null default now(),
  primary key (empresa_id, anio)
);

comment on table parametros_legales is 'Valores legales que cambian cada año (SMLMV). Los define admin_th en Administración → Parámetros legales. La elegibilidad de dotación usa el SMLMV del año de la entrega.';

alter table parametros_legales enable row level security;

create policy "parametros_legales: empresa lee" on parametros_legales for select
  using (empresa_id = fn_mi_empresa_id());
create policy "parametros_legales: admin_th escribe" on parametros_legales for all
  using (empresa_id = fn_mi_empresa_id() and fn_mi_rol() = 'admin_th')
  with check (empresa_id = fn_mi_empresa_id() and fn_mi_rol() = 'admin_th');

create trigger trg_parametros_legales_updated_at
  before update on parametros_legales
  for each row execute function fn_tocar_updated_at_dotacion();

-- ── 2. Cortes (periodos) de entrega ─────────────────────────────────────────
create type corte_dotacion as enum ('abril', 'agosto', 'diciembre');
create type tipo_entrega_dotacion as enum ('especie', 'bono_vestuario');

-- Fecha límite de cada corte en un año dado.
create or replace function fn_fecha_corte_dotacion(p_anio int, p_corte corte_dotacion)
returns date
language sql
immutable
as $$
  select case p_corte
    when 'abril' then make_date(p_anio, 4, 30)
    when 'agosto' then make_date(p_anio, 8, 31)
    when 'diciembre' then make_date(p_anio, 12, 20)
  end
$$;

-- Periodo al que pertenece una fecha. Las ventanas son (corte anterior, corte]:
-- hasta el 30 abr → abril; hasta el 31 ago → agosto; hasta el 20 dic → diciembre;
-- del 21 al 31 dic → abril del año siguiente.
create or replace function fn_periodo_dotacion_de_fecha(p_fecha date, out periodo_anio int, out periodo_corte corte_dotacion)
language plpgsql
immutable
as $$
declare
  v_anio int := extract(year from p_fecha)::int;
begin
  if p_fecha <= fn_fecha_corte_dotacion(v_anio, 'abril') then
    periodo_anio := v_anio; periodo_corte := 'abril';
  elsif p_fecha <= fn_fecha_corte_dotacion(v_anio, 'agosto') then
    periodo_anio := v_anio; periodo_corte := 'agosto';
  elsif p_fecha <= fn_fecha_corte_dotacion(v_anio, 'diciembre') then
    periodo_anio := v_anio; periodo_corte := 'diciembre';
  else
    periodo_anio := v_anio + 1; periodo_corte := 'abril';
  end if;
end;
$$;

-- Próximo corte estrictamente posterior a la fecha: es el vencimiento de la dotación.
create or replace function fn_proximo_corte_dotacion(p_fecha date)
returns date
language sql
immutable
as $$
  select min(f) from (
    select fn_fecha_corte_dotacion(extract(year from p_fecha)::int, c) as f
    from unnest(enum_range(null::corte_dotacion)) as c
    union all
    select fn_fecha_corte_dotacion(extract(year from p_fecha)::int + 1, 'abril')
  ) cortes
  where f > p_fecha
$$;

-- Orden lineal de un periodo (abril 2026 < agosto 2026 < diciembre 2026 < abril 2027).
create or replace function fn_ordinal_periodo_dotacion(p_anio int, p_corte corte_dotacion)
returns int
language sql
immutable
as $$
  select p_anio * 3 + case p_corte when 'abril' then 0 when 'agosto' then 1 else 2 end
$$;

-- ── 3. Entregas: nuevas columnas normativas ─────────────────────────────────
alter table dotacion_catalogo_articulos
  add column if not exists es_vestuario_calzado boolean not null default false;

comment on column dotacion_catalogo_articulos.es_vestuario_calzado is 'Solo los artículos de vestuario o calzado pueden entregarse como bono de vestuario (el Código Sustantivo del Trabajo prohíbe compensar la dotación en dinero, salvo bonos exclusivos para vestuario o calzado).';

alter table dotacion_entregas
  add column if not exists tipo_entrega tipo_entrega_dotacion not null default 'especie',
  add column if not exists periodo_anio int,
  add column if not exists periodo_corte corte_dotacion,
  add column if not exists uso_verificado boolean,            -- null = pendiente de verificar; true = usada; false = no usada
  add column if not exists uso_verificado_en timestamptz,
  add column if not exists uso_observacion text,
  add column if not exists excepcion_motivo text;             -- si admin_th fuerza una entrega no elegible, queda la justificación

comment on column dotacion_entregas.tipo_entrega is 'especie = entrega física (valor por defecto). bono_vestuario = bono canjeable solo por vestuario/calzado; solo válido para artículos del catálogo con es_vestuario_calzado.';
comment on column dotacion_entregas.periodo_anio is 'Año del corte obligatorio al que pertenece la entrega. Se deriva de fecha_entrega (fn_periodo_dotacion_de_fecha). Null en equipos de trabajo y en registros anteriores a esta migración.';
comment on column dotacion_entregas.periodo_corte is 'Corte obligatorio (abril, agosto, diciembre) al que pertenece la entrega.';
comment on column dotacion_entregas.uso_verificado is 'Lo verifica admin_th: true = el trabajador usó la dotación; false = no la usó (el empleador queda eximido de entregarla en el periodo siguiente); null = pendiente.';
comment on column dotacion_entregas.excepcion_motivo is 'Justificación de admin_th cuando fuerza una entrega que no cumple la elegibilidad. Sin motivo, la base de datos rechaza la entrega.';

create index if not exists idx_dotacion_periodo on dotacion_entregas(empresa_id, periodo_anio, periodo_corte);

-- ── 4. Elegibilidad ─────────────────────────────────────────────────────────
-- Devuelve { elegible, exento_por_no_uso, motivos[], antiguedad_meses }.
-- Solo admin_th. Los montos del salario no se devuelven: la respuesta solo
-- dice si cumple o no y por qué, así el dato sensible no sale de la base.
create or replace function fn_evaluar_elegibilidad_dotacion(p_colaborador_id uuid, p_fecha date)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_empresa uuid := fn_mi_empresa_id();
  c record;
  v_anio int := extract(year from p_fecha)::int;
  v_smlmv numeric;
  v_motivos text[] := '{}';
  v_periodo_anio int;
  v_periodo_corte corte_dotacion;
  v_exento boolean := false;
  v_meses int;
begin
  if fn_mi_rol() <> 'admin_th' then
    raise exception 'No autorizado';
  end if;

  select * into c from colaboradores where id = p_colaborador_id and empresa_id = v_empresa;
  if not found then
    raise exception 'Colaborador no encontrado';
  end if;

  -- Salario ≤ 2 SMLMV del año de la entrega
  select smlmv into v_smlmv from parametros_legales where empresa_id = v_empresa and anio = v_anio;
  if v_smlmv is null then
    v_motivos := array_append(v_motivos, format('Falta registrar el SMLMV de %s en Parámetros legales', v_anio));
  elsif c.salario is null then
    v_motivos := array_append(v_motivos, 'El salario no está registrado en la ficha del colaborador');
  elsif c.salario > 2 * v_smlmv then
    v_motivos := array_append(v_motivos, format('Su salario supera 2 SMLMV de %s', v_anio));
  end if;

  -- Más de 3 meses de antigüedad continua a la fecha de la entrega
  if p_fecha < c.fecha_ingreso then
    v_motivos := array_append(v_motivos, 'La entrega es anterior a su fecha de ingreso');
  elsif c.fecha_salida is not null and c.fecha_salida < p_fecha then
    v_motivos := array_append(v_motivos, 'Ya se había retirado a la fecha de la entrega');
  elsif p_fecha <= c.fecha_ingreso + interval '3 months' then
    v_motivos := array_append(v_motivos, 'Tiene menos de 3 meses de antigüedad continua a la fecha de la entrega');
  end if;

  v_meses := extract(year from age(p_fecha, c.fecha_ingreso))::int * 12
           + extract(month from age(p_fecha, c.fecha_ingreso))::int;

  -- Uso obligatorio: si en el periodo inmediatamente anterior el trabajador no usó la dotación,
  -- el empleador queda eximido de entregarla en este periodo.
  select p.periodo_anio, p.periodo_corte into v_periodo_anio, v_periodo_corte from fn_periodo_dotacion_de_fecha(p_fecha) p;
  select exists (
    select 1 from dotacion_entregas e
    where e.colaborador_id = p_colaborador_id
      and e.categoria = 'elemento_personal'
      and e.uso_verificado = false
      and e.periodo_anio is not null
      and fn_ordinal_periodo_dotacion(e.periodo_anio, e.periodo_corte) = fn_ordinal_periodo_dotacion(v_periodo_anio, v_periodo_corte) - 1
  ) into v_exento;

  return jsonb_build_object(
    'elegible', cardinality(v_motivos) = 0,
    'exento_por_no_uso', v_exento,
    'motivos', to_jsonb(v_motivos),
    'antiguedad_meses', greatest(v_meses, 0)
  );
end;
$$;

comment on function fn_evaluar_elegibilidad_dotacion is 'Evalúa si un colaborador debe recibir dotación en una fecha: salario ≤ 2 SMLMV y más de 3 meses de antigüedad continua. Devuelve también si quedó exento por uso no verificado en el periodo anterior. Solo admin_th; security definer, así que valida la empresa y el rol ella misma.';

-- ── 5. Validación de entregas (todas las vías de inserción pasan por aquí) ──
create or replace function fn_validar_entrega_dotacion()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_es_vestuario boolean;
  v_elig jsonb;
begin
  -- Equipos de trabajo no entran en la normativa de dotación.
  if new.categoria <> 'elemento_personal' then
    return new;
  end if;

  -- Periodo y vencimiento se derivan de la fecha, no se confían al cliente.
  select p.periodo_anio, p.periodo_corte into new.periodo_anio, new.periodo_corte from fn_periodo_dotacion_de_fecha(new.fecha_entrega) p;
  new.fecha_vencimiento := fn_proximo_corte_dotacion(new.fecha_entrega);

  -- Prohibido compensar en dinero: el bono solo es válido para vestuario o calzado del catálogo.
  if new.tipo_entrega = 'bono_vestuario' then
    if new.articulo_talla_id is null then
      raise exception 'Un bono de vestuario solo se puede registrar desde un artículo del catálogo de vestuario o calzado';
    end if;
    select ca.es_vestuario_calzado into v_es_vestuario
    from dotacion_catalogo_tallas ct
    join dotacion_catalogo_articulos ca on ca.id = ct.articulo_id
    where ct.id = new.articulo_talla_id;
    if not coalesce(v_es_vestuario, false) then
      raise exception 'Solo se puede entregar bono de vestuario para artículos marcados como vestuario o calzado';
    end if;
  end if;

  -- Elegibilidad. Si admin_th fuerza la entrega, debe quedar la justificación.
  if coalesce(trim(new.excepcion_motivo), '') = '' then
    v_elig := fn_evaluar_elegibilidad_dotacion(new.colaborador_id, new.fecha_entrega);
    if not (v_elig->>'elegible')::boolean then
      raise exception 'Entrega no permitida: %', array_to_string(array(select jsonb_array_elements_text(v_elig->'motivos')), '; ');
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_dotacion_validar_entrega on dotacion_entregas;
create trigger trg_dotacion_validar_entrega
  before insert on dotacion_entregas
  for each row execute function fn_validar_entrega_dotacion();

-- ── 6. Guardián de columnas: el colaborador no puede tocar los campos nuevos ──
-- 0067 solo protegía las columnas originales; los campos normativos también
-- deben quedar fuera de su alcance (uso verificado, tipo, periodo, excepción).
create or replace function fn_restringir_update_dotacion_colaborador()
returns trigger
language plpgsql
security definer
as $$
begin
  if fn_mi_rol() = 'colaborador' then
    if new.categoria is distinct from old.categoria
      or new.nombre_elemento is distinct from old.nombre_elemento
      or new.talla is distinct from old.talla
      or new.cantidad is distinct from old.cantidad
      or new.fecha_entrega is distinct from old.fecha_entrega
      or new.fecha_vencimiento is distinct from old.fecha_vencimiento
      or new.estado is distinct from old.estado
      or new.fecha_devolucion is distinct from old.fecha_devolucion
      or new.colaborador_id is distinct from old.colaborador_id
      or new.empresa_id is distinct from old.empresa_id
      or new.tipo_entrega is distinct from old.tipo_entrega
      or new.periodo_anio is distinct from old.periodo_anio
      or new.periodo_corte is distinct from old.periodo_corte
      or new.uso_verificado is distinct from old.uso_verificado
      or new.uso_verificado_en is distinct from old.uso_verificado_en
      or new.uso_observacion is distinct from old.uso_observacion
      or new.excepcion_motivo is distinct from old.excepcion_motivo
    then
      raise exception 'Un colaborador solo puede confirmar la firma de su propia dotación, no editar sus datos.';
    end if;
  end if;
  return new;
end;
$$;

-- ── 7. Entrega desde catálogo: nueva firma con tipo y excepción ─────────────
-- Se elimina la firma anterior (6 parámetros) para que PostgREST no tenga
-- dos funciones con el mismo nombre. El vencimiento ya no lo recibe la función.
drop function if exists fn_entregar_desde_catalogo(uuid, uuid, categoria_dotacion, int, date, date);

create or replace function fn_entregar_desde_catalogo(
  p_articulo_talla_id uuid,
  p_colaborador_id uuid,
  p_categoria categoria_dotacion,
  p_cantidad int,
  p_fecha_entrega date,
  p_tipo tipo_entrega_dotacion default 'especie',
  p_excepcion_motivo text default null
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

  -- Si la inserción falla por la validación normativa, el descuento de stock se revierte con ella.
  update dotacion_catalogo_tallas set stock_disponible = stock_disponible - p_cantidad where id = p_articulo_talla_id;

  insert into dotacion_entregas (
    empresa_id, colaborador_id, categoria, nombre_elemento, talla, cantidad,
    fecha_entrega, articulo_talla_id, entregado_por, tipo_entrega, excepcion_motivo
  )
  values (
    v_mi_empresa, p_colaborador_id, p_categoria, v_nombre, v_talla, p_cantidad,
    p_fecha_entrega, p_articulo_talla_id, (select id from perfiles_usuario where id = auth.uid()),
    p_tipo, nullif(trim(p_excepcion_motivo), '')
  )
  returning id into v_entrega_id;

  return v_entrega_id;
end;
$$;

comment on function fn_entregar_desde_catalogo is 'Descuenta stock y crea la entrega en una sola operación atómica. La validación normativa vive en el trigger de dotacion_entregas, así que una entrega no elegible revierte también el descuento de stock.';

-- ── 8. Cumplimiento por corte (para el reporte) ─────────────────────────────
create or replace function fn_cumplimiento_dotacion(p_anio int)
returns table (
  corte corte_dotacion,
  fecha_corte date,
  elegibles int,
  entregados int,
  entregas int,
  uso_verificado int,
  uso_no_verificado int,
  uso_pendiente int,
  con_excepcion int
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_empresa uuid := fn_mi_empresa_id();
  v_corte corte_dotacion;
  v_fecha date;
begin
  if fn_mi_rol() <> 'admin_th' then
    raise exception 'No autorizado';
  end if;

  for v_corte in select unnest(enum_range(null::corte_dotacion)) loop
    v_fecha := fn_fecha_corte_dotacion(p_anio, v_corte);
    corte := v_corte;
    fecha_corte := v_fecha;

    select count(*) into elegibles
    from colaboradores col
    where col.empresa_id = v_empresa
      and col.es_externo = false
      and col.fecha_ingreso <= v_fecha
      and (col.fecha_salida is null or col.fecha_salida >= v_fecha)
      and (fn_evaluar_elegibilidad_dotacion(col.id, v_fecha)->>'elegible')::boolean;

    select count(distinct e.colaborador_id), count(*),
           count(*) filter (where e.uso_verificado = true),
           count(*) filter (where e.uso_verificado = false),
           count(*) filter (where e.uso_verificado is null),
           count(*) filter (where e.excepcion_motivo is not null)
    into entregados, entregas, uso_verificado, uso_no_verificado, uso_pendiente, con_excepcion
    from dotacion_entregas e
    where e.empresa_id = v_empresa
      and e.categoria = 'elemento_personal'
      and e.periodo_anio = p_anio
      and e.periodo_corte = v_corte;

    return next;
  end loop;
end;
$$;

comment on function fn_cumplimiento_dotacion is 'Resumen por corte obligatorio del año: colaboradores elegibles frente a los que recibieron dotación, y estado del uso verificado. Solo admin_th. Usa el salario actual de la ficha, no un histórico.';
