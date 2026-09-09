-- ============================================================================
-- 0051_ser_privacidad_organizacional.sql
--
-- La Guía del Flow es un regalo íntimo del colaborador: le llega por fuera
-- de este sistema (correo / su espacio personal en guiadelflow). Círculo de
-- Crecimiento NUNCA almacena el PDF ni los aspectos psicológicos/emocionales
-- en crudo — para NINGÚN rol, ni siquiera el propio colaborador, porque su
-- cuenta en este sistema también es un vector de compromiso (admin_th u otro
-- admin podría acceder a ella). De los 30 aspectos que mide la Guía, 12 son
-- de naturaleza psicológica/íntima (infancia, pasado, frustración,
-- estabilidad emocional, felicidad, dependencia, pertenencia, etapa de vida,
-- retos internos, sanación, integración, "mente faro") y quedan fuera por
-- completo. Los otros 18 (talentos, propósito, liderazgo, comunicación,
-- trabajo en equipo, etc.) sí tienen relevancia laboral y son el único
-- insumo permitido para los informes que este sistema genera:
--   - guia_del_flow.informe_colaborador — autoconocimiento/desarrollo propio
--   - guia_del_flow.informe_lider       — enfoque de PDI para líder/admin_th
-- Ambos se sintetizan con IA (código de la app), nunca son texto copiado.
--
-- Hasta hoy (0014_ser_aspectos_puntajes.sql) líder y admin_th podían ver el
-- PDF completo y los 30 puntajes en crudo sin ninguna distinción — esta
-- migración corrige esa fuga y retira el PDF del sistema por completo.
-- ============================================================================

-- ── Marca de sensibilidad en el catálogo ────────────────────────────────────
alter table ser_aspectos add column sensible boolean not null default false;

comment on column ser_aspectos.sensible is 'true = aspecto psicológico/emocional íntimo. Nunca se lee ni se escribe en ser_puntajes/ser_comentarios_colaborador para estos aspectos, para ningún rol — bloqueado a nivel de RLS, no solo de UI.';

update ser_aspectos set sensible = true where nombre in (
  'Ecos infancia',
  'El pasado',
  'Tolerancia a la frustración',
  'Estabilidad emocional',
  'Felicidad',
  'Dependencia',
  'Pertenencia',
  'Etapa del Flow',
  'Retos internos',
  'Desafíos de sanación',
  'Balance',
  'Tu mente faro'
);

-- ── Dos informes sintetizados, ninguno es el documento crudo ───────────────
alter table guia_del_flow add column informe_colaborador text;
alter table guia_del_flow add column informe_colaborador_generado_at timestamptz;
alter table guia_del_flow add column informe_lider text;
alter table guia_del_flow add column informe_lider_generado_at timestamptz;

comment on column guia_del_flow.informe_colaborador is 'Narrativa generada por IA, solo desde los 18 aspectos no sensibles, en tono de autoconocimiento/desarrollo propio. Esto es lo que ve el colaborador en Espiral de Crecimiento — su Guía del Flow real le llega por fuera del sistema.';
comment on column guia_del_flow.informe_lider is 'Narrativa generada por IA, solo desde los 18 aspectos no sensibles, en tono de enfoque de PDI. Esto es lo único que ven líder y admin_th — nunca el PDF ni el desglose de aspectos.';

-- ── ser_puntajes: NADIE lee/escribe aspectos sensibles, ningún rol ─────────
drop policy "ser_puntajes: admin_th todo" on ser_puntajes;
create policy "ser_puntajes: admin_th aspectos no sensibles" on ser_puntajes for all
  using (
    exists(
      select 1
      from guia_del_flow g
      join colaboradores co on co.id = g.colaborador_id
      join ser_aspectos a on a.id = aspecto_id
      where g.id = guia_del_flow_id and co.empresa_id = fn_mi_empresa_id() and a.sensible = false
    ) and fn_mi_rol() = 'admin_th'
  );

drop policy "ser_puntajes: colaborador ve el propio" on ser_puntajes;
create policy "ser_puntajes: colaborador ve el propio (no sensibles)" on ser_puntajes for select
  using (
    exists(
      select 1
      from guia_del_flow g
      join ser_aspectos a on a.id = aspecto_id
      where g.id = guia_del_flow_id and g.colaborador_id = fn_mi_colaborador_id() and a.sensible = false
    )
  );

drop policy "ser_puntajes: lider ve el de su equipo" on ser_puntajes;
create policy "ser_puntajes: lider ve el de su equipo (no sensibles)" on ser_puntajes for select
  using (
    exists(
      select 1
      from guia_del_flow g
      join ser_aspectos a on a.id = aspecto_id
      where g.id = guia_del_flow_id and fn_es_mi_equipo(g.colaborador_id) and a.sensible = false
    )
  );

-- ── ser_comentarios_colaborador: mismo criterio, y ya no lo lee nadie más ──
-- (antes: admin_th todo, líder solo lectura — ninguno de los dos lo necesita
-- para enfocar un plan de desarrollo; ver informe_lider/informe_colaborador)
drop policy "ser_comentarios: admin_th todo" on ser_comentarios_colaborador;
drop policy "ser_comentarios: lider ve el de su equipo" on ser_comentarios_colaborador;
drop policy "ser_comentarios: propio colaborador administra el suyo" on ser_comentarios_colaborador;
create policy "ser_comentarios: propio colaborador administra el suyo (no sensibles)" on ser_comentarios_colaborador for all
  using (
    colaborador_id = fn_mi_colaborador_id()
    and (aspecto_id is null or exists(select 1 from ser_aspectos a where a.id = aspecto_id and a.sensible = false))
  );

-- ── Promedio de Ser: solo con aspectos no sensibles ────────────────────────
create or replace view v_ser_promedio as
select
  g.colaborador_id,
  round(avg(sp.puntaje)::numeric, 2) as promedio_ser,
  count(sp.id) as total_aspectos_calificados
from guia_del_flow g
join ser_puntajes sp on sp.guia_del_flow_id = g.id
join ser_aspectos a on a.id = sp.aspecto_id and a.sensible = false
where g.id in (
  select distinct on (colaborador_id) id
  from guia_del_flow
  order by colaborador_id, fecha_aplicacion desc, created_at desc
)
group by g.colaborador_id;

comment on view v_ser_promedio is 'Promedio 1-5 de los aspectos NO sensibles de Ser de la aplicación más reciente de cada colaborador. Usado por el Informe de brechas por dimensión.';

-- ── Storage "guias-flow": queda inerte, el PDF ya no tiene lugar aquí ──────
-- No se borra el bucket (por si queda algún archivo histórico a limpiar a
-- mano más adelante), pero ninguna policy permite ya subir ni leer: la app
-- deja de ofrecer esa función por completo.
drop policy "guias-flow: admin_th sube" on storage.objects;
drop policy "guias-flow: admin_th reemplaza" on storage.objects;
drop policy "guias-flow: lectura de las partes involucradas" on storage.objects;
