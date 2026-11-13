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
        { nombre: 'Importar incapacidades (admin_th)', explicacion: 'Carga masiva de incapacidades y licencias para empresas con muchas novedades (por ejemplo desde el archivo de nómina): descargas la plantilla, la llenas con una incapacidad por fila —documento del colaborador, tipo, fecha de inicio, fecha de fin y entidad EPS/ARL— y la subes. Ves una revisión fila por fila antes de guardar; los días se calculan solos, las que ya existen se omiten y te avisa si alguna se cruza con otra de la misma persona. Máximo 500 por archivo. No hay columna de diagnóstico a propósito (dato de salud sensible); el soporte PDF se adjunta después en la ficha de cada persona. Solo lo hace admin_th.' },
        { nombre: 'Importar desde Excel (admin_th)', explicacion: 'Carga masiva de la planta de personal: descargas una plantilla (con los cargos de tu empresa en lista desplegable), la llenas con una persona por fila —nombre, cargo y fecha de ingreso son obligatorios— y la subes. Antes de guardar ves una revisión fila por fila con lo que se importará, lo que tiene errores y lo que se omite porque su documento ya existe. Máximo 200 personas por archivo. Crea las fichas (con su historial de ingreso e inducción), no las cuentas de acceso.' },
        { nombre: 'Exportar a Excel', explicacion: 'Descarga un .xlsx con documento, nombre, cargo, área, líder, ingreso, estado, tipo de contrato, correo y teléfono de las personas que puedes ver (el líder solo exporta su equipo). La tabla también muestra el número de documento.' },
        { nombre: 'Fila de la tabla', explicacion: 'Foto, nombre, cargo, área, estado y fecha de ingreso. Clic en una fila abre la ficha 360° de esa persona.' },
        { nombre: 'Filtros de la lista', explicacion: 'Encima de la tabla hay cuatro herramientas: (1) una casilla para buscar por nombre, sin importar tildes ni mayúsculas; (2) «Todos los cargos», para ver solo a quienes tienen un cargo; (3) «Todos los líderes», para elegir el nombre de un líder y ver únicamente a las personas que tiene a cargo (el contador dice «Equipo de [nombre]: N personas»); y (4) la casilla «Solo líderes de área», que muestra a quienes tienen un cargo con personal a cargo o a quienes alguien tiene como líder directo (llevan la etiqueta «Líder de área»). Se pueden combinar. «Limpiar filtros» vuelve a mostrar a todos y debajo dice «Mostrando X de Y personas».' },
        { nombre: 'Nuevo colaborador', explicacion: 'Solo admin_th. Abre el alta de la ficha: datos personales, cargo, líder directo, fecha de ingreso, contrato, salario y afiliaciones (también puedes cargar la hoja de vida en PDF para prellenar los datos con IA). Al crearla, el ingreso queda en el historial y se asigna el plan de inducción. También llegas aquí desde "Contratado — crear colaborador" en Reclutamiento, con los datos del candidato ya llenos. El acceso para iniciar sesión se crea aparte, en Administración → Usuarios y roles.' },
        { nombre: 'Líder directo y equipo (en Nuevo colaborador)', explicacion: 'El líder es obligatorio para que la persona quede en el organigrama al instante; si no tiene líder (gerencia / nivel 1) marca la casilla que lo indica. Si la persona es líder, en «Personas que tendrá a cargo» marcas a quienes pasan a reportarle.' },
        { nombre: 'Equipo a cargo (en la ficha)', explicacion: 'Solo admin_th. Botón de la ficha que abre el editor de equipo de esa persona en Administración → Organigrama.' },
        { nombre: 'Eliminar', explicacion: 'Solo admin_th. Borra la ficha con todo lo asociado y es solo para corregir errores (ficha duplicada). Antes de borrar pide un motivo (opcional) y guarda un registro en «Histórico de eliminados» con nombre, documento, cargo, líder, fechas y su línea de tiempo. Si la persona aún lidera a alguien, no se deja eliminar hasta reasignar su equipo. Para quien simplemente dejó la empresa usa «Salida» desde su Historial.' },
        { nombre: 'Histórico de eliminados', explicacion: 'Solo admin_th. Lista de quienes pasaron por la empresa y cuya ficha se eliminó, con motivo y trayectoria. No se borra sola.' },
      ],
    },
    {
      slug: 'colaborador-nuevo',
      ruta: '/espiral-crecimiento/colaboradores/nuevo',
      titulo: 'Nuevo colaborador',
      resumen:
        'Crea la ficha de una persona con sus datos personales, cargo, líder, contrato y afiliaciones. Desde la ficha creada se cargan después la hoja de vida y certificaciones, la inducción, los documentos, las incapacidades y las fechas especiales. Solo admin_th.',
      camposYBotones: [
        { nombre: 'Vincular a una cuenta de acceso existente (opcional)', explicacion: 'Si ya creaste la cuenta de login en Usuarios y roles pero la persona no tiene ficha, elígela aquí para que cuenta y ficha queden unidas. Un aviso amarillo te dice cuántas cuentas hay sin ficha.' },
        { nombre: 'Datos personales', explicacion: 'Nombre completo (obligatorio), número de documento, teléfono y correo. Hay una carga de hoja de vida en PDF que lee con IA el nombre, documento, correo y teléfono para prellenar estos campos.' },
        { nombre: 'Cargo y organigrama', explicacion: 'El cargo es obligatorio (sale de Administración → Cargos; si no hay ninguno, primero crea uno). El líder directo es obligatorio salvo para gerencia («Sin líder asignado»). También puedes marcar a quienes pasan a reportarle a esta persona.' },
        { nombre: 'Contrato', explicacion: 'Fecha de ingreso (obligatoria), estado (período de prueba, activo, inactivo o en proceso de salida), tipo de contrato (indefinido, término fijo, obra o labor, prestación de servicios, empleado en misión, aprendizaje en sus etapas, pasantía o externo) y salario. Debajo del tipo de contrato te muestra hasta qué fecha llega el período de prueba (2 meses en indefinido; en término fijo, la quinta parte de la duración con máximo 2 meses).' },
        { nombre: 'Afiliaciones (SG-SST)', explicacion: 'EPS, ARL, AFP (pensión) y caja de compensación. Son datos de referencia para el certificado laboral; el sistema no los valida contra ninguna entidad.' },
      ],
      notas: [
        'Si llegas desde Reclutamiento con un candidato seleccionado, los datos del candidato vienen ya prellenados y su hoja de vida pasa a los documentos del colaborador.',
        'Al crear la ficha se deja el ingreso en el historial y se asigna el plan de inducción (puntos comunes de la empresa más los del cargo).',
        'Para cargar a toda la planta de una vez usa «Importar desde Excel» en la lista de Colaboradores.',
      ],
    },
    {
      slug: 'colaborador-editar',
      ruta: '/espiral-crecimiento/colaboradores/*/editar',
      titulo: 'Editar colaborador',
      resumen:
        'Cambia los datos de una ficha existente: datos personales, cargo, líder, contrato y afiliaciones. Solo admin_th. Los campos son los mismos de «Nuevo colaborador».',
      camposYBotones: [
        { nombre: 'Datos personales, cargo y líder', explicacion: 'Nombre, documento, teléfono, correo, cargo y líder directo. El cambio se refleja de inmediato en la ficha, el organigrama y los informes, porque todos leen la ficha en vivo.' },
        { nombre: 'Contrato y estado', explicacion: 'Fecha de ingreso, estado, tipo de contrato (con el cálculo del fin del período de prueba) y salario. Para registrar la salida de una persona usa «Salida» en su Historial, no el estado.' },
        { nombre: 'Afiliaciones (SG-SST)', explicacion: 'EPS, ARL, AFP y caja de compensación.' },
        { nombre: 'Carga de hoja de vida con IA', explicacion: 'Sube un PDF para que la IA lea nombre, documento, correo y teléfono y los proponga; revisa antes de guardar.' },
      ],
    },
    {
      slug: 'colaboradores-historico',
      ruta: '/espiral-crecimiento/colaboradores/historico',
      titulo: 'Histórico de colaboradores eliminados',
      resumen:
        'Constancia de las fichas que se eliminaron: quién pasó por la empresa, con qué cargo y por qué se eliminó. La lista no se borra sola. Solo admin_th.',
      camposYBotones: [
        { nombre: 'Buscador y filtro por cargo', explicacion: 'Busca por nombre o documento y filtra por cargo.' },
        { nombre: 'Datos de cada registro', explicacion: 'Nombre, documento, cargo, líder que tenía y el motivo de la eliminación.' },
      ],
      notas: [
        'Eliminar una ficha es definitivo y está pensado para corregir errores (por ejemplo una ficha duplicada). Si la persona simplemente dejó la empresa, usa «Salida» en su Historial: queda inactiva y sigue en Colaboradores.',
      ],
    },
    {
      slug: 'colaboradores-importar',
      ruta: '/espiral-crecimiento/colaboradores/importar',
      titulo: 'Importar colaboradores desde Excel',
      resumen:
        'Carga masiva de la planta de personal (hasta 200 personas por archivo), por ejemplo desde el ERP de nómina. Antes de guardar ves una revisión fila por fila. Solo admin_th.',
      camposYBotones: [
        { nombre: '1. Descargar plantilla', explicacion: 'Un .xlsx con los cargos de tu empresa en lista desplegable, listas de tipos de contrato y estados, y una hoja de instrucciones.' },
        { nombre: '2. Subir y revisar', explicacion: 'Obligatorios: nombre completo, cargo (ya creado) y fecha de ingreso (día/mes/año). Opcionales: documento, correo, teléfono, líder (nombre o documento), tipo de contrato, estado, salario, EPS, ARL, AFP y caja. Ves qué filas están listas, cuáles tienen errores (con el motivo) y cuáles se omiten porque su documento ya existe.' },
        { nombre: '3. Importar', explicacion: 'Guarda solo las filas correctas, con su historial de ingreso y su plan de inducción. Los líderes se enlazan al final, por nombre o documento.' },
      ],
      notas: [
        'No crea cuentas de acceso, solo fichas. Las cuentas se crean aparte en Usuarios y roles.',
        'Si el cargo del Excel no existe, la fila queda con error: no se crean cargos nuevos a escondidas.',
        'Puedes volver a subir el archivo corregido: las personas ya importadas se omiten solas por su documento.',
      ],
    },
    {
      slug: 'importar-incapacidades',
      ruta: '/espiral-crecimiento/importar-incapacidades',
      titulo: 'Importar incapacidades desde Excel',
      resumen:
        'Carga masiva de incapacidades y licencias (hasta 500 por archivo), por ejemplo desde el archivo de nómina. Solo admin_th.',
      camposYBotones: [
        { nombre: 'Plantilla', explicacion: 'Documento del colaborador, tipo (enfermedad general, accidente laboral, enfermedad laboral, licencia de maternidad o paternidad, otra), fecha de inicio, fecha de fin y entidad emisora (EPS o ARL). Entiende encabezados de nómina como Cédula, Desde, Hasta o EPS, y las siglas EG, AT y EL.' },
        { nombre: 'Revisión fila por fila', explicacion: 'Los días se calculan solos. Marca error si el colaborador no existe, el tipo no se reconoce o la fecha de fin es anterior a la de inicio; omite las que ya están registradas y avisa si una se cruza con otra de la misma persona.' },
      ],
      notas: [
        'No hay columna de diagnóstico a propósito: es un dato de salud sensible (Ley 1581). El soporte PDF se adjunta después en la ficha de cada persona.',
        'Solo Talento Humano y la propia persona ven las incapacidades; el líder no.',
      ],
    },
    {
      slug: 'externo-nuevo',
      ruta: '/espiral-crecimiento/externos/nuevo',
      titulo: 'Nuevo externo',
      resumen:
        'Registra a un contratista, transportador, asesor, freelance o proveedor. Solo admin_th. Hay dos pestañas: una persona o varias a la vez.',
      camposYBotones: [
        { nombre: 'Una persona', explicacion: 'Nombre completo (obligatorio), documento, teléfono y correo, más el vínculo: tipo de vínculo, servicio o cargo que presta (obligatorios), empresa o firma, responsable interno, inicio del vínculo, fin del contrato o servicio, estado y notas.' },
        { nombre: 'Varias a la vez', explicacion: 'Pega una persona por línea con el formato «Nombre ; documento ; correo ; teléfono» y comparten el mismo vínculo.' },
      ],
      notas: [
        'Si llenas el fin del contrato, el sistema crea una alerta 30 días antes del vencimiento.',
      ],
    },
    {
      slug: 'externo-detalle',
      ruta: '/espiral-crecimiento/externos/*',
      titulo: 'Detalle de un externo',
      resumen:
        'Ficha de un externo: datos del vínculo, vigencia, documentos y seguimiento del servicio.',
      camposYBotones: [
        { nombre: 'Datos del vínculo', explicacion: 'Responsable interno, documento, correo, teléfono, inicio del vínculo, fin del contrato o servicio (avisa si vence en 30 días o ya venció) y notas.' },
        { nombre: 'Documentos (contrato, RUT, ARL…) y Guía del Flow', explicacion: 'Accesos de admin_th a sus documentos y a su Guía del Flow.' },
        { nombre: 'Seguimiento del servicio', explicacion: 'Registro de seguimientos con fecha y una calificación opcional.' },
        { nombre: 'Editar / Pasar a colaborador vinculado', explicacion: 'Solo admin_th. Si la persona pasa a ser empleada, queda en período de prueba y con su historial.' },
      ],
    },
    {
      slug: 'externo-editar',
      ruta: '/espiral-crecimiento/externos/*/editar',
      titulo: 'Editar externo',
      resumen:
        'Cambia los datos personales y el vínculo de un externo (tipo, servicio, empresa, responsable, fechas, estado y notas). Solo admin_th.',
    },
    {
      slug: 'dimensiones',
      ruta: '/espiral-crecimiento/dimensiones',
      titulo: 'Dimensiones por colaborador',
      resumen:
        'Tabla comparativa con el estado vigente de Ser, Saber, Hacer y Deber de cada persona de un vistazo — siempre el dato más reciente disponible, sin importar de qué Ciclo de Crecimiento vino ni si ya cerró.',
      camposYBotones: [
        { nombre: 'Columnas Ser / Saber / Hacer / Deber', explicacion: 'Un semáforo (Alto/Medio/Bajo) por dimensión y por persona. Ser y Saber se derivan del mismo criterio que usa el Informe de brechas por dimensión; Hacer y Deber vienen del Encuentro de Crecimiento más reciente.' },
        { nombre: 'Resumen por área', explicacion: 'Tabla arriba de la lista con, por área, el número de personas, el Saber promedio (%), el Hacer y el Deber promedio (1 a 5) y cuántas personas tienen alguna dimensión en rojo. Un área con menos personas con dato que el mínimo de anonimato no muestra promedios. El Ser es descriptivo y no se promedia.' },
        { nombre: 'Filtro «Con alguna dimensión en rojo»', explicacion: 'Muestra solo a quienes tienen Saber, Hacer o Deber en rojo, para priorizar los casos críticos. «Todas las personas» vuelve a la lista completa.' },
        { nombre: 'Ver PDI', explicacion: 'Acceso directo al Plan de Desarrollo Individual de esa persona.' },
      ],
      notas: [
        'Pueden ver esta pantalla: admin_th y gerencia (toda la empresa), líder (su equipo directo y él mismo). El colaborador no tiene acceso — consulta sus propias dimensiones desde su ficha.',
        'A diferencia del listado de Colaboradores, esta vista es solo de lectura: no hay edición aquí, es un panorama comparativo para priorizar dónde intervenir.',
      ],
    },
    {
      slug: 'ficha-colaborador',
      ruta: '/espiral-crecimiento/colaboradores/*',
      titulo: 'Ficha del colaborador',
      resumen:
        'La vista 360° de una persona: sus cuatro dimensiones de un vistazo (Ser, Saber, Hacer, Deber), su perfil de cargo, su hoja de vida y su Plan de Desarrollo.',
      camposYBotones: [
        { nombre: 'Tarjeta SER', explicacion: 'Indica si la persona ya aplicó la Guía del Flow («Guía del Flow aplicada») o si está «Pendiente por completar». El Ser se describe, no se califica: no hay promedio, nota ni semáforo, ni en la ficha, ni en Mi Perfil, ni en los informes 360, de brechas o de dimensiones (allí solo se cuenta cuántas personas tienen Guía). Lleva a la pantalla de Guía del Flow, donde está la lectura descriptiva.' },
        { nombre: 'Tarjeta SABER', explicacion: '% de cumplimiento del perfil de cargo (formación, habilidades, certificaciones, experiencia). Lleva a Verificación de Saber.' },
        { nombre: 'Tarjetas HACER / DEBER', explicacion: 'Último índice calculado y su semáforo (Alto/Medio/Bajo), según el Encuentro de Crecimiento más reciente.' },
        { nombre: 'Perfil de cargo', explicacion: 'Objetivo del cargo, si tiene personal a cargo y su manual de funciones: la lista de funciones principales que se le asignaron, con su proceso y su periodicidad. Todo se define en Administración → Cargos y perfiles y se ve aquí en vivo.' },
        { nombre: 'Hoja de vida y certificaciones', explicacion: 'Formación, cursos y certificaciones cargadas, con fecha de vencimiento si aplica.' },
        { nombre: 'Inducción', explicacion: '% de avance del plan de inducción de la persona (comunes + específicos del cargo). Lleva al checklist completo.' },
        { nombre: 'Plan de Desarrollo Individual', explicacion: 'Las acciones de desarrollo activas de la persona, con su origen (Hacer/Deber/Saber/Ser) y estado.' },
        { nombre: 'Documentos y certificado laboral', explicacion: 'Solo visible para admin_th y el propio colaborador. Lleva a la hoja de vida, el contrato, las afiliaciones (EPS/ARL/AFP/caja de compensación) y el generador del certificado laboral.' },
        { nombre: 'Incapacidades', explicacion: 'Solo visible para admin_th y el propio colaborador. Incapacidades y licencias registradas (enfermedad, accidente laboral, maternidad/paternidad), con su soporte adjunto.' },
        { nombre: 'Editar (modificar al colaborador)', explicacion: 'Solo Talento Humano (admin_th). Botón con lápiz arriba a la derecha de la ficha, junto al estado. Abre el formulario para cambiar nombre, documento, correo, teléfono, cargo, líder directo, fecha de ingreso, tipo de contrato, estado, salario y afiliaciones (EPS, ARL, AFP y caja). Importante: «Editar» NO deja registro en el Historial. Si cambias el cargo o el líder, anótalo además en Historial → movimiento (promoción, cambio de área, cambio de líder), para conservar el cargo anterior. La salida de una persona tampoco se hace aquí: se registra desde Historial.' },
        { nombre: 'Ver historial y línea de tiempo', explicacion: 'Solo visible para admin_th y el líder directo. Lleva a movimientos de cargo, sanciones y, si aplica, entrevista de salida.' },
        { nombre: 'Fechas especiales', explicacion: 'Solo visible para admin_th y el líder directo. Cumpleaños, día de la profesión o cualquier otra fecha que valga la pena celebrar de esta persona — la propia persona también puede agregar las suyas desde Mi Perfil.' },
      ],
      notas: [
        'Quién puede ver esta ficha: admin_th y gerencia (todas), líder (su equipo directo y él mismo), colaborador (solo la propia).',
        'Cada tarjeta de la ficha (Ser, Saber, Inducción, Hoja de vida, Documentos, Incapacidades, Historial, Fechas especiales, Dotación) trae un botón visible: «Diligenciar / editar →» si puedes modificarla (Talento Humano o el líder directo) o «Ver →» / «Abrir →» si solo consultas. Toda la tarjeta sigue siendo clicable, pero ya no hace falta adivinarlo.',
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
        { nombre: 'Generar checklist desde cargo y hoja de vida', explicacion: 'Arma el checklist cruzando lo que exige el cargo con lo que la persona ya acreditó en su hoja de vida: la formación mínima (se compara el nivel que deduce del título con el que exige el cargo: cumple si lo iguala o lo supera, y si lo supera lo anota como posible sobrecalificación, que no es un incumplimiento; no cumple si queda por debajo; parcial si no se puede deducir el nivel del título; se compara con la hoja de vida actual, no con evaluaciones de desempeño), cada habilidad del cargo (queda pendiente de verificar), cada certificación o curso (cumple si tiene soporte o está verificada, parcial si no tiene soporte, no cumple si está vencida) y los meses de experiencia (se suman los de experiencia laboral). No duplica ítems que ya existan, así que puedes pulsarlo de nuevo cuando agregues algo a la hoja de vida.' },
      ],
      notas: [
        'Puede editar: admin_th y el líder directo de la persona. El propio colaborador y gerencia solo consultan.',
        'Mapa de dominio: arriba de los bloques se cuenta cuántos conocimientos están Dominados, Parciales o en Brecha, y se listan las brechas a cerrar (con el nivel que demuestra la persona frente al que exige el cargo y la fuente de la evidencia).',
        'Nivel de dominio y fuente de evidencia: en cada ítem puedes indicar el nivel que la persona demuestra (Sin dominio, Básico, Intermedio o Avanzado), el nivel que exige el cargo y de dónde sale la evidencia (prueba, demostración práctica, entrevista, certificación, documento u observación del líder). Si indicas ambos niveles, el estado se calcula solo: Dominado si alcanza el nivel exigido, Parcial si está un nivel por debajo y Brecha si está a dos o más. Las habilidades del cargo traen su nivel exigido (bajo = Básico, medio = Intermedio, alto = Avanzado) al generar el checklist.',
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
        { nombre: '¿Qué es la Guía del Flow? (desplegable)', explicacion: 'Al inicio de la pantalla hay un desplegable que explica en pocas líneas qué es la Guía del Flow, que no lleva nota y que el líder solo ve lo que la persona decida compartir.' },
        { nombre: 'Generar invitación', explicacion: 'admin_th, o el líder directo de esta persona. Crea un link único (con un token, no con su correo ni su nombre) y lo muestra con botón de copiar. Cuando la persona lo abre, completa el cuestionario en guiadelflow y genera su Guía, sus 18 aspectos y los dos informes se cargan aquí solos — este es el camino recomendado.' },
        { nombre: 'Crear / Nueva aplicación', explicacion: 'admin_th, o el líder directo. Abre un nuevo registro de Guía del Flow para la persona a mano — respaldo para cuando no se usó una invitación (por ejemplo, aplicaciones anteriores a esta integración). No lo uses si ya existe una aplicación cargada: cada clic crea una nueva y la más reciente es la que se muestra, así que puede tapar una que ya tenía datos.' },
        { nombre: 'Puntaje por aspecto (1-5)', explicacion: 'admin_th o el líder directo, y solo de los 18 aspectos con relevancia laboral — los 12 aspectos psicológicos/íntimos ni siquiera aparecen aquí. Se llena solo si la persona usó una invitación; si no, se carga a mano.' },
        { nombre: 'Generar informes con IA', explicacion: 'admin_th o el líder directo. A partir de esos puntajes genera dos textos distintos: uno para el líder (enfoque de PDI) y otro para el propio colaborador (recordatorio de fortalezas y áreas de desarrollo). Con invitación, esto también queda automático.' },
        { nombre: 'Tu decisión sobre tu Guía del Flow (para la persona)', explicacion: 'Cada colaborador ve en su Guía una tarjeta con la finalidad (acompañar su desarrollo, nada de notas ni evaluación) y elige quién puede ver el informe además de Talento Humano: su líder directo, o solo ella y Talento Humano. Puede cambiarla cuando quiera. Mientras no decida, su líder la ve como antes. Si elige no compartir, el líder deja de ver el informe y los puntajes (también lo impide la base de datos). Los aspectos sensibles nunca los ve nadie más que la persona. Talento Humano ve en la cabecera cuál fue su decisión.' },
        { nombre: 'Seguimiento del Ser', explicacion: 'Al final de la pantalla. Talento Humano o el líder directo registran, conversación a conversación, cómo la persona pone en práctica sus fortalezas, qué la motiva en ese momento y qué se acordó, con fecha y, si quieres, la próxima revisión. Es descriptivo, sin nota, y lo ven la propia persona, su líder directo y Talento Humano. No escribas ahí aspectos íntimos o sensibles de la Guía del Flow.' },
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
        'Al crear la ficha del colaborador, su ingreso queda registrado aquí automáticamente. Acceso exclusivo: admin_th (toda la empresa) y el líder directo (su equipo, sin ver la entrevista de salida). Gerencia y el propio colaborador no tienen acceso a esta pantalla.',
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
        { nombre: 'Casilla de cada punto', explicacion: 'Marca un punto como cumplido — queda registrado quién lo marcó y cuándo. En propósito, funciones y riesgos SST la casilla es la APROBACIÓN de Talento Humano o del líder, después de que la persona confirme.' },
        { nombre: 'Confirmación de la persona (propósito, funciones, riesgos SST)', explicacion: 'Quien certifica que conoce su propósito, sus funciones y los riesgos de su puesto es la propia persona: entra a su Inducción y pulsa «Confirmo que lo conozco y lo entiendo». Si el punto trae una pregunta de comprensión, debe responderla bien para poder confirmar. Talento Humano y el líder ven «La persona lo confirmó el… · por aprobar» y lo aprueban con la casilla.' },
        { nombre: 'Punto que se cumple con un curso', explicacion: 'Un punto puede estar ligado a un curso de Formación (se define en Administración → Cargos y perfiles, «Se cumple con el curso»). Al dar de alta a la persona se le asigna ese curso; al completarlo (y aprobar su quiz, si lo tiene) el punto queda confirmado solo: en propósito, funciones y riesgos SST queda «confirmado por la persona» para que Talento Humano o el líder lo aprueben, y en los demás puntos queda cumplido. La confirmación manual se desactiva en esos puntos.' },
        { nombre: 'Exámenes médicos (preingreso)', explicacion: 'Aparecen primero y con la etiqueta de preingreso, porque se hacen antes de la vinculación formal. Siguen a cargo de Talento Humano, igual que el EPP.' },
      ],
      notas: [
        'Puede marcar puntos como cumplidos (o aprobar las confirmaciones): admin_th o el líder directo de la persona. La propia persona confirma solo propósito, funciones y riesgos SST; gerencia solo consulta.',
        'Las preguntas de comprensión las define admin_th en Administración → Cargos y perfiles → (un cargo): en «Plan de inducción específico» y en «Puntos comunes a todos los cargos». La respuesta correcta solo la ve Talento Humano; quien responde nunca la ve.',
        'El plan se asigna automáticamente (puntos comunes + los del cargo) al crear la ficha del colaborador y también al registrar un ingreso en el Historial. Al registrar un cambio de cargo, solo se agregan los puntos del cargo nuevo (no se repiten los comunes).',
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
        { nombre: 'Eliminar ciclo', explicacion: 'Solo admin_th, para quitar ciclos creados por error o de pruebas. Avisa cuántas evaluaciones se perderán (y cuántas ya tenían avance) y exige escribir ELIMINAR para confirmar. Se borran las evaluaciones, valoraciones, briefs y acuerdos de ese ciclo; los planes de desarrollo que nacieron de él se conservan. No se puede deshacer: no lo uses con un ciclo real que ya tiene valoraciones.' },
      ],
    },
    {
      slug: 'detalle-ciclo',
      ruta: '/espiral-crecimiento/ciclos/*',
      titulo: 'Detalle de un ciclo',
      resumen:
        'Muestra las ponderaciones vigentes del ciclo y el avance de cada colaborador en crecimiento, con acceso directo a su Brief y su Acuerdo de crecimiento.',
      camposYBotones: [
        { nombre: 'Panel de generación de Encuentros de Crecimiento', explicacion: 'Solo admin_th. Se elige el alcance con tres botones: «Todos los colaboradores», «Un equipo» o «Un colaborador», y se pulsa «Generar Encuentros de Crecimiento». Cada encuentro trae cinco bloques (competencias organizacionales, funcionales, de liderazgo si aplica, Roles y funciones y cultura) y sus tareas de valoración: autoevaluación, líder, pares y colaboradores a cargo, según el organigrama del momento. El bloque Roles y funciones sale del manual de funciones del cargo.' },
        { nombre: 'Un equipo', explicacion: 'Eliges el nombre de un líder y debajo aparece la lista de sus personas, cada una con la etiqueta «Ya generado» o «Por generar», y cuántas faltan. Si todas ya tienen su encuentro en este ciclo, el botón queda deshabilitado y el panel lo dice; si alguien lo pulsa de todos modos, responde que ya están generados en lugar de repetirlos.' },
        { nombre: 'Un colaborador', explicacion: 'Primero puedes elegir un líder en el selector «Equipo de…» para que la lista de colaboradores muestre solo a su equipo, y luego eliges a la persona. Si esa persona ya tiene su encuentro en este ciclo, el botón se deshabilita y lo avisa. Si no eliges líder, la lista muestra a todos.' },
        { nombre: 'Aviso de espera', explicacion: 'Generar puede tardar uno o dos minutos. Mientras corre, el botón muestra un círculo girando con «Generando…» y aparece un recuadro con una barra animada que pide no cerrar ni recargar la página hasta ver «Listo: N Encuentros de Crecimiento, N tareas de acompañante y N ítems generados». Si falla, el mensaje de error aparece ahí mismo. Volver a generar un ciclo no duplica lo que ya existe.' },
        { nombre: 'Filtros de la tabla del ciclo', explicacion: 'Encima de la tabla de Encuentros: busca por persona y filtra por cargo o por etapa (En evaluación, Evaluación completa, Con retroalimentación, Cerrada).' },
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
        { nombre: 'Cómo leer la escala 1 a 5', explicacion: 'Una franja arriba de los ítems recuerda qué significa cada nota: 1 No cumple, 2 En desarrollo, 3 Cumple (lo esperado para el cargo), 4 Supera y 5 Referente (lo que otros toman como ejemplo). Al pasar el cursor sobre cada número también aparece su nombre.' },
        { nombre: 'Evidencias por ítem', explicacion: 'Debajo de cada ítem puedes adjuntar hasta 5 archivos que sustenten la nota (fotos, PDF, Word o Excel, de hasta 4 MB cada uno). Primero elige la nota o «No aplica» y luego adjunta. Mientras la valoración esté en borrador puedes subir y quitar archivos; al enviarla quedan fijos. Son privados: solo los ves tú, quien administra Talento Humano y —en el Resultado— el líder y la persona valorada, pero solo las de la autoevaluación y las del líder; las de pares y colaboradores a cargo nunca se muestran, para proteger su anonimato.' },
        { nombre: 'No aplica', explicacion: 'Junto a las notas de 1 a 5 hay un botón «No aplica» para los criterios que no corresponden a esa persona o que no pudiste observar. NO cuenta como cero: se excluye del promedio y los índices se calculan solo con lo que sí valoraste. Cada «No aplica» pide una breve explicación (obligatoria para poder enviar) y no puedes marcar todos los ítems como No aplica: debe quedar al menos uno valorado.' },
        { nombre: 'Barra fija de arriba', explicacion: 'Se queda visible aunque bajes por la pantalla. Muestra el promedio general, cuántos ítems llevas, el promedio de cada bloque y los botones «Guardar avance» y «Enviar valoración».' },
        { nombre: 'Guardar avance (borrador)', explicacion: 'Cada nota también se guarda al instante (aparece "Guardado" junto al ítem), pero «Guardar avance» asegura todo lo que llevas, incluidas las observaciones. Mientras no envíes, puedes salir, volver y cambiar lo que quieras. Un borrador todavía no cuenta en los resultados.' },
        { nombre: 'Enviar valoración', explicacion: 'Se activa cuando respondiste todos los ítems. Pide confirmación porque, una vez enviada, ya no se puede modificar nada: queda en solo lectura y empieza a contar en los resultados (índices, semáforo y brecha). Un Encuentro de Crecimiento sin enviar sigue apareciendo como pendiente en tu Inicio.' },
      ],
      proceso: [
        'Entra a Inicio: en «Encuentros de Crecimiento pendientes» aparece cada valoración que te toca (autoevaluación, líder, par o colaborador a cargo). Pulsa la que quieras.',
        'Arriba hay una barra fija (se queda visible aunque bajes) con tu promedio, cuántos ítems llevas y los botones «Guardar avance» y «Enviar valoración».',
        'Para cada ítem pulsa una nota de 1 a 5. Si el ítem tiene guía de valoración, verás el criterio del nivel que elegiste. En Roles y funciones puedes escribir además el «resultado real observado», y en cualquier ítem una observación.',
        'Puedes parar cuando quieras: pulsa «Guardar avance» y vuelve después. Mientras no envíes, puedes cambiar cualquier respuesta.',
        'Cuando hayas respondido todos los ítems se activa «Enviar valoración». Confirma el aviso: una vez enviada, la pantalla queda en solo lectura (con el aviso «Valoración enviada el…») y ya no se puede modificar.',
        'Tu valoración enviada empieza a contar en el índice de Hacer y Deber, el semáforo y la brecha de la persona. Luego prepara el Brief y registra el Acuerdo (ver «Resultado de un Encuentro de Crecimiento»).',
      ],
      notas: [
        'Un borrador (valoración sin enviar) todavía no cuenta en los resultados ni se muestra a nadie. En tu Inicio sigue apareciendo como pendiente hasta que la envíes.',
        'Si el Encuentro de Crecimiento no tiene ítems generados, pide a Talento Humano que la regenere desde el detalle del ciclo.',
      ],
    },
    {
      slug: 'resultado-evaluacion',
      ruta: '/espiral-crecimiento/evaluaciones/*/resultado',
      titulo: 'Resultado de un Encuentro de Crecimiento',
      resumen:
        'El resultado de Hacer y Deber de una persona en un ciclo: autoevaluación, índice final, brecha y semáforo, el detalle ítem por ítem (autoevaluación frente al líder), la retroalimentación cualitativa y su plan de desarrollo.',
      camposYBotones: [
        { nombre: 'Hacer y Deber', explicacion: 'Para cada dimensión: la autoevaluación, el índice final (de 1 a 5), la brecha (lo que valoraron los demás menos la autoevaluación) y el semáforo Alto, Medio o Bajo.' },
        { nombre: 'Evidencias en la tabla', explicacion: 'Junto a cada ítem aparecen, con un clip, las evidencias que adjuntaron la autoevaluación y el líder (un enlace temporal para abrirlas). Las de pares y colaboradores a cargo no se muestran.' },
        { nombre: 'Índice de desempeño integral', explicacion: 'Tarjeta que sintetiza Saber, Hacer y Deber en una sola lectura (de 1 a 5, con su semáforo) según el nivel del cargo, mostrando el valor, el peso y el aporte de cada dimensión. Los pesos de partida son 25 % Saber, 40 % Hacer y 35 % Deber y Talento Humano los ajusta por nivel de cargo en Administración → Índice integral. El Saber (que es un porcentaje de cumplimiento del perfil) se lleva a la escala de 1 a 5 de forma lineal. Si falta una dimensión, el índice se calcula con las otras y se marca como incompleto; nunca se toma como cero. El Ser no entra: se lee en paralelo.' },
        { nombre: 'Criterios críticos por debajo del mínimo', explicacion: 'Recuadro rojo que aparece si algún criterio que la empresa definió como crítico quedó, en su nota consolidada (líder, pares y colaboradores a cargo con los pesos del ciclo; la autoevaluación no cuenta), por debajo del mínimo establecido. Solo advierte: una nota general aceptable no debe ocultar un incumplimiento grave, pero Talento Humano decide qué hacer.' },
        { nombre: 'Aviso de «No aplica»', explicacion: 'Si hubo respuestas marcadas «No aplica», arriba de las tarjetas se indica cuántas fueron y qué porcentaje del total. No cuentan como cero. Si pasan del 30 %, el aviso se pone amarillo: lee el resultado con cautela y revisa si el perfil del cargo necesita ajustes. En las tablas se ven como «N/A».' },
        { nombre: 'Tablas por bloque (Auto / Líder)', explicacion: 'Cada ítem con la nota de la autoevaluación y la del líder, y el subtotal de cada bloque. Las respuestas de pares y de colaboradores a cargo cuentan en el índice pero no se muestran una por una, para proteger a quien califica.' },
        { nombre: 'Brief y Acuerdo', explicacion: 'Botones arriba para preparar la retroalimentación (Brief) y registrar los compromisos firmados (Acuerdo).' },
        { nombre: 'Retroalimentación cualitativa', explicacion: 'Lo que el líder escribió en el Brief: talento central, resumen de Hacer, resumen de Deber y sugerencias de enfoque.' },
        { nombre: 'Plan de Desarrollo → Nueva acción de desarrollo', explicacion: 'Disponible para admin_th y para el líder directo. Muestra como sugerencias los ítems que el líder calificó con 2 o menos; al tocar una, se llena la brecha. Elige la dimensión de origen, escribe la acción y la fecha compromiso y pulsa "Guardar acción".' },
      ],
      proceso: [
        'Abre el detalle del ciclo y entra a "Ver ficha" de la persona.',
        'Lee los índices, la brecha y el semáforo de Hacer y Deber.',
        'Revisa los ítems donde la autoevaluación y el líder difieren más.',
        'Prepara el Brief y, tras la conversación, registra el Acuerdo.',
        'Convierte las brechas en acciones con "Nueva acción de desarrollo".',
      ],
      notas: [
        'Pueden ver esta pantalla: admin_th, el líder directo y la propia persona. Si Hacer o Deber aparecen "Sin datos", todavía no hay respuestas del líder en ese ciclo.',
        'Criterios congelados: al generar la evaluación de un ciclo, el sistema guarda una «foto» de la guía de valoración por nivel y del mínimo crítico de cada criterio, y de los pesos de Saber, Hacer y Deber del nivel del cargo. Si después cambias el catálogo de competencias o los pesos, los ciclos ya abiertos se siguen juzgando con las reglas con que se abrieron; los cambios aplican a los ciclos nuevos. Al regenerar un ciclo, lo congelado se conserva. Evaluaciones generadas antes de esta función se congelaron con lo vigente el día de la actualización.',
        'El plan de desarrollo se crea solo cuando una dimensión queda en semáforo bajo; las acciones manuales sirven para el resto de brechas que detecte el líder.',
        'Si el ciclo asigna peso a los clientes internos, ese porcentaje se resta proporcionalmente a las demás fuentes (todo sigue sumando 100 %). Cómo se combinan varias valoraciones: dentro de cada grupo se promedia (si 4 pares valoran a una persona, cuentan como una sola fuente «pares»; el líder es una sola persona). Luego los grupos se ponderan: con personal a cargo, líder 40 %, pares 30 %, colaboradores a cargo 30 %; sin personal a cargo, líder 60 % y pares 40 %. Son valores por defecto y se cambian por ciclo en Administración → Configuración. La autoevaluación no entra en el índice: solo se usa para calcular la brecha. Solo cuentan valoraciones enviadas; si un grupo aún no ha enviado nada, el índice se calcula con los grupos que sí enviaron. Cada evaluador pesa igual dentro de su grupo y no hay un mínimo de evaluadores.',
      ],
    },
    {
      slug: 'reabrir-valoraciones',
      ruta: '/espiral-crecimiento/evaluaciones/*/valoraciones',
      titulo: 'Reabrir una valoración enviada',
      resumen:
        'Pantalla de Talento Humano para ver quién ya envió su valoración de una persona y, si hubo un error, reabrirla con un motivo para que su evaluador la corrija. Todo envío y toda reapertura quedan en la auditoría.',
      camposYBotones: [
        { nombre: 'Lista de valoraciones', explicacion: 'Cada evaluador (autoevaluación, líder, pares, colaboradores a cargo) con su estado: enviada (con fecha) o pendiente/en borrador.' },
        { nombre: 'Reabrir', explicacion: 'Solo en valoraciones enviadas. Pide un motivo de al menos 10 caracteres. La valoración vuelve a borrador: deja de contar en los resultados (índices, semáforo, brecha) y reaparece como pendiente en el Inicio de su evaluador.' },
        { nombre: 'Registro de envíos y reaperturas', explicacion: 'Historial de quién envió o reabrió, cuándo y con qué motivo. También se consulta en Administración → Auditoría, módulo «Valoraciones».' },
      ],
      proceso: [
        'Abre el detalle del ciclo y, en la fila de la persona, pulsa «Ver / reabrir» (columna Valoraciones, solo Talento Humano).',
        'Busca la valoración enviada que hay que corregir y pulsa «Reabrir».',
        'Escribe el motivo y confirma. Avisa al evaluador: la verá otra vez como pendiente.',
        'Cuando la envíe de nuevo, los resultados se recalculan solos.',
      ],
      notas: [
        'Solo Talento Humano puede reabrir. Las notas ya guardadas se conservan: el evaluador cambia lo que haga falta y vuelve a enviar.',
        'Si el evaluador no reenvía, esa valoración no cuenta en el resultado.',
        'Clientes internos: en esta misma pantalla puedes invitar a una persona que recibe el servicio de quien se evalúa (de otra área, por ejemplo). Responde solo las competencias funcionales y las funciones del cargo, puede usar «No aplica» y le aparece como pendiente en su Inicio. Cuenta como una fuente más si el ciclo le asignó un peso (Administración → Configuración → Clientes internos); con peso 0 su opinión se guarda pero no mueve el resultado. Puedes quitar la invitación mientras no haya empezado a responder. Nunca se muestra quién respondió. Por ahora solo se invita a personas de la empresa; los usuarios externos no.',
      ],
    },
    {
      slug: 'movilidad-interna',
      ruta: '/espiral-crecimiento/movilidad',
      titulo: 'Movilidad interna y potencial subutilizado',
      resumen:
        'Cruza lo que cada persona ya acredita (verificaciones de Saber y hoja de vida) con lo que exigen los cargos, para tener candidatos internos antes de abrir una vacante y descubrir talento que podría aportar más. Solo Talento Humano.',
      camposYBotones: [
        { nombre: 'Candidatos internos para un cargo', explicacion: 'Elige un cargo (los que tienen vacante abierta lo indican) y verás hasta 10 personas ordenadas por afinidad. Abre cada una para ver, requisito por requisito, qué está cubierto (✓), parcial (≈) o falta (✗) y por qué.' },
        { nombre: 'Potencial subutilizado', explicacion: 'Personas con Hacer alto y Deber alto o medio en su última evaluación que además cubren al menos el 75 % de los requisitos de otro cargo de su mismo nivel o superior, con el cargo a explorar y su afinidad.' },
        { nombre: 'Cómo se calcula la afinidad', explicacion: 'Cada habilidad del cargo cuenta si la persona la tiene verificada en su Saber (con el nivel exigido) o acreditada en su hoja de vida; además cuentan la formación y la experiencia mínima. Cubierto vale 1, parcial 0,5 y faltante 0; la afinidad es el promedio.' },
      ],
      proceso: [
        'Antes de abrir una vacante, entra a Movilidad interna y elige el cargo.',
        'Revisa los candidatos con mayor afinidad y el detalle de lo que les falta.',
        'Conversa con las personas y sus líderes: la afinidad es un punto de partida, no una decisión.',
        'Si hay brechas pequeñas, conviértelas en acciones del plan de desarrollo.',
      ],
      notas: [
        'Compara textos (nombres de habilidades, títulos de la hoja de vida), así que puede equivocarse: revisa siempre el detalle. No usa el Ser ni lo califica.',
        'Mientras más completas estén las hojas de vida, las verificaciones de Saber y los requisitos de los cargos, mejor funciona. Un cargo sin requisitos definidos no se puede comparar.',
      ],
    },
    {
      slug: 'perfil-integral',
      ruta: '/espiral-crecimiento/evaluaciones/*/perfil-integral',
      titulo: 'Perfil integral de talento',
      resumen:
        'Una sola pantalla por persona y ciclo que cruza Ser, Saber, Hacer y Deber en el formato del modelo: resultado por dimensión, hipótesis del Ser, lectura de cada dimensión, interpretación integral y posibles acciones. La plataforma o la IA proponen y tú decides.',
      camposYBotones: [
        { nombre: 'Tabla de dimensiones y tarjeta de índice integral', explicacion: 'Arriba, el resultado de cada dimensión (el Ser sin nota) y el índice de desempeño integral con sus pesos.' },
        { nombre: 'Rehacer borrador con los datos', explicacion: 'Genera un borrador automático (sin IA) con reglas claras a partir de los datos. Reemplaza lo que ves en pantalla hasta que guardes.' },
        { nombre: 'Mejorar la redacción con IA', explicacion: 'Pide a la IA que redacte mejor el borrador. Solo usa los datos ya cruzados (nunca aspectos íntimos del Ser), no inventa y trata el Ser como hipótesis. Si no responde, queda el borrador automático.' },
        { nombre: 'Campos editables', explicacion: 'Hipótesis del Ser, lectura de Saber, Hacer y Deber, interpretación integral y posibles acciones. Edítalos libremente; al guardar, queda registrado quién y cuándo.' },
      ],
      proceso: [
        'Abre el resultado de la evaluación y pulsa «Perfil integral».',
        'Lee la tabla y el índice; revisa el borrador de cada campo.',
        'Ajusta lo que haga falta y, si quieres, pide una mejor redacción con IA.',
        'Pulsa «Guardar perfil integral». Úsalo para preparar la conversación y el plan de desarrollo.',
      ],
      notas: [
        'Solo Talento Humano y el líder directo lo ven; la persona evaluada no (como el Brief). Si la persona decidió no compartir su Guía del Flow con su líder, el líder no verá hipótesis del Ser.',
        'Las hipótesis del Ser son recursos para conversar: no explican automáticamente el desempeño.',
      ],
    },
    {
      slug: 'objetivos-concertados',
      ruta: '/espiral-crecimiento/evaluaciones/*/objetivos',
      titulo: 'Objetivos concertados del ciclo',
      resumen:
        'Antes de evaluar, el líder (o Talento Humano) y la persona acuerdan qué se espera en el ciclo y con qué criterio se juzgará. Al cierre se registra si se cumplió, y de ahí sale el indicador de cumplimiento de objetivos.',
      camposYBotones: [
        { nombre: 'Proponer objetivo', explicacion: 'Talento Humano o el líder directo escriben el objetivo, su criterio de éxito (cómo se sabrá que se cumplió, medible u observable), un detalle y una fecha meta opcionales.' },
        { nombre: 'Aceptar objetivo / Quiero conversarlo', explicacion: 'La propia persona acepta cada objetivo, o lo deja con un comentario para conversarlo con su líder. Si el líder modifica un objetivo ya aceptado, la aceptación se reinicia.' },
        { nombre: 'Cierre (Cumplido, Parcial, No cumplido)', explicacion: 'Al terminar el ciclo, el líder o Talento Humano registran el resultado de cada objetivo acordado. Se puede reabrir para corregir.' },
        { nombre: 'Cumplimiento de objetivos', explicacion: 'Porcentaje sobre los objetivos cerrados: cumplido vale 100, parcial 50 y no cumplido 0. También aparece, agregado y protegido por el umbral de anonimato, en Espiral 360° → Indicadores.' },
      ],
      proceso: [
        'Al abrir el ciclo, entra al detalle del ciclo y pulsa «Objetivos» en la fila de la persona.',
        'Propón 2 a 5 objetivos con su criterio de éxito.',
        'La persona los acepta o pide conversarlos; ajusten hasta que queden acordados.',
        'Al cierre del ciclo, registra Cumplido, Parcial o No cumplido en cada uno.',
      ],
      notas: [
        'Pueden entrar: Talento Humano, el líder directo de la persona y la propia persona (que solo puede aceptar o comentar).',
        'Solo se pueden cerrar objetivos que la persona ya aceptó.',
      ],
    },
    {
      slug: 'brief',
      ruta: '/espiral-crecimiento/evaluaciones/*/brief',
      titulo: 'Brief de retroalimentación',
      resumen: 'Material de preparación del líder antes de la conversación con su colaborador. Es privado: solo lo ven quien lo escribe y Talento Humano. El sistema lo arma solo cruzando las cuatro dimensiones: Ser (Guía del Flow), Saber (hoja de vida, cursos y cargo), Hacer y Deber (valoración del ciclo). Tú lo lees, lo ajustas con lo que ves en el día a día y lo guardas.',
      camposYBotones: [
        { nombre: 'Lo que dicen los datos', explicacion: 'Cuatro tarjetas con lo más reciente de cada dimensión. Ser: si tiene Guía del Flow y sus aspectos más fuertes y a acompañar (solo los de relevancia laboral). Saber: porcentaje de cumplimiento del cargo, ítems pendientes, cursos completados o en curso y certificaciones por vencer. Hacer y Deber: índice, semáforo y diferencia con su autoevaluación.' },
        { nombre: 'Borrador automático', explicacion: 'La primera vez que abres el Brief ya trae las seis secciones escritas con esos datos (sin gastar nada de IA). Mientras no pulses Guardar, no queda guardado.' },
        { nombre: 'Rehacer borrador con los datos', explicacion: 'Vuelve a armar el borrador con la información más reciente (por ejemplo, después de que llegaron más valoraciones o se completó un curso). Reemplaza lo que hay escrito, por eso pide confirmación.' },
        { nombre: 'Mejorar la redacción con IA', explicacion: 'Si la IA está configurada, reescribe el borrador de forma más humana y breve usando solo esos datos. Si no puede, te deja el borrador automático y te avisa.' },
        { nombre: 'Talento central, Resumen de Ser, de Saber, de Hacer y de Deber, Sugerencias de enfoque', explicacion: 'Las seis secciones, todas editables. La IA propone; lo que tú ves en el día a día manda.' },
        { nombre: 'Guardar', explicacion: 'Guarda el Brief y anota si salió del borrador automático, de la IA o de tu propia edición. Te avisa si hay cambios sin guardar.' },
      ],
      notas: [
        'Privacidad del Ser: solo se usan los 18 aspectos de relevancia laboral y el informe pensado para el líder. Nunca los aspectos íntimos de la Guía del Flow.',
        'De los pares y colaboradores a cargo solo se usa el promedio agrupado: nunca quién dijo qué.',
        'El colaborador evaluado no ve el Brief. Para conversar con él usa el Acuerdo de crecimiento.',
      ],
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
      slug: 'externos',
      ruta: '/espiral-crecimiento/externos',
      titulo: 'Externos',
      resumen:
        'Registro de contratistas, transportadores, asesores, freelance y proveedores: personas o firmas que prestan servicios sin ser empleadas. No se evalúan en los Ciclos de Crecimiento, pero quedan con su vínculo, documentos, vencimiento y seguimiento.',
      camposYBotones: [
        { nombre: 'Tarjetas de resumen', explicacion: 'Cuántos externos activos hay, cuántos vencen en 30 días o ya vencieron, y cuántos hay por tipo.' },
        { nombre: 'Tabla y filtros', explicacion: 'Busca por nombre, empresa o servicio y filtra por tipo, estado y responsable. «Vigencia» muestra la fecha de fin del contrato o servicio y avisa cuando está por vencer.' },
        { nombre: 'Nuevo externo', explicacion: 'Solo admin_th. Pestaña «Una persona» (datos, tipo de vínculo, servicio, empresa o firma, responsable interno, fechas y notas) o «Varias a la vez»: pegas una persona por línea («Nombre ; documento ; correo ; teléfono», puedes copiar columnas de Excel) y todas comparten el mismo vínculo. Si el documento ya existe, esa línea se omite y te lo dice.' },
        { nombre: 'Detalle del externo', explicacion: 'Datos del vínculo, acceso a Documentos (contrato, RUT, ARL…) y a la Guía del Flow, «Seguimiento del servicio» (fecha, calificación opcional de 1 a 5 y comentario; lo registran Talento Humano y el responsable interno) y, para Talento Humano, Editar, «Pasar a colaborador vinculado» y Eliminar (deja registro en el Histórico de eliminados).' },
      ],
      notas: [
        'Responsable interno: es quien lo contrata o coordina. El externo aparece con línea punteada bajo esa persona en el organigrama.',
        'Si llenas «Fin del contrato o servicio», el sistema crea una alerta que avisa 30 días antes del vencimiento.',
        'Los externos no entran a Ciclos de Crecimiento, indicadores, dotación ni inducción. Si una persona pasa a ser empleada, usa «Pasar a colaborador vinculado»: queda en período de prueba y con su responsable como líder.',
        'Para dejar de trabajar con un externo sin perder su historia, márcalo «Inactivo» en Editar.',
      ],
    },
    {
      slug: 'organigrama-consulta',
      ruta: '/espiral-crecimiento/organigrama',
      titulo: 'Organigrama',
      resumen: 'Vista jerárquica de la empresa, en árbol. Explica la regla automática de quién acompaña a quién.',
      notas: [
        'Para ver quiénes dependen de un líder, el camino más directo es Espiral 360° → Colaboradores → selector «Todos los líderes» (lista a sus subalternos con cargo, área y estado). En Administración → Organigrama (editar) también puedes filtrar por «Líder directo».',
        'Regla de acompañantes: el líder es quien está justo arriba en el organigrama; los pares comparten el mismo líder; los colaboradores a cargo son quienes reportan directamente al colaborador en crecimiento.',
      ],
    },
    {
      slug: 'indicadores',
      ruta: '/espiral-crecimiento/indicadores',
      titulo: 'Indicadores',
      resumen: 'Panorama de la empresa: índices de Hacer y Deber, cumplimiento de Saber, «con Guía y desempeño sin alerta», rotación de personal, SST y Reclutamiento (para Talento Humano), y un mapa comparativo por equipo.',
      camposYBotones: [
        { nombre: 'Filtro por área y líder', explicacion: 'Elige un área o proceso y/o un líder directo y pulsa Aplicar: Índice de Hacer, Índice de Deber y el mapa de equipos se calculan solo con esa gente (con el mínimo de personas del umbral de anonimato). El resto de indicadores de la pantalla sigue siendo de toda la empresa. «Quitar filtros» vuelve a la vista completa.' },
        { nombre: 'Mapa de equipos', explicacion: 'Gráfico que compara Hacer, Deber y Saber promedio de cada equipo (agrupado por líder).' },
        { nombre: 'Tasa de rotación anual', explicacion: 'Porcentaje de personas que salieron en los últimos 12 meses, sobre quienes ya estaban activos hace 12 meses. Sale "—" si todavía no hay suficiente antigüedad registrada para calcularla.' },
        { nombre: 'Rotación voluntaria', explicacion: 'La misma tasa, pero contando solo las salidas registradas con motivo "Renuncia voluntaria" en el Historial de la ficha.' },
        { nombre: 'Salidas último año / Salidas voluntarias', explicacion: 'El conteo bruto de personas que salieron en los últimos 12 meses (total y solo voluntarias), sin convertir a porcentaje.' },
        { nombre: 'Plan de trabajo anual', explicacion: 'Cumplimiento del plan, del plan de formación (con horas ejecutadas), actividades SST ejecutadas frente a programadas y cobertura. Se alimentan solos de Procesos → Plan de trabajo anual y solo aparecen si ya hay actividades cargadas en el año.' },
        { nombre: 'Sección SST (solo admin_th)', explicacion: 'Accidentes laborales y su tasa por cada 100 trabajadores, días de incapacidad por origen (enfermedad general, accidente laboral, etc.), % de exámenes médicos al día y avance del plan de formación SST. Salen de las incapacidades, alertas y cursos ya registrados. Lo que la plataforma aún no registra (investigación de accidentes, permisos y calamidad) se avisa debajo.' },
        { nombre: 'Sección Reclutamiento (solo admin_th)', explicacion: 'Tiempo promedio de cierre de vacantes, efectividad de la contratación (% que supera el período de prueba), rotación temprana (salidas en los primeros 6 meses) y fuentes de candidatos. La fuente distingue por ahora solo entre formulario público e ingreso manual.' },
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
        { nombre: 'Filtros y vista de lista', explicacion: 'Arriba del tablero: filtro por área y líder directo (Aplicar / Quitar filtros), y un buscador por persona, brecha o acción con selectores de dimensión y estado. El botón Tarjetas/Lista cambia entre el tablero y una tabla, pensada para cuando hay muchas personas (con más de 40 planes abre en lista). En la lista no se arrastra: para cambiar el estado vuelve a Tarjetas.' },
        { nombre: 'Columnas del tablero', explicacion: 'Pendiente, En curso, Cumplido y Vencido — son fijas (no configurables, a diferencia del tablero de Procesos y Sistemas de Gestión).' },
        { nombre: 'Arrastrar tarjeta', explicacion: 'Mueve el PDI a otra columna para cambiar su estado. Al soltarlo en "Cumplido" se guarda automáticamente la fecha de cumplimiento.' },
        { nombre: 'Origen (badge de color)', explicacion: 'De qué dimensión viene la brecha detectada (Hacer/Deber/Saber/Ser/Mixto).' },
        { nombre: 'Nueva acción de desarrollo', explicacion: 'Las acciones manuales se crean desde el resultado de cada Encuentro de Crecimiento (admin_th y líder directo), con la brecha, la acción y la fecha compromiso. Aquí aparecen en el tablero junto con las automáticas.' },
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
