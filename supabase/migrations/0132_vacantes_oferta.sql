-- Informe de pruebas (5.1, 5.2.3): la vacante necesita información suficiente para que quien la ve decida postularse.
-- Se agregan modalidad, ciudad, horario, tipo de contrato, requisitos y beneficios. Todos opcionales. Idempotente.

alter table vacantes add column if not exists modalidad text;
alter table vacantes add column if not exists ciudad text;
alter table vacantes add column if not exists horario text;
alter table vacantes add column if not exists tipo_contrato text;
alter table vacantes add column if not exists requisitos text;
alter table vacantes add column if not exists beneficios text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'vacantes_modalidad_valida') then
    alter table vacantes add constraint vacantes_modalidad_valida check (modalidad is null or modalidad in ('presencial', 'hibrido', 'remoto'));
  end if;
end $$;

comment on column vacantes.modalidad is 'presencial, hibrido o remoto.';
comment on column vacantes.requisitos is 'Requisitos principales de la oferta (texto libre, una línea por requisito).';
comment on column vacantes.beneficios is 'Beneficios que ofrece la empresa. Solo lo que la persona de Talento Humano escribe: la IA no inventa beneficios.';
