-- ============================================================================
-- 0033_fechas_personales_colaborador.sql
-- Fechas personales sensibles autogestionadas: aniversario de bodas, baby
-- shower y embarazo/fecha probable de parto (punto 2 del plan de
-- diferenciación, docs/notas-proyecto-decisiones-y-backlog.md secc. 2.2).
--
-- Van en una tabla APARTE de `colaboradores` (no como columnas ahí) por lo
-- mismo que llevó a separar ser_comentarios_colaborador de ser_puntajes en
-- 0008: la RLS de `colaboradores` no tiene ninguna política de UPDATE para
-- el rol colaborador sobre su propia fila (solo admin_th y su líder pueden
-- actualizarla), y agregar una abriría la puerta a que cualquier persona
-- pudiera reescribir su propio cargo_id/lider_id/tipo_contrato por fuera de
-- la UI. Con una tabla nueva, angosta y de un solo propósito, la persona
-- puede administrar sus propias fechas sin tocar el resto de su ficha.
--
-- Aniversario de bodas y baby shower SÍ generan una alerta (visible para
-- el líder del equipo, igual que cumpleaños/aniversario de ingreso — son
-- eventos para celebrar). Embarazo/fecha probable de parto NO genera
-- alerta: es dato de salud, solo lo ve admin_th y la propia persona.
-- ============================================================================

create table fechas_personales_colaborador (
  id uuid primary key default gen_random_uuid(),
  colaborador_id uuid not null unique references colaboradores(id) on delete cascade,
  fecha_matrimonio date,
  fecha_baby_shower date,
  en_embarazo boolean not null default false,
  fecha_probable_parto date,
  updated_at timestamptz not null default now()
);

comment on table fechas_personales_colaborador is 'Fechas personales sensibles autogestionadas por cada colaborador. Aniversario de bodas y baby shower generan alerta visible para el líder (evento a celebrar). Embarazo/fecha probable de parto NO genera alerta y solo lo ve admin_th + la propia persona (dato de salud).';

alter table fechas_personales_colaborador enable row level security;

create policy "fechas_personales: admin_th todo" on fechas_personales_colaborador for all
  using (exists(select 1 from colaboradores co where co.id = colaborador_id and co.empresa_id = fn_mi_empresa_id()) and fn_mi_rol() = 'admin_th');
create policy "fechas_personales: colaborador administra lo propio" on fechas_personales_colaborador for all
  using (colaborador_id = fn_mi_colaborador_id());

-- ── Alertas de celebración (bodas/baby shower) al guardar/actualizar ──────
create or replace function fn_generar_alertas_fechas_personales()
returns trigger
language plpgsql
security definer
as $$
declare
  v_empresa_id uuid;
begin
  select empresa_id into v_empresa_id from colaboradores where id = new.colaborador_id;
  if v_empresa_id is null then
    return new;
  end if;

  if new.fecha_matrimonio is not null
     and (tg_op = 'INSERT' or old.fecha_matrimonio is distinct from new.fecha_matrimonio) then
    delete from alertas
      where colaborador_id = new.colaborador_id and tipo = 'aniversario_bodas' and estado in ('pendiente', 'notificada');
    insert into alertas (empresa_id, colaborador_id, tipo, severidad, titulo, fecha_objetivo, dias_anticipacion)
    values (v_empresa_id, new.colaborador_id, 'aniversario_bodas', 'info', 'Aniversario de bodas', new.fecha_matrimonio + interval '1 year', 7);
  end if;

  if new.fecha_baby_shower is not null
     and (tg_op = 'INSERT' or old.fecha_baby_shower is distinct from new.fecha_baby_shower) then
    delete from alertas
      where colaborador_id = new.colaborador_id and tipo = 'baby_shower' and estado in ('pendiente', 'notificada');
    insert into alertas (empresa_id, colaborador_id, tipo, severidad, titulo, fecha_objetivo, dias_anticipacion)
    values (v_empresa_id, new.colaborador_id, 'baby_shower', 'info', 'Baby shower', new.fecha_baby_shower, 7);
  end if;

  return new;
end;
$$;

comment on function fn_generar_alertas_fechas_personales is 'Crea/actualiza la alerta de aniversario de bodas o baby shower cuando cambia la fecha correspondiente. No toca fecha_probable_parto/en_embarazo a propósito: ese dato no debe pasar por el canal de alertas, que sí es visible para el líder de equipo.';

drop trigger if exists trg_fechas_personales_alertas on fechas_personales_colaborador;
create trigger trg_fechas_personales_alertas
  after insert or update on fechas_personales_colaborador
  for each row execute function fn_generar_alertas_fechas_personales();
