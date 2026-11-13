-- Informe de Luisa 4.20: clima por área / líder / sede y dimensiones nuevas.
-- Las respuestas siguen SIN colaborador_id: solo se guarda una instantánea del área y la sede de quien respondió
-- (igual que ya se hacía con el líder), para poder segmentar sin identificar a nadie. Idempotente.

alter table clima_respuestas add column if not exists area text;
alter table clima_respuestas add column if not exists sede_id uuid references sedes(id) on delete set null;
alter table clima_respuestas add column if not exists relaciones_pares smallint check (relaciones_pares between 1 and 5);
alter table clima_respuestas add column if not exists compensacion smallint check (compensacion between 1 and 5);
alter table clima_respuestas add column if not exists equidad smallint check (equidad between 1 and 5);

comment on column clima_respuestas.area is 'Instantánea del área (proceso del cargo) de quien respondió; solo para agregar, nunca identifica a la persona.';
comment on column clima_respuestas.sede_id is 'Instantánea de la sede de quien respondió; solo para agregar.';
comment on column clima_respuestas.relaciones_pares is 'Dimensión nueva (nullable: las rondas anteriores no la tienen).';
comment on column clima_respuestas.compensacion is 'Dimensión nueva (nullable).';
comment on column clima_respuestas.equidad is 'Dimensión nueva (nullable).';
