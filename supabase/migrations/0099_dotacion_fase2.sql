-- ============================================================================
-- 0099_dotacion_fase2.sql
-- Segunda fase de Dotación, según la reunión de revisión:
--   · Referencia del artículo (además de artículo y talla).
--   · Kit por cargo: qué le corresponde a cada cargo del catálogo.
--   · Recibido en buenas condiciones (firma o acta).
--   · Bloqueo de duplicados: no se entrega dos veces lo mismo en un mismo corte.
--   · Alerta anticipada a Talento Humano antes de cada corte (tipo 'dotacion_corte').
--   · Área del proceso de dotación renombrada al sistema SST.
-- ============================================================================

-- ── 1. Alerta de corte ───────────────────────────────────────────────────────
alter type tipo_alerta add value if not exists 'dotacion_corte';

-- ── 2. Referencia del artículo ──────────────────────────────────────────────
alter table dotacion_catalogo_articulos
  add column if not exists referencia text;

comment on column dotacion_catalogo_articulos.referencia is 'Referencia o modelo del artículo (ej. "Bota dieléctrica XR-200"). Cada referencia puede tener tallas distintas.';

-- ── 3. Recibido en buenas condiciones ───────────────────────────────────────
alter table dotacion_entregas
  add column if not exists buenas_condiciones boolean not null default false;

comment on column dotacion_entregas.buenas_condiciones is 'El trabajador declara que recibió el elemento en buenas condiciones (al confirmar en la app o en el acta firmada).';

-- ── 4. Kit por cargo ────────────────────────────────────────────────────────
create table dotacion_kit_cargo (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  cargo_id uuid not null references cargos(id) on delete cascade,
  articulo_id uuid not null references dotacion_catalogo_articulos(id) on delete cascade,
  cantidad int not null default 1 check (cantidad > 0),
  created_at timestamptz not null default now(),
  unique (cargo_id, articulo_id)
);

comment on table dotacion_kit_cargo is 'Kit de dotación de cada cargo: qué artículos del catálogo le corresponden y en qué cantidad. El área define el kit; las fechas de entrega siguen siendo las de ley (fn_fecha_corte_dotacion).';

create index idx_dotacion_kit_cargo_empresa on dotacion_kit_cargo(empresa_id);

alter table dotacion_kit_cargo enable row level security;

create policy "dotacion_kit_cargo: empresa lee" on dotacion_kit_cargo for select
  using (empresa_id = fn_mi_empresa_id());
create policy "dotacion_kit_cargo: admin_th escribe" on dotacion_kit_cargo for all
  using (empresa_id = fn_mi_empresa_id() and fn_mi_rol() = 'admin_th')
  with check (empresa_id = fn_mi_empresa_id() and fn_mi_rol() = 'admin_th');

-- ── 5. Validación de entregas: añade el bloqueo de duplicados ───────────────
-- Misma lógica de 0098 más esta regla: no se permite entregar el mismo artículo
-- (mismo nombre y talla) dos veces al trabajador en el mismo corte, salvo que
-- la entrega anterior haya sido devuelta o perdida. Si admin_th lo fuerza,
-- debe dejar la justificación, igual que con la elegibilidad.
create or replace function fn_validar_entrega_dotacion()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_es_vestuario boolean;
  v_elig jsonb;
  v_duplicada boolean;
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

  -- Sin justificación de admin_th, se exige cumplir la normativa.
  if coalesce(trim(new.excepcion_motivo), '') = '' then
    -- Elegibilidad: salario ≤ 2 SMLMV y más de 3 meses de antigüedad continua.
    v_elig := fn_evaluar_elegibilidad_dotacion(new.colaborador_id, new.fecha_entrega);
    if not (v_elig->>'elegible')::boolean then
      raise exception 'Entrega no permitida: %', array_to_string(array(select jsonb_array_elements_text(v_elig->'motivos')), '; ');
    end if;

    -- Duplicados: mismo artículo y talla, mismo corte, y la anterior sigue en poder del trabajador.
    select exists (
      select 1 from dotacion_entregas e
      where e.colaborador_id = new.colaborador_id
        and e.categoria = 'elemento_personal'
        and e.periodo_anio = new.periodo_anio
        and e.periodo_corte = new.periodo_corte
        and lower(e.nombre_elemento) = lower(new.nombre_elemento)
        and coalesce(e.talla, '') = coalesce(new.talla, '')
        and e.estado not in ('devuelto', 'perdido')
    ) into v_duplicada;
    if v_duplicada then
      raise exception 'Entrega no permitida: ya se entregó "%" a este trabajador en el corte %. Si necesitas reponerlo, registra la devolución o la pérdida primero, o usa una justificación.',
        new.nombre_elemento, fn_fecha_corte_dotacion(new.periodo_anio, new.periodo_corte);
    end if;
  end if;

  return new;
end;
$$;

-- ── 6. Área del proceso de dotación → sistema SST ───────────────────────────
-- En los datos demo, el proceso de dotación estaba agrupado bajo "Dotación";
-- la reunión pidió que quede bajo el sistema de seguridad y salud en el trabajo.
update procesos_gestion
set area_proceso = 'Seguridad y Salud en el Trabajo'
where area_proceso = 'Dotación';
