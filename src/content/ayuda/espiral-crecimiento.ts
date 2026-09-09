import type { ModuloAyuda } from '@/types/ayuda';

export const moduloEspiralCrecimiento: ModuloAyuda = {
  slug: 'espiral-crecimiento',
  titulo: 'Espiral de Crecimiento 360°',
  descripcion:
    'El corazón del sistema: valoración de las cuatro dimensiones (Ser, Saber, Hacer, Deber), ciclos, fichas de colaboradores y planes de desarrollo.',
  paginas: [
    {
      slug: 'colaboradores',
      ruta: '/espiral-crecimiento/colaboradores',
      titulo: 'Colaboradores',
      resumen:
        'Listado de personas de la empresa. Un líder ve solo su equipo (por eso el título cambia a "Mi equipo"); admin_th y gerencia ven a todos.',
      camposYBotones: [
        { nombre: 'Fila de la tabla', explicacion: 'Foto, nombre, cargo, área, estado y fecha de ingreso. Clic en una fila abre la ficha 360° de esa persona.' },
        { nombre: 'Nuevo colaborador', explicacion: 'Solo admin_th. Lleva a Administración → Usuarios para crear cuenta y ficha.' },
      ],
    },
    {
      slug: 'ficha-colaborador',
      ruta: '/espiral-crecimiento/colaboradores/*',
      titulo: 'Ficha del colaborador',
      resumen:
        'La vista 360° de una persona: sus cuatro dimensiones de un vistazo (Ser, Saber, Hacer, Deber), su perfil de cargo, su hoja de vida y su Plan de Desarrollo.',
      camposYBotones: [
        { nombre: 'Tarjeta SER', explicacion: 'Indica si la Guía del Flow está completa. Lleva a la pantalla de Guía del Flow.' },
        { nombre: 'Tarjeta SABER', explicacion: '% de cumplimiento del perfil de cargo (formación, habilidades, certificaciones, experiencia). Lleva a Verificación de Saber.' },
        { nombre: 'Tarjetas HACER / DEBER', explicacion: 'Último índice calculado y su semáforo (Alto/Medio/Bajo), según el Encuentro de Crecimiento más reciente.' },
        { nombre: 'Perfil de cargo', explicacion: 'Objetivo del cargo y si tiene personal a cargo (definido en Administración → Cargos).' },
        { nombre: 'Hoja de vida y certificaciones', explicacion: 'Formación, cursos y certificaciones cargadas, con fecha de vencimiento si aplica.' },
        { nombre: 'Inducción', explicacion: '% de avance del plan de inducción de la persona (comunes + específicos del cargo). Lleva al checklist completo.' },
        { nombre: 'Plan de Desarrollo Individual', explicacion: 'Las acciones de desarrollo activas de la persona, con su origen (Hacer/Deber/Saber/Ser) y estado.' },
        { nombre: 'Documentos y certificado laboral', explicacion: 'Solo visible para admin_th y el propio colaborador. Lleva a la hoja de vida, el contrato, las afiliaciones (EPS/ARL/AFP/caja de compensación) y el generador del certificado laboral.' },
        { nombre: 'Incapacidades', explicacion: 'Solo visible para admin_th y el propio colaborador. Incapacidades y licencias registradas (enfermedad, accidente laboral, maternidad/paternidad), con su soporte adjunto.' },
        { nombre: 'Ver historial y línea de tiempo', explicacion: 'Solo visible para admin_th y el líder directo. Lleva a movimientos de cargo, sanciones y, si aplica, entrevista de salida.' },
        { nombre: 'Fechas especiales', explicacion: 'Solo visible para admin_th y el líder directo. Cumpleaños, día de la profesión o cualquier otra fecha que valga la pena celebrar de esta persona — la propia persona también puede agregar las suyas desde Mi Perfil.' },
      ],
      notas: [
        'Quién puede ver esta ficha: admin_th y gerencia (todas), líder (su equipo directo y él mismo), colaborador (solo la propia).',
      ],
    },
    {
      slug: 'verificacion-saber',
      ruta: '/espiral-crecimiento/colaboradores/*/saber',
      titulo: 'Verificación de Saber',
      resumen:
        'Compara lo que exige el cargo (formación, habilidades, certificaciones, experiencia) contra lo que realmente tiene la persona, bloque por bloque.',
      camposYBotones: [
        { nombre: 'Recuadro "Exige el cargo"', explicacion: 'Lo que quedó definido en el perfil del cargo (Administración → Cargos), como referencia para verificar.' },
        { nombre: 'Checklist por bloque', explicacion: 'Formación académica, habilidades funcionales/técnicas, certificaciones y experiencia. Cada ítem se marca como Cumple, Parcial o No cumple.' },
      ],
      notas: [
        'Puede editar: admin_th y el líder directo de la persona. El propio colaborador y gerencia solo consultan.',
      ],
    },
    {
      slug: 'hoja-vida',
      ruta: '/espiral-crecimiento/colaboradores/*/hoja-vida',
      titulo: 'Hoja de vida y certificaciones',
      resumen: 'Registro de la formación, cursos y certificaciones de una persona, con fecha de vencimiento cuando aplica.',
      camposYBotones: [
        { nombre: 'Agregar registro', explicacion: 'Título, tipo (formación/curso/certificación), fechas y vencimiento si corresponde.' },
      ],
      notas: ['Solo Talento Humano (admin_th) puede cargar o editar estos registros; los demás roles solo consultan.'],
    },
    {
      slug: 'guia-del-flow',
      ruta: '/espiral-crecimiento/colaboradores/*/guia-flow',
      titulo: 'Guía del Flow (dimensión Ser)',
      resumen:
        'La Guía del Flow (diseñada por FlowAndo, se genera en la app hermana guiadelflow) es un regalo íntimo del colaborador y le llega por fuera de este sistema — Espiral de Crecimiento nunca guarda el PDF ni los aspectos psicológicos/emocionales, para ningún rol. Lo que sí vive aquí son dos informes cortos generados por IA, a partir solo de los 18 aspectos con relevancia laboral (talentos, propósito, liderazgo, comunicación, trabajo en equipo, compromiso, adaptación al cambio, negociación, recursividad).',
      camposYBotones: [
        { nombre: 'Generar invitación', explicacion: 'admin_th, o el líder directo de esta persona. Crea un link único (con un token, no con su correo ni su nombre) y lo muestra con botón de copiar. Cuando la persona lo abre, completa el cuestionario en guiadelflow y genera su Guía, sus 18 aspectos y los dos informes se cargan aquí solos — este es el camino recomendado.' },
        { nombre: 'Crear / Nueva aplicación', explicacion: 'admin_th, o el líder directo. Abre un nuevo registro de Guía del Flow para la persona a mano — respaldo para cuando no se usó una invitación (por ejemplo, aplicaciones anteriores a esta integración). No lo uses si ya existe una aplicación cargada: cada clic crea una nueva y la más reciente es la que se muestra, así que puede tapar una que ya tenía datos.' },
        { nombre: 'Puntaje por aspecto (1-5)', explicacion: 'admin_th o el líder directo, y solo de los 18 aspectos con relevancia laboral — los 12 aspectos psicológicos/íntimos ni siquiera aparecen aquí. Se llena solo si la persona usó una invitación; si no, se carga a mano.' },
        { nombre: 'Generar informes con IA', explicacion: 'admin_th o el líder directo. A partir de esos puntajes genera dos textos distintos: uno para el líder (enfoque de PDI) y otro para el propio colaborador (recordatorio de fortalezas y áreas de desarrollo). Con invitación, esto también queda automático.' },
      ],
      notas: [
        'admin_th y el líder directo ven y hacen exactamente lo mismo en esta pantalla (invitar, cargar puntajes, generar informes) — la única diferencia es que el líder solo puede hacerlo con su propio equipo. El colaborador ve una pantalla distinta: solo su propio informe (nunca el del líder, ni el PDF, ni el desglose de aspectos) — su Guía del Flow completa la recibió aparte.',
        'Si alguien completó el cuestionario pero no aparece nada acá, revisa Administración → Sincronizaciones Guía del Flow: ahí queda registrado incluso cuando no hubo invitación y el correo no coincidió con ningún colaborador.',
      ],
    },
    {
      slug: 'historial',
      ruta: '/espiral-crecimiento/colaboradores/*/historial',
      titulo: 'Historial y línea de tiempo',
      resumen: 'Movimientos de cargo (ascensos, traslados, cambios de área), sanciones, y para Talento Humano, la entrevista de salida si la persona se retira.',
      camposYBotones: [
        { nombre: 'Línea de tiempo', explicacion: 'Cada movimiento con tipo, fecha, cargo anterior y nuevo, y descripción.' },
        { nombre: 'Movimiento "Sanción"', explicacion: 'Además de fecha y descripción, pide la gravedad (leve / grave / gravísima) y permite adjuntar el soporte o descargo firmado.' },
        { nombre: 'Movimiento "Salida"', explicacion: 'Pide el motivo (renuncia voluntaria, despido, fin de contrato, mutuo acuerdo, jubilación u otro). Al guardarlo, en un solo paso: la ficha queda con estado "Inactivo" y esa fecha/motivo registrados, y si la persona tenía cuenta de acceso, se retira automáticamente (ver Administración → Usuarios y roles) — no hace falta ir aparte a retirarla.' },
        { nombre: 'Entrevista de salida', explicacion: 'Solo visible y editable por admin_th. Se diligencia cuando la persona sale de la empresa — es un formulario aparte de solo registrar el movimiento "Salida".' },
      ],
      notas: [
        'Acceso exclusivo: admin_th (toda la empresa) y el líder directo (su equipo, sin ver la entrevista de salida). Gerencia y el propio colaborador no tienen acceso a esta pantalla.',
      ],
    },
    {
      slug: 'incapacidades',
      ruta: '/espiral-crecimiento/colaboradores/*/incapacidades',
      titulo: 'Incapacidades',
      resumen:
        'Registro de incapacidades y licencias: enfermedad general, accidente laboral, enfermedad laboral, licencia de maternidad o paternidad — con la entidad que la certifica (EPS o ARL) y el soporte adjunto.',
      camposYBotones: [
        { nombre: 'Tipo', explicacion: 'Enfermedad general, accidente laboral, enfermedad laboral, licencia de maternidad, licencia de paternidad, u otra.' },
        { nombre: 'Fecha de inicio / fin', explicacion: 'Los días se calculan solos (inclusive el día de inicio y el de fin).' },
        { nombre: 'Entidad que certifica', explicacion: 'EPS (enfermedad general) o ARL (accidente/enfermedad laboral) — texto libre.' },
        { nombre: 'Soporte adjunto', explicacion: 'El certificado de incapacidad en PDF o imagen (opcional al registrar).' },
      ],
      notas: [
        'Dato de salud, sensible: solo lo administran admin_th, y lo consulta también la propia persona (desde aquí o desde Mi Perfil) — ni siquiera el líder directo tiene acceso, igual que Documentos.',
        'No se guarda el diagnóstico médico como texto — si hace falta el detalle, queda en el soporte adjunto, no en un campo abierto de la base de datos.',
      ],
    },
    {
      slug: 'fechas-especiales',
      ruta: '/espiral-crecimiento/colaboradores/*/fechas-especiales',
      titulo: 'Fechas especiales',
      resumen:
        'Lista abierta de fechas personalizadas de esta persona — cumpleaños, día de su profesión, cualquier aniversario que valga la pena celebrar —, cada una con una descripción libre.',
      camposYBotones: [
        { nombre: 'Descripción y fecha', explicacion: 'Texto libre (ej. "Día del profesional en Contaduría") más una fecha, que se repite cada año.' },
        { nombre: 'Agregar', explicacion: 'Suma una fecha nueva a la lista, sin límite de cuántas.' },
        { nombre: 'Eliminar (ícono de basura)', explicacion: 'Quita esa fecha de la lista, pidiendo confirmación primero.' },
      ],
      notas: [
        'Puede administrar las fechas de esta persona: admin_th y su líder directo. La propia persona administra las suyas desde Mi Perfil, no desde aquí.',
        'Cada fecha genera una alerta con el próximo aniversario, visible en Alertas — si editas o eliminas la fecha, la alerta se actualiza o desaparece con ella.',
      ],
    },
    {
      slug: 'induccion',
      ruta: '/espiral-crecimiento/colaboradores/*/induccion',
      titulo: 'Inducción',
      resumen:
        'Checklist de inducción de la persona: los puntos comunes a toda la empresa (propósito, visión, principios y valores) más los específicos de su cargo (funciones, riesgos SST, EPP, exámenes de ingreso, formación mínima) — generados automáticamente a partir del perfil de cargo y de la Identidad Organizacional.',
      camposYBotones: [
        { nombre: 'Barra de avance', explicacion: 'Muestra qué porcentaje del plan de inducción ya se cumplió.' },
        { nombre: 'Casilla de cada punto', explicacion: 'Marca un punto como cumplido — queda registrado quién lo marcó y cuándo.' },
      ],
      notas: [
        'Puede marcar puntos como cumplidos: admin_th o el líder directo de la persona. El propio colaborador y gerencia solo consultan.',
        'Al registrar un ingreso en el Historial, se asignan automáticamente los puntos comunes + los del cargo. Al registrar un cambio de cargo, solo se agregan los puntos del cargo nuevo (no se repiten los comunes).',
      ],
    },
    {
      slug: 'documentos',
      ruta: '/espiral-crecimiento/colaboradores/*/documentos',
      titulo: 'Documentos y certificado laboral',
      resumen:
        'La hoja de vida (el archivo del CV) y el contrato de la persona, y el generador del certificado laboral en PDF. No confundir con "Hoja de vida y certificaciones", que es el registro de formación/certificaciones con fecha de vencimiento.',
      camposYBotones: [
        { nombre: 'Hoja de vida', explicacion: 'Sube o reemplaza el archivo (PDF/Word) de la hoja de vida de la persona.' },
        { nombre: 'Contrato', explicacion: 'Sube o reemplaza el archivo del contrato, y registra el salario — el salario es la fuente que usa el certificado laboral. El archivo es opcional si solo quieres actualizar el salario.' },
        { nombre: 'Incluir el salario', explicacion: 'Casilla que decide si el certificado laboral que descargues trae o no el salario.' },
        { nombre: 'Afiliaciones', explicacion: 'EPS, ARL, fondo de pensiones (AFP) y caja de compensación de la persona — texto libre por campo.' },
        { nombre: 'Descargar PDF (certificado laboral)', explicacion: 'Genera al momento el certificado, con el logo de la empresa y los datos configurados en Administración → Configuración.' },
      ],
      notas: [
        'Sección de manejo exclusivo de Talento Humano y del propio colaborador — ni siquiera el líder directo tiene acceso, porque el contrato trae el salario.',
        'Solo admin_th puede subir/reemplazar archivos o cambiar el salario; el colaborador solo consulta lo suyo.',
      ],
    },
    {
      slug: 'ciclos',
      ruta: '/espiral-crecimiento/ciclos',
      titulo: 'Ciclos de Crecimiento',
      resumen:
        'Hacer y Deber se valoran por ciclos (normalmente semestrales); Ser y Saber se verifican de forma continua, sin ciclo.',
      camposYBotones: [
        { nombre: 'Abrir nuevo ciclo', explicacion: 'Solo admin_th. Crea un ciclo con nombre, fechas de apertura/cierre y las ponderaciones vigentes (definidas en Administración → Configuración).' },
        { nombre: 'Tarjeta de ciclo', explicacion: 'Nombre, estado (Planeado/Abierto/En consolidación/Publicado/Cerrado) y rango de fechas. Clic para entrar al detalle.' },
      ],
    },
    {
      slug: 'detalle-ciclo',
      ruta: '/espiral-crecimiento/ciclos/*',
      titulo: 'Detalle de un ciclo',
      resumen:
        'Muestra las ponderaciones vigentes del ciclo y el avance de cada colaborador en crecimiento, con acceso directo a su Brief y su Acuerdo de crecimiento.',
      camposYBotones: [
        { nombre: 'Panel de generación de Encuentros de Crecimiento', explicacion: 'Solo admin_th. Genera las tareas de valoración (autoevaluación, líder, pares, colaboradores a cargo) para todo el equipo de un líder o para personas específicas.' },
        { nombre: 'Tabla de Encuentros de Crecimiento', explicacion: 'Por persona: % de avance, resultado de Hacer y Deber con semáforo, y enlaces a Brief y Acuerdo (admin_th y líder).' },
      ],
      proceso: [
        'admin_th crea el ciclo desde "Abrir nuevo ciclo".',
        'admin_th usa el panel de generación de Encuentros de Crecimiento para crear las tareas de cada acompañante.',
        'Cada acompañante (autoevaluación, líder, pares, colaboradores a cargo) completa su valoración en la pantalla "Valorar".',
        'El líder prepara el Brief antes de la retroalimentación.',
        'En la sesión de retroalimentación, se registran los compromisos en el Acuerdo de crecimiento y ambas partes firman.',
      ],
    },
    {
      slug: 'evaluar',
      ruta: '/espiral-crecimiento/evaluar/*',
      titulo: 'Valorar (Hacer / Deber)',
      resumen:
        'El formulario donde cada acompañante (autoevaluación, líder, par, o colaborador a cargo) valora los comportamientos observables del colaborador en crecimiento durante el período.',
      camposYBotones: [
        { nombre: 'Ítems por bloque (Hacer/Deber)', explicacion: 'Cada ítem tiene una nota y, opcionalmente, una observación en texto libre.' },
        { nombre: 'Guardado automático', explicacion: 'Cada respuesta se guarda al instante y recalcula el resultado — no hace falta un botón de "enviar todo" al final.' },
      ],
      notas: ['Si el Encuentro de Crecimiento no tiene ítems generados, pide a Talento Humano que la regenere desde el detalle del ciclo.'],
    },
    {
      slug: 'brief',
      ruta: '/espiral-crecimiento/evaluaciones/*/brief',
      titulo: 'Brief de retroalimentación',
      resumen: 'Material de preparación del líder antes de la sesión de retroalimentación con su colaborador. Es privado: solo lo ve quien lo escribe y Talento Humano.',
      camposYBotones: [
        { nombre: 'Talento central', explicacion: 'Lo más fuerte de la persona, para abrir la conversación desde ahí.' },
        { nombre: 'Resumen de Hacer / Resumen de Deber', explicacion: 'Los puntos más relevantes de cada resultado.' },
        { nombre: 'Sugerencias de enfoque', explicacion: 'Cómo abordar la conversación y qué priorizar.' },
      ],
      notas: ['El brief es manual — no se autogenera; lo redacta el líder o admin_th antes de la reunión.'],
    },
    {
      slug: 'acuerdo-crecimiento',
      ruta: '/espiral-crecimiento/evaluaciones/*/acuerdo',
      titulo: 'Acuerdo de crecimiento',
      resumen: 'Los compromisos que quedan de la sesión de retroalimentación, tanto de la persona como de la empresa, con su firma.',
      camposYBotones: [
        { nombre: 'Compromisos del colaborador / de la empresa', explicacion: 'Editables por admin_th y el líder directo.' },
        { nombre: 'Firma', explicacion: 'Cada parte (colaborador y líder) firma con una casilla + fecha — no es una firma dibujada.' },
      ],
    },
    {
      slug: 'organigrama-consulta',
      ruta: '/espiral-crecimiento/organigrama',
      titulo: 'Organigrama',
      resumen: 'Vista jerárquica de la empresa, en árbol. Explica la regla automática de quién acompaña a quién.',
      notas: [
        'Regla de acompañantes: el líder es quien está justo arriba en el organigrama; los pares comparten el mismo líder; los colaboradores a cargo son quienes reportan directamente al colaborador en crecimiento.',
      ],
    },
    {
      slug: 'indicadores',
      ruta: '/espiral-crecimiento/indicadores',
      titulo: 'Indicadores',
      resumen: 'Panorama de la empresa: índices de Hacer y Deber, cumplimiento de Saber, alineación talento-rol, rotación de personal, y un mapa comparativo por equipo.',
      camposYBotones: [
        { nombre: 'Mapa de equipos', explicacion: 'Gráfico que compara Hacer, Deber y Saber promedio de cada equipo (agrupado por líder).' },
        { nombre: 'Tasa de rotación anual', explicacion: 'Porcentaje de personas que salieron en los últimos 12 meses, sobre quienes ya estaban activos hace 12 meses. Sale "—" si todavía no hay suficiente antigüedad registrada para calcularla.' },
        { nombre: 'Rotación voluntaria', explicacion: 'La misma tasa, pero contando solo las salidas registradas con motivo "Renuncia voluntaria" en el Historial de la ficha.' },
        { nombre: 'Salidas último año / Salidas voluntarias', explicacion: 'El conteo bruto de personas que salieron en los últimos 12 meses (total y solo voluntarias), sin convertir a porcentaje.' },
        { nombre: 'Tendencia de salidas (12 meses)', explicacion: 'Gráfico de líneas mes a mes, comparando el total de salidas contra las voluntarias.' },
      ],
      notas: [
        'Estos datos salen solos del movimiento "Salida" que ya se registra en el Historial de cada ficha (fecha y motivo) — no hay que capturar nada aparte para que la rotación se calcule.',
      ],
    },
    {
      slug: 'pdi',
      ruta: '/espiral-crecimiento/pdi',
      titulo: 'Planes de Desarrollo Individual (PDI)',
      resumen:
        'El entregable central del Encuentro de Crecimiento, en forma de tablero kanban: cada acción de desarrollo indica si la brecha viene de Hacer, Deber, Saber, Ser, o es mixta, y se arrastra entre columnas según su estado.',
      camposYBotones: [
        { nombre: 'Columnas del tablero', explicacion: 'Pendiente, En curso, Cumplido y Vencido — son fijas (no configurables, a diferencia del tablero de Procesos y Sistemas de Gestión).' },
        { nombre: 'Arrastrar tarjeta', explicacion: 'Mueve el PDI a otra columna para cambiar su estado. Al soltarlo en "Cumplido" se guarda automáticamente la fecha de cumplimiento.' },
        { nombre: 'Origen (badge de color)', explicacion: 'De qué dimensión viene la brecha detectada (Hacer/Deber/Saber/Ser/Mixto).' },
        { nombre: 'Insignia "Automático"', explicacion: 'Marca los PDI que generó solo el sistema (ver nota siguiente), para distinguirlos de los que redactó admin_th o el líder a mano.' },
        { nombre: 'Fecha de compromiso en rojo', explicacion: 'Se resalta en rojo cuando ya venció y la tarjeta todavía no está en la columna "Cumplido".' },
      ],
      notas: [
        'Un colaborador solo ve su propio PDI (y puede arrastrar sus propias tarjetas para reportar avance); admin_th, líder y gerencia ven el de su alcance correspondiente. Gerencia ve el tablero de solo lectura, sin poder arrastrar.',
        'Motor automático de brechas: cuando un Encuentro de Crecimiento queda 100% respondido y el semáforo de Hacer o de Deber sale en "bajo", el sistema crea aquí un PDI automático y asigna al colaborador los cursos de Nexa configurados para esa dimensión — sin que nadie tenga que redactarlo a mano. Los cursos que dispara cada dimensión se configuran en Administración → Configuración.',
      ],
    },
  ],
};
