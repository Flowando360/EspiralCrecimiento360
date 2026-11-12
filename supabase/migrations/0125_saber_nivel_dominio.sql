-- Modelo integral (§6.2), Fase 2 parte 1: Saber con nivel de dominio y fuente de evidencia.
-- Cada conocimiento verificado puede llevar el nivel que la persona demuestra, el nivel que exige el cargo y de dónde
-- sale la evidencia. El estado (cumple / parcial / no cumple) sigue siendo el resumen y se sugiere desde los niveles:
-- dominado = al menos el nivel requerido, parcial = un nivel por debajo, brecha = dos o más. Idempotente.

alter table verificaciones_saber add column if not exists nivel_dominio smallint;
alter table verificaciones_saber add column if not exists nivel_requerido smallint;
alter table verificaciones_saber add column if not exists fuente_evidencia text;
alter table verificaciones_saber add column if not exists fecha_evidencia date;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'verif_saber_nivel_dominio_rango') then
    alter table verificaciones_saber add constraint verif_saber_nivel_dominio_rango check (nivel_dominio is null or nivel_dominio between 0 and 3);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'verif_saber_nivel_requerido_rango') then
    alter table verificaciones_saber add constraint verif_saber_nivel_requerido_rango check (nivel_requerido is null or nivel_requerido between 1 and 3);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'verif_saber_fuente_valida') then
    alter table verificaciones_saber add constraint verif_saber_fuente_valida
      check (fuente_evidencia is null or fuente_evidencia in ('prueba', 'demostracion', 'entrevista', 'certificacion', 'documento', 'observacion_lider'));
  end if;
end $$;

comment on column verificaciones_saber.nivel_dominio is 'Nivel que la persona demuestra: 0 sin dominio, 1 básico, 2 intermedio, 3 avanzado.';
comment on column verificaciones_saber.nivel_requerido is 'Nivel que exige el cargo: 1 básico, 2 intermedio, 3 avanzado (bajo/medio/alto de cargo_habilidades).';
comment on column verificaciones_saber.fuente_evidencia is 'De dónde sale la evidencia: prueba, demostracion, entrevista, certificacion, documento u observacion_lider.';
