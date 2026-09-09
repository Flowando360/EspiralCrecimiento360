-- ============================================================================
-- 0009_rls_perfil_completo_y_bloques.sql
-- RLS para las tablas nuevas de 0008: perfil de cargo completo, identidad
-- organizacional y evaluación por ítems.
-- ============================================================================

alter table cargo_funciones_principales enable row level security;
alter table cargo_decisiones enable row level security;
alter table cargo_factores_riesgo enable row level security;
alter table cargo_examenes_medicos enable row level security;
alter table cargo_epp enable row level security;
alter table empresa_identidad enable row level security;
alter table empresa_identidad_elementos enable row level security;
alter table evaluacion_items enable row level security;

-- ── Perfil de cargo extendido: lectura para toda la empresa, edición admin_th ──
create policy "cargo_funciones: lectura empresa" on cargo_funciones_principales for select
  using (exists(select 1 from cargos c where c.id = cargo_id and c.empresa_id = fn_mi_empresa_id()));
create policy "cargo_funciones: admin_th administra" on cargo_funciones_principales for all
  using (fn_mi_rol() = 'admin_th' and exists(select 1 from cargos c where c.id = cargo_id and c.empresa_id = fn_mi_empresa_id()));

create policy "cargo_decisiones: lectura empresa" on cargo_decisiones for select
  using (exists(select 1 from cargos c where c.id = cargo_id and c.empresa_id = fn_mi_empresa_id()));
create policy "cargo_decisiones: admin_th administra" on cargo_decisiones for all
  using (fn_mi_rol() = 'admin_th' and exists(select 1 from cargos c where c.id = cargo_id and c.empresa_id = fn_mi_empresa_id()));

create policy "cargo_riesgos: lectura empresa" on cargo_factores_riesgo for select
  using (exists(select 1 from cargos c where c.id = cargo_id and c.empresa_id = fn_mi_empresa_id()));
create policy "cargo_riesgos: admin_th administra" on cargo_factores_riesgo for all
  using (fn_mi_rol() = 'admin_th' and exists(select 1 from cargos c where c.id = cargo_id and c.empresa_id = fn_mi_empresa_id()));

create policy "cargo_examenes: lectura empresa" on cargo_examenes_medicos for select
  using (exists(select 1 from cargos c where c.id = cargo_id and c.empresa_id = fn_mi_empresa_id()));
create policy "cargo_examenes: admin_th administra" on cargo_examenes_medicos for all
  using (fn_mi_rol() = 'admin_th' and exists(select 1 from cargos c where c.id = cargo_id and c.empresa_id = fn_mi_empresa_id()));

create policy "cargo_epp: lectura empresa" on cargo_epp for select
  using (exists(select 1 from cargos c where c.id = cargo_id and c.empresa_id = fn_mi_empresa_id()));
create policy "cargo_epp: admin_th administra" on cargo_epp for all
  using (fn_mi_rol() = 'admin_th' and exists(select 1 from cargos c where c.id = cargo_id and c.empresa_id = fn_mi_empresa_id()));

-- ── Identidad organizacional: lectura para TODA la empresa (es cultura, debe ser visible a todos) ──
create policy "identidad: lectura empresa" on empresa_identidad for select
  using (empresa_id = fn_mi_empresa_id());
create policy "identidad: admin_th edita" on empresa_identidad for all
  using (empresa_id = fn_mi_empresa_id() and fn_mi_rol() = 'admin_th');

create policy "identidad_elementos: lectura empresa" on empresa_identidad_elementos for select
  using (empresa_id = fn_mi_empresa_id());
create policy "identidad_elementos: admin_th edita" on empresa_identidad_elementos for all
  using (empresa_id = fn_mi_empresa_id() and fn_mi_rol() = 'admin_th');

-- ── Evaluación por ítems: mismo criterio que evaluaciones/resultados ──────
create policy "items: admin_th todo" on evaluacion_items for all
  using (exists(select 1 from evaluaciones e join colaboradores co on co.id = e.colaborador_evaluado_id where e.id = evaluacion_id and co.empresa_id = fn_mi_empresa_id()) and fn_mi_rol() = 'admin_th');
create policy "items: lider y propio colaborador ven" on evaluacion_items for select
  using (exists(select 1 from evaluaciones e where e.id = evaluacion_id and (fn_es_mi_equipo(e.colaborador_evaluado_id) or e.colaborador_evaluado_id = fn_mi_colaborador_id())));
