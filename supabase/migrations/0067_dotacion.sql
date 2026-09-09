-- ============================================================================
-- 0067_dotacion.sql
-- Módulo de Gestión de Dotaciones — comprometido en la propuesta piloto
-- Sky2B (docs/Propuesta_Comercial_Piloto_Espiral.docx, sección 04): registro
-- individual de elementos personales (uniformes, botas, guantes) y equipos
-- de trabajo (herramientas, cómputo, celulares) entregados a cada
-- colaborador, con talla y fecha de entrega, constancia firmada
-- digitalmente (mismo mecanismo del Acuerdo de Crecimiento: casilla + fecha,
-- no una firma dibujada), alertas de renovación/vencimiento (reusa el motor
-- de alertas — 0003/0006, con el valor de enum agregado en 0065) y checklist
-- de devolución en la desvinculación.
--
-- Explícitamente NO cubre (ver exclusiones de la propuesta): inventario de
-- bodega / compras a proveedor. Es el registro de la entrega individual a
-- cada persona, no el stock general de dotación de la empresa.
--
-- Alcance de permisos: mismo criterio que hoja_vida_formacion — admin_th
-- administra, líder ve la de su equipo, colaborador ve (y firma) la propia.
-- ============================================================================

create type categoria_dotacion as enum ('elemento_personal', 'equipo_trabajo');
create type estado_dotacion as enum ('entregado', 'devuelto', 'perdido', 'danado');

create table dotacion_entregas (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  colaborador_id uuid not null references colaboradores(id) on delete cascade,
  categoria categoria_dotacion not null,
  nombre_elemento text not null, -- ej: "Uniforme camisa", "Botas de seguridad", "Portátil Dell"
  talla text, -- solo aplica a elementos personales tipo ropa/calzado
  cantidad int not null default 1 check (cantidad > 0),
  fecha_entrega date not null default current_date,
  fecha_vencimiento date, -- renovación (uniformes/EPP); null si el equipo no vence (ej. herramienta)
  estado estado_dotacion not null default 'entregado',
  fecha_devolucion date,
  firma_confirmada boolean not null default false,
  firmado_en timestamptz,
  observaciones text,
  entregado_por uuid references perfiles_usuario(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table dotacion_entregas is 'Registro individual de elementos personales y equipos de trabajo entregados a cada colaborador. La firma es el mismo mecanismo del Acuerdo de Crecimiento (casilla + fecha), no una firma dibujada. No es control de inventario de bodega.';

create index idx_dotacion_empresa on dotacion_entregas(empresa_id);
create index idx_dotacion_colaborador on dotacion_entregas(colaborador_id);
create index idx_dotacion_vencimiento on dotacion_entregas(fecha_vencimiento) where fecha_vencimiento is not null;

create or replace function fn_tocar_updated_at_dotacion() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_dotacion_updated_at
  before update on dotacion_entregas
  for each row execute function fn_tocar_updated_at_dotacion();

-- ── Alertas de renovación/vencimiento ────────────────────────────────────
-- Mismo patrón que fn_generar_alerta_vencimiento_formacion (0015), con una
-- mejora puntual: alertas.dotacion_entrega_id es único, así que un
-- upsert (on conflict) evita duplicar la alerta si alguien corrige la
-- fecha de vencimiento más adelante — el trigger de formación no tenía esta
-- protección porque alertas no tenía ninguna restricción única todavía.
alter table alertas add column dotacion_entrega_id uuid references dotacion_entregas(id) on delete cascade;
create unique index idx_alertas_dotacion_entrega_unica on alertas(dotacion_entrega_id) where dotacion_entrega_id is not null;

create or replace function fn_generar_alerta_vencimiento_dotacion()
returns trigger
language plpgsql
security definer
as $$
begin
  if new.fecha_vencimiento is not null and new.estado = 'entregado' then
    insert into alertas (empresa_id, colaborador_id, tipo, severidad, titulo, descripcion, fecha_objetivo, dias_anticipacion, dotacion_entrega_id)
    values (
      new.empresa_id,
      new.colaborador_id,
      'dotacion_vencimiento'::tipo_alerta,
      'atencion',
      'Renovar dotación: ' || new.nombre_elemento,
      'Elemento de dotación próximo a vencer, verificar renovación o reposición.',
      new.fecha_vencimiento,
      15,
      new.id
    )
    on conflict (dotacion_entrega_id) where dotacion_entrega_id is not null
    do update set fecha_objetivo = excluded.fecha_objetivo, titulo = excluded.titulo, estado = 'pendiente';
  else
    delete from alertas where dotacion_entrega_id = new.id;
  end if;
  return new;
end;
$$;

create trigger trg_dotacion_alerta_vencimiento
  after insert or update on dotacion_entregas
  for each row execute function fn_generar_alerta_vencimiento_dotacion();

-- ── RLS ──────────────────────────────────────────────────────────────────
alter table dotacion_entregas enable row level security;

create policy "dotacion: admin_th todo" on dotacion_entregas for all
  using (empresa_id = fn_mi_empresa_id() and fn_mi_rol() = 'admin_th');
create policy "dotacion: lider ve la de su equipo" on dotacion_entregas for select
  using (fn_es_mi_equipo(colaborador_id) or colaborador_id = fn_mi_colaborador_id());
create policy "dotacion: colaborador firma la propia" on dotacion_entregas for update
  using (colaborador_id = fn_mi_colaborador_id() and fn_mi_rol() = 'colaborador');

-- La policy de arriba autoriza la fila, pero no restringe columnas (RLS no
-- puede hacerlo por sí sola) — sin este guardián, un colaborador podría
-- reescribir cualquier campo de su propia entrega, no solo firmar. Solo
-- puede tocar firma_confirmada/firmado_en; cualquier otro cambio de su
-- parte se rechaza. admin_th no pasa por este guardián.
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
    then
      raise exception 'Un colaborador solo puede confirmar la firma de su propia dotación, no editar sus datos.';
    end if;
  end if;
  return new;
end;
$$;

create trigger trg_dotacion_restringir_colaborador
  before update on dotacion_entregas
  for each row execute function fn_restringir_update_dotacion_colaborador();
