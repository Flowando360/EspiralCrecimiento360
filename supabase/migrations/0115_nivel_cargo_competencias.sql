-- Informe de pruebas (Luisa), 4.9: las competencias deben aplicarse según el nivel del cargo
-- (corporativas para todos, de nivel según el grupo de cargos, específicas de supervisión/gestión),
-- para no evaluar "Liderazgo" a un cargo operativo.

do $$ begin
  create type nivel_cargo as enum ('operativo', 'tecnico_administrativo', 'supervision', 'directivo');
exception when duplicate_object then null;
end $$;

-- Nivel del cargo. Si es nulo se deduce: con personal a cargo = supervisión, sin personal = técnico/administrativo.
alter table cargos add column if not exists nivel_cargo nivel_cargo;

-- Nivel mínimo del cargo para el que aplica la competencia. 'operativo' = aplica a todos (corporativa).
alter table competencias add column if not exists nivel_minimo nivel_cargo not null default 'operativo';

-- Las competencias que ya eran "solo con personal a cargo" pasan a exigir nivel de supervisión.
-- (Mismo efecto que hoy; el administrador puede afinar el resto desde Administración → Competencias por nivel.)
update competencias set nivel_minimo = 'supervision'
where solo_con_personal_a_cargo = true and nivel_minimo = 'operativo';
