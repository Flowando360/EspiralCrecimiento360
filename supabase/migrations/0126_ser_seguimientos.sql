-- Modelo integral (§5), Fase 2 parte 2: seguimiento periódico del Ser.
-- El Ser se describe, no se califica, y cambia con el tiempo. Cada seguimiento es una conversación registrada entre la
-- persona y su líder o Talento Humano: fortalezas puestas en práctica, motivadores del momento y acuerdos. NO se guarda
-- nada de los aspectos sensibles de la Guía del Flow. Lo ve la propia persona, su líder directo y Talento Humano.
-- Idempotente.

create table if not exists ser_seguimientos (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  colaborador_id uuid not null references colaboradores(id) on delete cascade,
  fecha date not null default current_date,
  fortalezas_en_practica text,
  motivadores text,
  acuerdos text,
  proxima_revision date,
  registrado_por uuid references perfiles_usuario(id) on delete set null,
  registrado_por_nombre text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (coalesce(trim(fortalezas_en_practica), '') <> '' or coalesce(trim(motivadores), '') <> '' or coalesce(trim(acuerdos), '') <> '')
);

comment on table ser_seguimientos is 'Seguimiento periódico del Ser (evolución): fortalezas puestas en práctica, motivadores y acuerdos. Descriptivo, sin nota. No incluye aspectos sensibles de la Guía del Flow.';

create index if not exists idx_ser_seguimientos_colaborador_fecha on ser_seguimientos(colaborador_id, fecha desc);

alter table ser_seguimientos enable row level security;

drop policy if exists "ser_seguimientos: lectura" on ser_seguimientos;
create policy "ser_seguimientos: lectura" on ser_seguimientos for select
  using (
    empresa_id = fn_mi_empresa_id()
    and (fn_mi_rol() = 'admin_th' or fn_es_mi_equipo(colaborador_id) or colaborador_id = fn_mi_colaborador_id())
  );

drop policy if exists "ser_seguimientos: escritura" on ser_seguimientos;
create policy "ser_seguimientos: escritura" on ser_seguimientos for all
  using (empresa_id = fn_mi_empresa_id() and (fn_mi_rol() = 'admin_th' or fn_es_mi_equipo(colaborador_id)))
  with check (empresa_id = fn_mi_empresa_id() and (fn_mi_rol() = 'admin_th' or fn_es_mi_equipo(colaborador_id)));
