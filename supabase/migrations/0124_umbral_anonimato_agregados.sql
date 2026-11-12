-- Modelo integral (§9), Fase 1 parte 7: umbral de anonimato para resultados agregados.
-- Ningún informe agrupado (por equipo, área o líder) muestra promedios de un grupo con menos de N personas
-- con dato, para no exponer el resultado de una persona. Por defecto 5; Talento Humano puede cambiarlo (2 a 50).
-- Clima Organizacional conserva su propio umbral (0050). Idempotente.

alter table empresas add column if not exists umbral_anonimato_agregados smallint not null default 5;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'empresas_umbral_anonimato_agregados_rango') then
    alter table empresas add constraint empresas_umbral_anonimato_agregados_rango check (umbral_anonimato_agregados between 2 and 50);
  end if;
end $$;

comment on column empresas.umbral_anonimato_agregados is 'Mínimo de personas con dato que debe tener un grupo (equipo, área, líder) para mostrar sus promedios en informes agregados de desempeño. Por defecto 5.';
