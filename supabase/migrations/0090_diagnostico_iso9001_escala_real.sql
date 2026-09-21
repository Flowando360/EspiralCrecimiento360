-- ============================================================================
-- 0090_diagnostico_iso9001_escala_real.sql
-- Ajusta el Diagnóstico ISO 9001 a la metodología real de Diana (carpeta
-- Documentos/Diagnostico ISO 9001.xlsx), que es más rica que la genérica que
-- se había construido sin ese archivo:
--   - Escala de 5 niveles (1 / 0.75 / 0.5 / 0.25 / 0), no 4.
--   - Los pesos por cláusula (4=10%, 5=15%, 6=15%, 7=15%, 8=25% "corazón del
--     SGC", 9=15%, 10=5%) viven en código (src/lib/calculos/diagnostico-iso9001.ts),
--     no en esta tabla — son fijos por la norma, no configurables por empresa.
--   - La guía de cada numeral se enriquece con "qué información pedir" +
--     "cómo debe estar para cumplir", tomado literalmente de su hoja "Encuesta".
--
-- Escrita para poder correrse más de una vez sin error: el ALTER de
-- constraint usa DROP + ADD (no hay "IF NOT EXISTS" para constraints check
-- con nombre autogenerado, así que se nombra explícitamente), y las
-- actualizaciones de datos son UPDATE simples (idempotentes por naturaleza).
-- ============================================================================

-- Migra las respuestas ya guardadas con la escala vieja (4 niveles) a la
-- nueva (5 niveles) antes de cambiar el constraint, para no dejar filas
-- inválidas: "cumple" -> "cumple_completamente", "cumple_parcial" ->
-- "cumple_parcialmente". "no_cumple" y "no_aplica" se llaman igual en ambas.
update diagnostico_iso9001_respuestas set nivel = 'cumple_completamente' where nivel = 'cumple';
update diagnostico_iso9001_respuestas set nivel = 'cumple_parcialmente' where nivel = 'cumple_parcial';

alter table diagnostico_iso9001_respuestas drop constraint if exists diagnostico_iso9001_respuestas_nivel_check;
alter table diagnostico_iso9001_respuestas add constraint diagnostico_iso9001_respuestas_nivel_check
  check (nivel in ('no_cumple', 'cumple_minimamente', 'en_desarrollo', 'cumple_parcialmente', 'cumple_completamente', 'no_aplica'));

comment on column diagnostico_iso9001_respuestas.nivel is 'Escala real de 5 niveles de Diana: no_cumple(0) / cumple_minimamente(0.25) / en_desarrollo(0.5) / cumple_parcialmente(0.75) / cumple_completamente(1) / no_aplica(excluido del promedio).';

-- ── Guía enriquecida por numeral: "qué información pedir" + "cómo debe
-- estar para cumplir", tomado de la hoja "Encuesta" de su Excel real ──

update diagnostico_iso9001_items set guia = 'Qué pedir: documento o análisis donde se identifiquen factores internos y externos que afectan al negocio (ej. DOFA, PESTEL, matriz de contexto). Para cumplir: debe existir un análisis formal, actualizado y alineado con el negocio.' where numeral = '4.1';
update diagnostico_iso9001_items set guia = 'Qué pedir: listado de clientes, proveedores, entes regulatorios, comunidad, empleados, etc. Para cumplir: partes interesadas identificadas y con sus necesidades/expectativas documentadas.' where numeral = '4.2';
update diagnostico_iso9001_items set guia = 'Qué pedir: documento de alcance (qué incluye/excluye el sistema). Para cumplir: debe estar definido por escrito y justificar exclusiones.' where numeral = '4.3';
update diagnostico_iso9001_items set guia = 'Qué pedir: mapa de procesos, caracterizaciones, interacciones. Para cumplir: procesos identificados, con entradas, salidas, responsables e interacciones claras.' where numeral = '4.4';
update diagnostico_iso9001_items set guia = 'Qué pedir: evidencia de reuniones de dirección, decisiones sobre calidad, recursos asignados. Para cumplir: alta dirección involucrada, con evidencias de liderazgo y comunicación sobre la calidad.' where numeral = '5.1';
update diagnostico_iso9001_items set guia = 'Qué pedir: política escrita y difundida. Para cumplir: debe estar aprobada, comunicada y entendida por el personal.' where numeral = '5.2';
update diagnostico_iso9001_items set guia = 'Qué pedir: organigrama, descripciones de cargo, actas de asignación de funciones. Para cumplir: roles definidos y comunicados, con responsabilidades claras relacionadas con la calidad.' where numeral = '5.3';
update diagnostico_iso9001_items set guia = 'Qué pedir: matriz de riesgos y oportunidades. Para cumplir: documentada, evaluada, con planes de acción, relacionada con la operación real del negocio.' where numeral = '6.1';
update diagnostico_iso9001_items set guia = 'Qué pedir: listado de objetivos medibles. Para cumplir: deben ser SMART, medibles y con indicadores de seguimiento, sincronizados con la política.' where numeral = '6.2';
update diagnostico_iso9001_items set guia = 'Qué pedir: registros de cambios en procesos, infraestructura, personal. Para cumplir: evidencias de planificación previa y comunicación de cambios.' where numeral = '6.3';
update diagnostico_iso9001_items set guia = 'Qué pedir: registros de mantenimiento de activos, equipos, infraestructura, presupuesto de recursos. Para cumplir: disponibilidad de recursos demostrada y gestionada.' where numeral = '7.1';
update diagnostico_iso9001_items set guia = 'Qué pedir: hojas de vida, certificaciones, registros de capacitación. Para cumplir: competencia validada, con planes de capacitación definidos.' where numeral = '7.2';
update diagnostico_iso9001_items set guia = 'Qué pedir: evidencia de inducciones, sensibilizaciones, comunicados internos. Para cumplir: el personal conoce la política, los objetivos y su aporte a la calidad.' where numeral = '7.3';
update diagnostico_iso9001_items set guia = 'Qué pedir: plan de comunicación interna/externa. Para cumplir: canales y mensajes definidos, con evidencias de uso.' where numeral = '7.4';
update diagnostico_iso9001_items set guia = 'Qué pedir: procedimientos, manuales, formatos, registros. Para cumplir: controlados, con codificación, versión vigente identificada y accesibles.' where numeral = '7.5';
update diagnostico_iso9001_items set guia = 'Qué pedir: procedimientos de operación, planes de servicio, protocolos. Para cumplir: documentados y aplicados, con seguimiento a su cumplimiento (no depender de acciones puntuales de una sola persona).' where numeral = '8.1';
update diagnostico_iso9001_items set guia = 'Qué pedir: contratos, órdenes de servicio, requisitos de clientes. Para cumplir: documentados y revisados antes de la aceptación, con gestión de cambios a esos requisitos.' where numeral = '8.2';
update diagnostico_iso9001_items set guia = 'Qué pedir: planes de diseño, proyectos desarrollados. Para cumplir: evidencia de diseño/innovación con controles establecidos. No aplica si la organización no diseña productos/servicios.' where numeral = '8.3';
update diagnostico_iso9001_items set guia = 'Qué pedir: lista de proveedores, criterios de evaluación, evaluaciones periódicas. Para cumplir: evaluados y aprobados con registros actualizados, con criterios claros y evaluación de desempeño periódica.' where numeral = '8.4';
update diagnostico_iso9001_items set guia = 'Qué pedir: registros de control operativo, guías, evidencias de prestación del servicio. Para cumplir: procedimientos seguidos, trazabilidad demostrada.' where numeral = '8.5';
update diagnostico_iso9001_items set guia = 'Qué pedir: registros de verificación antes de entrega (checklist, conformidad del cliente). Para cumplir: evidencia de controles antes de entregar el producto/servicio, con responsables y registros definidos.' where numeral = '8.6';
update diagnostico_iso9001_items set guia = 'Qué pedir: registros de incidentes, reclamos, servicios/productos rechazados. Para cumplir: procedimiento documentado, con acciones tomadas y registradas, y vínculo a acciones correctivas.' where numeral = '8.7';
update diagnostico_iso9001_items set guia = 'Qué pedir: indicadores, reportes de desempeño, satisfacción del cliente. Para cumplir: medidos, analizados y con acciones de mejora derivadas.' where numeral = '9.1';
update diagnostico_iso9001_items set guia = 'Qué pedir: programa anual, planes de auditoría, informes, registros. Para cumplir: auditorías realizadas periódicamente, con seguimiento a hallazgos.' where numeral = '9.2';
update diagnostico_iso9001_items set guia = 'Qué pedir: actas de revisión gerencial. Para cumplir: documentadas, con conclusiones y acciones derivadas.' where numeral = '9.3';
update diagnostico_iso9001_items set guia = 'Qué pedir: proyectos de mejora, evidencias de lecciones aprendidas. Para cumplir: acciones tomadas con resultados medibles.' where numeral = '10.1';
update diagnostico_iso9001_items set guia = 'Qué pedir: reportes de no conformidades, planes de acción. Para cumplir: documentados, con análisis de causa raíz y acciones verificadas (ver ACPM).' where numeral = '10.2';
update diagnostico_iso9001_items set guia = 'Qué pedir: evidencias de cambios, innovaciones, optimización de procesos. Para cumplir: acciones comprobables que demuestran progreso en el tiempo.' where numeral = '10.3';
