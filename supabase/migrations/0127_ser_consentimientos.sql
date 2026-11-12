-- Modelo integral (§5, §9), Fase 2 parte 3: consentimiento explícito sobre la Guía del Flow.
-- La persona decide si su líder directo puede ver el informe de su Guía del Flow (y los puntajes de los aspectos con
-- relevancia laboral). Talento Humano la usa para acompañar su desarrollo (esa es la finalidad declarada) y la ve siempre;
-- los aspectos sensibles nunca los ve nadie más que ella. Sin registro de consentimiento se mantiene el comportamiento
-- anterior (el líder la ve) y la persona queda con la decisión «pendiente». La regla se aplica en la base de datos
-- (políticas de guia_del_flow y ser_puntajes), no solo en pantalla. Idempotente.

create table if not exists ser_consentimientos (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  colaborador_id uuid not null unique references colaboradores(id) on delete cascade,
  comparte_con_lider boolean not null default true,
  version_finalidad text not null,
  aceptado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

comment on table ser_consentimientos is 'Decisión de la persona sobre quién puede ver el informe de su Guía del Flow. Sin fila = decisión pendiente (el líder la ve, como antes). version_finalidad identifica el texto de finalidad que aceptó.';

alter table ser_consentimientos enable row level security;

drop policy if exists "ser_consentimientos: lectura" on ser_consentimientos;
create policy "ser_consentimientos: lectura" on ser_consentimientos for select
  using (
    empresa_id = fn_mi_empresa_id()
    and (fn_mi_rol() = 'admin_th' or colaborador_id = fn_mi_colaborador_id() or fn_es_mi_equipo(colaborador_id))
  );

drop policy if exists "ser_consentimientos: la persona decide" on ser_consentimientos;
create policy "ser_consentimientos: la persona decide" on ser_consentimientos for all
  using (empresa_id = fn_mi_empresa_id() and colaborador_id = fn_mi_colaborador_id())
  with check (empresa_id = fn_mi_empresa_id() and colaborador_id = fn_mi_colaborador_id());

-- ¿La persona permite que su líder vea su Guía? (true si aún no decidió: comportamiento anterior)
create or replace function fn_ser_comparte_con_lider(p_colaborador_id uuid) returns boolean
language sql security definer stable set search_path = public as $$
  select not exists (select 1 from ser_consentimientos where colaborador_id = p_colaborador_id and comparte_con_lider = false);
$$;

-- El líder solo gestiona la Guía de su equipo si la persona lo permite.
drop policy if exists "ser: lider gestiona la de su equipo" on guia_del_flow;
create policy "ser: lider gestiona la de su equipo" on guia_del_flow for all
  using (fn_es_mi_equipo(colaborador_id) and fn_ser_comparte_con_lider(colaborador_id))
  with check (fn_es_mi_equipo(colaborador_id) and fn_ser_comparte_con_lider(colaborador_id));

drop policy if exists "ser_puntajes: lider gestiona el de su equipo (no sensibles)" on ser_puntajes;
create policy "ser_puntajes: lider gestiona el de su equipo (no sensibles)" on ser_puntajes for all
  using (exists (
    select 1 from guia_del_flow g join ser_aspectos a on a.id = ser_puntajes.aspecto_id
    where g.id = ser_puntajes.guia_del_flow_id and fn_es_mi_equipo(g.colaborador_id) and fn_ser_comparte_con_lider(g.colaborador_id) and a.sensible = false
  ))
  with check (exists (
    select 1 from guia_del_flow g join ser_aspectos a on a.id = ser_puntajes.aspecto_id
    where g.id = ser_puntajes.guia_del_flow_id and fn_es_mi_equipo(g.colaborador_id) and fn_ser_comparte_con_lider(g.colaborador_id) and a.sensible = false
  ));
