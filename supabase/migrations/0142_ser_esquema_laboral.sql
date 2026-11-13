-- ============================================================================
-- 0142_ser_esquema_laboral.sql
--
-- El Ser que ve la empresa es un ESQUEMA descriptivo, no la Guía del Flow ni un puntaje.
--
-- Decisión de Diana (2026-11-13): la empresa (Talento Humano y el líder directo) nunca ve la Guía del Flow
-- de la persona; solo ve, aspecto por aspecto, lo que tiene relevancia laboral. Por eso:
--   1. Cada aspecto lleva un título, una descripción laboral formal, cómo aprovecharlo y cómo acompañarlo
--      (ser_puntajes.nota / descripcion / aprovechar / acompanar) y un enfoque descriptivo (aprovechar,
--      equilibrado, acompanar). El puntaje 1-5 deja de usarse: pasa a ser opcional.
--   2. El consentimiento previo se obtiene en la aplicación de la Guía del Flow (casilla de autorización al
--      registrarse, revocable desde su resultado): si la persona no autoriza, la Guía no envía nada. Por eso
--      aquí ya no hay segunda decisión: fn_ser_comparte_con_lider siempre devuelve true.
--   3. Las 9 inteligencias tienen su propio aspecto (antes había 3 «casillas» con nombres equivocados).
--   4. Se agrega «Talento único» (titular de la esencia). Los 12 aspectos sensibles siguen sin entrar.
--   5. El catálogo se siembra solo en cada empresa nueva (antes solo existía en CONVERGIA y Mármoles).
--   6. El líder solo LEE el esquema; cargar o corregir a mano es de Talento Humano.
-- Idempotente.
-- ============================================================================

-- ── 1. Columnas del esquema ──────────────────────────────────────────────────
alter table ser_puntajes add column if not exists descripcion text;
alter table ser_puntajes add column if not exists aprovechar text;
alter table ser_puntajes add column if not exists acompanar text;
alter table ser_puntajes add column if not exists enfoque text;
alter table ser_puntajes alter column puntaje drop not null;

alter table ser_puntajes drop constraint if exists ser_puntajes_enfoque_check;
alter table ser_puntajes add constraint ser_puntajes_enfoque_check check (enfoque is null or enfoque in ('aprovechar', 'equilibrado', 'acompanar'));

comment on column ser_puntajes.nota is 'Título del resultado de este aspecto (p. ej. «Visión, empatía y determinación»).';
comment on column ser_puntajes.descripcion is 'Descripción laboral formal del aspecto, en tercera persona. Redactada por la aplicación de la Guía del Flow a partir del resultado; NO es el texto de la Guía de la persona.';
comment on column ser_puntajes.aprovechar is 'Cómo puede la empresa aprovechar este rasgo (una o dos frases).';
comment on column ser_puntajes.acompanar is 'Cómo puede el líder acompañar a la persona en este rasgo (una o dos frases).';
comment on column ser_puntajes.enfoque is 'Lectura descriptiva, no una nota: aprovechar (rasgo fuerte), equilibrado, acompanar (conviene apoyar).';
comment on column ser_puntajes.puntaje is 'Obsoleto: el Ser no se califica. Se conserva solo por datos históricos.';

-- Lo ya cargado: el enfoque se deduce del puntaje que sí existía.
update ser_puntajes set enfoque = case when puntaje <= 2 then 'acompanar' when puntaje = 3 then 'equilibrado' else 'aprovechar' end
where enfoque is null and puntaje is not null;

-- ── 2. Consentimiento: ya se obtuvo en la Guía del Flow ──────────────────────
create or replace function fn_ser_comparte_con_lider(p_colaborador_id uuid) returns boolean
language sql security definer stable set search_path = public as $$
  select true;
$$;
comment on function fn_ser_comparte_con_lider(uuid) is 'Siempre true: la autorización de la persona se pide en la Guía del Flow antes de enviar nada a la empresa. Se conserva para no romper políticas.';

-- ── 3. El líder solo lee el esquema ──────────────────────────────────────────
drop policy if exists "ser_puntajes: lider gestiona el de su equipo (no sensibles)" on ser_puntajes;
drop policy if exists "ser_puntajes: lider ve el de su equipo (no sensibles)" on ser_puntajes;
create policy "ser_puntajes: lider ve el de su equipo (no sensibles)" on ser_puntajes for select
  using (exists (
    select 1 from guia_del_flow g join ser_aspectos a on a.id = ser_puntajes.aspecto_id
    where g.id = ser_puntajes.guia_del_flow_id and fn_es_mi_equipo(g.colaborador_id) and a.sensible = false
  ));

-- ── 4. Catálogo completo, sembrado por empresa ───────────────────────────────
create or replace function fn_sembrar_ser_aspectos(p_empresa uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  insert into ser_aspectos (empresa_id, bloque, nombre, orden, sensible) values
    (p_empresa, 'esencia', 'Talento único', 0, false),
    (p_empresa, 'esencia', 'Carácter', 1, false),
    (p_empresa, 'esencia', 'Temperamento', 2, false),
    (p_empresa, 'esencia', 'Talentos innatos', 3, false),
    (p_empresa, 'esencia', 'Talentos para potenciar', 4, false),
    (p_empresa, 'esencia', 'Propósito – Intuición', 5, false),
    (p_empresa, 'esencia', 'Propósito – Equilibrio', 6, false),
    (p_empresa, 'esencia', 'Liderazgo – Inspirar', 7, false),
    (p_empresa, 'esencia', 'Liderazgo – Transformacional', 8, false),
    (p_empresa, 'esencia', 'Comunicación', 9, false),
    (p_empresa, 'esencia', 'Ecos infancia', 13, true),
    (p_empresa, 'esencia', 'Inteligencia verbal', 20, false),
    (p_empresa, 'esencia', 'Inteligencia lógica', 21, false),
    (p_empresa, 'esencia', 'Inteligencia visual', 22, false),
    (p_empresa, 'esencia', 'Inteligencia musical', 23, false),
    (p_empresa, 'esencia', 'Inteligencia corporal', 24, false),
    (p_empresa, 'esencia', 'Inteligencia interpersonal', 25, false),
    (p_empresa, 'esencia', 'Inteligencia intrapersonal', 26, false),
    (p_empresa, 'esencia', 'Inteligencia naturalista', 27, false),
    (p_empresa, 'esencia', 'Inteligencia existencial', 28, false),
    (p_empresa, 'emociones', 'El pasado', 1, true),
    (p_empresa, 'emociones', 'Tolerancia a la frustración', 2, true),
    (p_empresa, 'emociones', 'Estabilidad emocional', 3, true),
    (p_empresa, 'emociones', 'Felicidad', 4, true),
    (p_empresa, 'pertenencia_compromiso', 'Dependencia', 1, true),
    (p_empresa, 'pertenencia_compromiso', 'Pertenencia', 2, true),
    (p_empresa, 'pertenencia_compromiso', 'Trabajo en equipo', 3, false),
    (p_empresa, 'pertenencia_compromiso', 'Responsabilidad', 4, false),
    (p_empresa, 'desafios', 'Etapa del Flow', 1, true),
    (p_empresa, 'desafios', 'Retos internos', 2, true),
    (p_empresa, 'desafios', 'Desafíos de sanación', 3, true),
    (p_empresa, 'desafios', 'Balance', 4, true),
    (p_empresa, 'desafios', 'Tu mente faro', 5, true),
    (p_empresa, 'desafios', 'Compromiso', 6, false),
    (p_empresa, 'desafios', 'Adaptación al cambio', 7, false),
    (p_empresa, 'desafios', 'Negociación', 8, false),
    (p_empresa, 'desafios', 'Recursividad', 9, false)
  on conflict (empresa_id, nombre) do nothing;
end;
$$;

-- Inteligencias: antes había 3 «casillas» (musical, naturaleza, expresiva) que guardaban las 3 primeras que
-- salieran, sin importar cuáles eran. Se reubica cada resultado en la inteligencia que dice su título.
do $$
declare
  e record;
  m record;
begin
  for e in select id from empresas loop
    perform fn_sembrar_ser_aspectos(e.id);

    for m in
      select * from (values
        ('Habilidad expresiva y comunicativa', 'Inteligencia verbal'),
        ('Pensamiento lógico y analítico', 'Inteligencia lógica'),
        ('Visión y creatividad espacial', 'Inteligencia visual'),
        ('Sensibilidad y talento musical', 'Inteligencia musical'),
        ('Destreza corporal y coordinación', 'Inteligencia corporal'),
        ('Conexión y empatía social', 'Inteligencia interpersonal'),
        ('Autoconocimiento y reflexión', 'Inteligencia intrapersonal'),
        ('Conciencia y amor por la naturaleza', 'Inteligencia naturalista'),
        ('Búsqueda de propósito y significado', 'Inteligencia existencial')
      ) as t(titulo, destino)
    loop
      update ser_puntajes sp
         set aspecto_id = destino.id
        from ser_aspectos origen, ser_aspectos destino
       where sp.aspecto_id = origen.id
         and origen.empresa_id = e.id
         and origen.nombre in ('Inteligencia musical', 'Inteligencia naturaleza', 'Inteligencia expresiva')
         and destino.empresa_id = e.id and destino.nombre = m.destino
         and sp.nota = m.titulo
         and origen.id <> destino.id
         and not exists (select 1 from ser_puntajes x where x.guia_del_flow_id = sp.guia_del_flow_id and x.aspecto_id = destino.id);
    end loop;

    -- Las casillas viejas que quedaron vacías se retiran.
    delete from ser_aspectos a
     where a.empresa_id = e.id and a.nombre in ('Inteligencia naturaleza', 'Inteligencia expresiva')
       and not exists (select 1 from ser_puntajes p where p.aspecto_id = a.id)
       and not exists (select 1 from ser_comentarios_colaborador c where c.aspecto_id = a.id);
  end loop;
end $$;

-- Toda empresa nueva nace con el catálogo.
create or replace function fn_empresa_nueva_siembra_ser() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  perform fn_sembrar_ser_aspectos(new.id);
  return new;
end;
$$;

drop trigger if exists trg_empresa_nueva_siembra_ser on empresas;
create trigger trg_empresa_nueva_siembra_ser after insert on empresas
  for each row execute function fn_empresa_nueva_siembra_ser();
