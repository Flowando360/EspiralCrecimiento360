-- Modelo integral (§6.1, §6.5), Fase 3 parte 1: concertación de objetivos al inicio del ciclo y su cumplimiento.
-- Antes de evaluar, el líder (o Talento Humano) y la persona acuerdan qué se espera: objetivos con su criterio de éxito.
-- La persona los acepta (o los comenta) y, al cerrar el ciclo, el líder registra si se cumplió. Con eso se calcula el
-- indicador de cumplimiento de objetivos. Si un objetivo se modifica después de aceptado, la aceptación se reinicia.
-- Idempotente.

create table if not exists objetivos_ciclo (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  evaluacion_id uuid not null references evaluaciones(id) on delete cascade,
  colaborador_id uuid not null references colaboradores(id) on delete cascade,
  titulo text not null check (length(trim(titulo)) > 0),
  descripcion text,
  criterio_exito text not null check (length(trim(criterio_exito)) > 0),
  fecha_meta date,
  creado_por_nombre text,
  aceptado_en timestamptz,
  comentario_colaborador text,
  resultado text check (resultado is null or resultado in ('cumplido', 'parcial', 'no_cumplido')),
  cierre_comentario text,
  cerrado_por_nombre text,
  cerrado_en timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table objetivos_ciclo is 'Objetivos concertados al inicio del ciclo (por evaluación): qué se espera y con qué criterio se juzgará. aceptado_en = la persona los aceptó. resultado se registra al cierre: cumplido, parcial o no_cumplido.';

create index if not exists idx_objetivos_ciclo_evaluacion on objetivos_ciclo(evaluacion_id);
create index if not exists idx_objetivos_ciclo_colaborador on objetivos_ciclo(colaborador_id);

alter table objetivos_ciclo enable row level security;

drop policy if exists "objetivos_ciclo: lectura" on objetivos_ciclo;
create policy "objetivos_ciclo: lectura" on objetivos_ciclo for select
  using (empresa_id = fn_mi_empresa_id() and (fn_mi_rol() = 'admin_th' or fn_es_mi_equipo(colaborador_id) or colaborador_id = fn_mi_colaborador_id()));

drop policy if exists "objetivos_ciclo: th y lider gestionan" on objetivos_ciclo;
create policy "objetivos_ciclo: th y lider gestionan" on objetivos_ciclo for all
  using (empresa_id = fn_mi_empresa_id() and (fn_mi_rol() = 'admin_th' or fn_es_mi_equipo(colaborador_id)))
  with check (empresa_id = fn_mi_empresa_id() and (fn_mi_rol() = 'admin_th' or fn_es_mi_equipo(colaborador_id)));

drop policy if exists "objetivos_ciclo: la persona responde" on objetivos_ciclo;
create policy "objetivos_ciclo: la persona responde" on objetivos_ciclo for update
  using (empresa_id = fn_mi_empresa_id() and colaborador_id = fn_mi_colaborador_id())
  with check (empresa_id = fn_mi_empresa_id() and colaborador_id = fn_mi_colaborador_id());

-- La persona solo puede aceptar y comentar; si el contenido cambia, la aceptación se reinicia.
create or replace function fn_objetivos_ciclo_guardia() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_es_gestor boolean;
begin
  v_es_gestor := fn_mi_rol() = 'admin_th' or fn_es_mi_equipo(old.colaborador_id) or auth.uid() is null;
  if not v_es_gestor then
    if new.titulo is distinct from old.titulo or new.descripcion is distinct from old.descripcion
       or new.criterio_exito is distinct from old.criterio_exito or new.fecha_meta is distinct from old.fecha_meta
       or new.resultado is distinct from old.resultado or new.cierre_comentario is distinct from old.cierre_comentario
       or new.cerrado_en is distinct from old.cerrado_en or new.evaluacion_id is distinct from old.evaluacion_id
       or new.colaborador_id is distinct from old.colaborador_id then
      raise exception 'Solo puedes aceptar o comentar tus objetivos';
    end if;
  elsif new.titulo is distinct from old.titulo or new.descripcion is distinct from old.descripcion
        or new.criterio_exito is distinct from old.criterio_exito or new.fecha_meta is distinct from old.fecha_meta then
    new.aceptado_en := null;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_objetivos_ciclo_guardia on objetivos_ciclo;
create trigger trg_objetivos_ciclo_guardia before update on objetivos_ciclo
  for each row execute function fn_objetivos_ciclo_guardia();
