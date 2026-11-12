-- Modelo integral (§8), Fase 3 parte 2: perfil integral de talento.
-- Una sola pantalla por persona y ciclo con los cuatro resultados, la lectura integral, hipótesis y posibles acciones.
-- La plataforma (o la IA) propone un borrador; quien lo revisa decide, lo edita y lo guarda. Es material de trabajo
-- de Talento Humano y del líder directo: la persona evaluada no lo ve (como el Brief). Idempotente.

create table if not exists perfiles_integrales (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  evaluacion_id uuid not null unique references evaluaciones(id) on delete cascade,
  colaborador_id uuid not null references colaboradores(id) on delete cascade,
  hipotesis_ser text,
  lectura_saber text,
  lectura_hacer text,
  lectura_deber text,
  interpretacion text,
  acciones text,
  fuente text not null default 'automatico' check (fuente in ('automatico', 'ia', 'manual')),
  actualizado_por_nombre text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table perfiles_integrales is 'Perfil integral de talento (formato §8 del modelo): hipótesis del Ser, lectura de Saber/Hacer/Deber, interpretación integral y posibles acciones. Borrador propuesto por el sistema o la IA y validado por quien lo guarda. La IA propone y la persona decide.';

alter table perfiles_integrales enable row level security;

drop policy if exists "perfiles_integrales: th y lider" on perfiles_integrales;
create policy "perfiles_integrales: th y lider" on perfiles_integrales for all
  using (empresa_id = fn_mi_empresa_id() and (fn_mi_rol() = 'admin_th' or fn_es_mi_equipo(colaborador_id)))
  with check (empresa_id = fn_mi_empresa_id() and (fn_mi_rol() = 'admin_th' or fn_es_mi_equipo(colaborador_id)));
