-- ============================================================================
-- 0007_rls_policies.sql
-- Row Level Security: admin_th ve/edita todo dentro de su empresa.
-- lider ve su equipo + su propia info. colaborador se ve solo a sí mismo.
-- gerencia ve reportes agregados, no calificaciones individuales de otras líneas.
-- (secc. 13.3 y 13.7 del documento)
-- ============================================================================

-- ── Funciones auxiliares (evitan repetir subconsultas en cada policy) ──────
create or replace function fn_mi_empresa_id() returns uuid
language sql security definer stable as $$
  select empresa_id from perfiles_usuario where id = auth.uid();
$$;

create or replace function fn_mi_rol() returns rol_usuario
language sql security definer stable as $$
  select rol from perfiles_usuario where id = auth.uid();
$$;

create or replace function fn_mi_colaborador_id() returns uuid
language sql security definer stable as $$
  select id from colaboradores where usuario_id = auth.uid();
$$;

-- ¿el colaborador_id dado está en el equipo (directo) de quien consulta?
create or replace function fn_es_mi_equipo(p_colaborador_id uuid) returns boolean
language sql security definer stable as $$
  select exists (
    select 1 from colaboradores where id = p_colaborador_id and lider_id = fn_mi_colaborador_id()
  );
$$;

-- ── Habilitar RLS en todas las tablas sensibles ────────────────────────────
alter table empresas enable row level security;
alter table perfiles_usuario enable row level security;
alter table cargos enable row level security;
alter table cargo_habilidades enable row level security;
alter table colaboradores enable row level security;
alter table hoja_vida_formacion enable row level security;
alter table historial_movimientos enable row level security;
alter table entrevistas_salida enable row level security;
alter table competencias enable row level security;
alter table escala_niveles enable row level security;
alter table competencia_criterios enable row level security;
alter table ciclos_evaluacion enable row level security;
alter table evaluaciones enable row level security;
alter table evaluacion_tareas enable row level security;
alter table respuestas_evaluacion enable row level security;
alter table resultados_evaluacion enable row level security;
alter table guia_del_flow enable row level security;
alter table verificaciones_saber enable row level security;
alter table planes_desarrollo enable row level security;
alter table briefs_retroalimentacion enable row level security;
alter table acuerdos_crecimiento enable row level security;
alter table alertas enable row level security;
alter table notificaciones enable row level security;
alter table nexa_feed_publicaciones enable row level security;
alter table nexa_feed_reacciones enable row level security;
alter table nexa_cursos enable row level security;
alter table nexa_rutas_por_cargo enable row level security;
alter table nexa_rutas_formacion enable row level security;
alter table nexa_simulacros enable row level security;
alter table nexa_simulacro_participantes enable row level security;
alter table nexa_insignias enable row level security;
alter table nexa_reconocimientos enable row level security;
alter table nexa_asistente_conversaciones enable row level security;
alter table nexa_directorio_aliados enable row level security;

-- ── EMPRESAS: cada quien ve solo la suya ───────────────────────────────────
create policy "empresa: ver la propia" on empresas for select
  using (id = fn_mi_empresa_id());

-- ── PERFILES_USUARIO ────────────────────────────────────────────────────────
create policy "perfiles: admin_th ve todos en su empresa" on perfiles_usuario for select
  using (empresa_id = fn_mi_empresa_id() and fn_mi_rol() = 'admin_th');
create policy "perfiles: cualquiera ve su propio perfil" on perfiles_usuario for select
  using (id = auth.uid());
create policy "perfiles: admin_th administra usuarios" on perfiles_usuario for all
  using (empresa_id = fn_mi_empresa_id() and fn_mi_rol() = 'admin_th');

-- ── CARGOS y HABILIDADES: lectura amplia dentro de la empresa, edición solo admin_th
create policy "cargos: lectura empresa" on cargos for select
  using (empresa_id = fn_mi_empresa_id());
create policy "cargos: admin_th administra" on cargos for insert with check (empresa_id = fn_mi_empresa_id() and fn_mi_rol() = 'admin_th');
create policy "cargos: admin_th actualiza" on cargos for update using (empresa_id = fn_mi_empresa_id() and fn_mi_rol() = 'admin_th');
create policy "cargos: admin_th elimina" on cargos for delete using (empresa_id = fn_mi_empresa_id() and fn_mi_rol() = 'admin_th');

create policy "cargo_habilidades: lectura empresa" on cargo_habilidades for select
  using (exists(select 1 from cargos c where c.id = cargo_id and c.empresa_id = fn_mi_empresa_id()));
create policy "cargo_habilidades: admin_th administra" on cargo_habilidades for all
  using (fn_mi_rol() = 'admin_th' and exists(select 1 from cargos c where c.id = cargo_id and c.empresa_id = fn_mi_empresa_id()));

-- ── COLABORADORES: admin_th todo | lider su equipo+propio | colaborador su ficha
create policy "colaboradores: admin_th todo" on colaboradores for all
  using (empresa_id = fn_mi_empresa_id() and fn_mi_rol() = 'admin_th');
create policy "colaboradores: gerencia lee todo su empresa" on colaboradores for select
  using (empresa_id = fn_mi_empresa_id() and fn_mi_rol() = 'gerencia');
create policy "colaboradores: lider ve su equipo y a si mismo" on colaboradores for select
  using (empresa_id = fn_mi_empresa_id() and fn_mi_rol() = 'lider' and (lider_id = fn_mi_colaborador_id() or id = fn_mi_colaborador_id()));
create policy "colaboradores: colaborador ve su propia ficha" on colaboradores for select
  using (id = fn_mi_colaborador_id());
create policy "colaboradores: lider actualiza datos basicos de su equipo" on colaboradores for update
  using (empresa_id = fn_mi_empresa_id() and fn_mi_rol() = 'lider' and lider_id = fn_mi_colaborador_id());

-- ── HOJA DE VIDA: mismo criterio que colaboradores (dato sensible → admin_th + propio líder + el propio colaborador puede ver, no editar libremente)
create policy "hoja_vida: admin_th todo" on hoja_vida_formacion for all
  using (exists(select 1 from colaboradores co where co.id = colaborador_id and co.empresa_id = fn_mi_empresa_id()) and fn_mi_rol() = 'admin_th');
create policy "hoja_vida: lider ve la de su equipo" on hoja_vida_formacion for select
  using (fn_es_mi_equipo(colaborador_id) or colaborador_id = fn_mi_colaborador_id());

-- ── HISTORIAL Y ENTREVISTAS DE SALIDA: solo admin_th (información sensible de RRHH)
create policy "historial: admin_th todo" on historial_movimientos for all
  using (exists(select 1 from colaboradores co where co.id = colaborador_id and co.empresa_id = fn_mi_empresa_id()) and fn_mi_rol() = 'admin_th');
create policy "historial: lider ve el de su equipo" on historial_movimientos for select
  using (fn_es_mi_equipo(colaborador_id));
create policy "entrevistas_salida: solo admin_th" on entrevistas_salida for all
  using (exists(select 1 from colaboradores co where co.id = colaborador_id and co.empresa_id = fn_mi_empresa_id()) and fn_mi_rol() = 'admin_th');

-- ── COMPETENCIAS / ESCALA: lectura general, edición admin_th
create policy "competencias: lectura empresa" on competencias for select using (empresa_id = fn_mi_empresa_id());
create policy "competencias: admin_th edita" on competencias for all using (empresa_id = fn_mi_empresa_id() and fn_mi_rol() = 'admin_th');
create policy "escala: lectura empresa" on escala_niveles for select using (empresa_id = fn_mi_empresa_id());
create policy "escala: admin_th edita" on escala_niveles for all using (empresa_id = fn_mi_empresa_id() and fn_mi_rol() = 'admin_th');
create policy "criterios: lectura empresa" on competencia_criterios for select
  using (exists(select 1 from competencias c where c.id = competencia_id and c.empresa_id = fn_mi_empresa_id()));
create policy "criterios: admin_th edita" on competencia_criterios for all
  using (fn_mi_rol() = 'admin_th' and exists(select 1 from competencias c where c.id = competencia_id and c.empresa_id = fn_mi_empresa_id()));

-- ── CICLOS: lectura general, gestión admin_th ──────────────────────────────
create policy "ciclos: lectura empresa" on ciclos_evaluacion for select using (empresa_id = fn_mi_empresa_id());
create policy "ciclos: admin_th gestiona" on ciclos_evaluacion for all using (empresa_id = fn_mi_empresa_id() and fn_mi_rol() = 'admin_th');

-- ── EVALUACIONES / RESULTADOS: admin_th todo | lider su equipo | colaborador la propia (solo tras publicación, controlado en la app)
create policy "evaluaciones: admin_th todo" on evaluaciones for all
  using (exists(select 1 from colaboradores co where co.id = colaborador_evaluado_id and co.empresa_id = fn_mi_empresa_id()) and fn_mi_rol() = 'admin_th');
create policy "evaluaciones: lider ve las de su equipo" on evaluaciones for select
  using (fn_es_mi_equipo(colaborador_evaluado_id) or colaborador_evaluado_id = fn_mi_colaborador_id());
create policy "evaluaciones: colaborador ve la propia" on evaluaciones for select
  using (colaborador_evaluado_id = fn_mi_colaborador_id());

create policy "resultados: admin_th todo" on resultados_evaluacion for all
  using (exists(select 1 from evaluaciones e join colaboradores co on co.id = e.colaborador_evaluado_id where e.id = evaluacion_id and co.empresa_id = fn_mi_empresa_id()) and fn_mi_rol() = 'admin_th');
create policy "resultados: lider y propio colaborador" on resultados_evaluacion for select
  using (exists(select 1 from evaluaciones e where e.id = evaluacion_id and (fn_es_mi_equipo(e.colaborador_evaluado_id) or e.colaborador_evaluado_id = fn_mi_colaborador_id())));

-- ── EVALUACION_TAREAS: cada quien ve/gestiona SU tarea de evaluar (nunca la nota que otro dio de él)
create policy "tareas: admin_th todo" on evaluacion_tareas for all
  using (exists(select 1 from evaluaciones e join colaboradores co on co.id = e.colaborador_evaluado_id where e.id = evaluacion_id and co.empresa_id = fn_mi_empresa_id()) and fn_mi_rol() = 'admin_th');
create policy "tareas: veo mis tareas como evaluador" on evaluacion_tareas for select
  using (evaluador_colaborador_id = fn_mi_colaborador_id());
create policy "tareas: completo mis propias tareas" on evaluacion_tareas for update
  using (evaluador_colaborador_id = fn_mi_colaborador_id());
create policy "tareas: lider ve avance de su equipo (sin detalle de quien califico)" on evaluacion_tareas for select
  using (exists(select 1 from evaluaciones e where e.id = evaluacion_id and fn_es_mi_equipo(e.colaborador_evaluado_id)));

-- ── RESPUESTAS_EVALUACION: el evaluador escribe la suya; nadie más la lee individualmente salvo admin_th (secc. 13.7: anonimato de pares)
create policy "respuestas: admin_th todo" on respuestas_evaluacion for all
  using (exists(select 1 from evaluacion_tareas et join evaluaciones e on e.id = et.evaluacion_id join colaboradores co on co.id = e.colaborador_evaluado_id where et.id = evaluacion_tarea_id and co.empresa_id = fn_mi_empresa_id()) and fn_mi_rol() = 'admin_th');
create policy "respuestas: escribo las mias" on respuestas_evaluacion for insert
  with check (exists(select 1 from evaluacion_tareas et where et.id = evaluacion_tarea_id and et.evaluador_colaborador_id = fn_mi_colaborador_id()));
create policy "respuestas: edito las mias antes del cierre" on respuestas_evaluacion for update
  using (exists(select 1 from evaluacion_tareas et where et.id = evaluacion_tarea_id and et.evaluador_colaborador_id = fn_mi_colaborador_id()));
create policy "respuestas: leo las mias propias como evaluador" on respuestas_evaluacion for select
  using (exists(select 1 from evaluacion_tareas et where et.id = evaluacion_tarea_id and et.evaluador_colaborador_id = fn_mi_colaborador_id()));
-- Nota: la agregación por fuente (promedio de pares, etc.) se sirve vía resultados_evaluacion,
-- nunca exponiendo respuestas_evaluacion individuales de terceros al colaborador o al líder.

-- ── SER (Guía del Flow): visible para el propio colaborador, su líder y admin_th
create policy "ser: admin_th todo" on guia_del_flow for all
  using (exists(select 1 from colaboradores co where co.id = colaborador_id and co.empresa_id = fn_mi_empresa_id()) and fn_mi_rol() = 'admin_th');
create policy "ser: propio colaborador administra la suya" on guia_del_flow for all
  using (colaborador_id = fn_mi_colaborador_id());
create policy "ser: lider ve la de su equipo" on guia_del_flow for select
  using (fn_es_mi_equipo(colaborador_id));

-- ── SABER: verificado por admin_th/lider, visible para el propio colaborador
create policy "saber: admin_th todo" on verificaciones_saber for all
  using (exists(select 1 from colaboradores co where co.id = colaborador_id and co.empresa_id = fn_mi_empresa_id()) and fn_mi_rol() = 'admin_th');
create policy "saber: lider certifica su equipo" on verificaciones_saber for all
  using (fn_es_mi_equipo(colaborador_id));
create policy "saber: colaborador ve la propia" on verificaciones_saber for select
  using (colaborador_id = fn_mi_colaborador_id());

-- ── PDI: colaborador + líder + admin_th, todos pueden ver y actualizar estado
create policy "pdi: admin_th todo" on planes_desarrollo for all
  using (exists(select 1 from colaboradores co where co.id = colaborador_id and co.empresa_id = fn_mi_empresa_id()) and fn_mi_rol() = 'admin_th');
create policy "pdi: lider gestiona el de su equipo" on planes_desarrollo for all
  using (fn_es_mi_equipo(colaborador_id));
create policy "pdi: colaborador ve y actualiza el propio" on planes_desarrollo for select
  using (colaborador_id = fn_mi_colaborador_id());
create policy "pdi: colaborador marca su propio avance" on planes_desarrollo for update
  using (colaborador_id = fn_mi_colaborador_id());

create policy "briefs: admin_th y lider" on briefs_retroalimentacion for select
  using (exists(select 1 from evaluaciones e where e.id = evaluacion_id and (fn_es_mi_equipo(e.colaborador_evaluado_id) or fn_mi_rol() = 'admin_th')));

create policy "acuerdos: partes involucradas" on acuerdos_crecimiento for all
  using (exists(select 1 from evaluaciones e where e.id = evaluacion_id and (fn_es_mi_equipo(e.colaborador_evaluado_id) or e.colaborador_evaluado_id = fn_mi_colaborador_id() or fn_mi_rol() = 'admin_th')));

-- ── ALERTAS: admin_th todo | lider las de su equipo | colaborador las propias
create policy "alertas: admin_th todo" on alertas for all
  using (empresa_id = fn_mi_empresa_id() and fn_mi_rol() = 'admin_th');
create policy "alertas: lider ve las de su equipo" on alertas for select
  using (fn_es_mi_equipo(colaborador_id));
create policy "alertas: colaborador ve las propias" on alertas for select
  using (colaborador_id = fn_mi_colaborador_id());

create policy "notificaciones: cada quien ve las suyas" on notificaciones for select
  using (destinatario_usuario_id = auth.uid());
create policy "notificaciones: admin_th todo" on notificaciones for all
  using (fn_mi_rol() = 'admin_th');

-- ── NEXA: feed y cursos visibles para toda la empresa; edición admin_th ────
create policy "nexa_feed: lectura empresa" on nexa_feed_publicaciones for select using (empresa_id = fn_mi_empresa_id());
create policy "nexa_feed: admin_th publica" on nexa_feed_publicaciones for insert with check (empresa_id = fn_mi_empresa_id() and fn_mi_rol() in ('admin_th','lider'));
create policy "nexa_feed: autor edita lo propio" on nexa_feed_publicaciones for update using (autor_id = auth.uid() or fn_mi_rol() = 'admin_th');
create policy "nexa_reacciones: todos reaccionan" on nexa_feed_reacciones for all using (usuario_id = auth.uid());

create policy "nexa_cursos: lectura empresa" on nexa_cursos for select using (empresa_id = fn_mi_empresa_id());
create policy "nexa_cursos: admin_th administra" on nexa_cursos for all using (empresa_id = fn_mi_empresa_id() and fn_mi_rol() = 'admin_th');
create policy "nexa_rutas_cargo: lectura empresa" on nexa_rutas_por_cargo for select
  using (exists(select 1 from cargos c where c.id = cargo_id and c.empresa_id = fn_mi_empresa_id()));
create policy "nexa_rutas_cargo: admin_th administra" on nexa_rutas_por_cargo for all
  using (fn_mi_rol() = 'admin_th' and exists(select 1 from cargos c where c.id = cargo_id and c.empresa_id = fn_mi_empresa_id()));

create policy "nexa_rutas_formacion: admin_th todo" on nexa_rutas_formacion for all
  using (exists(select 1 from colaboradores co where co.id = colaborador_id and co.empresa_id = fn_mi_empresa_id()) and fn_mi_rol() = 'admin_th');
create policy "nexa_rutas_formacion: lider ve la de su equipo" on nexa_rutas_formacion for select
  using (fn_es_mi_equipo(colaborador_id) or colaborador_id = fn_mi_colaborador_id());
create policy "nexa_rutas_formacion: colaborador actualiza su avance" on nexa_rutas_formacion for update
  using (colaborador_id = fn_mi_colaborador_id());

create policy "nexa_simulacros: lectura empresa" on nexa_simulacros for select using (empresa_id = fn_mi_empresa_id());
create policy "nexa_simulacros: admin_th administra" on nexa_simulacros for all using (empresa_id = fn_mi_empresa_id() and fn_mi_rol() = 'admin_th');
create policy "nexa_simulacro_participantes: visible por equipo" on nexa_simulacro_participantes for select
  using (fn_es_mi_equipo(colaborador_id) or colaborador_id = fn_mi_colaborador_id() or fn_mi_rol() = 'admin_th');

create policy "nexa_insignias: lectura empresa" on nexa_insignias for select using (empresa_id = fn_mi_empresa_id());
create policy "nexa_reconocimientos: lectura empresa" on nexa_reconocimientos for select
  using (exists(select 1 from colaboradores co where co.id = colaborador_id and co.empresa_id = fn_mi_empresa_id()));
create policy "nexa_reconocimientos: admin_th y lider otorgan" on nexa_reconocimientos for insert
  with check (fn_mi_rol() in ('admin_th','lider'));

create policy "nexa_asistente: cada quien ve su historial" on nexa_asistente_conversaciones for all
  using (usuario_id = auth.uid());

create policy "nexa_directorio: lectura empresa" on nexa_directorio_aliados for select using (empresa_id = fn_mi_empresa_id());
create policy "nexa_directorio: admin_th administra" on nexa_directorio_aliados for all using (empresa_id = fn_mi_empresa_id() and fn_mi_rol() = 'admin_th');
