-- Modelo integral (§6.3-6.5), Fase 1 parte 2: índice de desempeño integral y umbrales críticos.
-- Los pesos de Saber, Hacer y Deber se configuran por nivel de cargo (si no hay fila se usa 25/40/35, el ejemplo
-- ilustrativo del modelo). Cada competencia puede tener un mínimo crítico, definido y justificado de antemano:
-- si la nota consolidada queda por debajo, el resultado lo advierte aunque el índice sea alto.

create table if not exists ponderacion_dimensiones_nivel (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  nivel_cargo nivel_cargo not null,
  peso_saber numeric(5,2) not null check (peso_saber between 0 and 100),
  peso_hacer numeric(5,2) not null check (peso_hacer between 0 and 100),
  peso_deber numeric(5,2) not null check (peso_deber between 0 and 100),
  actualizado_en timestamptz not null default now(),
  unique (empresa_id, nivel_cargo),
  check (abs(peso_saber + peso_hacer + peso_deber - 100) < 0.01)
);

comment on table ponderacion_dimensiones_nivel is 'Pesos (%) de Saber, Hacer y Deber para el índice de desempeño integral, por nivel de cargo. Deben sumar 100. Sin fila para un nivel, se usa 25/40/35. El Ser no entra: se presenta en paralelo.';

alter table ponderacion_dimensiones_nivel enable row level security;

drop policy if exists "ponderacion_dimensiones: lectura empresa" on ponderacion_dimensiones_nivel;
create policy "ponderacion_dimensiones: lectura empresa" on ponderacion_dimensiones_nivel for select
  using (empresa_id = fn_mi_empresa_id());

drop policy if exists "ponderacion_dimensiones: admin_th administra" on ponderacion_dimensiones_nivel;
create policy "ponderacion_dimensiones: admin_th administra" on ponderacion_dimensiones_nivel for all
  using (empresa_id = fn_mi_empresa_id() and fn_mi_rol() = 'admin_th')
  with check (empresa_id = fn_mi_empresa_id() and fn_mi_rol() = 'admin_th');

-- Umbral crítico por competencia (1 a 4; null = sin umbral) y su justificación.
alter table competencias add column if not exists umbral_critico smallint check (umbral_critico is null or umbral_critico between 1 and 4);
alter table competencias add column if not exists umbral_justificacion text;

comment on column competencias.umbral_critico is 'Nota consolidada mínima (1-4) bajo la cual el resultado advierte un incumplimiento crítico en este criterio, aunque el índice sea alto. Null = sin umbral.';
comment on column competencias.umbral_justificacion is 'Por qué este criterio es crítico y por qué ese mínimo (el modelo exige que los umbrales estén definidos de antemano y justificados).';
