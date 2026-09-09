-- ============================================================================
-- carga_perfil_auxiliar_inventarios.sql
-- Generado a partir de PERFIL_AUXILIAR_DE_INVENTARIOS_2026.xlsx (FORSST 61)
-- Completa el perfil de cargo ya existente en el seed con TODO el contenido
-- del documento oficial: SST, funciones, decisiones, riesgos, exámenes, EPP.
-- Ejecutar DESPUÉS de las migraciones 0001-0009.
-- ============================================================================

update cargos set
  codigo_documento = 'FORSST 61',
  version_documento = '3',
  fecha_documento = '2026-05-06',
  tipo_area = 'operativa',
  genero_requerido = 'Indiferente',
  salario = 'A convenir',
  competencias_cardinales = 'Aprendizaje continuo, planeación y organización del trabajo, trabajo en equipo y colaboración, comunicación efectiva, responsabilidad y compromiso.',
  experiencia_minima_meses = 12,
  formacion_minima_induccion = 'Minimo inducción previa de 30 días. Excel, indicadores, sistemas de información, herramientas de producción, control estadístico de procesos, organización documental.',
  cargos_a_los_que_reporta = 'Coordinador logístico e inventario',
  cargos_que_le_reportan = 'Cargos con los que coordina actividades; Operarios de producción, operarios de máquina de corte, transportadores y asesores comerciales.',
  manejo_dinero = 'No aplica',
  toma_decisiones_organizacionales = 'Priorizar la ejecución de conteos físicos, identificar y reportar diferencias de inventario, validar documentación de ingreso y salida de materiales, solicitar correcciones de registros cuando se detecten inconsistencias, informar novedades relacionadas con inventarios y despachos.',
  cambios_documentales = 'Coordinador logístico e inventario',
  responsabilidad_bienes_servicios = 'alto',
  responsabilidad_informacion = 'alto',
  responsabilidad_relaciones_interpersonales = 'alto',
  responsabilidad_direccion_coordinacion = 'medio',
  sgsst_responsabilidades_generales = '1. Procurar el cuidado integral de su salud física y mental, así como la de las demás personas que puedan verse afectadas por sus actos u omisiones durante el desarrollo de sus actividades laborales.
2. Suministrar información clara, veraz, completa y oportuna sobre su estado de salud cuando sea requerida para el cumplimiento de las actividades del SG-SST.
3. Cumplir las normas, reglamentos, procedimientos, estándares e instrucciones establecidas por la organización en materia de Seguridad y Salud en el Trabajo.
4. Informar oportunamente al empleador sobre los peligros, riesgos, condiciones inseguras, actos inseguros o cualquier situación que pueda afectar la seguridad y salud de los trabajadores.
5. Participar activamente en las capacitaciones, entrenamientos, simulacros y demás actividades programadas dentro del Plan de Capacitación del SG-SST.
6. Contribuir al cumplimiento de los objetivos, metas, programas y actividades definidas dentro del Sistema de Gestión de Seguridad y Salud en el Trabajo.
7. Ejecutar las labores asignadas bajo condiciones seguras de trabajo, utilizando adecuadamente los elementos de protección personal y siguiendo los procedimientos establecidos.
8. Reportar oportunamente las necesidades de mantenimiento, reparación o intervención de maquinaria, equipos, herramientas e instalaciones, y realizar seguimiento a las acciones implementadas.
9. Reportar de manera inmediata los incidentes, accidentes de trabajo, enfermedades laborales, emergencias, actos y condiciones inseguras al jefe inmediato y al área de Seguridad y Salud en el Trabajo.
10. Informar y comunicar oportunamente las condiciones y actos inseguros al COPASST, al Líder de Seguridad y Salud en el Trabajo o al área de Gestión Humana, según corresponda.
11. Participar en las inspecciones, auditorías, investigaciones y demás actividades de seguimiento y control del SG-SST cuando sea requerida su intervención.
12. Identificar y comunicar las necesidades relacionadas con las condiciones de seguridad y salud de las áreas donde desarrolla sus actividades.
13. Participar en la investigación de incidentes, accidentes de trabajo y demás eventos relacionados con la seguridad y salud laboral cuando sea convocado.
14. Cumplir los requisitos legales, reglamentarios, estándares internos y procedimientos aplicables a las actividades desarrolladas por la organización.
15. Apoyar el desarrollo, mantenimiento y mejora continua del Sistema de Gestión de Seguridad y Salud en el Trabajo.
16. Ser responsable de reportar oportunamente y realizar seguimiento a los mantenimientos preventivos y correctivos de las máquinas, equipos y herramientas asignadas para el desarrollo de sus funciones.',
  sgsst_responsabilidades_campo = 'Verificar antes de iniciar las actividades que las herramientas, equipos, maquinaria y demás elementos requeridos para la operación se encuentren en condiciones seguras de uso.
Cumplir los procedimientos de trabajo seguro establecidos por la organización y abstenerse de operar equipos, herramientas o vehículos para los cuales no cuente con autorización, capacitación o competencia.
Participar activamente en las capacitaciones, charlas de seguridad, inspecciones y demás actividades programadas dentro del Sistema de Gestión de Seguridad y Salud en el Trabajo.
Identificar, reportar y contribuir al control de los peligros y riesgos presentes en las áreas donde desarrolla sus actividades.',
  sgsst_rendicion_cuentas = 'Rinde cuentas al Líder de Seguridad y Salud en el Trabajo y/o Jefe Inmediato respecto a:

Reporte de actos y condiciones inseguras.
Accidentes e incidentes de trabajo.
Situaciones de emergencia.
Cumplimiento de procedimientos de seguridad.
Participación en actividades del SG-SST.
Quejas, sugerencias o necesidades relacionadas con la Seguridad y Salud en el Trabajo.',
  sgsst_autoridad = 'Suspender actividades cuando identifique una condición de riesgo inminente que pueda afectar la integridad de las personas, informando inmediatamente al jefe inmediato.

Suspender actividades relacionadas con inventarios o almacenamiento cuando identifique condiciones que representen riesgo inminente para las personas, materiales o instalaciones.

Solicitar la implementación de medidas de control cuando identifique peligros o condiciones inseguras.

Solicitar el cumplimiento de los procedimientos, estándares y normas de seguridad establecidos por la organización.',
  recursos_seleccion = 'Examen Médico, Entrevista, Hoja de Vida, Prueba psicotécnica'
where id = '20000000-0000-0000-0000-00000000000b';

delete from cargo_habilidades where cargo_id = '20000000-0000-0000-0000-00000000000b';

insert into cargo_habilidades (cargo_id, tipo, nombre, nivel_esperado, orden) values
('20000000-0000-0000-0000-00000000000b', 'funcional', 'Capacidad de negociación', 'medio', 1),
('20000000-0000-0000-0000-00000000000b', 'funcional', 'Capacidad de supervisión', 'alto', 2),
('20000000-0000-0000-0000-00000000000b', 'funcional', 'Autonomía', 'medio', 3),
('20000000-0000-0000-0000-00000000000b', 'funcional', 'Proactividad', 'alto', 4),
('20000000-0000-0000-0000-00000000000b', 'funcional', 'Liderazgo', 'medio', 5),
('20000000-0000-0000-0000-00000000000b', 'funcional', 'Organización', 'alto', 6),
('20000000-0000-0000-0000-00000000000b', 'funcional', 'Solución de problemas', 'alto', 7),
('20000000-0000-0000-0000-00000000000b', 'funcional', 'Tolerancia a la presión', 'alto', 8),
('20000000-0000-0000-0000-00000000000b', 'funcional', 'Trabajo en equipo', 'alto', 9),
('20000000-0000-0000-0000-00000000000b', 'tecnica', 'Capacidad de inferir respuestas correctas ante problemas complejos de interpretación de datos en procesos produccion.', 'alto', 101),
('20000000-0000-0000-0000-00000000000b', 'tecnica', 'Capacidad de transmitir el conocimiento.', 'alto', 102),
('20000000-0000-0000-0000-00000000000b', 'tecnica', 'Desarrollo de procesos; con aptitud proactiva  que pueda identificar formas de racionalizar los procesos de trabajo.', 'alto', 103),
('20000000-0000-0000-0000-00000000000b', 'tecnica', 'Planificación y ejecución; Contar con una excelente planificación de futuro (prospectiva), análisis de rendimiento y previsión.Comprensión y conocimiento en la manipulación datos.', 'alto', 104),
('20000000-0000-0000-0000-00000000000b', 'tecnica', 'Procesador de texto, hoja de cálculo, generación de presentaciones, correo electrónico.', 'alto', 105);

insert into cargo_funciones_principales (cargo_id, proceso, funcion, tipo_phva, periodicidad, herramientas, orden) values
('20000000-0000-0000-0000-00000000000b', 'Logística e Inventarios', 'Registrar en el sistema (Kardex) los movimientos diarios de entradas, salidas, consumos y traslados de materiales.', 'H', 'Diaria', 'Excel, PC, internet', 1),
('20000000-0000-0000-0000-00000000000b', 'Logística e Inventarios', 'Recibir, verificar y entregar materiales, productos, asegurando que cumplan con las condiciones de cantidad, calidad, estado y asimismo realizar el Checklist de verificaciòn de entrega.', 'H', 'Ocasional', 'Checklist de verificación, documentos soporte, EPP', 2),
('20000000-0000-0000-0000-00000000000b', 'Logística e Inventarios', 'Elaborar y gestionar documentos de inventario (informe de recepción, remisiones, traslados, devoluciones, en (Kontrol).', 'H', 'Diaria', 'Software Kontrol, PC, impresora, Excel', 3),
('20000000-0000-0000-0000-00000000000b', 'Logística e Inventarios', 'Mantener actualizado el control de inventarios físicos y sistematizados, realizando conciliaciones periódicas.', 'H', 'Diaria', 'Excel, software de inventarios, Kardex, informes físicos, PC', 4),
('20000000-0000-0000-0000-00000000000b', 'Logística e Inventarios', 'Atender llamadas, correos electrónicos y mensajes relacionados con el área de inventarios.', 'H', 'Diaria', 'Teléfono móvil, PC, correo electrónico (Outlook), WhatsApp empresarial', 5),
('20000000-0000-0000-0000-00000000000b', 'Logística e Inventarios', 'Coordinar despachos de materiales con clientes y transportadores, garantizando entregas oportunas.', 'H', 'Diaria', 'Teléfono, correo electrónico, WhatsApp, software de inventarios.', 6),
('20000000-0000-0000-0000-00000000000b', 'Logística e Inventarios', 'Informar oportunamente al jefe inmediato y a la coordinadora de importaciones sobre novedades de inventario como, faltantes, sobrantes, daños o materiales críticos.', 'H', 'Ocasional', 'WhatsApp, correo electrónico, software de inventarios, reportes internos', 7),
('20000000-0000-0000-0000-00000000000b', 'Logística e Inventarios', 'Realizar traslados entre almacén y producción de la compañía en Kontrol, y registrar en el Kardex', 'H', 'Ocasional', 'Software Kontrol, Kardex, PC, formatos de movimiento interno', 8),
('20000000-0000-0000-0000-00000000000b', 'Logística e Inventarios', 'Elaborar órdenes de compra para la adquisición de materiales nacionales según requerimientos del inventario u operación.', 'H', 'Ocasional', 'PC, correo electrónico, software de inventario, formatos de compra', 9),
('20000000-0000-0000-0000-00000000000b', 'Logística e Inventarios', 'Mantener actualizado y organizado el archivo físico de la Bodega 002.', 'H', 'Diaria', 'Archivadores, carpetas, PC, escáner', 10),
('20000000-0000-0000-0000-00000000000b', 'Logística e Inventarios', 'Atender y recibir clientes cuando sea necesario, brindando apoyo en la presentación de los materiales disponibles.', 'H', 'Ocasional', 'Muestras físicas de material, catálogos, PC, espacio de exhibición', 11),
('20000000-0000-0000-0000-00000000000b', 'Logística e Inventarios', 'Apoyar la apertura y cierre de la bodega, asegurando el cumplimiento de los protocolos de seguridad.', 'H', 'Ocasional', 'Llaves, candados, protocolos de seguridad', 12),
('20000000-0000-0000-0000-00000000000b', 'Logística e Inventarios', 'Coordinar o delegar tareas al personal de planta cuando se requiera, garantizando el cumplimiento oportuno de las actividades operativas.', 'H', 'Ocasional', 'Comunicación verbal, órdenes de trabajo, radio', 13),
('20000000-0000-0000-0000-00000000000b', 'Logística e Inventarios', 'Operar el puente grúa cuando sea necesario, garantizando el manejo seguro de los materiales según los procedimientos establecidos.', 'H', 'Ocasional', 'Puente grúa, control, EPP', 14),
('20000000-0000-0000-0000-00000000000b', 'Logística e Inventarios', 'Vigilar y controlar el acceso en la puerta principal (puerta vidriera), garantizando la seguridad de la bodega y del personal.', 'H', 'Diaria', 'Control visual, cámaras de seguridad', 15);

insert into cargo_decisiones (cargo_id, descripcion, periodicidad, orden) values
('20000000-0000-0000-0000-00000000000b', 'Determinar el trabajador encargado de realizar el despacho de acuerdo con la programación operativa y las necesidades del área.', 'Diario', 1),
('20000000-0000-0000-0000-00000000000b', 'Distribuir funciones relacionadas con cargue, descargue, almacenamiento, organización e inventario de los compañeros a cargo del Coordinador de lógistico e inventarios cuando se requiera.', 'Diario', 2),
('20000000-0000-0000-0000-00000000000b', 'Definir el vehículo más adecuado para realizar la entrega de materiales o productos.', 'Diario', 3),
('20000000-0000-0000-0000-00000000000b', 'Determinar el orden en el que deben ser preparados y despachados los pedidos programados.', 'Diario', 4),
('20000000-0000-0000-0000-00000000000b', 'Verificar y aprobar la salida de mercancía de la bodega conforme a los controles establecidos.', 'Diario', 5),
('20000000-0000-0000-0000-00000000000b', 'Asignar el espacio adecuado para el almacenamiento de productos o materiales dentro de la bodega, cuando se requiera.', 'Diario', 6),
('20000000-0000-0000-0000-00000000000b', 'Informar diferencias encontradas entre el inventario físico y el registrado en el sistema.', 'Ocasional', 7),
('20000000-0000-0000-0000-00000000000b', 'Determinar la necesidad de solicitar nuevos materiales o productos para mantener la operación.', 'Ocasional', 8),
('20000000-0000-0000-0000-00000000000b', 'Notificacar, devolución o reporte de mercancía nacional averiada o en mal estado', 'Ocasional', 9),
('20000000-0000-0000-0000-00000000000b', 'Detener actividades que representen riesgo para la seguridad y salud de los trabajadores.', 'Ocasional', 10);

insert into cargo_factores_riesgo (cargo_id, factor, categoria, efectos_posibles, orden) values
('20000000-0000-0000-0000-00000000000b', 'QUÍMICO: Exposición a material particulado, polvo generado en los procesos productivos y sustancias presentes en el ambiente de trabajo.', 'quimico', 'Irritación ocular y respiratoria, alergias, enfermedades respiratorias ocupacionales.', 1),
('20000000-0000-0000-0000-00000000000b', 'MECÁNICO: Manipulación de materiales, herramientas, equipos, cargas y contacto con elementos cortantes o puntos de atrapamiento.', 'mecanico', 'Golpes, heridas, contusiones, fracturas, atrapamientos y amputaciones.', 2),
('20000000-0000-0000-0000-00000000000b', 'LOCATIVO: Superficies irregulares, obstáculos en zonas de tránsito, condiciones de orden y aseo.', 'locativo', 'Caídas al mismo nivel, golpes y contusiones.', 3),
('20000000-0000-0000-0000-00000000000b', 'ERGONÓMICO: Manipulación manual de cargas, movimientos repetitivos, posturas prolongadas o forzadas.', 'ergonomico', 'Fatiga muscular, lumbalgias, lesiones osteomusculares y trastornos musculoesqueléticos.', 4),
('20000000-0000-0000-0000-00000000000b', 'PSICOSOCIAL: Demandas propias del cargo, y cumplimiento de metas.', 'psicosocial', 'Estrés laboral, fatiga mental y disminución de la concentración.', 5),
('20000000-0000-0000-0000-00000000000b', 'FÍSICO: Exposición a ruido, vibraciones, cambios de temperatura y superficies calientes.', 'fisico', 'Hipoacusia, fatiga, estrés térmico y quemaduras leves.', 6),
('20000000-0000-0000-0000-00000000000b', 'BIOLÓGICO: Contacto con personal externo o exposición a agentes biológicos presentes en el entorno laboral.', 'biologico', 'Enfermedades infectocontagiosas.', 7),
('20000000-0000-0000-0000-00000000000b', 'CONDICIONES DE SEGURIDAD – TRÁNSITO INTERNO Y MOVILIZACIÓN DE CARGAS: Desplazamiento de materiales dentro de la planta y zonas de cargue y descargue.', 'seguridad_transito', 'Golpes, atropellamientos, atrapamientos, lesiones graves o fatales.', 8),
('20000000-0000-0000-0000-00000000000b', 'CONDICIONES DE SEGURIDAD – ALMACENAMIENTO Y MOVILIZACIÓN DE MATERIALES: Manipulación, inspección y control de materiales almacenados en bodega y áreas operativas.', 'seguridad_almacenamiento', 'Golpes, atrapamientos, caídas de objetos, lesiones musculoesqueléticas y accidentes durante actividades de almacenamiento.', 9);

insert into cargo_examenes_medicos (cargo_id, momento, nombre_examen, orden) values
('20000000-0000-0000-0000-00000000000b', 'ingreso', 'Examen medico con énfasis osteomuscular', 1),
('20000000-0000-0000-0000-00000000000b', 'ingreso', 'Concepto para tareas de riesgo: ALTURAS', 2),
('20000000-0000-0000-0000-00000000000b', 'ingreso', 'Detección drogas de abuso', 3),
('20000000-0000-0000-0000-00000000000b', 'ingreso', 'PARACLINICOS: Visiometria, Audiometría, Espirometria, Glicemia, Perfil lipídico', 4),
('20000000-0000-0000-0000-00000000000b', 'ingreso', 'Mayores de 50 años: Electrocardiograma', 5),
('20000000-0000-0000-0000-00000000000b', 'periodico', 'Examen medico con énfasis osteomuscular', 6),
('20000000-0000-0000-0000-00000000000b', 'periodico', 'Concepto para tareas de riesgo: ALTURAS', 7),
('20000000-0000-0000-0000-00000000000b', 'periodico', 'Detección drogas de abuso', 8),
('20000000-0000-0000-0000-00000000000b', 'periodico', 'PARACLINICOS: Visiometria, Audiometría, Espirometria, Glicemia, Perfil lipídico', 9),
('20000000-0000-0000-0000-00000000000b', 'periodico', 'Mayores de 50 años: Electrocardiograma', 10),
('20000000-0000-0000-0000-00000000000b', 'periodico', 'Rx de tórax con lectura ILO', 11),
('20000000-0000-0000-0000-00000000000b', 'periodico', 'Prueba de Tuberculina', 12),
('20000000-0000-0000-0000-00000000000b', 'retiro', 'Examen medico con énfasis osteomuscular', 13),
('20000000-0000-0000-0000-00000000000b', 'retiro', 'Concepto para tareas de riesgo: ALTURAS', 14),
('20000000-0000-0000-0000-00000000000b', 'retiro', 'Detección drogas de abuso', 15),
('20000000-0000-0000-0000-00000000000b', 'retiro', 'PARACLINICOS: Visiometria, Audiometría, Espirometria, Glicemia, Perfil lipídico', 16),
('20000000-0000-0000-0000-00000000000b', 'retiro', 'Mayores de 50 años: Electrocardiograma', 17);

insert into cargo_epp (cargo_id, item, orden) values
('20000000-0000-0000-0000-00000000000b', 'Uniforme Administrativo', 1),
('20000000-0000-0000-0000-00000000000b', 'Tapabocas N95', 2),
('20000000-0000-0000-0000-00000000000b', 'Botas de Seguridad con puntera', 3),
('20000000-0000-0000-0000-00000000000b', 'Casco de seguridad', 4);
