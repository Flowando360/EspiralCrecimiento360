-- ============================================================================
-- 0044_afiliaciones_colaborador.sql
-- Afiliaciones a EPS/AFP/ARL/caja de compensación (docs/Requerimientos.docx,
-- secc. 1 "Núcleo de datos del empleado" -- no existía ningún campo para
-- esto). Son datos legales/de nómina, no de salud (a diferencia de
-- incapacidades en 0043): mismo nivel de sensibilidad que el contrato/
-- salario ya guardados en 0020, así que van directo en `colaboradores`
-- junto a esos campos y con la misma gobernanza de acceso (admin_th + el
-- propio colaborador, sin el líder).
-- ============================================================================

alter table colaboradores add column if not exists eps text;
alter table colaboradores add column if not exists arl text;
alter table colaboradores add column if not exists afp text;
alter table colaboradores add column if not exists caja_compensacion text;

comment on column colaboradores.eps is 'Entidad Promotora de Salud a la que está afiliado el colaborador. Mismo nivel de acceso que el contrato/salario: admin_th y el propio colaborador, sin el líder.';
comment on column colaboradores.arl is 'Administradora de Riesgos Laborales a la que está afiliado el colaborador.';
comment on column colaboradores.afp is 'Fondo de pensiones (Administradora de Fondos de Pensiones) al que está afiliado el colaborador.';
comment on column colaboradores.caja_compensacion is 'Caja de compensación familiar a la que está afiliado el colaborador.';
