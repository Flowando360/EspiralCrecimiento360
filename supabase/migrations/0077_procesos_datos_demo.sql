-- ============================================================================
-- 0077_procesos_datos_demo.sql
-- Datos ficticios para demostrar el módulo de Gestión de Procesos (Bloques 1
-- y 2 + Gestión documental) en la empresa piloto Flow, Nexus y Visión. Datos
-- inventados a pedido del cliente para poder mostrar el módulo funcionando,
-- salvo el proceso "Gestión de Desarrollo Organizacional" (PE-3), cuyo
-- contenido de caracterización viene tal cual de la plantilla real del
-- cliente (C-DO-01 Gestión de desarrollo organizacional.pptx).
--
-- Todas las referencias a colaboradores (responsable, solicitante, aprobador,
-- confirmaciones de lectura) se resuelven con subconsultas dinámicas contra
-- la tabla colaboradores en vez de UUID fijos, porque este seed no carga
-- colaboradores (se restauran aparte desde la base real anonimizada) — así
-- el script no falla sin importar cuántos colaboradores existan al momento
-- de aplicarlo.
-- ============================================================================

-- ── Bloque 1: Mapa de procesos (10 procesos, 3 Estratégicos + 4 Misionales + 3 Apoyo) ──

insert into procesos_gestion (id, empresa_id, area_proceso, nombre, tipo, codigo, objetivo, descripcion, version, estado, fecha_actualizacion) values
('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Dirección', 'Direccionamiento Estratégico', 'estrategico', 'PE-1', 'Definir, comunicar y hacer seguimiento a la estrategia, objetivos y metas de la organización, garantizando la toma de decisiones basada en datos.', 'Incluye la planeación estratégica anual, el mapa estratégico y la revisión periódica de indicadores de gestión de toda la organización.', 'v001', 'vigente', current_date),
('20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Dirección', 'Gestión de Alianzas y Relacionamiento', 'estrategico', 'PE-2', 'Identificar, negociar y mantener alianzas estratégicas con clientes, aliados y proveedores clave que amplíen el alcance e impacto de la organización.', 'Cubre la gestión del directorio de aliados y el relacionamiento con clientes corporativos.', 'v001', 'vigente', current_date),
('20000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Desarrollo Organizacional', 'Gestión de Desarrollo Organizacional', 'estrategico', 'PE-3', 'Documentar y mejorar continuamente los procesos de la organización, desarrollar el talento del equipo y garantizar condiciones de trabajo seguras, asegurando que la organización opere con calidad, eficiencia y un equipo competente y protegido.', 'Proceso dueño del Sistema de Gestión de Calidad y del SG-SST — desde la identificación de una necesidad de mejora, brecha de competencia o activación del cronograma SST, hasta la mejora implementada y documentada, el plan de desarrollo del equipo o el requerimiento SST atendido con evidencia archivada y equipo informado.', 'v001', 'vigente', '2026-08-31'),
('20000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'Talento Humano', 'Gestión del Talento Humano', 'misional', 'PM-1', 'Atraer, desarrollar, evaluar y retener el talento de la organización a través del ciclo completo de Encuentros de Crecimiento 360°.', 'Corazón del Espiral de Crecimiento: colaboradores, dimensiones, ciclos, PDI y organigrama.', 'v001', 'vigente', current_date),
('20000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'Formación', 'Formación y Desarrollo', 'misional', 'PM-2', 'Cerrar las brechas de competencias identificadas y fortalecer la cultura organizacional a través de formación continua y contenidos de Nexa.', 'Incluye cursos, SST, cuaderno de aprendizaje y simulacros.', 'v001', 'vigente', current_date),
('20000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', 'Reclutamiento', 'Reclutamiento y Selección', 'misional', 'PM-3', 'Cubrir las vacantes de la organización con el talento idóneo, en el tiempo y con el perfil requerido por cada cargo.', null, 'v001', 'vigente', current_date),
('20000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000001', 'Bienestar', 'Bienestar y Cultura Organizacional', 'misional', 'PM-4', 'Fortalecer el clima organizacional, el sentido de pertenencia y el reconocimiento entre los colaboradores.', null, 'v001', 'en_definicion', current_date),
('20000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000001', 'Administrativo', 'Gestión Administrativa y Financiera', 'apoyo', 'PA-1', 'Garantizar los recursos financieros, administrativos y de infraestructura que la operación necesita.', null, 'v001', 'vigente', current_date),
('20000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000001', 'Tecnología', 'Gestión Tecnológica', 'apoyo', 'PA-2', 'Administrar la plataforma Espiral de Crecimiento 360° y demás herramientas tecnológicas, garantizando su disponibilidad y seguridad.', null, 'v001', 'vigente', current_date),
('20000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', 'Dotación', 'Gestión de Dotación y Recursos', 'apoyo', 'PA-3', 'Entregar y hacer seguimiento a la dotación e implementos de trabajo que cada colaborador requiere según su cargo.', null, 'v001', 'vigente', current_date)
on conflict (id) do nothing;

insert into proceso_marcos_normativos (proceso_id, marco_normativo) values
('20000000-0000-0000-0000-000000000001', 'interno'),
('20000000-0000-0000-0000-000000000002', 'interno'),
('20000000-0000-0000-0000-000000000003', 'iso_9001'),
('20000000-0000-0000-0000-000000000003', 'sst'),
('20000000-0000-0000-0000-000000000003', 'interno'),
('20000000-0000-0000-0000-000000000004', 'iso_9001'),
('20000000-0000-0000-0000-000000000004', 'interno'),
('20000000-0000-0000-0000-000000000005', 'sst'),
('20000000-0000-0000-0000-000000000005', 'interno'),
('20000000-0000-0000-0000-000000000006', 'interno'),
('20000000-0000-0000-0000-000000000006', 'sarlaft_sagrilaft'),
('20000000-0000-0000-0000-000000000007', 'interno'),
('20000000-0000-0000-0000-000000000008', 'iso_9001'),
('20000000-0000-0000-0000-000000000008', 'sarlaft_sagrilaft'),
('20000000-0000-0000-0000-000000000009', 'iso_9001'),
('20000000-0000-0000-0000-000000000010', 'sst')
on conflict do nothing;

-- Interacciones (generan las flechas del mapa automáticamente)
insert into interacciones_proceso (proceso_origen_id, proceso_destino_id, tipo, descripcion) values
('20000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000003', 'entrada', 'Entrega lineamientos estratégicos y objetivos del período'),
('20000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000004', 'entrada', 'Entrega perfiles de cargo actualizados y plan de mejora continua'),
('20000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000005', 'entrada', 'Entrega brechas de competencias identificadas en los Encuentros de Crecimiento'),
('20000000-0000-0000-0000-000000000006', '20000000-0000-0000-0000-000000000004', 'entrada', 'Entrega colaboradores seleccionados listos para ingreso'),
('20000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000006', 'entrada', 'Entrega necesidad de personal / vacante aprobada'),
('20000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000006', 'apoyo', 'Verifica cumplimiento de requisitos legales y SST en el proceso de selección'),
('20000000-0000-0000-0000-000000000008', '20000000-0000-0000-0000-000000000004', 'apoyo', 'Aprueba presupuesto de nómina y beneficios'),
('20000000-0000-0000-0000-000000000009', '20000000-0000-0000-0000-000000000004', 'apoyo', 'Provee y mantiene la plataforma Espiral de Crecimiento 360°'),
('20000000-0000-0000-0000-000000000010', '20000000-0000-0000-0000-000000000006', 'apoyo', 'Entrega kit de dotación a colaboradores nuevos'),
('20000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000007', 'entrada', 'Entrega resultados de clima organizacional por equipo'),
('20000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', 'entrada', 'Entrega oportunidades de alianzas con impacto estratégico'),
('20000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000008', 'apoyo', 'Audita procesos administrativos y financieros')
on conflict do nothing;

-- ── Bloque 2: Caracterización (SIPOC) ──────────────────────────────────────

-- PE-3 Gestión de Desarrollo Organizacional — contenido real de la plantilla
-- C-DO-01 del cliente, adaptado de "la Fundación" a "la organización".
insert into elementos_proceso (proceso_id, tipo, descripcion, orden) values
('20000000-0000-0000-0000-000000000003', 'entrada', 'Notas de reuniones y entrevistas de levantamiento de procesos', 1),
('20000000-0000-0000-0000-000000000003', 'entrada', 'Indicadores de gestión', 2),
('20000000-0000-0000-0000-000000000003', 'entrada', 'Documentación existente', 3),
('20000000-0000-0000-0000-000000000003', 'entrada', 'Necesidades de formación identificadas', 4),
('20000000-0000-0000-0000-000000000003', 'entrada', 'Cronograma anual de actividades SST', 5),
('20000000-0000-0000-0000-000000000003', 'entrada', 'Resultados de exámenes laborales y reportes de incidentes', 6),
('20000000-0000-0000-0000-000000000003', 'actividad', 'Planear ciclo SGC, TH y cronograma SST', 1),
('20000000-0000-0000-0000-000000000003', 'actividad', 'Construir y actualizar perfiles de cargo', 2),
('20000000-0000-0000-0000-000000000003', 'actividad', 'Ejecutar actividades y documentación SST', 3),
('20000000-0000-0000-0000-000000000003', 'actividad', 'Aplicar evaluación de desempeño', 4),
('20000000-0000-0000-0000-000000000003', 'actividad', 'Levantar y documentar procesos', 5),
('20000000-0000-0000-0000-000000000003', 'actividad', 'Actualizar, corregir y definir planes de acción', 6),
('20000000-0000-0000-0000-000000000003', 'actividad', 'Capacitar y desarrollar al equipo', 7),
('20000000-0000-0000-0000-000000000003', 'actividad', 'Auditar procesos y verificar cumplimiento SST', 8),
('20000000-0000-0000-0000-000000000003', 'actividad', 'Revisar brechas y efectividad del plan de capacitación', 9),
('20000000-0000-0000-0000-000000000003', 'salida', 'Mapa de procesos y su documentación', 1),
('20000000-0000-0000-0000-000000000003', 'salida', 'Plan de mejora continua', 2),
('20000000-0000-0000-0000-000000000003', 'salida', 'Perfiles de cargo', 3),
('20000000-0000-0000-0000-000000000003', 'salida', 'Evaluaciones de desempeño aplicadas', 4),
('20000000-0000-0000-0000-000000000003', 'salida', 'Plan de desarrollo y capacitación', 5),
('20000000-0000-0000-0000-000000000003', 'salida', 'Cronograma SST ejecutado con evidencias archivadas', 6),
('20000000-0000-0000-0000-000000000003', 'salida', 'Documentación del SG-SST vigente y actualizada', 7),

-- Resto de procesos: caracterización abreviada (ficticia)
('20000000-0000-0000-0000-000000000001', 'entrada', 'Análisis del entorno y resultados del período anterior', 1),
('20000000-0000-0000-0000-000000000001', 'actividad', 'Definir objetivos y mapa estratégico', 1),
('20000000-0000-0000-0000-000000000001', 'actividad', 'Revisar indicadores en comité de gerencia', 2),
('20000000-0000-0000-0000-000000000001', 'salida', 'Objetivos y metas del período aprobados', 1),

('20000000-0000-0000-0000-000000000002', 'entrada', 'Oportunidades de alianza identificadas', 1),
('20000000-0000-0000-0000-000000000002', 'actividad', 'Negociar y formalizar convenios con aliados', 1),
('20000000-0000-0000-0000-000000000002', 'salida', 'Convenios y alianzas vigentes', 1),

('20000000-0000-0000-0000-000000000004', 'entrada', 'Perfiles de cargo y plan de mejora continua', 1),
('20000000-0000-0000-0000-000000000004', 'actividad', 'Ejecutar ciclos de Encuentros de Crecimiento 360°', 1),
('20000000-0000-0000-0000-000000000004', 'actividad', 'Elaborar y hacer seguimiento a Planes de Desarrollo Individual', 2),
('20000000-0000-0000-0000-000000000004', 'salida', 'Evaluaciones 360° y PDI cerrados', 1),

('20000000-0000-0000-0000-000000000005', 'entrada', 'Brechas de competencias identificadas', 1),
('20000000-0000-0000-0000-000000000005', 'actividad', 'Diseñar y publicar cursos en Nexa', 1),
('20000000-0000-0000-0000-000000000005', 'salida', 'Colaboradores certificados y cursos completados', 1),

('20000000-0000-0000-0000-000000000006', 'entrada', 'Vacante aprobada con perfil del cargo', 1),
('20000000-0000-0000-0000-000000000006', 'actividad', 'Publicar vacante, filtrar y entrevistar candidatos', 1),
('20000000-0000-0000-0000-000000000006', 'salida', 'Candidato seleccionado listo para ingreso', 1),

('20000000-0000-0000-0000-000000000007', 'entrada', 'Resultados de clima organizacional', 1),
('20000000-0000-0000-0000-000000000007', 'actividad', 'Planear actividades de bienestar y reconocimientos', 1),
('20000000-0000-0000-0000-000000000007', 'salida', 'Plan de bienestar ejecutado', 1),

('20000000-0000-0000-0000-000000000008', 'entrada', 'Presupuesto anual y necesidades de las áreas', 1),
('20000000-0000-0000-0000-000000000008', 'actividad', 'Ejecutar y controlar el presupuesto', 1),
('20000000-0000-0000-0000-000000000008', 'salida', 'Estados financieros y presupuesto ejecutado', 1),

('20000000-0000-0000-0000-000000000009', 'entrada', 'Requerimientos funcionales de los módulos', 1),
('20000000-0000-0000-0000-000000000009', 'actividad', 'Administrar y dar soporte a la plataforma', 1),
('20000000-0000-0000-0000-000000000009', 'salida', 'Plataforma disponible, segura y actualizada', 1),

('20000000-0000-0000-0000-000000000010', 'entrada', 'Solicitud de dotación por cargo', 1),
('20000000-0000-0000-0000-000000000010', 'actividad', 'Entregar dotación y registrar el acta', 1),
('20000000-0000-0000-0000-000000000010', 'salida', 'Colaborador dotado con acta firmada', 1)
on conflict do nothing;

-- ── Gestión documental ──────────────────────────────────────────────────────

insert into documentos_proceso (id, proceso_id, codigo, nombre, tipo_documento, version_vigente, estado, requiere_confirmacion, created_at) values
('21000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000003', 'GC-PO-001', 'Procedimiento Gestión Documental', 'procedimiento', 'v002', 'vigente', true, now() - interval '90 days'),
('21000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000003', 'GC-PL-002', 'Política de Gestión de Riesgos y Oportunidades', 'politica', 'v001', 'vigente', true, now() - interval '60 days'),
('21000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000003', 'GC-MT-005', 'Matriz de Riesgos y Oportunidades', 'formato', 'v001', 'vigente', false, now() - interval '60 days'),
('21000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000004', 'PM1-PO-001', 'Procedimiento de Encuentros de Crecimiento 360°', 'procedimiento', 'v001', 'vigente', true, now() - interval '30 days'),
('21000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000006', 'PM3-IN-001', 'Instructivo de Entrevista de Selección', 'instructivo', 'v001', 'vigente', false, now() - interval '10 days')
on conflict (id) do nothing;

-- Historial: GC-PO-001 tuvo una v001 previa, archivada al aprobar la v002
insert into documentos_historial_version (documento_id, version, archivo_url, resumen_cambio, fecha) values
('21000000-0000-0000-0000-000000000001', 'v001', '00000000-0000-0000-0000-000000000001/obsoletos/gc-po-001-v001.pdf', 'Versión inicial del procedimiento, antes de incluir el flujo de aprobación dentro de la plataforma.', now() - interval '90 days');

-- Solicitudes en distintos estados del flujo
insert into solicitudes_documento (proceso_id, documento_id, tipo_solicitud, archivo_propuesto_url, justificacion, estado, fecha_solicitud, fecha_resolucion, comentarios_aprobador) values
('20000000-0000-0000-0000-000000000003', '21000000-0000-0000-0000-000000000001', 'actualizar', '00000000-0000-0000-0000-000000000001/borradores/gc-po-001-v002-borrador.pdf', 'Se actualiza para incluir el flujo de aprobación y difusión dentro de Espiral de Crecimiento 360°.', 'aprobado', now() - interval '91 days', now() - interval '90 days', 'Aprobado. Publicar como v002 y archivar la v001.'),
('20000000-0000-0000-0000-000000000004', null, 'crear', '00000000-0000-0000-0000-000000000001/borradores/pm1-fo-002-borrador.pdf', 'Formato para registrar acuerdos de la reunión de retroalimentación del Encuentro de Crecimiento.', 'pendiente', now() - interval '2 days', null, null);

insert into solicitudes_documento (proceso_id, documento_id, tipo_solicitud, nombre_documento, tipo_documento, justificacion, estado, fecha_solicitud) values
('20000000-0000-0000-0000-000000000004', null, 'crear', 'Formato Acuerdos de Retroalimentación', 'formato', 'Formato para registrar acuerdos de la reunión de retroalimentación del Encuentro de Crecimiento.', 'pendiente', now() - interval '2 days');

-- Confirmaciones de lectura del documento más crítico (GC-PO-001), tomando
-- dinámicamente hasta 3 colaboradores activos que existan al aplicar este
-- script — sin depender de IDs fijos que este seed no controla.
insert into confirmaciones_lectura (documento_id, colaborador_id, confirmado_at)
select '21000000-0000-0000-0000-000000000001', c.id, now() - interval '85 days' + (row_number() over (order by c.nombre_completo)) * interval '1 day'
from colaboradores c
where c.empresa_id = '00000000-0000-0000-0000-000000000001' and c.estado = 'activo'
order by c.nombre_completo
limit 3
on conflict do nothing;
