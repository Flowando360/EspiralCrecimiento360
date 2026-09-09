-- ============================================================================
-- 0038_fechas_especiales_colaborador.sql
-- Fechas especiales personalizadas y de texto libre: día de la profesión,
-- cumpleaños, o cualquier otra fecha que la persona o Talento Humano quieran
-- registrar para celebrar — a diferencia de fechas_personales_colaborador
-- (0033: campos fijos, una sola fila por colaborador), esta es una lista
-- abierta: cada colaborador puede tener cuantas fechas especiales quiera.
--
-- Quién puede registrar: admin_th sobre cualquier colaborador de su empresa,
-- y cada colaborador sobre sí mismo (mismo patrón de dos policies "for all"
-- que fechas_personales_colaborador). El líder de equipo NO queda incluido
-- a propósito — ver la nota en 0021_fix_rls_lider_colaboradores.sql sobre no
-- abrir policies de escritura sobre datos de colaboradores sin que se pida
-- explícitamente.
--
-- Cada fecha genera una alerta (tipo 'fecha_especial', agregado al enum en
-- 0037) con el próximo aniversario calculado al guardar, para que aparezca
-- en el calendario de Alertas igual que cumpleaños/aniversario de bodas.
-- Limitación conocida (igual que aniversario_bodas/baby_shower en 0033): si
-- nadie vuelve a editar la fecha, la alerta no se regenera sola año tras
-- año — no hay un job programado todavía. Mismo gap ya existente en el
-- resto del sistema de alertas.
-- ============================================================================

create table fechas_especiales_colaborador (
  id uuid primary key default gen_random_uuid(),
  colaborador_id uuid not null references colaboradores(id) on delete cascade,
  descripcion text not null,
  fecha date not null,
  creado_por uuid references perfiles_usuario(id) on delete set null,
  created_at timestamptz not null default now()
);

comment on table fechas_especiales_colaborador is 'Fechas especiales personalizadas de texto libre (día de la profesión, aniversarios inventados, etc.). A diferencia de fechas_personales_colaborador, un mismo colaborador puede tener varias.';

create index idx_fechas_especiales_colaborador on fechas_especiales_colaborador(colaborador_id);

alter table fechas_especiales_colaborador enable row level security;

create policy "fechas_especiales: admin_th todo" on fechas_especiales_colaborador for all
  using (exists(select 1 from colaboradores co where co.id = colaborador_id and co.empresa_id = fn_mi_empresa_id()) and fn_mi_rol() = 'admin_th');
create policy "fechas_especiales: colaborador administra lo propio" on fechas_especiales_colaborador for all
  using (colaborador_id = fn_mi_colaborador_id());

-- ── Alerta de celebración: próximo aniversario de la fecha guardada ──────
alter table alertas add column fecha_especial_id uuid references fechas_especiales_colaborador(id) on delete cascade;

create or replace function fn_generar_alerta_fecha_especial()
returns trigger
language plpgsql
security definer
as $$
declare
  v_empresa_id uuid;
  v_proxima date;
begin
  select empresa_id into v_empresa_id from colaboradores where id = new.colaborador_id;
  if v_empresa_id is null then
    return new;
  end if;

  begin
    v_proxima := make_date(extract(year from current_date)::int, extract(month from new.fecha)::int, extract(day from new.fecha)::int);
  exception when others then
    -- 29 de febrero en un año no bisiesto: cae al 28.
    v_proxima := make_date(extract(year from current_date)::int, extract(month from new.fecha)::int, 28);
  end;
  if v_proxima < current_date then
    v_proxima := v_proxima + interval '1 year';
  end if;

  delete from alertas where fecha_especial_id = new.id and estado in ('pendiente', 'notificada');
  insert into alertas (empresa_id, colaborador_id, tipo, severidad, titulo, fecha_objetivo, dias_anticipacion, fecha_especial_id)
  values (v_empresa_id, new.colaborador_id, 'fecha_especial', 'info', new.descripcion, v_proxima, 7, new.id);

  return new;
end;
$$;

comment on function fn_generar_alerta_fecha_especial is 'Crea/actualiza la alerta del próximo aniversario de una fecha especial al guardarla o editarla. Al borrar la fecha, la alerta se borra en cascada (fecha_especial_id references ... on delete cascade).';

drop trigger if exists trg_fechas_especiales_alertas on fechas_especiales_colaborador;
create trigger trg_fechas_especiales_alertas
  after insert or update on fechas_especiales_colaborador
  for each row execute function fn_generar_alerta_fecha_especial();
