-- ============================================================================
-- seed.sql — Datos de arranque para Flow, Nexus y Visión (copia de
-- demostración de Espiral de Crecimiento 360°, con datos ficticios).
-- Carga: empresa, escala de 5 niveles, 9 competencias con criterios,
-- cargo de referencia (Auxiliar de Inventarios) y el organigrama base.
-- Los colaboradores NO se cargan aquí: se restauran aparte desde la base
-- real, con nombres y datos de contacto ya anonimizados (ver informe de la
-- copia). Ejecutar con: supabase db reset  (aplica migraciones + este seed)
-- ============================================================================

-- ── Empresa ─────────────────────────────────────────────────────────────────
insert into empresas (id, nombre, slug, color_marca, fecha_fundacion, nit, direccion, telefono, firmante_nombre, firmante_cargo)
values ('00000000-0000-0000-0000-000000000001', 'Flow, Nexus y Visión', 'flow-nexus-vision', '#16a34a', '2015-01-01', '900123456-7', 'Calle 10 # 40-25, Medellín', '3000000000', 'Camila Restrepo Vélez', 'Directora de Desarrollo Organizacional y Talento Humano');

-- ── Escala de 5 niveles (idéntica al Espiral de Crecimiento original) ──────
insert into escala_niveles (empresa_id, nivel, etiqueta, descripcion_general) values
('00000000-0000-0000-0000-000000000001', 5, 'Referente', 'Supera constantemente las expectativas. Es ejemplo para otros, genera impacto positivo y contribuye activamente al crecimiento de la organización.'),
('00000000-0000-0000-0000-000000000001', 4, 'Destacado', 'Cumple de manera consistente los objetivos y comportamientos esperados. Aporta valor adicional en algunas situaciones.'),
('00000000-0000-0000-0000-000000000001', 3, 'Esperado', 'Cumple adecuadamente con las responsabilidades y comportamientos requeridos para su cargo.'),
('00000000-0000-0000-0000-000000000001', 2, 'En Desarrollo', 'Presenta oportunidades importantes de mejora. Requiere acompañamiento y seguimiento frecuente.'),
('00000000-0000-0000-0000-000000000001', 1, 'Crítico', 'No cumple con las expectativas del cargo o presenta comportamientos que afectan los resultados, el equipo o la cultura.');

-- ── Las 9 competencias (5 Hacer + 4 Deber) ─────────────────────────────────
insert into competencias (id, empresa_id, dimension, nombre, descripcion_que_evalua, solo_con_personal_a_cargo, peso_relativo, orden) values
('10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001','hacer','Resultados','Cumplimiento de indicadores (KPI), metas, objetivos del período y contribución al Mapa Estratégico.', false, 2.0, 1),
('10000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000001','hacer','Puntualidad','Cumplimiento oportuno de tareas, compromisos, entregables y reuniones.', false, 1.0, 2),
('10000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000001','hacer','Estrategia','Comprensión y alineación con el direccionamiento estratégico, la cultura y los valores.', false, 1.0, 3),
('10000000-0000-0000-0000-000000000004','00000000-0000-0000-0000-000000000001','hacer','Autogestión','Organización personal, manejo del tiempo, autonomía y disciplina.', false, 1.0, 4),
('10000000-0000-0000-0000-000000000005','00000000-0000-0000-0000-000000000001','hacer','Liderazgo','Capacidad para orientar, desarrollar y movilizar al equipo. Solo aplica a cargos con personal a cargo.', true, 1.0, 5),
('10000000-0000-0000-0000-000000000006','00000000-0000-0000-0000-000000000001','deber','Trabajo en Equipo','Colaboración, cooperación, comunicación y construcción de relaciones positivas.', false, 1.0, 6),
('10000000-0000-0000-0000-000000000007','00000000-0000-0000-0000-000000000001','deber','Compromiso','Responsabilidad, cumplimiento de compromisos y sentido de pertenencia.', false, 1.0, 7),
('10000000-0000-0000-0000-000000000008','00000000-0000-0000-0000-000000000001','deber','Calidez Humana','Empatía, respeto, trato cordial, integridad y escucha activa.', false, 1.0, 8),
('10000000-0000-0000-0000-000000000009','00000000-0000-0000-0000-000000000001','deber','Actitud de Servicio','Disposición para ayudar, orientación al cliente y búsqueda de soluciones.', false, 1.0, 9);

-- Criterios por nivel para cada competencia (guía de valoración completa)
insert into competencia_criterios (competencia_id, nivel, criterio) values
-- Resultados
('10000000-0000-0000-0000-000000000001',5,'Supera las metas establecidas, genera mejoras adicionales y aporta significativamente al logro estratégico del proceso.'),
('10000000-0000-0000-0000-000000000001',4,'Cumple la mayoría de metas e indicadores establecidos.'),
('10000000-0000-0000-0000-000000000001',3,'Cumple los objetivos esperados para el período.'),
('10000000-0000-0000-0000-000000000001',2,'Cumple parcialmente las metas o presenta desviaciones frecuentes.'),
('10000000-0000-0000-0000-000000000001',1,'No cumple los objetivos ni los compromisos establecidos.'),
-- Puntualidad
('10000000-0000-0000-0000-000000000002',5,'Entrega siempre antes o dentro del plazo acordado.'),
('10000000-0000-0000-0000-000000000002',4,'Presenta retrasos ocasionales sin afectar el resultado.'),
('10000000-0000-0000-0000-000000000002',3,'Cumple normalmente los tiempos establecidos.'),
('10000000-0000-0000-0000-000000000002',2,'Requiere recordatorios o seguimiento frecuente.'),
('10000000-0000-0000-0000-000000000002',1,'Incumple reiteradamente los plazos acordados.'),
-- Estrategia
('10000000-0000-0000-0000-000000000003',5,'Actúa como promotor de la estrategia y la cultura organizacional.'),
('10000000-0000-0000-0000-000000000003',4,'Comprende y aplica adecuadamente la estrategia en su trabajo.'),
('10000000-0000-0000-0000-000000000003',3,'Conoce los objetivos y los incorpora parcialmente en sus actividades.'),
('10000000-0000-0000-0000-000000000003',2,'Presenta dificultades para alinearse a las prioridades organizacionales.'),
('10000000-0000-0000-0000-000000000003',1,'Desconoce o actúa en contravía de la estrategia y la cultura.'),
-- Autogestión
('10000000-0000-0000-0000-000000000004',5,'Trabaja con alta autonomía y excelente organización.'),
('10000000-0000-0000-0000-000000000004',4,'Requiere poca supervisión para cumplir.'),
('10000000-0000-0000-0000-000000000004',3,'Cumple adecuadamente con seguimiento ocasional.'),
('10000000-0000-0000-0000-000000000004',2,'Necesita supervisión frecuente.'),
('10000000-0000-0000-0000-000000000004',1,'Presenta dificultades constantes para organizar y ejecutar su trabajo.'),
-- Liderazgo
('10000000-0000-0000-0000-000000000005',5,'Desarrolla personas, logra resultados sobresalientes, fortalece la cultura y es referente para otros líderes.'),
('10000000-0000-0000-0000-000000000005',4,'Gestiona adecuadamente al equipo, realiza seguimiento y promueve el desarrollo de las personas.'),
('10000000-0000-0000-0000-000000000005',3,'Cumple con las responsabilidades básicas de liderazgo.'),
('10000000-0000-0000-0000-000000000005',2,'Presenta debilidades en la gestión del equipo o el desarrollo de personas.'),
('10000000-0000-0000-0000-000000000005',1,'No logra orientar, desarrollar o movilizar efectivamente a su equipo.'),
-- Trabajo en Equipo
('10000000-0000-0000-0000-000000000006',5,'Promueve activamente el trabajo colaborativo y fortalece al equipo.'),
('10000000-0000-0000-0000-000000000006',4,'Colabora frecuentemente y mantiene relaciones positivas.'),
('10000000-0000-0000-0000-000000000006',3,'Trabaja adecuadamente con los demás.'),
('10000000-0000-0000-0000-000000000006',2,'Presenta dificultades ocasionales para colaborar.'),
('10000000-0000-0000-0000-000000000006',1,'Genera conflictos o afecta negativamente el trabajo conjunto.'),
-- Compromiso
('10000000-0000-0000-0000-000000000007',5,'Actúa como dueño de los procesos y busca constantemente mejorar.'),
('10000000-0000-0000-0000-000000000007',4,'Asume responsabilidades y cumple sus compromisos.'),
('10000000-0000-0000-0000-000000000007',3,'Cumple adecuadamente con lo asignado.'),
('10000000-0000-0000-0000-000000000007',2,'Requiere seguimiento frecuente para cumplir.'),
('10000000-0000-0000-0000-000000000007',1,'Presenta incumplimientos reiterados o falta de interés.'),
-- Calidez Humana
('10000000-0000-0000-0000-000000000008',5,'Genera confianza, respeto y bienestar en quienes lo rodean.'),
('10000000-0000-0000-0000-000000000008',4,'Mantiene relaciones positivas y respetuosas.'),
('10000000-0000-0000-0000-000000000008',3,'Tiene un trato adecuado y cordial.'),
('10000000-0000-0000-0000-000000000008',2,'Presenta dificultades ocasionales en las relaciones interpersonales.'),
('10000000-0000-0000-0000-000000000008',1,'Presenta comportamientos irrespetuosos o inadecuados.'),
-- Actitud de Servicio
('10000000-0000-0000-0000-000000000009',5,'Anticipa necesidades y supera expectativas.'),
('10000000-0000-0000-0000-000000000009',4,'Atiende oportunamente y con buena disposición.'),
('10000000-0000-0000-0000-000000000009',3,'Cumple adecuadamente los requerimientos del servicio.'),
('10000000-0000-0000-0000-000000000009',2,'Presenta dificultades ocasionales en la atención o respuesta.'),
('10000000-0000-0000-0000-000000000009',1,'Recibe quejas recurrentes o muestra actitud negativa.');

-- ── Cargos (según el organigrama vigente de FNV, confirmado con DatosEmpleadosM&S.xlsx) ──
insert into cargos (id, empresa_id, nombre, proceso_area, objetivo_cargo, tiene_personal_a_cargo,
  formacion_nivel, formacion_titulo_especifico, experiencia_minima_meses, formacion_minima_induccion,
  destreza_fisica, destreza_auditiva, destreza_visual, destreza_manual, destreza_coordinacion_motora,
  codigo_documento, version_documento, fecha_documento, genero_requerido, edad_minima, edad_maxima,
  salario, competencias_cardinales, cargos_a_los_que_reporta, cargos_que_le_reportan,
  manejo_dinero, toma_decisiones_organizacionales, cambios_documentales) values
('1e0a6e97-96eb-474d-8738-f52b407c5e3d', '00000000-0000-0000-0000-000000000001', 'OPERARIO INTEGRAL DE LOGÍSTICA Y PRODUCCIÓN', 'Producción', 'Ejecutar de manera segura y eficiente las operaciones de cargue, descargue, traslado y ubicación de materiales dentro de la planta mediante el uso del puente grúa, garantizando el cumplimiento de las normas de seguridad industrial y los procedimientos establecidos. Asimismo, brindar apoyo en las actividades operativas de la planta, incluyendo la organización, clasificación e identificación de materiales, el soporte en procesos de producción y despachos, el mantenimiento del orden y aseo en las áreas de trabajo, y la colaboración en tareas logísticas y operativas requeridas para asegurar la continuidad y eficiencia de las operaciones.', false, 'bachillerato', 'Bachiller', 6, 'Mínimo inducción previa de 30 días.; Trabajo en Alturas; Tipología y Manipulación del material.', true, true, true, true, true, 'FORSST 61', '2', '2021-06-05', 'Indiferente', 20, 40, 'SMLV', 'Aprendizaje continuo, Planeación y organización del trabajo, Trabajo en equipo y colaboración, Comunicaciòn efectiva, Responsabilidad y compromiso.', 'Coordinador logístico e inventario', 'No aplica', 'No aplica', 'Coordinador logístico e inventario', 'Coordinador logístico e inventario'),
('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Gerente General', 'ADMINISTRATIVO', 'Desarrollar estrategias orientadas a la consecución de las metas organizacionales a través del ejercicio de la planeación, dirección, verificación y la promoción de acciones que aseguren la  implantación de mejoras continuas. Lo anterior asegurando que las prácticas implantadas giren en torno al cumplimiento de las metas financieras definidas para el negocio.', true, 'universitario', 'Administracion de Empresas, Gerencia de Pymes', 48, null, true, true, true, true, true, 'FR051', '1', null, 'Indiferente', null, null, '7.370.000', null, 'Asamblea accionistas.', 'Lideres de procesos', 'Asamblea accionistas.', 'Asamblea accionistas.', 'asamblea accionistas.'),
('20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Directora de Desarrollo Organizacional y Talento Humano', 'Talento Humano y SG-SST', 'Liderar, planificar, dirigir y controlar los procesos de Desarrollo Organizacional, Gestión del Talento Humano y Seguridad y Salud en el Trabajo, garantizando su alineación con la estrategia corporativa, el cumplimiento de la normatividad legal vigente y los lineamientos de la Alta Dirección. Asimismo, promover el fortalecimiento de la cultura organizacional, el desarrollo de las competencias del talento humano, la optimización de los procesos, la gestión del cambio, la mejora continua y la toma de decisiones basada en indicadores, contribuyendo al crecimiento, la sostenibilidad y el logro de los objetivos estratégicos de la organización.', true, 'universitario', 'Tecnólogo(a) en Seguridad y Salud en el Trabajo con licencia vigente para ejercer, o profesional en Seguridad y Salud en el Trabajo.', 12, 'Tecnólogo(a) en Seguridad y Salud en el Trabajo con licencia vigente para ejercer, o profesional en Seguridad y Salud en el Trabajo.
Técnico(a) o Tecnólogo(a) con formación complementaria o actualización en Gestión del Talento Humano y Legislación Laboral Colombiana.', true, true, true, true, true, 'FORSST 61', '2', '2021-06-05', 'Indiferente', 25, 40, '$4.000.000', null, 'Gerente General, Asamblea de Accionistas', 'Auxiliar de Talento Humano y SST, Jefes de áreas.', 'Sí. Administra y coordina el proceso de nómina.', 'Gerente General, Asamblea de Accionistas.', 'Gerente General, Asamblea de Accionistas.'),
('20000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Coordinadora Administrativa', 'Administrativo', 'Desarrollar diferentes actividades administrativas y contables relacionadas con el control de los flujos de caja, pagos, recuperación de cartera, facturación, asegurando el control de los recursos financieros y activos de la compañía', true, 'universitario', 'Profesional en Areas Administrativa, tesoreria, facturación.', 12, 'Minimo inducción del cargo', true, true, true, false, true, 'FORSST 61', '2', '2021-06-05', 'Mujer', 20, 40, '2.500.000', null, 'Junta de accionista, Gerencia General.', 'Auxiliar Oficina, Recepcion, Auxiliar de Servicos Generales, Asesoras Comerciales', 'Si, manejo   caja general de la compañía', 'Junta de accionista, Gerencia General.', 'Gerencia General, Gerente de Talento Humano y SST, Gerente comercial.'),
('20000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'Coordinadora de Producción', 'Producción', 'Garantizar la efectividad de los procesos de producción y la calidad de los productos. Realizar de manera efectiva la entrega del producto terminado al cliente y su instalación.', true, 'universitario', 'Profesional o Ingeniero industrial, Producción, Logística o afines.', 24, 'Mínimo inducción previa de 30 días.', true, true, true, false, true, 'FORSST 61', '2', '2021-06-05', 'Indiferente', null, null, 'a convenir', null, 'Gerente General', 'Asistente de Producción, Operadores de maquinas cortadoras, Operarios de producción, Contratistas, operario de producción plomero/soldador.', 'No aplica', 'Gerente General', 'Gerente General'),
('20000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'Coordinador Logístico e Inventarios', 'Producción', 'Custiodiar y organizar el material en la bodega, además de velar porque las instalaciones de la bodega estén en óptimas condiciones, y que el material despachado sea retirado con los estándares de calidad y cantidades correspondientes.', true, 'tecnico', 'Tecnico de Auxiliar Logistico, produccion o afines.', 6, 'Minimo inducción previa de 30 dias.; Excel, Manejo de base de Datos, indicadores, Sistemas de información, herramientas de Producción, Control Estadistico de procesos, Organización Documental.; Tipología de material, Trabajo en Alturas, Herramientas para el Inventario.', true, true, true, false, true, 'FORSST 61', '2', '2021-06-05', 'Indiferente', null, null, 'A convenir', 'Capacidad de aprendizaje, Planeación, Organización, Trabajo colaborativo y en Equipo.', 'Gerente General', 'Auxiliar de Inventarios', 'No aplica', 'Gerente General', 'Gerente General'),
('20000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', 'Líder de Operaciones Internacionales', 'Administrativo', 'Planificar, coordinar y supervisar las operaciones internacionales de la organización, garantizando la adecuada gestión de los procesos de importación, el cumplimiento de la normatividad vigente.', false, 'universitario', 'Profesional en Negocios internacionales, Administración de empresas, Comercio Internacional o Comercio Exterior.', 24, 'Profesional en Negocios internacionales, Administración de empresas, Comercio Internacional o Comercio Exterior.', true, true, true, false, true, 'FORSST 61', '2', '2021-06-05', 'Indiferente', null, null, '7740000', null, 'Gerente General', 'No aplica', 'Autoriza y gestiona pagos a proveedores nacionales e internacionales, de acuerdo con las políticas financieras y los niveles de autorización establecidos por la organización. No administra caja ni maneja dinero en efectivo.', 'Gerente General', 'Gerente General, talento humano.'),
('20000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000001', 'Coordinadora Comercial', 'Comercial', 'Lograr las metas establecidas en el presupuesto de ventas de la empresa, motivando al personal a dicho objetivo, además de velar por los bienes físicos de las diferentes salas de venta logrando así un buen control del área comercial.', true, 'universitario', 'Profesional en administración de negocios, negocios internacionales, mercadeo, ingeniería industrial o afines.', 36, 'Excel avanzado, liderazgo, CRM.', true, true, true, true, true, 'FR051', '01', '2017-11-01', 'Indiferente', null, null, '4.200.000 + COMISIONES', 'Capacidad de aprendizaje, liderazgo, capacidad de negociación, RIGUROSIDAD, Planeacion, Orden, Organización, Trabajo colaborativo y en Equipo.', 'JUNTA DIRECTIVA Y GERENCIA.', 'Asesores comerciales, staff/asistentes comerciales', 'N/A', 'JUNTA DIRECTIVA Y GERENCIA.', 'Gerencia'),
('20000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000001', 'Auxiliar de Talento Humano y de Seguridad y Salud en el Trabajo', 'Talento Humano', 'Brindar apoyo integral a los procesos de Seguridad y Salud en el Trabajo (SG-SST), Talento Humano y gestión administrativa de la organización, ejecutando actividades operativas, documentales y de seguimiento que garanticen el cumplimiento de la normatividad legal vigente, la adecuada administración del personal, la prevención de riesgos laborales, el fortalecimiento de la cultura de seguridad y el mejoramiento continuo de los procesos organizacionales.', true, 'tecnologo', 'Técnico(a) o Tecnólogo(a) en Gestión del Talento Humano, Recursos Humanos, Seguridad y Salud en el Trabajo o áreas afines.', 12, 'Técnico(a) o Tecnólogo(a) en Gestión del Talento Humano, Recursos Humanos, Seguridad y Salud en el Trabajo o áreas afines.', true, true, true, false, true, 'FORSST 61', '2', '2021-06-05', 'Mujer', 20, 40, '$2.000.000', null, 'Gerente general, Directora de Desarrollo Organizacional y Talento Humano.', 'Todas las áreas.', 'Manejo de caja menor.', 'Directora de Desarrollo Organizacional y Talento Humano.', 'Directora de Desarrollo Organizacional y Talento Humano.'),
('20000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000001', 'Auxiliar de Servicios Generales', 'administrativo', 'Promover 5S en todos las areas de la empresa, procurando que permanezcan  limpios, salubres y confortables al interior y al exterior de las instalaciones, proporcionando calidad de vida a clientes internos y externos.', false, 'bachillerato', null, 12, 'Mínimo inducción previa de 30 días.', true, true, true, false, true, 'FORSST 61', '2', '2021-06-05', 'Indiferente', 20, 40, 'S.M. L. V', null, 'Gerente Comercial, Gerente de Talento Humano SSGT, Gerente de Calidad y Servicio al Cliente, Gerente General. Lider directo Administración.', 'No aplica', 'No aplica', 'No aplica', 'No aplica'),
('20000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-000000000001', 'Asistente de Producción y Gestión de Contratistas', 'Producción', null, false, 'tecnico', null, null, null, false, false, false, false, false, null, null, null, 'Indiferente', null, null, null, null, null, null, null, null, null),
('20000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-000000000001', 'Auxiliar de Inventarios', 'Producción', 'Apoyar la gestión y control de inventarios mediante el registro, verificación y organización de los materiales, garantizando la exactitud de la información, la disponibilidad de los recursos y el adecuado manejo de los mismos.', false, 'tecnico', 'Técnico en logística, producción o áreas afines', 12, 'Minimo inducción previa de 30 días. Excel, indicadores, sistemas de información, herramientas de producción, control estadístico de procesos, organización documental.', true, true, true, false, true, 'FORSST 61', '3', '2026-05-06', 'Indiferente', 20, 40, 'A convenir', 'Aprendizaje continuo, planeación y organización del trabajo, trabajo en equipo y colaboración, comunicación efectiva, responsabilidad y compromiso.', 'Coordinador logístico e inventario', 'Cargos con los que coordina actividades; Operarios de producción, operarios de máquina de corte, transportadores y asesores comerciales.', 'No aplica', 'Priorizar la ejecución de conteos físicos, identificar y reportar diferencias de inventario, validar documentación de ingreso y salida de materiales, solicitar correcciones de registros cuando se detecten inconsistencias, informar novedades relacionadas con inventarios y despachos.', 'Coordinador logístico e inventario'),
('20000000-0000-0000-0000-00000000000c', '00000000-0000-0000-0000-000000000001', 'Auxiliar Logístico e Inventarios', 'Logística e Inventarios', null, false, 'tecnico', null, null, null, false, false, false, false, false, null, null, null, 'Indiferente', null, null, null, null, null, null, null, null, null),
('20000000-0000-0000-0000-00000000000d', '00000000-0000-0000-0000-000000000001', 'Operario Integral de Logística e Inventarios', 'Logística e Inventarios', null, false, 'bachillerato', null, null, null, false, false, false, false, false, null, null, null, 'Indiferente', null, null, null, null, null, null, null, null, null),
('20000000-0000-0000-0000-00000000000e', '00000000-0000-0000-0000-000000000001', 'Operario de Montacargas y Otros Oficios de Producción', 'Producción', 'Garantizar la movilización, almacenamiento y despacho seguro de materiales dentro de la bodega y área de producción, operando el montacargas de manera eficiente y cumpliendo con las normas de seguridad, procedimientos internos y estándares de calidad. Apoyar el control de inventarios, la organización de la bodega y las actividades logísticas, asegurando la integridad de los materiales, la eficiencia en los procesos y el cumplimiento de las políticas de la empresa.', false, 'bachillerato', 'Bachiller', 12, 'Mínimo inducción previa de 30 días. Certificación en operación segura de montacargas. Tipología y Manipulación del material.', true, true, true, true, true, 'FORSST 61', '3', '2026-05-06', 'Indiferente', 20, 40, 'A convenir', 'Aprendizaje continuo, planeación y organización del trabajo, trabajo en equipo y colaboración, comunicación efectiva, responsabilidad y compromiso.', 'Coordinador logístico e inventario', 'No aplica', 'No aplica', 'Suspender la operación del montacargas cuando existan condiciones inseguras, determinar la forma segura de movilizar materiales, seleccionar elementos de aseguramiento de carga, reportar fallas mecánicas o de seguridad, solicitar mantenimiento del equipo cuando sea requerido.', 'Coordinador logístico e inventario'),
('20000000-0000-0000-0000-00000000000f', '00000000-0000-0000-0000-000000000001', 'Auxiliar Contable', 'Contabilidad', 'Gestionar la información contable garantizando que dicha informacion sea confiable, fidedigna y que permita trazabilidad para la toma de decisiones en el area de contabilidad, llevando a cabo el  análisis de cuentas así como los asientos, ajustes y reclasificaciones requeridos para un adecuado proceso contable, a fin de mantener actualizadas las operaciones de la compañía y verificar su adecuada contabilización.', true, 'tecnologo', 'Diplomado en NIIFF Legislación tributaria, Finanzas organizacionales (Deseable), Ofimática avanzada', 12, 'Excel, Manejo de base de Datos, indicadores, Sistemas de información, herramientas contables,Organización Documental.', true, true, true, false, true, 'FORSST 61', '2.0', '2021-06-05', 'Indiferente', 20, 45, '1.900.000-2.000.000', null, 'Contador, Gerencia, Revisoria Fiscal', 'Administracion, produccion, comercial yTalento Humano.', 'No aplica', 'Junta Directiva, Gerencia General, Contadora', 'Contadora.'),
('20000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', 'Asesora de Obras y Servicio al Cliente', 'Comercial', null, false, 'tecnologo', null, null, null, false, false, false, false, false, null, null, null, 'Indiferente', null, null, null, null, null, null, null, null, null),
('20000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001', 'Asistente Comercial', 'Comercial', 'Permitir la fluidez de los negocios y promover el crecimiento de las ventas de la compañía, posicionando constantemente la marca de los productos en el mercado, desde un rol de apoyo.', false, 'tecnologo', 'Tecnico en ventas, atención al cliente, mercadeo, diseño de interiores.', 6, 'Minimo inducción previa de 30 dias.; Excel, Manejo de programa para cotizar, comprensión de planos de diseño, veas y aborjade a los diferentes tipos de clientes, mercadeo.; Tipología de material, Cotizaciones.', true, true, true, false, true, 'FORSST 61', '2', '2021-06-05', 'Indiferente', null, null, 'SMMLV + comisiones', 'Capacidad de aprendizaje, Planeacion, Orden, Perseverante, conocedor del producto, comptitivo, Trabajo colaborativo y en Equipo.', 'Gerencia (Servicio al cliente y control de calidad, talento Humano y Comercial)', 'No aplica', 'Administradora', 'Gerencia General y Comercial', 'Gerencia General y Comercial'),
('20000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000001', 'Staff Comercial', 'Comercial', 'Permitir la fluidez de los negocios y promover el crecimiento de las ventas de la compañía, posicionando constantemente la marca de los productos en el mercado, desde un rol de apoyo.', false, 'tecnologo', 'Tecnico en ventas, atención al cliente, mercadeo, diseño de interiores, auxiliar administrativo', 6, 'Minimo inducción previa de 30 dias.; Excel, Manejo de programa para cotizar, comprensión de planos de diseño, veas y aborjade a los diferentes tipos de clientes, mercadeo.; Tipología de material, Cotizaciones.', true, true, true, false, true, 'FORSST 61', '2', '2021-06-05', 'Indiferente', null, null, 'SMMLV + comisiones', 'Capacidad de aprendizaje, Planeacion, Orden, Perseverante, conocedor del producto, comptitivo, Trabajo colaborativo y en Equipo.', 'Gerencia (Servicio al cliente y control de calidad, talento Humano y Comercial)', 'No aplica', 'Administradora', 'Gerencia General y Comercial', 'Gerencia General y Comercial'),
('20000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000001', 'Asesor Comercial', 'Comercial', 'Promover el crecimiento de las ventas de la compañía y posicionar constantemente la marca de los productos en el mercado.', false, 'universitario', 'Tecnico en ventas, atención al cliente, mercadeo, diseño de interiores.', 6, 'Minimo inducción previa de 30 dias.; Excel, Manejo de programa para cotizar, comprensión de planos de diseño, veas y aborjade a los diferentes tipos de clientes, mercadeo.; Tipología de material, Cotizaciones.', true, true, true, false, true, 'FORSST 61', '2', '2021-06-05', 'Indiferente', null, null, 'SMMLV + COMISIONES', 'Capacidad de aprendizaje, Planeacion, Orden, Perseverante, conocedor del producto, comptitivo, Trabajo colaborativo y en Equipo.', 'Gerencia (General, talento Humano y Comercial)', 'No aplica', 'Administradora', 'Gerencia General y Comercial', 'Gerencia General y Comercial'),
('20000000-0000-0000-0000-000000000014', '00000000-0000-0000-0000-000000000001', 'Cortador / Oficios de Producción', 'Producción', null, false, 'bachillerato', null, null, null, false, false, false, false, false, null, null, null, 'Indiferente', null, null, null, null, null, null, null, null, null),
('20000000-0000-0000-0000-000000000015', '00000000-0000-0000-0000-000000000001', 'Operario de Producción', 'Producción', 'Realizar labores de cargue, descargue de contenedores y material en las instalaciones de la empresa y obras; con el fin de entregar producto terminado a nuestros clientes a satisfacción. 
Mantener el lugar de trabajo que le corresponde, en orden y debidamente aseado para evitar accidentes laborales y formar un entorno agradable.', false, 'bachillerato', 'Bachiller', 12, 'Minimo inducción previa de 30 dias.', true, true, true, true, true, 'FORSST 61', '2', '2021-06-05', 'Indiferente', 20, 45, 'SMLV', null, 'COORDINADOR DE PRODUCCIÓN', 'No aplica', 'No aplica', 'COORDINADOR DE PRODUCCIÓN', 'COORDINADOR DE PRODUCCIÓN'),
('20000000-0000-0000-0000-000000000016', '00000000-0000-0000-0000-000000000001', 'Transportador', 'Producción', null, false, 'bachillerato', null, null, null, false, false, false, false, false, null, null, null, 'Indiferente', null, null, null, null, null, null, null, null, null),
('20000000-0000-0000-0000-000000000017', '00000000-0000-0000-0000-000000000001', 'Contratista Instalador', 'Producción', null, false, 'empirico', null, null, null, false, false, false, false, false, null, null, null, 'Indiferente', null, null, null, null, null, null, null, null, null),
('20000000-0000-0000-0000-000000000018', '00000000-0000-0000-0000-000000000001', 'Revisor Fiscal', 'Externo', null, false, null, null, null, null, false, false, false, false, false, null, null, null, 'Indiferente', null, null, null, null, null, null, null, null, null),
('20000000-0000-0000-0000-000000000019', '00000000-0000-0000-0000-000000000001', 'Asesor Externo', 'Externo', null, false, null, null, null, null, false, false, false, false, false, null, null, null, 'Indiferente', null, null, null, null, null, null, null, null, null),
('61483566-78ea-46e0-8e11-c19462a50d6d', '00000000-0000-0000-0000-000000000001', 'Operario de puente grúa y otros oficios de producción', 'Producción', 'Ejecutar de manera segura y eficiente las operaciones de cargue, descargue, traslado y ubicación de materiales dentro de la planta mediante el uso del puente grúa, garantizando el cumplimiento de las normas de seguridad industrial y los procedimientos establecidos. Asimismo, brindar apoyo en las actividades operativas de la planta, incluyendo la organización, clasificación e identificación de materiales, el soporte en procesos de producción y despachos, el mantenimiento del orden y aseo en las áreas de trabajo, y la colaboración en tareas logísticas y operativas requeridas para asegurar la continuidad y eficiencia de las operaciones.', false, 'bachillerato', 'Bachiller', 12, 'Mínimo inducción previa de 30 días.', true, true, true, true, true, 'FORSST 61', '3', '2026-05-06', 'Indiferente', 20, 40, 'SMLV', null, 'Coordinador logístico e inventario', 'No aplica', null, null, null),
('a5bd6b51-9ac9-4dc5-b686-5535b77600df', '00000000-0000-0000-0000-000000000001', 'AUXILIAR DE PRODUCCIÓN Y GESTIÓN DE CONTRATISTAS', null, null, false, null, null, null, null, false, false, false, false, false, null, null, null, 'Indiferente', null, null, null, null, null, null, null, null, null),
('b3595394-b432-487f-900b-c1805d585a45', '00000000-0000-0000-0000-000000000001', 'Auxiliar Lógistico', 'Producción', 'Garantizar el adecuado control administrativo y operativo de los inventarios mediante el registro oportuno de los movimientos de materiales, la recepción, verificación y entrega de productos, la gestión documental y la coordinación de despachos, asegurando la confiabilidad de la información, la disponibilidad de los inventarios, la atención oportuna a clientes internos y externos, y el cumplimiento de los procedimientos establecidos por la organización.', false, 'tecnico', 'Técnico en logística, producción o áreas afines', 12, 'Minimo inducción previa de 30 días. Excel, indicadores, sistemas de información, herramientas de producción, control estadístico de procesos, organización documental.', true, true, true, false, true, 'FORSST 61', '3', null, 'Indiferente', 20, 40, 'SMMLV', 'Aprendizaje continuo, planeación y organización del trabajo, trabajo en equipo y colaboración, comunicación efectiva, responsabilidad y compromiso.', 'Coordinador logístico e inventario', 'Cargos con los que coordina actividades; Operarios de producción y asesores comerciales.', 'No aplica', 'Priorizar la ejecución de conteos físicos, identificar y reportar diferencias de inventario, validar documentación de ingreso y salida de materiales, solicitar correcciones de registros cuando se detecten inconsistencias, informar novedades relacionadas con inventarios y despachos.', 'Coordinador logístico e inventario'),
('ce248ca9-d089-45be-bd56-4e34340ff7cf', '00000000-0000-0000-0000-000000000001', 'Operario logístico y de inventarios', 'Producción', 'Garantizar la correcta ejecución de los procesos de despacho, mediante la verificación de cantidades, especificaciones y estado del producto frente a la documentación correspondiente, asegurando entregas completas, oportunas y conforme a los requerimientos del cliente. Asimismo, apoyar las operaciones logísticas y de planta, incluyendo cargue, descargue, organización y mantenimiento del orden y aseo, cumpliendo con las políticas internas y normas de seguridad establecidas.', false, 'bachillerato', 'Bachiller (Deseable formación complementaria en logística, almacenamiento, inventarios o manejo seguro de cargas).', 12, 'Mínimo inducción previa de 30 días. Excel y organización documental.', true, true, true, true, true, 'FORSST 61', '3', '2026-05-06', 'Indiferente', 20, 40, 'SMLV', 'Aprendizaje continuo, planeación y organización del trabajo, trabajo en equipo y colaboración, comunicación efectiva, responsabilidad y compromiso.', 'Coordinador logístico e inventarios.', 'No aplica', 'No aplica', 'Toma decisiones operativas relacionadas con la verificación de materiales, condiciones de despacho y reporte de novedades, de acuerdo con los procedimientos establecidos.', 'Coordinador logístico e inventarios.'),
('d0da7f10-c8af-46a8-90fd-c5278dcdab4b', '00000000-0000-0000-0000-000000000001', 'OPERARIO DE MÁQUINA CORTADORA Y OTROS OFICIOS DE PRODUCCIÓN', 'Producción', 'Operar la maquina de corte y optimizar el material en su proceso operativo.', false, 'bachillerato', null, 12, 'Mínimo inducción previa de 60 días.', true, true, true, true, true, 'FORSST 61', '2', '2021-06-05', 'Masculino', 27, 55, 'A CONVENIR', null, 'Director de producción y Logística, Analista de producción y Logística.', 'No aplica', 'No aplica', 'Director de producción y Logística', 'Director de producción y Logística'),
('e898198a-fc65-495e-9ce1-606a8c2c6601', '00000000-0000-0000-0000-000000000001', 'OPERARIO DE PRODUCCIÓN Y MANTENIMIENTO', 'Producción', 'Ejecutar de manera eficiente y segura las actividades operativas de producción, cargue y descargue, despacho de materiales, mantenimiento locativo básico y organización interna, garantizando el correcto flujo de materiales, el adecuado funcionamiento de las instalaciones y el cumplimiento de las normas de calidad, orden, aseo y seguridad industrial de la empresa.', false, 'tecnico', 'Técnico', 12, 'Minimo inducción previa de 30 dias.', true, true, true, true, true, 'FORSST 61', '2', '2021-06-05', 'Indiferente', null, null, 'a convenir', null, 'Coordinadora producción', 'No aplica', 'No aplica', 'Coordinadora producción', 'Coordinadora producción');

-- ── Habilidades funcionales/técnicas por cargo ──
insert into cargo_habilidades (cargo_id, tipo, nombre, nivel_esperado, orden) values
('20000000-0000-0000-0000-000000000001', 'funcional', 'Desarrollo de personas', 'alto', 1),
('20000000-0000-0000-0000-000000000001', 'funcional', 'Capacidad de supervisión', 'alto', 2),
('20000000-0000-0000-0000-000000000001', 'funcional', 'Autonomía', 'alto', 3),
('20000000-0000-0000-0000-000000000001', 'funcional', 'Proactividad', 'alto', 4),
('20000000-0000-0000-0000-000000000001', 'funcional', 'Liderazgo', 'alto', 5),
('20000000-0000-0000-0000-000000000001', 'funcional', 'Organización y Planeación', 'alto', 6),
('20000000-0000-0000-0000-000000000001', 'funcional', 'Solución de problemas', 'alto', 7),
('20000000-0000-0000-0000-000000000001', 'funcional', 'Tolerancia a la presión', 'alto', 8),
('20000000-0000-0000-0000-000000000001', 'funcional', 'Trabajo en equipo', 'alto', 9),
('20000000-0000-0000-0000-000000000001', 'tecnica', 'Capacidad de inferir respuestas correctas ante problemas complejos de interpretación de datos en procesos', 'alto', 10),
('20000000-0000-0000-0000-000000000001', 'tecnica', 'Capacidad pedagógica en la transmisión de conocimientos a su equipo de trabajo y otros con interés', 'alto', 11),
('20000000-0000-0000-0000-000000000002', 'funcional', 'Capacidad de negociación', 'alto', 1),
('20000000-0000-0000-0000-000000000002', 'funcional', 'Capacidad de supervisión', 'alto', 2),
('20000000-0000-0000-0000-000000000002', 'funcional', 'Autonomía', 'alto', 3),
('20000000-0000-0000-0000-000000000002', 'funcional', 'Proactividad', 'alto', 4),
('20000000-0000-0000-0000-000000000002', 'funcional', 'Liderazgo', 'alto', 5),
('20000000-0000-0000-0000-000000000002', 'funcional', 'Organización', 'alto', 6),
('20000000-0000-0000-0000-000000000002', 'funcional', 'Solución de problemas', 'alto', 7),
('20000000-0000-0000-0000-000000000002', 'funcional', 'Tolerancia a la presión', 'alto', 8),
('20000000-0000-0000-0000-000000000002', 'funcional', 'Trabajo en equipo', 'alto', 9),
('20000000-0000-0000-0000-000000000002', 'tecnica', 'Capacidad de inferir respuestas correctas ante problemas complejos de interpretación de datos en procesos produccion.', 'alto', 10),
('20000000-0000-0000-0000-000000000002', 'tecnica', 'Capacidad de transmitir el conocimiento.', 'alto', 11),
('20000000-0000-0000-0000-000000000002', 'tecnica', 'Desarrollo de procesos; Un lider con aptitud proactiva  que pueda identificar formas de racionalizar los procesos de trabajo.', 'alto', 12),
('20000000-0000-0000-0000-000000000002', 'tecnica', 'Planificación y ejecución; Contar con una excelente planificación de futuro (prospectiva), análisis de rendimiento y previsión.Comprención y conocimiento en la manipulación datos.', 'alto', 13),
('20000000-0000-0000-0000-000000000002', 'tecnica', 'Procesador de texto, hoja de cálculo, generación de presentaciones, correo electrónico.', 'alto', 14),
('20000000-0000-0000-0000-000000000003', 'funcional', 'Capacidad de negociación', 'medio', 1),
('20000000-0000-0000-0000-000000000003', 'funcional', 'Capacidad de supervisión', 'alto', 2),
('20000000-0000-0000-0000-000000000003', 'funcional', 'Autonomía', 'alto', 3),
('20000000-0000-0000-0000-000000000003', 'funcional', 'Proactividad', 'alto', 4),
('20000000-0000-0000-0000-000000000003', 'funcional', 'Liderazgo', 'alto', 5),
('20000000-0000-0000-0000-000000000003', 'funcional', 'Organización', 'alto', 6),
('20000000-0000-0000-0000-000000000003', 'funcional', 'Solución de problemas', 'alto', 7),
('20000000-0000-0000-0000-000000000003', 'funcional', 'Tolerancia a la presión', 'alto', 8),
('20000000-0000-0000-0000-000000000003', 'funcional', 'Trabajo en equipo', 'alto', 9),
('20000000-0000-0000-0000-000000000003', 'tecnica', 'Capacidad de inferir respuestas correctas ante problemas complejos de interpretación de datos en procesos relacionados con diferentes tipos de pruebas a pozo y planeación de operaciones complejas de servicio a pozo.', 'alto', 10),
('20000000-0000-0000-0000-000000000003', 'tecnica', 'Capacidad de transmitir el conocimiento.', 'alto', 11),
('20000000-0000-0000-0000-000000000003', 'tecnica', 'Desarrollo de procesos; con aptitud proactiva  que pueda identificar formas de racionalizar los procesos de trabajo.', 'alto', 12),
('20000000-0000-0000-0000-000000000003', 'tecnica', 'Planificación y ejecución; Contar con una excelente planificación de futuro (prospectiva), análisis de rendimiento y previsión.Comprensión y conocimiento en la manipulación datos.', 'medio', 13),
('20000000-0000-0000-0000-000000000003', 'tecnica', 'Procesador de texto, hoja de cálculo, generación de presentaciones, correo electrónico.', 'alto', 14),
('20000000-0000-0000-0000-000000000004', 'funcional', 'Capacidad de negociación', 'alto', 1),
('20000000-0000-0000-0000-000000000004', 'funcional', 'Capacidad de supervisión', 'alto', 2),
('20000000-0000-0000-0000-000000000004', 'funcional', 'Autonomía', 'alto', 3),
('20000000-0000-0000-0000-000000000004', 'funcional', 'Proactividad', 'alto', 4),
('20000000-0000-0000-0000-000000000004', 'funcional', 'Liderazgo', 'alto', 5),
('20000000-0000-0000-0000-000000000004', 'funcional', 'Organización', 'alto', 6),
('20000000-0000-0000-0000-000000000004', 'funcional', 'Solución de problemas', 'alto', 7),
('20000000-0000-0000-0000-000000000004', 'funcional', 'Tolerancia a la presión', 'alto', 8),
('20000000-0000-0000-0000-000000000004', 'funcional', 'Trabajo en equipo', 'alto', 9),
('20000000-0000-0000-0000-000000000004', 'tecnica', 'Capacidad de hacer ciclos de mejoramiento, en el cual se identifica el problema, se llega hasta su causa raíz y se soluciona por medio de acciones simples, de bajo costo y alta creatividad.', 'alto', 10),
('20000000-0000-0000-0000-000000000004', 'tecnica', 'Capacidad de transmitir el conocimiento.  Inteligencia para  atraer a los empleados adecuados y diseñar planes de desarrollo que implementen iniciativas innovadoras para mantenerlos comprometidos con la empresa a la vez que desarrollan sus habilidades duras.', 'alto', 11),
('20000000-0000-0000-0000-000000000004', 'tecnica', 'Desarrollo de procesos; Un líder con aptitud proactiva  que pueda identificar formas de racionalizar los procesos de trabajo. Esto puede incluir la minimización de costos, la optimización de la capacidad productiva y la mejora de la calidad.', 'alto', 12),
('20000000-0000-0000-0000-000000000004', 'tecnica', 'Planificación y ejecución; Contar con una excelente planificación de futuro (prospectiva), análisis de rendimiento y previsión. Comprensión y conocimiento en la manipulación datos.', 'alto', 13),
('20000000-0000-0000-0000-000000000004', 'tecnica', 'Resolución de conflictos; El líder debe asegurarse de que todos los canales de comunicación sean claros y que se cumplan los plazos. Además, deberá minimizar el efecto de un conflicto en pro de la productividad. Por lo tanto, el líder debe tener la  capacidad para trabajar de manera conjunta con clientes, empresas y equipos jurídicos.', 'alto', 14),
('20000000-0000-0000-0000-000000000004', 'tecnica', 'Procesador de texto, hoja de cálculo, generación de presentaciones, correo electrónico.', 'alto', 15),
('20000000-0000-0000-0000-000000000006', 'funcional', 'Capacidad de negociación', 'medio', 1),
('20000000-0000-0000-0000-000000000006', 'funcional', 'Capacidad de supervisión', 'medio', 2),
('20000000-0000-0000-0000-000000000006', 'funcional', 'Autonomía', 'bajo', 3),
('20000000-0000-0000-0000-000000000006', 'funcional', 'Proactividad', 'alto', 4),
('20000000-0000-0000-0000-000000000006', 'funcional', 'Liderazgo', 'medio', 5),
('20000000-0000-0000-0000-000000000006', 'funcional', 'Organización', 'alto', 6),
('20000000-0000-0000-0000-000000000006', 'funcional', 'Solución de problemas', 'alto', 7),
('20000000-0000-0000-0000-000000000006', 'funcional', 'Tolerancia a la presión', 'alto', 8),
('20000000-0000-0000-0000-000000000006', 'funcional', 'Trabajo en equipo', 'alto', 9),
('20000000-0000-0000-0000-000000000006', 'tecnica', 'Capacidad de inferir respuestas correctas ante problemas complejos de interpretación de datos en procesos relacionados con diferentes tipos de pruebas a pozo y planeación de operaciones complejas de servicio a pozo.', 'medio', 10),
('20000000-0000-0000-0000-000000000006', 'tecnica', 'Capacidad de transmitir el conocimiento.', 'medio', 11),
('20000000-0000-0000-0000-000000000006', 'tecnica', 'Desarrollo de procesos; con aptitud proactiva  que pueda identificar formas de racionalizar los procesos de trabajo.', 'alto', 12),
('20000000-0000-0000-0000-000000000006', 'tecnica', 'Procesador de texto, hoja de cálculo, generación de presentaciones, correo electrónico.', 'medio', 13),
('20000000-0000-0000-0000-000000000008', 'funcional', 'Capacidad de negociación', 'medio', 1),
('20000000-0000-0000-0000-000000000008', 'funcional', 'Capacidad de supervisión', 'alto', 2),
('20000000-0000-0000-0000-000000000008', 'funcional', 'Autonomía', 'alto', 3),
('20000000-0000-0000-0000-000000000008', 'funcional', 'Proactividad', 'alto', 4),
('20000000-0000-0000-0000-000000000008', 'funcional', 'Liderazgo', 'alto', 5),
('20000000-0000-0000-0000-000000000008', 'funcional', 'Organización', 'alto', 6),
('20000000-0000-0000-0000-000000000008', 'funcional', 'Solución de problemas', 'alto', 7),
('20000000-0000-0000-0000-000000000008', 'funcional', 'Tolerancia a la presión', 'alto', 8),
('20000000-0000-0000-0000-000000000008', 'funcional', 'Trabajo en equipo', 'alto', 9),
('20000000-0000-0000-0000-000000000008', 'tecnica', 'Capacidad de inferir respuestas correctas ante problemas complejos de interpretación de datos en procesos relacionados con diferentes tipos de pruebas a pozo y planeación de operaciones complejas de servicio a pozo.', 'alto', 10),
('20000000-0000-0000-0000-000000000008', 'tecnica', 'Capacidad de transmitir el conocimiento.', 'alto', 11),
('20000000-0000-0000-0000-000000000008', 'tecnica', 'Desarrollo de procesos; con aptitud proactiva  que pueda identificar formas de racionalizar los procesos de trabajo.', 'alto', 12),
('20000000-0000-0000-0000-000000000008', 'tecnica', 'Planificación y ejecución; Contar con una excelente planificación de futuro (prospectiva), análisis de rendimiento y previsión.Comprensión y conocimiento en la manipulación datos.', 'medio', 13),
('20000000-0000-0000-0000-000000000008', 'tecnica', 'Procesador de texto, hoja de cálculo, generación de presentaciones, correo electrónico.', 'alto', 14),
('20000000-0000-0000-0000-000000000009', 'funcional', 'Capacidad de negociación', 'bajo', 1),
('20000000-0000-0000-0000-000000000009', 'funcional', 'Capacidad de supervisión', 'medio', 2),
('20000000-0000-0000-0000-000000000009', 'funcional', 'Autonomía', 'bajo', 3),
('20000000-0000-0000-0000-000000000009', 'funcional', 'Proactividad', 'alto', 4),
('20000000-0000-0000-0000-000000000009', 'funcional', 'Liderazgo', 'bajo', 5),
('20000000-0000-0000-0000-000000000009', 'funcional', 'Organización', 'medio', 6),
('20000000-0000-0000-0000-000000000009', 'funcional', 'Solución de problemas', 'bajo', 7),
('20000000-0000-0000-0000-000000000009', 'funcional', 'Tolerancia a la presión', 'medio', 8),
('20000000-0000-0000-0000-000000000009', 'funcional', 'Trabajo en equipo', 'alto', 9),
('20000000-0000-0000-0000-000000000009', 'tecnica', 'Capacidad de hacer ciclos de mejoramiento, en el cual se identifica el problema, se llega hasta su causa raíz y se soluciona por medio de acciones simples, de bajo costo y alta creatividad.', 'bajo', 10),
('20000000-0000-0000-0000-000000000009', 'tecnica', 'Capacidad de transmitir el conocimiento.  Inteligencia para  atraer a los empleados adecuados y diseñar planes de desarrollo que implementen iniciativas innovadoras para mantenerlos comprometidos con la empresa a la vez que desarrollan sus habilidades duras.', 'bajo', 11),
('20000000-0000-0000-0000-000000000009', 'tecnica', 'Desarrollo de procesos; Un líder con aptitud proactiva  que pueda identificar formas de racionalizar los procesos de trabajo. Esto puede incluir la minimización de costos, la optimización de la capacidad productiva y la mejora de la calidad.', 'bajo', 12),
('20000000-0000-0000-0000-000000000009', 'tecnica', 'Planificación y ejecución; Contar con una excelente planificación de futuro (prospectiva), análisis de rendimiento y previsión. Comprensión y conocimiento en la manipulación datos.', 'bajo', 13),
('20000000-0000-0000-0000-000000000009', 'tecnica', 'Resolución de conflictos; El líder debe asegurarse de que todos los canales de comunicación sean claros y que se cumplan los plazos. Además, deberá minimizar el efecto de un conflicto en pro de la productividad. Por lo tanto, el líder debe tener la  capacidad para trabajar de manera conjunta con clientes, empresas y equipos jurídicos.', 'bajo', 14),
('20000000-0000-0000-0000-000000000009', 'tecnica', 'Procesador de texto, hoja de cálculo, generación de presentaciones, correo electrónico.', 'bajo', 15),
('20000000-0000-0000-0000-00000000000b', 'funcional', 'Capacidad de negociación', 'medio', 1),
('20000000-0000-0000-0000-00000000000b', 'funcional', 'Capacidad de supervisión', 'alto', 2),
('20000000-0000-0000-0000-00000000000b', 'funcional', 'Autonomía', 'medio', 3),
('20000000-0000-0000-0000-00000000000b', 'funcional', 'Proactividad', 'alto', 4),
('20000000-0000-0000-0000-00000000000b', 'funcional', 'Liderazgo', 'medio', 5),
('20000000-0000-0000-0000-00000000000b', 'funcional', 'Organización', 'alto', 6),
('20000000-0000-0000-0000-00000000000b', 'funcional', 'Solución de problemas', 'alto', 7),
('20000000-0000-0000-0000-00000000000b', 'funcional', 'Tolerancia a la presión', 'alto', 8),
('20000000-0000-0000-0000-00000000000b', 'funcional', 'Trabajo en equipo', 'alto', 9),
('20000000-0000-0000-0000-00000000000b', 'tecnica', 'Capacidad de inferir respuestas correctas ante problemas complejos de interpretación de datos en procesos produccion.', 'alto', 10),
('20000000-0000-0000-0000-00000000000b', 'tecnica', 'Capacidad de transmitir el conocimiento.', 'alto', 11),
('20000000-0000-0000-0000-00000000000b', 'tecnica', 'Desarrollo de procesos; con aptitud proactiva que pueda identificar formas de racionalizar los procesos de trabajo.', 'alto', 12),
('20000000-0000-0000-0000-00000000000b', 'tecnica', 'Planificación y ejecución; Contar con una excelente planificación de futuro (prospectiva), análisis de rendimiento y previsión.Comprensión y conocimiento en la manipulación datos.', 'alto', 13),
('20000000-0000-0000-0000-00000000000b', 'tecnica', 'Procesador de texto, hoja de cálculo, generación de presentaciones, correo electrónico.', 'alto', 14),
('20000000-0000-0000-0000-00000000000e', 'funcional', 'Capacidad de negociación', 'bajo', 1),
('20000000-0000-0000-0000-00000000000e', 'funcional', 'Capacidad de supervisión', 'bajo', 2),
('20000000-0000-0000-0000-00000000000e', 'funcional', 'Autonomía', 'alto', 3),
('20000000-0000-0000-0000-00000000000e', 'funcional', 'Proactividad', 'alto', 4),
('20000000-0000-0000-0000-00000000000e', 'funcional', 'Liderazgo', 'bajo', 5),
('20000000-0000-0000-0000-00000000000e', 'funcional', 'Organización', 'alto', 6),
('20000000-0000-0000-0000-00000000000e', 'funcional', 'Solución de problemas', 'medio', 7),
('20000000-0000-0000-0000-00000000000e', 'funcional', 'Tolerancia a la presión', 'medio', 8),
('20000000-0000-0000-0000-00000000000e', 'funcional', 'Trabajo en equipo', 'alto', 9),
('20000000-0000-0000-0000-00000000000e', 'tecnica', 'Manejo seguro de montacargas.', 'alto', 10),
('20000000-0000-0000-0000-00000000000e', 'tecnica', 'Inspección preoperacional del montacargas', 'alto', 11),
('20000000-0000-0000-0000-00000000000e', 'tecnica', 'Manipulación segura de cargas (peso, altura, tipo de material)', 'alto', 12),
('20000000-0000-0000-0000-00000000000e', 'tecnica', 'Identificación y clasificación de materiales', 'medio', 13),
('20000000-0000-0000-0000-00000000000e', 'tecnica', 'Apoyo a procesos de producción y despacho', 'alto', 14),
('20000000-0000-0000-0000-00000000000f', 'funcional', 'Capacidad de negociación', 'alto', 1),
('20000000-0000-0000-0000-00000000000f', 'funcional', 'Capacidad de supervisión', 'alto', 2),
('20000000-0000-0000-0000-00000000000f', 'funcional', 'Autonomía', 'medio', 3),
('20000000-0000-0000-0000-00000000000f', 'funcional', 'Proactividad', 'alto', 4),
('20000000-0000-0000-0000-00000000000f', 'funcional', 'Liderazgo', 'medio', 5),
('20000000-0000-0000-0000-00000000000f', 'funcional', 'Organización', 'alto', 6),
('20000000-0000-0000-0000-00000000000f', 'funcional', 'Solución de problemas', 'medio', 7),
('20000000-0000-0000-0000-00000000000f', 'funcional', 'Tolerancia a la presión', 'alto', 8),
('20000000-0000-0000-0000-00000000000f', 'funcional', 'Trabajo en equipo', 'alto', 9),
('20000000-0000-0000-0000-00000000000f', 'tecnica', 'Capacidad de inferir respuestas correctas ante problemas complejos de interpretación de datos en procesos produccion.', 'alto', 10),
('20000000-0000-0000-0000-00000000000f', 'tecnica', 'Capacidad de transmitir el conocimiento.', 'medio', 11),
('20000000-0000-0000-0000-00000000000f', 'tecnica', 'Desarrollo de procesos; con aptitud proactiva  que pueda identificar formas de racionalizar los procesos de trabajo.', 'medio', 12),
('20000000-0000-0000-0000-00000000000f', 'tecnica', 'Planificación y ejecución; Contar con una excelente planificación de futuro (prospectiva), análisis de rendimiento y previsión. Comprensión y conocimiento en la manipulación datos.', 'medio', 13),
('20000000-0000-0000-0000-00000000000f', 'tecnica', 'Programas contables, Procesador de texto, hoja de cálculo, generación De presentaciones, correo electrónico.', 'medio', 14),
('20000000-0000-0000-0000-000000000015', 'funcional', 'Capacidad de negociación', 'bajo', 1),
('20000000-0000-0000-0000-000000000015', 'funcional', 'Capacidad de supervisión', 'bajo', 2),
('20000000-0000-0000-0000-000000000015', 'funcional', 'Autonomía', 'medio', 3),
('20000000-0000-0000-0000-000000000015', 'funcional', 'Proactividad', 'alto', 4),
('20000000-0000-0000-0000-000000000015', 'funcional', 'Organización', 'alto', 5),
('20000000-0000-0000-0000-000000000015', 'funcional', 'Solución de problemas', 'medio', 6),
('20000000-0000-0000-0000-000000000015', 'funcional', 'Tolerancia a la presión', 'medio', 7),
('20000000-0000-0000-0000-000000000015', 'funcional', 'Trabajo en equipo', 'alto', 8),
('20000000-0000-0000-0000-000000000015', 'tecnica', 'Capacidad de inferir respuestas correctas ante problemas complejos de interpretación de datos en procesos produccion.', 'bajo', 9),
('20000000-0000-0000-0000-000000000015', 'tecnica', 'Capacidad de transmitir el conocimiento.', 'medio', 10),
('20000000-0000-0000-0000-000000000015', 'tecnica', 'Desarrollo de procesos; Un lider con aptitud proactiva  que pueda identificar formas de racionalizar los procesos de trabajo.', 'medio', 11),
('20000000-0000-0000-0000-000000000015', 'tecnica', 'Planificación y ejecución; Contar con una excelente planificación de futuro (prospectiva), análisis de rendimiento y previsión.Comprención y conocimiento en la manipulación datos.', 'bajo', 12),
('20000000-0000-0000-0000-000000000015', 'tecnica', 'Procesador de texto, hoja de cálculo, generación de presentaciones, correo electrónico.', 'bajo', 13),
('61483566-78ea-46e0-8e11-c19462a50d6d', 'funcional', 'Capacidad de negociación', 'bajo', 1),
('61483566-78ea-46e0-8e11-c19462a50d6d', 'funcional', 'Capacidad de supervisión', 'bajo', 2),
('61483566-78ea-46e0-8e11-c19462a50d6d', 'funcional', 'Autonomía', 'medio', 3),
('61483566-78ea-46e0-8e11-c19462a50d6d', 'funcional', 'Proactividad', 'alto', 4),
('61483566-78ea-46e0-8e11-c19462a50d6d', 'funcional', 'Liderazgo', 'bajo', 5),
('61483566-78ea-46e0-8e11-c19462a50d6d', 'funcional', 'Organización', 'alto', 6),
('61483566-78ea-46e0-8e11-c19462a50d6d', 'funcional', 'Solución de problemas', 'medio', 7),
('61483566-78ea-46e0-8e11-c19462a50d6d', 'funcional', 'Tolerancia a la presión', 'medio', 8),
('61483566-78ea-46e0-8e11-c19462a50d6d', 'funcional', 'Trabajo en equipo', 'alto', 9),
('61483566-78ea-46e0-8e11-c19462a50d6d', 'tecnica', 'Manejo seguro de puente grúa', 'alto', 10),
('61483566-78ea-46e0-8e11-c19462a50d6d', 'tecnica', 'Inspección preoperacional.', 'alto', 11),
('61483566-78ea-46e0-8e11-c19462a50d6d', 'tecnica', 'Manipulación segura de cargas.', 'alto', 12),
('61483566-78ea-46e0-8e11-c19462a50d6d', 'tecnica', 'Identificación y clasificación de materiales.', 'alto', 13),
('61483566-78ea-46e0-8e11-c19462a50d6d', 'tecnica', 'Apoyo a procesos de producción y despacho', 'medio', 14),
('b3595394-b432-487f-900b-c1805d585a45', 'funcional', 'Capacidad de negociación', 'medio', 1),
('b3595394-b432-487f-900b-c1805d585a45', 'funcional', 'Capacidad de supervisión', 'alto', 2),
('b3595394-b432-487f-900b-c1805d585a45', 'funcional', 'Autonomía', 'medio', 3),
('b3595394-b432-487f-900b-c1805d585a45', 'funcional', 'Proactividad', 'alto', 4),
('b3595394-b432-487f-900b-c1805d585a45', 'funcional', 'Liderazgo', 'medio', 5),
('b3595394-b432-487f-900b-c1805d585a45', 'funcional', 'Organización', 'alto', 6),
('b3595394-b432-487f-900b-c1805d585a45', 'funcional', 'Solución de problemas', 'alto', 7),
('b3595394-b432-487f-900b-c1805d585a45', 'funcional', 'Tolerancia a la presión', 'alto', 8),
('b3595394-b432-487f-900b-c1805d585a45', 'funcional', 'Trabajo en equipo', 'alto', 9),
('b3595394-b432-487f-900b-c1805d585a45', 'tecnica', 'Capacidad de inferir respuestas correctas ante problemas complejos de interpretación de datos en procesos produccion.', 'alto', 10),
('b3595394-b432-487f-900b-c1805d585a45', 'tecnica', 'Capacidad de transmitir el conocimiento.', 'alto', 11),
('b3595394-b432-487f-900b-c1805d585a45', 'tecnica', 'Desarrollo de procesos; con aptitud proactiva que pueda identificar formas de racionalizar los procesos de trabajo.', 'alto', 12),
('b3595394-b432-487f-900b-c1805d585a45', 'tecnica', 'Planificación y ejecución; Contar con una excelente planificación de futuro (prospectiva), análisis de rendimiento y previsión.Comprensión y conocimiento en la manipulación datos.', 'alto', 13),
('b3595394-b432-487f-900b-c1805d585a45', 'tecnica', 'Procesador de texto, hoja de cálculo, generación de presentaciones, correo electrónico.', 'alto', 14),
('ce248ca9-d089-45be-bd56-4e34340ff7cf', 'funcional', 'Capacidad de negociación', 'bajo', 1),
('ce248ca9-d089-45be-bd56-4e34340ff7cf', 'funcional', 'Capacidad de supervisión', 'medio', 2),
('ce248ca9-d089-45be-bd56-4e34340ff7cf', 'funcional', 'Autonomía', 'medio', 3),
('ce248ca9-d089-45be-bd56-4e34340ff7cf', 'funcional', 'Proactividad', 'alto', 4),
('ce248ca9-d089-45be-bd56-4e34340ff7cf', 'funcional', 'Liderazgo', 'bajo', 5),
('ce248ca9-d089-45be-bd56-4e34340ff7cf', 'funcional', 'Organización', 'alto', 6),
('ce248ca9-d089-45be-bd56-4e34340ff7cf', 'funcional', 'Solución de problemas', 'medio', 7),
('ce248ca9-d089-45be-bd56-4e34340ff7cf', 'funcional', 'Tolerancia a la presión', 'medio', 8),
('ce248ca9-d089-45be-bd56-4e34340ff7cf', 'funcional', 'Trabajo en equipo', 'alto', 9),
('ce248ca9-d089-45be-bd56-4e34340ff7cf', 'tecnica', 'Interpretación de datos en procesos productivos', 'medio', 10),
('ce248ca9-d089-45be-bd56-4e34340ff7cf', 'tecnica', 'Capacidad de transmitir conocimiento', 'medio', 11),
('ce248ca9-d089-45be-bd56-4e34340ff7cf', 'tecnica', 'Planificación y ejecución (prospectiva, análisis)', 'medio', 12),
('ce248ca9-d089-45be-bd56-4e34340ff7cf', 'tecnica', 'Manejo de herramientas ofimáticas', 'medio', 13),
('d0da7f10-c8af-46a8-90fd-c5278dcdab4b', 'funcional', 'Capacidad de negociación', 'medio', 1),
('d0da7f10-c8af-46a8-90fd-c5278dcdab4b', 'funcional', 'Capacidad de supervisión', 'medio', 2),
('d0da7f10-c8af-46a8-90fd-c5278dcdab4b', 'funcional', 'Autonomía', 'bajo', 3),
('d0da7f10-c8af-46a8-90fd-c5278dcdab4b', 'funcional', 'Proactividad', 'alto', 4),
('d0da7f10-c8af-46a8-90fd-c5278dcdab4b', 'funcional', 'Liderazgo', 'medio', 5),
('d0da7f10-c8af-46a8-90fd-c5278dcdab4b', 'funcional', 'Organización', 'alto', 6),
('d0da7f10-c8af-46a8-90fd-c5278dcdab4b', 'funcional', 'Solución de problemas', 'alto', 7),
('d0da7f10-c8af-46a8-90fd-c5278dcdab4b', 'funcional', 'Tolerancia a la presión', 'alto', 8),
('d0da7f10-c8af-46a8-90fd-c5278dcdab4b', 'funcional', 'Trabajo en equipo', 'alto', 9),
('d0da7f10-c8af-46a8-90fd-c5278dcdab4b', 'tecnica', 'Capacidad de inferir respuestas correctas ante problemas complejos de interpretación de datos en procesos producción.', 'alto', 10),
('d0da7f10-c8af-46a8-90fd-c5278dcdab4b', 'tecnica', 'Capacidad de transmitir el conocimiento.', 'alto', 11),
('d0da7f10-c8af-46a8-90fd-c5278dcdab4b', 'tecnica', 'Desarrollo de procesos; con aptitud proactiva  que pueda identificar formas de racionalizar los procesos de trabajo.', 'alto', 12),
('d0da7f10-c8af-46a8-90fd-c5278dcdab4b', 'tecnica', 'Planificación y ejecución; Contar con una excelente planificación de futuro (prospectiva), análisis de rendimiento y previsión.Comprensión y conocimiento en la manipulación datos.', 'medio', 13),
('d0da7f10-c8af-46a8-90fd-c5278dcdab4b', 'tecnica', 'Procesador de texto, hoja de cálculo, generación de presentaciones, correo electrónico.', 'bajo', 14);

-- ── Habilidades de los 6 cargos completados el 2026-07-30 (Coordinadora
-- Comercial, Asesor/Asistente/Staff Comercial, Coordinador Logístico e
-- Inventarios, Operario Integral de Logística y Producción) ───────────────
insert into cargo_habilidades (cargo_id, tipo, nombre, nivel_esperado, orden) values
('20000000-0000-0000-0000-000000000007', 'funcional', 'Desarrollo de personas', 'alto', 0),
('20000000-0000-0000-0000-000000000007', 'funcional', 'Capacidad de supervisión', 'alto', 1),
('20000000-0000-0000-0000-000000000007', 'funcional', 'Autonomía', 'alto', 2),
('20000000-0000-0000-0000-000000000007', 'funcional', 'Proactividad', 'alto', 3),
('20000000-0000-0000-0000-000000000007', 'funcional', 'Liderazgo', 'alto', 4),
('20000000-0000-0000-0000-000000000007', 'funcional', 'Organización y Planeación', 'alto', 5),
('20000000-0000-0000-0000-000000000007', 'funcional', 'Solución de problemas', 'alto', 6),
('20000000-0000-0000-0000-000000000007', 'funcional', 'Tolerancia a la presión', 'alto', 7),
('20000000-0000-0000-0000-000000000007', 'funcional', 'Trabajo en equipo', 'alto', 8),
('20000000-0000-0000-0000-000000000007', 'tecnica', 'Capacidad de inferir respuestas correctas ante problemas complejos de interpretación de datos en procesos', 'alto', 9),
('20000000-0000-0000-0000-000000000007', 'tecnica', 'Capacidad pedagógica en la transmisión de conocimientos a su equipo de trabajo y otros con interés', 'alto', 10),

('20000000-0000-0000-0000-000000000013', 'funcional', 'Capacidad de negociación', 'alto', 0),
('20000000-0000-0000-0000-000000000013', 'funcional', 'Capacidad de supervisión', 'alto', 1),
('20000000-0000-0000-0000-000000000013', 'funcional', 'Autonomía', 'medio', 2),
('20000000-0000-0000-0000-000000000013', 'funcional', 'Proactividad', 'alto', 3),
('20000000-0000-0000-0000-000000000013', 'funcional', 'Liderazgo', 'medio', 4),
('20000000-0000-0000-0000-000000000013', 'funcional', 'Organización', 'alto', 5),
('20000000-0000-0000-0000-000000000013', 'funcional', 'Solución de problemas', 'medio', 6),
('20000000-0000-0000-0000-000000000013', 'funcional', 'Tolerancia a la presión', 'alto', 7),
('20000000-0000-0000-0000-000000000013', 'funcional', 'Trabajo en equipo', 'alto', 8),
('20000000-0000-0000-0000-000000000013', 'tecnica', 'Capacidad de inferir respuestas correctas ante problemas complejos de interpretación de datos en procesos produccion.', 'alto', 9),
('20000000-0000-0000-0000-000000000013', 'tecnica', 'Capacidad de transmitir el conocimiento.', 'medio', 10),
('20000000-0000-0000-0000-000000000013', 'tecnica', 'Desarrollo de procesos; con aptitud proactiva que pueda identificar formas de racionalizar los procesos de trabajo.', 'medio', 11),
('20000000-0000-0000-0000-000000000013', 'tecnica', 'Planificación y ejecución; Contar con una excelente planificación de futuro (prospectiva), análisis de rendimiento y previsión. Comprensión y conocimiento en la manipulación datos.', 'medio', 12),
('20000000-0000-0000-0000-000000000013', 'tecnica', 'Procesador de texto, hoja de cálculo, generación de presentaciones, correo electrónico.', 'medio', 13),

('20000000-0000-0000-0000-000000000011', 'funcional', 'Capacidad de negociación', 'alto', 0),
('20000000-0000-0000-0000-000000000011', 'funcional', 'Capacidad de supervisión', 'alto', 1),
('20000000-0000-0000-0000-000000000011', 'funcional', 'Autonomía', 'medio', 2),
('20000000-0000-0000-0000-000000000011', 'funcional', 'Proactividad', 'alto', 3),
('20000000-0000-0000-0000-000000000011', 'funcional', 'Liderazgo', 'medio', 4),
('20000000-0000-0000-0000-000000000011', 'funcional', 'Organización', 'alto', 5),
('20000000-0000-0000-0000-000000000011', 'funcional', 'Solución de problemas', 'medio', 6),
('20000000-0000-0000-0000-000000000011', 'funcional', 'Tolerancia a la presión', 'medio', 7),
('20000000-0000-0000-0000-000000000011', 'funcional', 'Trabajo en equipo', 'alto', 8),
('20000000-0000-0000-0000-000000000011', 'tecnica', 'Capacidad de inferir respuestas correctas ante problemas complejos de interpretación de datos en procesos produccion.', 'alto', 9),
('20000000-0000-0000-0000-000000000011', 'tecnica', 'Capacidad de transmitir el conocimiento.', 'medio', 10),
('20000000-0000-0000-0000-000000000011', 'tecnica', 'Desarrollo de procesos; con aptitud proactiva que pueda identificar formas de racionalizar los procesos de trabajo.', 'medio', 11),
('20000000-0000-0000-0000-000000000011', 'tecnica', 'Planificación y ejecución; Contar con una excelente planificación de futuro (prospectiva), análisis de rendimiento y previsión. Comprensión y conocimiento en la manipulación datos.', 'medio', 12),
('20000000-0000-0000-0000-000000000011', 'tecnica', 'Procesador de texto, hoja de cálculo, generación de presentaciones, correo electrónico.', 'medio', 13),

('20000000-0000-0000-0000-000000000012', 'funcional', 'Capacidad de negociación', 'alto', 0),
('20000000-0000-0000-0000-000000000012', 'funcional', 'Capacidad de supervisión', 'alto', 1),
('20000000-0000-0000-0000-000000000012', 'funcional', 'Autonomía', 'medio', 2),
('20000000-0000-0000-0000-000000000012', 'funcional', 'Proactividad', 'alto', 3),
('20000000-0000-0000-0000-000000000012', 'funcional', 'Liderazgo', 'medio', 4),
('20000000-0000-0000-0000-000000000012', 'funcional', 'Organización', 'alto', 5),
('20000000-0000-0000-0000-000000000012', 'funcional', 'Solución de problemas', 'medio', 6),
('20000000-0000-0000-0000-000000000012', 'funcional', 'Tolerancia a la presión', 'medio', 7),
('20000000-0000-0000-0000-000000000012', 'funcional', 'Trabajo en equipo', 'alto', 8),
('20000000-0000-0000-0000-000000000012', 'tecnica', 'Capacidad de inferir respuestas correctas ante problemas complejos de interpretación de datos en procesos produccion.', 'alto', 9),
('20000000-0000-0000-0000-000000000012', 'tecnica', 'Capacidad de transmitir el conocimiento.', 'medio', 10),
('20000000-0000-0000-0000-000000000012', 'tecnica', 'Desarrollo de procesos; con aptitud proactiva que pueda identificar formas de racionalizar los procesos de trabajo.', 'medio', 11),
('20000000-0000-0000-0000-000000000012', 'tecnica', 'Planificación y ejecución; Contar con una excelente planificación de futuro (prospectiva), análisis de rendimiento y previsión. Comprensión y conocimiento en la manipulación datos.', 'medio', 12),
('20000000-0000-0000-0000-000000000012', 'tecnica', 'Procesador de texto, hoja de cálculo, generación de presentaciones, correo electrónico.', 'medio', 13),

('20000000-0000-0000-0000-000000000005', 'funcional', 'Capacidad de negociación', 'medio', 0),
('20000000-0000-0000-0000-000000000005', 'funcional', 'Capacidad de supervisión', 'alto', 1),
('20000000-0000-0000-0000-000000000005', 'funcional', 'Autonomía', 'medio', 2),
('20000000-0000-0000-0000-000000000005', 'funcional', 'Proactividad', 'alto', 3),
('20000000-0000-0000-0000-000000000005', 'funcional', 'Liderazgo', 'medio', 4),
('20000000-0000-0000-0000-000000000005', 'funcional', 'Organización', 'alto', 5),
('20000000-0000-0000-0000-000000000005', 'funcional', 'Solución de problemas', 'alto', 6),
('20000000-0000-0000-0000-000000000005', 'funcional', 'Tolerancia a la presión', 'alto', 7),
('20000000-0000-0000-0000-000000000005', 'funcional', 'Trabajo en equipo', 'alto', 8),
('20000000-0000-0000-0000-000000000005', 'tecnica', 'Capacidad de inferir respuestas correctas ante problemas complejos de interpretación de datos en procesos produccion.', 'alto', 9),
('20000000-0000-0000-0000-000000000005', 'tecnica', 'Capacidad de transmitir el conocimiento.', 'alto', 10),
('20000000-0000-0000-0000-000000000005', 'tecnica', 'Desarrollo de procesos; con aptitud proactiva que pueda identificar formas de racionalizar los procesos de trabajo.', 'alto', 11),
('20000000-0000-0000-0000-000000000005', 'tecnica', 'Planificación y ejecución; Contar con una excelente planificación de futuro (prospectiva), análisis de rendimiento y previsión. Comprensión y conocimiento en la manipulación datos.', 'alto', 12),
('20000000-0000-0000-0000-000000000005', 'tecnica', 'Procesador de texto, hoja de cálculo, generación de presentaciones, correo electrónico.', 'alto', 13),

('1e0a6e97-96eb-474d-8738-f52b407c5e3d', 'funcional', 'Capacidad de negociación', 'bajo', 0),
('1e0a6e97-96eb-474d-8738-f52b407c5e3d', 'funcional', 'Capacidad de supervisión', 'bajo', 1),
('1e0a6e97-96eb-474d-8738-f52b407c5e3d', 'funcional', 'Autonomía', 'medio', 2),
('1e0a6e97-96eb-474d-8738-f52b407c5e3d', 'funcional', 'Proactividad', 'alto', 3),
('1e0a6e97-96eb-474d-8738-f52b407c5e3d', 'funcional', 'Liderazgo', 'bajo', 4),
('1e0a6e97-96eb-474d-8738-f52b407c5e3d', 'funcional', 'Organización', 'alto', 5),
('1e0a6e97-96eb-474d-8738-f52b407c5e3d', 'funcional', 'Solución de problemas', 'medio', 6),
('1e0a6e97-96eb-474d-8738-f52b407c5e3d', 'funcional', 'Tolerancia a la presión', 'medio', 7),
('1e0a6e97-96eb-474d-8738-f52b407c5e3d', 'funcional', 'Trabajo en equipo', 'alto', 8),
('1e0a6e97-96eb-474d-8738-f52b407c5e3d', 'tecnica', 'Manejo seguro de puente grúa', 'alto', 9),
('1e0a6e97-96eb-474d-8738-f52b407c5e3d', 'tecnica', 'Inspección preoperacional.', 'alto', 10),
('1e0a6e97-96eb-474d-8738-f52b407c5e3d', 'tecnica', 'Manipulación segura de cargas.', 'alto', 11),
('1e0a6e97-96eb-474d-8738-f52b407c5e3d', 'tecnica', 'Identificación y clasificación de materiales.', 'alto', 12),
('1e0a6e97-96eb-474d-8738-f52b407c5e3d', 'tecnica', 'Apoyo a procesos de producción y despacho', 'medio', 13);

-- ── Colaboradores ────────────────────────────────────────────────────────
-- No se cargan aquí: esta copia de demostración restaura los colaboradores
-- (y todo lo que depende de ellos: evaluaciones, hoja de vida, Ser, etc.)
-- desde la base real, ya con nombres, documentos, correos y teléfonos
-- reemplazados por datos ficticios. Ver el resumen entregado con esta copia.
--
-- (bloque original de colaboradores y salarios reales, quitado de esta copia)

-- ── Ciclo de evaluación inicial (2026 - Semestre 1) ────────────────────────
insert into ciclos_evaluacion (id, empresa_id, nombre, fecha_apertura, fecha_cierre_respuestas, estado)
values ('40000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001','2026 - Semestre 1', current_date, current_date + 21, 'planeado');

-- ── Cursos base de Nexa aplicados a SST (Tabla 3 de la propuesta de alianza) ──
insert into nexa_cursos (empresa_id, titulo, categoria, duracion_minutos, puntos_otorgados) values
('00000000-0000-0000-0000-000000000001','Inducción SST general', 'induccion_sst', 45, 50),
('00000000-0000-0000-0000-000000000001','Manejo seguro de alturas', 'alturas', 60, 80),
('00000000-0000-0000-0000-000000000001','Manejo de cargas y montacargas', 'manejo_cargas', 40, 60),
('00000000-0000-0000-0000-000000000001','Uso correcto de EPP', 'epp', 20, 30),
('00000000-0000-0000-0000-000000000001','Protocolos de emergencia y evacuación', 'protocolos_emergencia', 30, 40);

-- Nota: usuarios de auth.users y perfiles_usuario se crean vía Supabase Auth
-- (signup / invite), no por seed directo, para respetar el flujo de auth real.

-- ── Perfil de cargo completo: Asistente Comercial (cargado 2026-08-06 desde
--    "PERFIL DE CARGO ASISTENTE COMERCIAL QUICENO.xlsx", hoja "ASESOR COMERCIAL J",
--    FORSST 61 v2. Completa los campos SG-SST que quedaron NULL en la carga
--    inicial del 2026-07-30 y las tablas cargo_funciones_principales,
--    cargo_factores_riesgo, cargo_examenes_medicos y cargo_epp, que hasta hoy
--    estaban vacías para todos los cargos. ────────────────────────────────────
update cargos set
  tipo_area = 'administrativa',
  edad_minima = 20,
  edad_maxima = 40,
  responsabilidad_bienes_servicios = 'alto',
  responsabilidad_informacion = 'alto',
  responsabilidad_relaciones_interpersonales = 'alto',
  responsabilidad_direccion_coordinacion = 'bajo',
  sgsst_responsabilidades_generales = '1. Procurar el cuidado integral de su salud.
2. Suministrar información Clara, veraz y completa sobre su estado de salud
3. Cumplir las normas, reglamentos e instrucciones del Sistema de Gestión de la Seguridad y Salud en el Trabajo de la empresa
4. Informar oportunamente al empleador o contratante acerca de los peligros y riesgos latentes en su sitio de trabajo
5. Participar en las actividades de capacitación en seguridad y salud en el trabajo definido en el plan de capacitación del SG-SST.
6. Participar y contribuir al cumplimiento de los objetivos del Sistema de Gestión de la Seguridad y Salud en el Trabajo SG-SST.
* Ejecutar las actividades asignadas bajo las condiciones de Seguridad.
* Reportar y hacer seguimiento sobre el mantenimiento de las maquinas, equipos y actividades realizadas por parte de FNV.
* Reportar condiciones y actos inseguros al personal de seguridad de la empresa (COPASST, Lider de Talento Humano y SST)
* Participar en las auditorias e inspecciones que se programen y se requiera su presencia.
* Identificar las necesidades y requerimientos de condiciones de seguridad de las areas en que participa FNV
* Participar en la investigación de los incidentes que sucedan en FNV o a su personal a cargo.
* Garantizar la salud y seguridad de las personas a su cargo.
* Reportar de forma inmediata incidentes, accidentes, enfermedades laborales, actos, condiciones inseguras y situaciones de emergencia que se pueden presentar, proponiendo soluciones potenciales.
* Asegurar el cumplimiento de los requisitos legales, reglamentarios, estandares y/o procedimientos designados para las actividades propias de FNV
* Dar cumplimiento a las políticas del SG-SST, apoyar al cumplimiento de los objetivos y metas.',
  sgsst_responsabilidades_campo = '1. Asegurarse en todo momento de que las herramientas, maquinaria, dispositivos y demás elementos que intervengan en la operación estén instalados correctamente y que su funcionamiento sea adecuado.
2. No manejar ningún tipo de maquinaria o automóvil, ni desarrollar ningún procedimiento si no ha sido autorizado ni esta consciente de los riesgos que para el trabajador como para sus compañeros y para la operación en general se generen por esta causa.
3. Participar activamente en las charlas de seguridad realizadas en campo.
4. Identificar plenamente los riegos generales del trabajo, así como los específicos de la locación en donde se encuentre trabajando, definiendo las medidas necesarias para su control.',
  sgsst_rendicion_cuentas = '* Rinde cuentas al Líder de SST en caso de reportar actos y condiciones inseguras en el comportamiento de los trabajadores, reportar quejas o reclamos en materia de SST, accidentes, incidentes, situaciones de emergencia.',
  sgsst_autoridad = '* Suspender cualquier actividad que atente contra la seguridad del personal.
* Exigir el uso adecuado de los elementos de protección personal EPP y adopción de actos y condiciones seguras, por parte de los trabajadores de FNV.
* Exigir el cumplimiento de los requisitos legales, procedimientos, estándares, reglamentos aplicables y suscritos a todo el personal que labora en FNV',
  recursos_seleccion = 'Examen médico, Entrevista, Hoja de vida, Prueba psicotécnica'
where id = '20000000-0000-0000-0000-000000000011';

insert into cargo_funciones_principales (cargo_id, proceso, funcion, tipo_phva, periodicidad, herramientas, orden) values
('20000000-0000-0000-0000-000000000011', 'Comercial', 'Atender y recibir las solicitudes de los clientes con los que venía anteriormente, de forma presencial y telefónica (llamada o WhatsApp), brindando asesorías sobre nuestros servicios y productos, con un lenguaje verbal y físico adecuado', 'H', 'Diaria', 'Herramientas tecnológicas y personal humano.', 0),
('20000000-0000-0000-0000-000000000011', 'Comercial', 'Previo a brindar información sobre los productos, validar en el sistema y en la sede autopista la existencia del material requerido por el cliente.', 'H', 'Diaria', 'Herramientas tecnológicas y personal humano.', 1),
('20000000-0000-0000-0000-000000000011', 'Comercial', 'Realizar las cotizaciones solicitadas, con los datos indicados para el respectivo registro del potencial cliente que le corresponde atender, de tal forma que se tengan los datos correctos en el sistema de la compañía. Tener claridad y efectividad al realizarlas.', 'H', 'Diaria', 'Software de la compañía (Sistemas Kontrol) - hojas, impresiones - Teléfono celular', 2),
('20000000-0000-0000-0000-000000000011', 'Comercial', 'Entrega oportuna de las cotizaciones, realizar seguimiento y cierre de venta con clientes fijos.', 'H', 'Diaria', 'Software de la compañía (Sistemas Kontrol) - hojas, impresiones - Teléfono celular', 3),
('20000000-0000-0000-0000-000000000011', 'Comercial', 'Validar el pago oportuno de la venta: 50% para iniciar la gestión de producción, 50% para despachar.', 'V', 'Diaria', 'Software de la compañía (Sistemas Kontrol) - hojas, impresiones - Teléfono celular', 4),
('20000000-0000-0000-0000-000000000011', 'Comercial', 'Realizar recibos de caja de los clientes fijos y también de los clientes de su jefe inmediato.', 'V', 'Diaria', 'Software de la compañía (Sistemas Kontrol) - hojas, impresiones - Teléfono celular', 5),
('20000000-0000-0000-0000-000000000011', 'Comercial', 'Notificar al área de producción del contrato de suministro, enviar por correo electrónico dicho contrato con el soporte del pago del 50% de la venta, para que se pueda proceder con el servicio adquirido.', 'H', 'Diaria', 'Software de la compañía (Sistemas Kontrol) - Correo electrónico - Celular.', 6),
('20000000-0000-0000-0000-000000000011', 'Comercial', 'Trazabilidad de los contratos de suministro', 'H', 'Diaria', 'Ofimática y software de la compañía (Sistemas Kontrol, Softland)', 7),
('20000000-0000-0000-0000-000000000011', 'Comercial', 'Cuando la venta requiera de mano de obra e instalación, debe realizar la solicitud de toma de medidas y seguimiento a la misma, al área de producción.', 'H', 'Diaria', 'Formato lista de chequeo (Toma de medidas)', 8),
('20000000-0000-0000-0000-000000000011', 'Comercial', 'Verificar lugar disponible para las instalaciones: debe concertar con el cliente el requerimiento para realizar la toma de medidas, el despacho o la instalación.', 'H', 'Diaria', 'Software de la compañía (Sistemas Kontrol) - Correo electrónico - Celular.', 9),
('20000000-0000-0000-0000-000000000011', 'Comercial', 'Revisar actas de entrega y verificación de instalación', 'H', 'Diaria', 'Teléfono, celular, PC.', 10),
('20000000-0000-0000-0000-000000000011', 'Comercial', 'En la atención de clientes que le corresponde, si requiere pasar a planta, hacerlos firmar el protocolo de seguridad; el cliente debe estar usando casco y zapatos cerrados. Todas las asesoras deben usar de manera permanente sus EPP (botas y casco) para el ingreso a esa área.', 'H', 'Diaria', 'Herramientas EPP y personal humano.', 11),
('20000000-0000-0000-0000-000000000011', 'Comercial', 'Cliente que pase a la planta debe estar bajo su acompañamiento, no dejarlos solos, para evitar accidentes.', 'H', 'Diaria', 'Herramientas EPP y personal humano.', 12),
('20000000-0000-0000-0000-000000000011', 'Comercial', 'Apoyar al área administrativa y de cartera: en lo relacionado al cobro proactivo de la cartera.', 'P', 'Mensual', 'Teléfono, celular, PC, correo corporativo, internet', 13),
('20000000-0000-0000-0000-000000000011', 'Comercial', 'Aseguramiento del ingreso, mantener al día formatos', 'H', 'Diaria', 'Teléfono, celular, PC, correo corporativo, internet', 14),
('20000000-0000-0000-0000-000000000011', 'Comercial', 'Mantener al día la lista de chequeo en atención a sus clientes y clientes de la gerencia comercial y su jefe inmediata.', 'V', 'Diaria', 'Teléfono, celular, PC, correo corporativo, internet', 15),
('20000000-0000-0000-0000-000000000011', 'Comercial', 'Orden y aseo en el puesto de trabajo', 'H', 'Diaria', 'Teléfono, celular, PC, correo corporativo, internet', 16),
('20000000-0000-0000-0000-000000000011', 'Comercial', 'Verificar la satisfacción del cliente que le corresponde atender (ya sea de los anteriores o los de su jefe inmediato y de la gerencia comercial)', 'V', 'Mensual', 'Teléfono, celular, PC, correo corporativo, internet', 17),
('20000000-0000-0000-0000-000000000011', 'Comercial', 'La efectividad en el manejo del pipeline de la compañía.', 'V', 'Mensual', 'Teléfono, celular, PC, correo corporativo, internet', 18),
('20000000-0000-0000-0000-000000000011', 'Comercial', 'Ofrecer servicio posventa (mantenimiento preventivo a la instalación).', 'V', 'Mensual', 'Teléfono, celular, PC, correo corporativo, internet', 19),
('20000000-0000-0000-0000-000000000011', 'Comercial', 'Cumplir con las normatividades e indicaciones entregadas, entre las que se encuentran las políticas de la compañía, Reglamento Interno de Trabajo, Reglamento de Higiene y Seguridad Industrial, Política SST Flow, Nexus y Visión y otras funciones inherentes al cargo. Estas no son límite para otras asignadas por sus superiores.', 'V', 'Mensual', 'Teléfono, celular, PC, correo corporativo, internet', 20),
('20000000-0000-0000-0000-000000000011', 'Comercial', 'Atender clientes, realizar las cotizaciones, recibos de caja, contratos de suministro, facturas de los clientes de su jefe inmediato.', 'H', 'Diaria', 'Teléfono, celular, PC, correo corporativo, internet', 21),
('20000000-0000-0000-0000-000000000011', 'Comercial', 'Realizar las listas de chequeo de los clientes de su jefe inmediato.', 'H', 'Diaria', 'Teléfono, celular, PC, correo corporativo, internet', 22),
('20000000-0000-0000-0000-000000000011', 'Comercial', 'Atender los clientes de sala y de obras del la gerencia comercial cuando sea requerido. Además de gestionar la labor administrativa de cotizaciones, recibos de caja, contratos de suministro y facturas.', 'H', 'Ocasional', 'Teléfono, celular, PC, correo corporativo, internet', 23),
('20000000-0000-0000-0000-000000000011', 'Comercial', 'Elaborar y hacer seguimiento al pago de las cotizaciones ejecutadas.', 'H', 'Diaria', 'Teléfono, celular, PC, correo corporativo, internet', 24),
('20000000-0000-0000-0000-000000000011', 'Comercial', 'Visitar las obras en los casos que sea requerido', 'V', 'Mensual', 'Teléfono, celular, PC, correo corporativo, internet', 25),
('20000000-0000-0000-0000-000000000011', 'Comercial', 'Comunicarse con las obras a ejecutar de su jefe inmediato, para realizar toda la gestión necesaria para inicio, realización de cotizaciones, contratos de suministro, recibos de caja y facturas, y activar los procesos necesarios para que fluya la ejecución de la misma.', 'H', null, 'Teléfono, celular, PC, correo corporativo, internet', 26),
('20000000-0000-0000-0000-000000000011', 'Comercial', 'Revisar y atender los requerimientos de las obras para ser atendidos oportunamente.', 'V', 'Diaria', 'Teléfono, celular, PC, correo corporativo, internet', 27),
('20000000-0000-0000-0000-000000000011', 'Comercial', 'Realizar la planeación de las entregas de los materiales a manera de control de obras', 'H', 'Diaria', 'Teléfono, celular, PC, correo corporativo, internet', 28);

insert into cargo_factores_riesgo (cargo_id, factor, categoria, efectos_posibles, orden) values
('20000000-0000-0000-0000-000000000011', 'QUÍMICO: presencia de material particulado en el ambiente.', 'quimico', 'Alergias respiratorias.', 0),
('20000000-0000-0000-0000-000000000011', 'MECÁNICO: manipulación de puertas de estantes, oficinas, equipos de impresión, de cómputo.', 'mecanico', 'Heridas leves.', 1),
('20000000-0000-0000-0000-000000000011', 'LOCATIVO: condiciones de orden y aseo.', 'locativo', 'Golpes, lesiones menores, dificultad ante la necesidad de evacuar.', 2),
('20000000-0000-0000-0000-000000000011', 'ERGONÓMICO: posición sentado con inclinación de región cervical, movimientos repetitivos.', 'ergonomico', 'Fatiga osteomuscular a nivel cervical, lumbar o coccígeo. Síndromes en diferentes articulaciones empleadas al digitar.', 3),
('20000000-0000-0000-0000-000000000011', 'PSICOSOCIAL: naturaleza de las funciones del cargo desempeñado', 'psicosocial', 'Trastornos de sueño, estrés, ansiedad.', 4),
('20000000-0000-0000-0000-000000000011', 'FÍSICO: ruido proveniente de dispositivos de sonido o de la calle, radiación emitida por el PC.', 'fisico', 'Desconcentración, estrés, fatiga visual, golpes.', 5),
('20000000-0000-0000-0000-000000000011', 'ELÉCTRICO: sobrecarga de tomacorrientes.', 'otro', 'Quemaduras de 1er, 2do o 3er grado, electrocución, shock, muerte.', 6),
('20000000-0000-0000-0000-000000000011', 'BIOLÓGICO: exposición a enfermedades originadas por condiciones laborales (virus)', 'biologico', 'Enfermedades infectocontagiosas.', 7);

insert into cargo_examenes_medicos (cargo_id, momento, nombre_examen, orden) values
('20000000-0000-0000-0000-000000000011', 'ingreso', 'Examen médico con énfasis osteomuscular', 0),
('20000000-0000-0000-0000-000000000011', 'ingreso', 'Detección drogas de abuso', 1),
('20000000-0000-0000-0000-000000000011', 'ingreso', 'Paraclínicos: Visiometría, Audiometría, Espirometría, Glicemia, Perfil lipídico', 2),
('20000000-0000-0000-0000-000000000011', 'ingreso', 'Mayores de 50 años: Electrocardiograma', 3),
('20000000-0000-0000-0000-000000000011', 'periodico', 'Examen médico con énfasis osteomuscular', 0),
('20000000-0000-0000-0000-000000000011', 'periodico', 'Detección drogas de abuso', 1),
('20000000-0000-0000-0000-000000000011', 'periodico', 'Paraclínicos: Visiometría, Audiometría, Espirometría, Glicemia, Perfil lipídico', 2),
('20000000-0000-0000-0000-000000000011', 'periodico', 'Mayores de 50 años: Electrocardiograma', 3),
('20000000-0000-0000-0000-000000000011', 'retiro', 'Examen médico con énfasis osteomuscular', 0),
('20000000-0000-0000-0000-000000000011', 'retiro', 'Detección drogas de abuso', 1),
('20000000-0000-0000-0000-000000000011', 'retiro', 'Paraclínicos: Visiometría, Audiometría, Espirometría, Glicemia, Perfil lipídico', 2),
('20000000-0000-0000-0000-000000000011', 'retiro', 'Mayores de 50 años: Electrocardiograma', 3);

insert into cargo_epp (cargo_id, item, orden) values
('20000000-0000-0000-0000-000000000011', 'Uniforme administrativo', 0),
('20000000-0000-0000-0000-000000000011', 'Botas de seguridad punteras dieléctricas', 1),
('20000000-0000-0000-0000-000000000011', 'Casco de seguridad', 2),
('20000000-0000-0000-0000-000000000011', 'Protectores auditivos: inserción', 3);
