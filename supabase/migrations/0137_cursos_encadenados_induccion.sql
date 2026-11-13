-- Informe de Luisa 4.18: rutas de aprendizaje encadenadas e inducción convertida en cursos.
--  · nexa_cursos.curso_previo_id: un curso puede exigir haber completado otro antes. Al asignar el curso se asigna
--    también el previo, y no se puede avanzar ni completar mientras el previo no esté completado.
--  · induccion_items.curso_id: un punto de inducción puede cumplirse con un curso (con su quiz). Al completar el curso,
--    el punto queda confirmado por la persona; Talento Humano o el líder lo aprueban. Idempotente.

alter table nexa_cursos add column if not exists curso_previo_id uuid references nexa_cursos(id) on delete set null;
alter table nexa_cursos drop constraint if exists nexa_cursos_previo_distinto;
alter table nexa_cursos add constraint nexa_cursos_previo_distinto check (curso_previo_id is null or curso_previo_id <> id);

alter table induccion_items add column if not exists curso_id uuid references nexa_cursos(id) on delete set null;

-- Al asignar un curso, asignar también su curso previo si la persona no lo tiene (cada inserción repite la regla hacia atrás).
create or replace function fn_ruta_asegura_previo() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_previo uuid;
begin
  select curso_previo_id into v_previo from nexa_cursos where id = new.curso_id;
  if v_previo is not null
     and not exists (select 1 from nexa_rutas_formacion r where r.colaborador_id = new.colaborador_id and r.curso_id = v_previo) then
    insert into nexa_rutas_formacion (colaborador_id, curso_id, fecha_limite)
    values (new.colaborador_id, v_previo, new.fecha_limite);
  end if;
  return new;
end;
$$;

drop trigger if exists trg_ruta_asegura_previo on nexa_rutas_formacion;
create trigger trg_ruta_asegura_previo after insert on nexa_rutas_formacion
  for each row execute function fn_ruta_asegura_previo();

-- No se avanza ni se completa un curso mientras su previo no esté completado.
create or replace function fn_ruta_exige_previo() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_previo uuid;
  v_titulo text;
begin
  if new.estado in ('en_curso', 'completado') and (old.estado is distinct from new.estado or new.progreso_pct > coalesce(old.progreso_pct, 0)) then
    select c.curso_previo_id, p.titulo into v_previo, v_titulo
    from nexa_cursos c left join nexa_cursos p on p.id = c.curso_previo_id
    where c.id = new.curso_id;
    if v_previo is not null
       and not exists (select 1 from nexa_rutas_formacion r where r.colaborador_id = new.colaborador_id and r.curso_id = v_previo and r.estado = 'completado') then
      raise exception 'Primero completa el curso «%», que es la base de este.', coalesce(v_titulo, 'previo');
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_ruta_exige_previo on nexa_rutas_formacion;
create trigger trg_ruta_exige_previo before update on nexa_rutas_formacion
  for each row execute function fn_ruta_exige_previo();

-- Completar el curso confirma los puntos de inducción ligados a él.
create or replace function fn_ruta_completa_induccion() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.estado = 'completado' and old.estado is distinct from 'completado' then
    -- Propósito, funciones y riesgos SST: queda confirmado por la persona (TH o el líder aprueban).
    -- Los demás puntos (formación, otros): el curso completado es la evidencia y se dan por cumplidos.
    update colaborador_induccion_items ci
       set confirmado_colaborador_en = coalesce(ci.confirmado_colaborador_en, now()),
           completado = case when i.categoria in ('proposito_organizacional', 'funciones', 'riesgos_sst') then ci.completado else true end,
           completado_en = case when i.categoria in ('proposito_organizacional', 'funciones', 'riesgos_sst') then ci.completado_en else coalesce(ci.completado_en, now()) end
      from induccion_items i
     where ci.item_id = i.id
       and i.curso_id = new.curso_id
       and ci.colaborador_id = new.colaborador_id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_ruta_completa_induccion on nexa_rutas_formacion;
create trigger trg_ruta_completa_induccion after update on nexa_rutas_formacion
  for each row execute function fn_ruta_completa_induccion();
