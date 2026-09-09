-- ============================================================================
-- 0034_nexa_quizzes.sql
-- Quizzes de verificación de aprendizaje en cursos de Nexa (punto 3 del
-- plan de diferenciación pendiente). Hasta hoy un curso solo tenía
-- % de avance autorreportado por el colaborador (una barra que la propia
-- persona arrastra) — el documento comercial promete explícitamente
-- "videos, quizzes, retos, trivias".
--
-- Diseño de seguridad: la respuesta correcta (`correcta`) NO se expone por
-- RLS a nadie más que admin_th. El colaborador que toma el quiz lee las
-- preguntas/opciones a través de la vista `v_nexa_curso_opciones`, que
-- omite esa columna — mismo idioma que las demás vistas `v_*` de este
-- proyecto (v_saber_cumplimiento, v_indicadores_empresa, etc.), que
-- corren con los privilegios de su dueño y no la RLS de quien consulta,
-- así que hace falta repetir el filtro de empresa a mano dentro de la
-- vista. La calificación la hace una función security definer
-- (`fn_calificar_intento_quiz`) que sí puede leer `correcta`, valida que
-- la ruta de formación sea la propia del que llama, y escribe el
-- resultado en nexa_rutas_formacion — así ni el enunciado con la
-- respuesta correcta ni el cálculo del puntaje pasan nunca por el
-- navegador del colaborador.
-- ============================================================================

create table nexa_curso_preguntas (
  id uuid primary key default gen_random_uuid(),
  curso_id uuid not null references nexa_cursos(id) on delete cascade,
  enunciado text not null,
  orden int not null default 0,
  created_at timestamptz not null default now()
);

create table nexa_curso_opciones (
  id uuid primary key default gen_random_uuid(),
  pregunta_id uuid not null references nexa_curso_preguntas(id) on delete cascade,
  texto text not null,
  correcta boolean not null default false,
  orden int not null default 0
);

comment on table nexa_curso_preguntas is 'Preguntas de opción múltiple del quiz de verificación de un curso de Nexa. Un curso sin preguntas sigue funcionando con el % de avance autorreportado de siempre (compatibilidad hacia atrás).';
comment on table nexa_curso_opciones is 'Opciones de cada pregunta. La columna correcta NO tiene política de SELECT abierta — ver v_nexa_curso_opciones y fn_calificar_intento_quiz más abajo.';

alter table nexa_cursos add column if not exists quiz_umbral_aprobacion int not null default 70;
comment on column nexa_cursos.quiz_umbral_aprobacion is '% mínimo de respuestas correctas para aprobar el quiz y marcar el curso como completado.';

alter table nexa_rutas_formacion
  add column if not exists quiz_puntaje_pct numeric(5,2),
  add column if not exists quiz_intentos int not null default 0,
  add column if not exists quiz_aprobado_en timestamptz;

comment on column nexa_rutas_formacion.quiz_puntaje_pct is 'Puntaje (%) del último intento del quiz.';
comment on column nexa_rutas_formacion.quiz_intentos is 'Cuántas veces ha intentado el quiz de este curso.';
comment on column nexa_rutas_formacion.quiz_aprobado_en is 'Cuándo aprobó el quiz (si ya lo hizo). Null si nunca ha alcanzado el umbral.';

alter table nexa_curso_preguntas enable row level security;
alter table nexa_curso_opciones enable row level security;

create policy "preguntas: lectura empresa" on nexa_curso_preguntas for select
  using (exists(select 1 from nexa_cursos c where c.id = curso_id and c.empresa_id = fn_mi_empresa_id()));
create policy "preguntas: admin_th administra" on nexa_curso_preguntas for all
  using (exists(select 1 from nexa_cursos c where c.id = curso_id and c.empresa_id = fn_mi_empresa_id()) and fn_mi_rol() = 'admin_th');

-- A propósito NO hay política de SELECT para nadie más que admin_th en
-- nexa_curso_opciones: el resto de roles la lee sin `correcta` vía la
-- vista de abajo.
create policy "opciones: admin_th administra" on nexa_curso_opciones for all
  using (
    exists(
      select 1 from nexa_curso_preguntas p join nexa_cursos c on c.id = p.curso_id
      where p.id = pregunta_id and c.empresa_id = fn_mi_empresa_id()
    )
    and fn_mi_rol() = 'admin_th'
  );

create view v_nexa_curso_opciones as
select o.id, o.pregunta_id, o.texto, o.orden
from nexa_curso_opciones o
join nexa_curso_preguntas p on p.id = o.pregunta_id
join nexa_cursos c on c.id = p.curso_id
where c.empresa_id = fn_mi_empresa_id();

comment on view v_nexa_curso_opciones is 'Opciones del quiz SIN la columna correcta, para que el colaborador pueda tomar el quiz sin poder leer la respuesta. Repite el filtro de empresa porque la vista corre con los privilegios de su dueño, no la RLS del que consulta.';

grant select on v_nexa_curso_opciones to authenticated;

-- ── Calificación: security definer, valida dueño de la ruta, lee
-- `correcta` (bypasea RLS de nexa_curso_opciones a propósito) y escribe
-- el resultado. p_respuestas: {"<pregunta_id>": "<opcion_id>", ...}
create or replace function fn_calificar_intento_quiz(p_ruta_id uuid, p_respuestas jsonb)
returns table(puntaje_pct numeric, aprobado boolean, umbral int)
language plpgsql
security definer
as $$
declare
  v_colaborador_id uuid;
  v_curso_id uuid;
  v_umbral int;
  v_total_preguntas int;
  v_correctas int := 0;
  v_pregunta record;
  v_opcion_id uuid;
begin
  select colaborador_id, curso_id into v_colaborador_id, v_curso_id
  from nexa_rutas_formacion where id = p_ruta_id;

  if v_colaborador_id is null or v_colaborador_id is distinct from fn_mi_colaborador_id() then
    raise exception 'No autorizado';
  end if;

  select nc.quiz_umbral_aprobacion into v_umbral from nexa_cursos nc where nc.id = v_curso_id;
  v_umbral := coalesce(v_umbral, 70);

  select count(*) into v_total_preguntas from nexa_curso_preguntas where curso_id = v_curso_id;
  if v_total_preguntas = 0 then
    raise exception 'Este curso no tiene quiz configurado';
  end if;

  for v_pregunta in select id from nexa_curso_preguntas where curso_id = v_curso_id loop
    v_opcion_id := nullif(p_respuestas ->> v_pregunta.id::text, '')::uuid;
    if v_opcion_id is not null and exists(
      select 1 from nexa_curso_opciones where id = v_opcion_id and pregunta_id = v_pregunta.id and correcta = true
    ) then
      v_correctas := v_correctas + 1;
    end if;
  end loop;

  puntaje_pct := round(100.0 * v_correctas / v_total_preguntas, 2);
  aprobado := puntaje_pct >= v_umbral;
  umbral := v_umbral;

  update nexa_rutas_formacion set
    quiz_puntaje_pct = puntaje_pct,
    quiz_intentos = quiz_intentos + 1,
    quiz_aprobado_en = case when aprobado then now() else quiz_aprobado_en end,
    progreso_pct = case when aprobado then 100 else progreso_pct end,
    estado = case
      when aprobado then 'completado'::estado_curso_colaborador
      when estado = 'asignado' then 'en_curso'::estado_curso_colaborador
      else estado
    end,
    completado_en = case when aprobado then now() else completado_en end
  where id = p_ruta_id;

  return next;
end;
$$;

comment on function fn_calificar_intento_quiz is 'Califica un intento de quiz para la ruta de formación propia de quien llama (valida colaborador_id = fn_mi_colaborador_id()). Si aprueba (>= quiz_umbral_aprobacion), marca el curso como completado igual que "Marcar como completado" hacía antes con el slider.';

grant execute on function fn_calificar_intento_quiz(uuid, jsonb) to authenticated;
