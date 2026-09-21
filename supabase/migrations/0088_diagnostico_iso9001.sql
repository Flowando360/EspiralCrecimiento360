-- ============================================================================
-- 0088_diagnostico_iso9001.sql
-- Diagnóstico / autoevaluación de la empresa frente a ISO 9001:2015 — la
-- pieza que quedaba pendiente y bloqueada del módulo de Procesos (Diana
-- había compartido su Excel real "Diagnostico ISO 9001" con Nexus en otra
-- conversación, pero ese archivo no llegó a este repo). Estructura estándar
-- de la norma (numerales 4 a 10, los auditables — 1 a 3 son alcance/
-- referencias/términos, no se evalúan), con la misma escala de 4 niveles
-- que ya usa checklist_cumplimiento (No cumple / Cumple parcial / Cumple /
-- No aplica), para no introducir un lenguaje nuevo en la plataforma.
--
-- Tres piezas:
--   1. diagnostico_iso9001_items: catálogo FIJO y global (no depende de
--      empresa_id) de los 28 numerales evaluables — se siembra una sola vez
--      acá, ninguna empresa lo edita.
--   2. diagnosticos_iso9001: una "corrida" del diagnóstico para una empresa
--      (fecha, responsable, estado).
--   3. diagnostico_iso9001_respuestas: la respuesta a cada ítem dentro de
--      una corrida.
--
-- Escrita con IF NOT EXISTS / DROP POLICY IF EXISTS / ON CONFLICT DO NOTHING
-- para poder correrse más de una vez sin error, igual que las migraciones
-- anteriores del módulo.
-- ============================================================================

create table if not exists diagnostico_iso9001_items (
  id uuid primary key default gen_random_uuid(),
  clausula int not null check (clausula between 4 and 10),
  numeral text not null,
  titulo text not null,
  guia text,
  orden int not null default 0
);

comment on table diagnostico_iso9001_items is 'Catálogo fijo y global de los 28 numerales evaluables de ISO 9001:2015 (clausulas 4-10). No tiene empresa_id: es el mismo catálogo para todas las empresas, sembrado una sola vez por esta migración.';

create unique index if not exists idx_diagnostico_iso9001_items_numeral on diagnostico_iso9001_items(numeral);

create table if not exists diagnosticos_iso9001 (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  fecha date not null default current_date,
  realizado_por uuid references colaboradores(id) on delete set null,
  estado text not null default 'en_progreso' check (estado in ('en_progreso', 'completado')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table diagnosticos_iso9001 is 'Una corrida del diagnóstico/autoevaluación ISO 9001:2015 para una empresa — puede haber varias en el tiempo, para comparar avance.';

create table if not exists diagnostico_iso9001_respuestas (
  id uuid primary key default gen_random_uuid(),
  diagnostico_id uuid not null references diagnosticos_iso9001(id) on delete cascade,
  item_id uuid not null references diagnostico_iso9001_items(id) on delete cascade,
  nivel text check (nivel in ('no_cumple', 'cumple_parcial', 'cumple', 'no_aplica')),
  observacion text,
  updated_at timestamptz not null default now()
);

comment on table diagnostico_iso9001_respuestas is 'Respuesta a un ítem del catálogo dentro de una corrida del diagnóstico. nivel nulo = todavía sin responder.';

create unique index if not exists idx_diagnostico_iso9001_respuestas_unica on diagnostico_iso9001_respuestas(diagnostico_id, item_id);
create index if not exists idx_diagnosticos_iso9001_empresa on diagnosticos_iso9001(empresa_id);

create or replace function fn_tocar_updated_at_diagnostico_iso9001() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_diagnosticos_iso9001_updated_at on diagnosticos_iso9001;
create trigger trg_diagnosticos_iso9001_updated_at
  before update on diagnosticos_iso9001
  for each row execute function fn_tocar_updated_at_diagnostico_iso9001();

alter table diagnostico_iso9001_items enable row level security;
alter table diagnosticos_iso9001 enable row level security;
alter table diagnostico_iso9001_respuestas enable row level security;

drop policy if exists "diagnostico_iso9001_items: lectura autenticados" on diagnostico_iso9001_items;
create policy "diagnostico_iso9001_items: lectura autenticados" on diagnostico_iso9001_items for select
  using (auth.uid() is not null);

drop policy if exists "diagnosticos_iso9001: lectura empresa" on diagnosticos_iso9001;
create policy "diagnosticos_iso9001: lectura empresa" on diagnosticos_iso9001 for select
  using (empresa_id = fn_mi_empresa_id());
drop policy if exists "diagnosticos_iso9001: admin_th administra" on diagnosticos_iso9001;
create policy "diagnosticos_iso9001: admin_th administra" on diagnosticos_iso9001 for all
  using (empresa_id = fn_mi_empresa_id() and fn_mi_rol() = 'admin_th');

drop policy if exists "diagnostico_iso9001_respuestas: lectura empresa" on diagnostico_iso9001_respuestas;
create policy "diagnostico_iso9001_respuestas: lectura empresa" on diagnostico_iso9001_respuestas for select
  using (exists (select 1 from diagnosticos_iso9001 d where d.id = diagnostico_iso9001_respuestas.diagnostico_id and d.empresa_id = fn_mi_empresa_id()));
drop policy if exists "diagnostico_iso9001_respuestas: admin_th administra" on diagnostico_iso9001_respuestas;
create policy "diagnostico_iso9001_respuestas: admin_th administra" on diagnostico_iso9001_respuestas for all
  using (
    fn_mi_rol() = 'admin_th'
    and exists (select 1 from diagnosticos_iso9001 d where d.id = diagnostico_iso9001_respuestas.diagnostico_id and d.empresa_id = fn_mi_empresa_id())
  );

-- ── Catálogo: los 28 numerales evaluables de ISO 9001:2015 ──

insert into diagnostico_iso9001_items (clausula, numeral, titulo, guia, orden) values
(4, '4.1', 'Comprensión de la organización y su contexto', 'Se identifican y monitorean las cuestiones internas y externas (incluido el entorno legal, tecnológico, competitivo, cultural) que afectan la capacidad de la organización de lograr los resultados de su SGC.', 1),
(4, '4.2', 'Comprensión de las necesidades y expectativas de las partes interesadas', 'Se identifican las partes interesadas pertinentes (clientes, colaboradores, proveedores, entidades regulatorias) y sus requisitos, y se hace seguimiento a esa información.', 2),
(4, '4.3', 'Determinación del alcance del SGC', 'El alcance del sistema de gestión está definido por escrito, considera las cuestiones de 4.1/4.2 y los productos/servicios cubiertos, y está disponible como información documentada.', 3),
(4, '4.4', 'Sistema de gestión de la calidad y sus procesos', 'La organización tiene identificados sus procesos, sus interacciones, entradas/salidas esperadas, criterios de control y responsables (mapa de procesos y caracterización).', 4),
(5, '5.1', 'Liderazgo y compromiso', 'La alta dirección demuestra liderazgo activo: rinde cuentas de la eficacia del SGC, integra los requisitos del SGC a los procesos de negocio y promueve el enfoque a procesos y el pensamiento basado en riesgos.', 5),
(5, '5.2', 'Política de la calidad', 'Existe una política de calidad adecuada al propósito de la organización, comunicada y entendida por el personal, disponible para las partes interesadas.', 6),
(5, '5.3', 'Roles, responsabilidades y autoridades', 'Los roles, responsabilidades y autoridades clave del SGC están asignados, comunicados y entendidos en toda la organización (incluye quién reporta el desempeño del SGC a la dirección).', 7),
(6, '6.1', 'Acciones para abordar riesgos y oportunidades', 'La organización identifica y gestiona los riesgos y oportunidades de sus procesos (matriz de riesgos), con acciones proporcionales a su impacto potencial.', 8),
(6, '6.2', 'Objetivos de la calidad y planificación para lograrlos', 'Existen objetivos de calidad medibles, coherentes con la política, con responsable, plazo y recursos asignados, y se hace seguimiento a su cumplimiento.', 9),
(6, '6.3', 'Planificación de los cambios', 'Los cambios al SGC (nuevos procesos, sistemas, estructura) se planifican de forma controlada, evaluando su propósito, consecuencias, integridad del SGC y disponibilidad de recursos antes de implementarlos.', 10),
(7, '7.1', 'Recursos', 'Se determinan y proveen los recursos necesarios (personas, infraestructura, ambiente de trabajo, recursos de seguimiento y medición, conocimientos de la organización) para el SGC.', 11),
(7, '7.2', 'Competencia', 'Se determina la competencia necesaria de las personas que afectan el desempeño del SGC, y se asegura mediante formación, experiencia o educación, con evidencia documentada.', 12),
(7, '7.3', 'Toma de conciencia', 'El personal es consciente de la política de calidad, los objetivos pertinentes, su contribución a la eficacia del SGC y las implicaciones de no cumplir los requisitos.', 13),
(7, '7.4', 'Comunicación', 'Existen comunicaciones internas y externas pertinentes al SGC, definiendo qué, cuándo, a quién y cómo se comunica.', 14),
(7, '7.5', 'Información documentada', 'La información documentada requerida por la norma y por la operación de la organización está controlada: creación, actualización, identificación, aprobación y control de versiones (Gestión documental).', 15),
(8, '8.1', 'Planificación y control operacional', 'Los procesos necesarios para cumplir los requisitos de productos/servicios están planificados, implementados y controlados, con los criterios de aceptación definidos.', 16),
(8, '8.2', 'Requisitos para los productos y servicios', 'Existe comunicación clara con el cliente, se revisan los requisitos antes de comprometerse a entregar (contratos, propuestas) y se gestionan los cambios a esos requisitos.', 17),
(8, '8.3', 'Diseño y desarrollo de productos y servicios', 'Si aplica, el diseño/desarrollo de productos o servicios sigue un proceso planificado, con entradas, controles, salidas y cambios documentados.', 18),
(8, '8.4', 'Control de procesos, productos y servicios suministrados externamente', 'Se evalúan y seleccionan proveedores/contratistas externos con criterios definidos, y se controla lo que ellos entregan cuando afecta la conformidad del producto/servicio final.', 19),
(8, '8.5', 'Producción y provisión del servicio', 'La prestación del servicio/producción se realiza bajo condiciones controladas: identificación y trazabilidad, propiedad del cliente, preservación, actividades posteriores a la entrega.', 20),
(8, '8.6', 'Liberación de los productos y servicios', 'Existen verificaciones planificadas antes de liberar un producto/servicio al cliente, con evidencia de conformidad y de quién autoriza la liberación.', 21),
(8, '8.7', 'Control de las salidas no conformes', 'Las salidas que no cumplen los requisitos se identifican y controlan para prevenir su uso o entrega no intencional, con acciones según la naturaleza de la no conformidad.', 22),
(9, '9.1', 'Seguimiento, medición, análisis y evaluación', 'Se determina qué se necesita medir, con qué métodos y cuándo, incluida la satisfacción del cliente — y esa información se analiza y evalúa (Matriz de indicadores).', 23),
(9, '9.2', 'Auditoría interna', 'Se planifican y ejecutan auditorías internas a intervalos definidos, cubriendo todo el SGC en un ciclo, con criterios objetivos y resultados reportados a la dirección pertinente.', 24),
(9, '9.3', 'Revisión por la dirección', 'La alta dirección revisa el SGC a intervalos planificados, considerando el desempeño, cambios de contexto, eficacia de acciones de riesgos y oportunidades, y sale con decisiones/acciones registradas.', 25),
(10, '10.1', 'Generalidades (mejora)', 'La organización determina y selecciona oportunidades de mejora e implementa las acciones necesarias para cumplir los requisitos del cliente y aumentar su satisfacción.', 26),
(10, '10.2', 'No conformidad y acción correctiva', 'Ante una no conformidad, se reacciona, se evalúa la necesidad de eliminar la causa raíz (no solo el síntoma), se implementa la acción y se verifica su eficacia (ACPM con ciclo completo).', 27),
(10, '10.3', 'Mejora continua', 'La organización mejora continuamente la conveniencia, adecuación y eficacia del SGC, considerando los resultados del análisis/evaluación y de la revisión por la dirección.', 28)
on conflict (numeral) do nothing;
