-- ============================================================================
-- 0078_riesgos_ciclo_revision.sql
-- Fase 2 del módulo de Procesos — Flujo diferenciador 3 (Nexus): la matriz
-- de riesgos deja de ser un documento que se llena una vez y ya. Se le
-- agrega tipo (riesgo/oportunidad, ISO 9001 6.1 habla de ambos), frecuencia
-- de revisión, fecha de la última revisión y el riesgo residual (tras
-- aplicar el control) — para poder mostrar qué riesgos están vencidos de
-- revisar y priorizar.
--
-- No hay envío de alertas automáticas todavía (no hay proveedor de
-- notificaciones configurado) — por ahora el "vencido" se calcula y se
-- muestra en pantalla; queda para una fase posterior conectarlo a
-- Alertas/Notificaciones.
--
-- Escrita con IF NOT EXISTS / manejo de duplicate_object para poder
-- correrse más de una vez sin error, igual que 0074-0076.
-- ============================================================================

alter table matriz_riesgos_controles
  add column if not exists tipo text not null default 'riesgo',
  add column if not exists frecuencia_revision text,
  add column if not exists fecha_ultima_revision date,
  add column if not exists riesgo_residual text;

do $$ begin
  alter table matriz_riesgos_controles add constraint matriz_riesgos_controles_tipo_check check (tipo in ('riesgo', 'oportunidad'));
exception when duplicate_object then null;
end $$;

do $$ begin
  alter table matriz_riesgos_controles add constraint matriz_riesgos_controles_frecuencia_revision_check check (frecuencia_revision in ('trimestral', 'semestral', 'anual'));
exception when duplicate_object then null;
end $$;

do $$ begin
  alter table matriz_riesgos_controles add constraint matriz_riesgos_controles_riesgo_residual_check check (riesgo_residual in ('bajo', 'medio', 'alto'));
exception when duplicate_object then null;
end $$;

comment on column matriz_riesgos_controles.tipo is 'Riesgo u oportunidad (ISO 9001 numeral 6.1 exige gestionar ambos).';
comment on column matriz_riesgos_controles.frecuencia_revision is 'Cada cuánto debe revisarse este riesgo/oportunidad. Nulo = sin periodicidad definida, no se marca como vencido.';
comment on column matriz_riesgos_controles.fecha_ultima_revision is 'Última vez que alguien confirmó o actualizó probabilidad/impacto/control. Se compara contra frecuencia_revision para saber si está vencido.';
comment on column matriz_riesgos_controles.riesgo_residual is 'Nivel de riesgo que queda después de aplicar el control (distinto del impacto/probabilidad "en bruto").';
