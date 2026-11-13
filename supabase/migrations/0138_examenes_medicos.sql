-- Informe de Luisa 4.10.3: exámenes médicos como módulo propio, separados de la inducción.
-- Se distinguen los de preingreso, periódicos y de egreso, con fecha de vencimiento y alerta de renovación.
-- Dato sensible de salud: mismo nivel de privacidad que las incapacidades (Talento Humano y la propia persona;
-- el líder directo no lo ve). Solo se guarda el concepto general (apto o no), nunca el diagnóstico. Idempotente.

create table if not exists examenes_medicos_colaborador (
  id uuid primary key default gen_random_uuid(),
  colaborador_id uuid not null references colaboradores(id) on delete cascade,
  tipo text not null check (tipo in ('preingreso', 'periodico', 'egreso')),
  fecha_realizado date not null,
  proxima_fecha date, -- cuándo vence (solo periódicos)
  concepto text not null default 'apto' check (concepto in ('apto', 'apto_con_restricciones', 'no_apto', 'pendiente')),
  entidad text, -- IPS o médico ocupacional
  registrado_por uuid references perfiles_usuario(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint examen_proxima_valida check (proxima_fecha is null or proxima_fecha >= fecha_realizado)
);

create index if not exists idx_examenes_colaborador on examenes_medicos_colaborador(colaborador_id, fecha_realizado desc);

alter table examenes_medicos_colaborador enable row level security;

drop policy if exists "examenes: admin_th administra" on examenes_medicos_colaborador;
create policy "examenes: admin_th administra" on examenes_medicos_colaborador for all
  using (exists (select 1 from colaboradores co where co.id = colaborador_id and co.empresa_id = fn_mi_empresa_id()) and fn_mi_rol() = 'admin_th')
  with check (exists (select 1 from colaboradores co where co.id = colaborador_id and co.empresa_id = fn_mi_empresa_id()) and fn_mi_rol() = 'admin_th');

drop policy if exists "examenes: colaborador ve los propios" on examenes_medicos_colaborador;
create policy "examenes: colaborador ve los propios" on examenes_medicos_colaborador for select
  using (colaborador_id = fn_mi_colaborador_id());

-- Alerta de renovación: un solo aviso vigente por persona. Al registrar un examen con próxima fecha, se cierran los avisos
-- anteriores de renovación y se crea el nuevo (30 días de anticipación).
create or replace function fn_examen_alerta_renovacion() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_empresa uuid;
begin
  if new.proxima_fecha is null then
    return new;
  end if;
  select empresa_id into v_empresa from colaboradores where id = new.colaborador_id;
  update alertas set estado = 'resuelta'
   where colaborador_id = new.colaborador_id
     and tipo = 'sst_examen_medico'
     and titulo = 'Renovar examen médico periódico'
     and estado in ('pendiente', 'notificada');
  insert into alertas (empresa_id, colaborador_id, tipo, severidad, titulo, descripcion, fecha_objetivo, dias_anticipacion)
  values (v_empresa, new.colaborador_id, 'sst_examen_medico', 'atencion', 'Renovar examen médico periódico',
          'El examen médico periódico vence en esta fecha: programa uno nuevo antes.', new.proxima_fecha, 30);
  return new;
end;
$$;

drop trigger if exists trg_examen_alerta_renovacion on examenes_medicos_colaborador;
create trigger trg_examen_alerta_renovacion after insert on examenes_medicos_colaborador
  for each row execute function fn_examen_alerta_renovacion();
