import type { PreguntaFrecuente } from '@/types/ayuda';

export const preguntasFrecuentes: PreguntaFrecuente[] = [
  {
    pregunta: '¿Qué significan Ser, Saber, Hacer y Deber?',
    respuesta:
      'Son las cuatro dimensiones que valora el Espiral de Crecimiento. Ser: quién es la persona (talentos, propósito), se explora con la Guía del Flow. Saber: si cumple lo que exige su cargo (formación, habilidades, certificaciones, experiencia). Hacer: su desempeño en comportamientos observables, valorado por ciclo. Deber: su comportamiento cultural/actitudinal, valorado también por ciclo.',
  },
  {
    pregunta: '¿Con qué frecuencia se valoran Hacer y Deber?',
    respuesta: 'Por ciclos, normalmente semestrales, definidos por Talento Humano en Ciclos de Crecimiento. Ser y Saber, en cambio, se verifican de forma continua, sin depender de un ciclo.',
  },
  {
    pregunta: '¿Quién acompaña a quién?',
    respuesta:
      'Se calcula automáticamente a partir del organigrama: tu líder es quien está justo arriba de ti; tus pares son quienes comparten tu mismo líder; tus colaboradores a cargo son quienes te reportan directamente a ti. Además, cada persona se autoevalúa.',
  },
  {
    pregunta: 'No veo a algunos colaboradores en mi lista de "Mi equipo". ¿Por qué?',
    respuesta:
      'Como líder, solo ves a las personas que te reportan directamente (según el organigrama) y a ti mismo. Si falta alguien, probablemente su líder directo no está bien configurado — pide a Talento Humano que lo revise en Administración → Editar organigrama.',
  },
  {
    pregunta: 'No puedo editar un campo que debería poder editar.',
    respuesta:
      'Los permisos dependen de tu rol y, en varias pantallas, de si eres el líder directo de esa persona (no cualquier líder). Si algo se ve solo de lectura y crees que no debería ser así, confírmalo con Talento Humano.',
  },
  {
    pregunta: '¿Cómo se calcula el semáforo (Alto/Medio/Bajo)?',
    respuesta: 'Se calcula automáticamente a partir del índice numérico de Hacer o Deber de la persona, según los rangos definidos por el sistema — no se asigna a mano.',
  },
  {
    pregunta: '¿Cómo exporto un informe?',
    respuesta: 'Entra a Informes, elige el informe que necesitas, y usa los botones "Exportar PDF" o "Exportar Excel" en la parte superior.',
  },
  {
    pregunta: '¿Qué es el Brief de retroalimentación y quién lo ve?',
    respuesta: 'Es el material de preparación que el líder escribe antes de la reunión de retroalimentación con su colaborador. Es privado: solo lo ve quien lo escribió y Talento Humano — ni siquiera el colaborador en crecimiento lo ve.',
  },
  {
    pregunta: '¿Cómo firmo el Acuerdo de crecimiento?',
    respuesta: 'La firma es una casilla de verificación más la fecha (no una firma dibujada). Cada parte —colaborador y líder— firma la suya desde la pantalla del Acuerdo de ese Encuentro de Crecimiento.',
  },
  {
    pregunta: '¿Por qué no puedo abrir un nuevo Ciclo de Crecimiento?',
    respuesta: 'Solo Talento Humano (admin_th) puede crear ciclos, desde Espiral de Crecimiento → Ciclos de Crecimiento → "Abrir nuevo ciclo".',
  },
  {
    pregunta: '¿Puedo cambiar las ponderaciones de un ciclo que ya está abierto?',
    respuesta: 'No. Las ponderaciones solo se pueden editar mientras el ciclo está en estado "planeado", antes de abrirlo — así se evita afectar Encuentros de Crecimiento que ya están en curso.',
  },
  {
    pregunta: '¿Cómo marco mi avance en un curso de Formación?',
    respuesta: 'En Nexa → Formación y SST, cada curso asignado tiene un control deslizante de avance y un botón "Marcar como completado". Guarda tu avance con el botón correspondiente.',
  },
  {
    pregunta: '¿Qué le pasa a una alerta cuando la marco como resuelta o la descarto?',
    respuesta: 'Ambas acciones (solo disponibles para admin_th) la sacan de la lista de alertas pendientes. "Resuelta" indica que ya se atendió (ej. se renovó un examen); "Descartar" indica que no aplicaba o fue un error.',
  },
  {
    pregunta: 'Olvidé mi contraseña, ¿qué hago?',
    respuesta: 'Pide a Talento Humano que te asigne una nueva contraseña temporal desde Administración → Usuarios y roles.',
  },
  {
    pregunta: '¿Tengo que iniciar sesión con mi correo?',
    respuesta:
      'No es obligatorio. En la pantalla de ingreso puedes escribir tu usuario (ej. "juan.perez") o tu correo completo — ambos funcionan igual. Si no sabes cuál es tu usuario, pregúntale a Talento Humano — lo puede ver en Administración → Usuarios y roles, columna "Usuario".',
  },
  {
    pregunta: 'Intenté entrar con "nombre.apellido" y no funcionó, ¿por qué?',
    respuesta:
      'El usuario de login es un dato propio de la cuenta, no siempre es exactamente "primernombre.primerapellido" — por ejemplo, si tu cuenta se creó a mano con un correo personal, tu usuario pudo quedar distinto (ej. sin el punto). Pide a Talento Humano que revise la columna "Usuario" en Administración → Usuarios y roles, o que te lo corrija si hace falta.',
  },
  {
    pregunta: '¿Por qué mi usuario nuevo no aparece con el rol que Talento Humano configuró?',
    respuesta: 'El rol que ves reflejado es el que quedó guardado al crear la cuenta en Administración → Usuarios. Si no coincide, pide a Talento Humano que lo revise y corrija ahí — no se edita desde ningún otro lugar.',
  },
  {
    pregunta: '¿Puedo editar los datos de un usuario después de creado?',
    respuesta: 'Sí. admin_th puede presionar "Editar" en la fila de esa persona, en Administración → Usuarios y roles, y cambiar su nombre, apodo, correo o rol.',
  },
  {
    pregunta: '¿Qué diferencia hay entre "Retirar" y "Eliminar" un usuario?',
    respuesta:
      '"Retirar" deja la cuenta inactiva y le bloquea el acceso, pero es reversible — se puede "Reactivar" en cualquier momento. "Eliminar" borra la cuenta por completo y no se puede deshacer; si esa persona tiene actividad registrada en el sistema (certificaciones, alertas resueltas, publicaciones, etc.), la eliminación no procede y te sugiere usar "Retirar" en su lugar. Ninguna de las dos opciones aparece sobre tu propia cuenta.',
  },
  {
    pregunta: '¿Qué diferencia hay entre "Descartar" un aliado del directorio y no hacer nada?',
    respuesta: 'Eliminar un aliado del Directorio de aliados lo borra permanentemente de la lista — pide confirmación antes de hacerlo.',
  },
  {
    pregunta: '¿Cómo funciona el Plan de inducción de un cargo?',
    respuesta:
      'Se genera automáticamente: la parte común (propósito, visión, principios, valores) viene de Identidad Organizacional, y la parte específica del cargo viene de su perfil (funciones, riesgos SST, EPP, exámenes de ingreso, formación mínima). admin_th puede editar los puntos de un cargo desde Administración → Cargos. Cuando se registra el ingreso o el cambio de cargo de alguien en su Historial, el checklist se le asigna solo.',
  },
  {
    pregunta: '¿Quién puede marcar un punto de inducción como cumplido?',
    respuesta: 'El líder directo de la persona o admin_th. Queda registrado quién lo marcó y cuándo.',
  },
  {
    pregunta: '¿Qué diferencia hay entre "Hoja de vida y certificaciones" y "Documentos"?',
    respuesta:
      '"Hoja de vida y certificaciones" es el registro de formación, cursos y certificaciones de la persona (con fecha de vencimiento si aplica). "Documentos" es otra pantalla distinta, donde se sube el archivo real de la hoja de vida (el CV), el contrato, y desde donde se genera el certificado laboral.',
  },
  {
    pregunta: '¿Cómo genero el certificado laboral de alguien?',
    respuesta:
      'Entra a la ficha de la persona → Documentos y certificado laboral. Marca o no la casilla "Incluir el salario" y presiona "Descargar PDF". El salario que trae el certificado es el que quede registrado en el contrato de esa persona.',
  },
  {
    pregunta: '¿Por qué no veo la sección de Documentos en la ficha de alguien de mi equipo?',
    respuesta: 'Esa sección es de manejo exclusivo de Talento Humano y del propio colaborador — ni siquiera el líder directo tiene acceso, porque el contrato trae el salario de la persona.',
  },
  {
    pregunta: '¿Cómo edito los datos que salen en el certificado laboral (NIT, dirección, quién firma)?',
    respuesta: 'En Administración → Configuración, sección "Datos de la empresa".',
  },
  {
    pregunta: '¿Dónde registro la EPS, ARL, AFP o caja de compensación de alguien?',
    respuesta: 'En la ficha de la persona → Documentos y certificado laboral, sección "Afiliaciones". Mismo nivel de acceso que el contrato: solo Talento Humano y la propia persona.',
  },
  {
    pregunta: '¿Cómo registro una incapacidad o licencia?',
    respuesta:
      'En la ficha de la persona → Incapacidades → "Registrar incapacidad". Elige el tipo (enfermedad general, accidente laboral, licencia de maternidad/paternidad, etc.), las fechas, quién la certifica (EPS o ARL) y, si lo tienes, adjunta el soporte. La persona la puede ver desde ahí o desde su propio Mi Perfil, de solo lectura.',
  },
  {
    pregunta: '¿Cómo registro que alguien renunció o fue despedido?',
    respuesta:
      'Entra a la ficha de la persona → Historial → "Agregar movimiento" → tipo "Salida", y elige el motivo (renuncia voluntaria, despido, fin de contrato, mutuo acuerdo, jubilación u otro). Al guardar, en un solo paso: la ficha queda inactiva con esa fecha y motivo, y si la persona tenía cuenta de acceso, se retira automáticamente — no hace falta ir aparte a Usuarios y roles a retirarla. Aparte, puedes diligenciar la Entrevista de salida si quieres registrar sus comentarios.',
  },
  {
    pregunta: '¿Cómo registro una sanción o llamado de atención?',
    respuesta:
      'En Historial → "Agregar movimiento" → tipo "Sanción". Además de la fecha y la descripción, elige la gravedad (leve, grave o gravísima) y puedes adjuntar el soporte o descargo firmado.',
  },
  {
    pregunta: '¿Cómo envío un mensaje directo a alguien?',
    respuesta: 'Entra a Mensajes (ícono en el encabezado o el menú lateral) → "Nuevo mensaje", elige a la persona y escribe. Puedes escribirle a cualquiera de tu empresa, no solo a tu equipo.',
  },
  {
    pregunta: '¿Qué diferencia hay entre el Feed corporativo y Mensajes?',
    respuesta: 'El Feed es de difusión general — lo publica admin_th o un líder y lo ve toda la empresa. Mensajes es privado, 1 a 1, entre dos personas específicas.',
  },
  {
    pregunta: '¿Dónde veo mis notificaciones?',
    respuesta: 'En el ícono de sobre del encabezado, o entrando a Notificaciones. Ahí aparecen recordatorios como fechas próximas de tus alertas.',
  },
  {
    pregunta: '¿Qué es "Mi cuaderno" en Nexa?',
    respuesta: 'Un espacio de apuntes personales sobre tu propio aprendizaje, dentro de Nexa → Formación. Es privado: ni Talento Humano puede verlo.',
  },
  {
    pregunta: '¿Cómo reacciono a una publicación del feed corporativo?',
    respuesta: 'Con el botón "Me gusta" que aparece abajo de cada publicación. Vuelve a hacer clic para quitar tu reacción.',
  },
  {
    pregunta: '¿Por qué aparece un PDI que nadie de mi equipo redactó?',
    respuesta:
      'Lo generó el motor automático: cuando un Encuentro de Crecimiento queda 100% respondido y el semáforo de Hacer o Deber sale "bajo", el sistema crea el PDI solo y asigna los cursos de Nexa configurados para esa dimensión. Se distingue por la insignia "Automático" en Planes de Desarrollo Individual. Los cursos que dispara se configuran en Administración → Configuración.',
  },
  {
    pregunta: '¿Qué es el rol auditor_externo y qué puede ver?',
    respuesta:
      'Un rol de solo lectura pensado para alguien ajeno a la empresa (ej. un auditor de certificación). Solo ve nombre/cargo de los colaboradores y sus certificaciones de hoja de vida, y puede descargar el paquete de Evidencia de auditoría. No tiene acceso a ningún otro módulo. Se asigna igual que cualquier otro rol, desde Administración → Usuarios y roles.',
  },
  {
    pregunta: '¿Qué trae el paquete "Evidencia de auditoría" y de dónde sale la información?',
    respuesta:
      'Es un ZIP con un PDF de portada, un Excel de detalle y los archivos de evidencia adjuntos. La información sale directo de Procesos y Sistemas de Gestión (procesos, riesgos, checklist) y del módulo SST — no hay que volver a diligenciar nada aparte.',
  },
  {
    pregunta: '¿Quién puede ver el panel de "Cuentas y membresías" (Meta-Admin)?',
    respuesta:
      'Solo el equipo interno de la alianza Flowando/Nexus/V&E (cuentas marcadas como superadmin). Ninguna empresa cliente lo ve, ni siquiera con el rol admin_th.',
  },
  {
    pregunta: '¿Cómo instalo la app en mi celular?',
    respuesta:
      'En Android/Chrome: abre la app en el navegador y busca la opción "Agregar a pantalla de inicio" o "Instalar app" en el menú del navegador. En iPhone/Safari: toca el botón de compartir y elige "Agregar a pantalla de inicio". Queda como un ícono más, se abre a pantalla completa sin las barras del navegador.',
  },
  {
    pregunta: '¿Qué es el tablero (kanban) de un proceso, y en qué se diferencia del de Planes de Desarrollo?',
    respuesta:
      'En Procesos y Sistemas de Gestión, cada proceso tiene su propio tablero con columnas que admin_th puede crear, renombrar y reordenar a su gusto (por ejemplo: "Por hacer", "En revisión", "Listo"). En Planes de Desarrollo Individual, en cambio, las columnas son siempre las mismas cuatro (Pendiente/En curso/Cumplido/Vencido) y no se pueden cambiar — son el estado real del PDI, no una configuración libre.',
  },
  {
    pregunta: '¿Cómo tomo el quiz de un curso en Nexa?',
    respuesta:
      'Si el curso tiene quiz configurado, en vez de la barra de avance verás un botón "Tomar el quiz". Responde todas las preguntas y envíalas: si alcanzas el % mínimo que definió Talento Humano, el curso queda completado de una vez; si no, puedes reintentarlo.',
  },
  {
    pregunta: '¿Dónde registro mi aniversario de bodas, mi baby shower o mi embarazo?',
    respuesta:
      'En Mi Perfil, sección "Mis fechas personales". El aniversario de bodas y el baby shower le avisan a tu líder para celebrar contigo (aparecen en Alertas). El embarazo y la fecha probable de parto son privados: solo los ves tú y Talento Humano, ni tu líder ni gerencia tienen acceso a ese dato.',
  },
  {
    pregunta: '¿Qué diferencia hay entre "Mis fechas personales" y "Mis fechas especiales"?',
    respuesta:
      '"Mis fechas personales" son campos fijos y privados (matrimonio, baby shower, embarazo) que solo cada persona registra sobre sí misma. "Mis fechas especiales" es una lista abierta de texto libre (cumpleaños, día de tu profesión, cualquier aniversario que se te ocurra) — puedes agregar cuantas quieras, y a diferencia de las personales, tu líder directo y Talento Humano también te pueden agregar fechas especiales desde tu ficha.',
  },
  {
    pregunta: '¿Cómo cambio el nombre con el que me saluda la app?',
    respuesta:
      'En Mi Perfil, sección "Cómo te gusta que te llamen", escribe tu apodo o diminutivo y guarda. Reemplaza tu primer nombre legal en el saludo de Inicio y en el encabezado. Si lo dejas vacío, vuelve a usar tu primer nombre. admin_th también puede fijarlo por ti desde Administración → Usuarios y roles.',
  },
  {
    pregunta: '¿Cómo hago que el Asistente IA conozca nuestras políticas y reglamentos reales?',
    respuesta:
      'Solo admin_th puede cargarlos, desde Nexa → Asistente IA → "Base documental". Se sube el PDF (el texto se extrae solo) o se pega el texto directamente. El asistente busca automáticamente el documento más relacionado con cada pregunta que le hagan.',
  },
  {
    pregunta: '¿Cómo se calcula la tasa de rotación de personal?',
    respuesta:
      'En Espiral de Crecimiento → Indicadores: se toman todas las personas que ya estaban activas hace 12 meses, y se calcula qué porcentaje de ellas salió desde entonces (según el movimiento "Salida" registrado en su Historial). Se muestra el total y, aparte, solo las renuncias voluntarias. Si sale "—" es porque todavía no hay suficiente antigüedad registrada para calcularla, no porque haya un error.',
  },
  {
    pregunta: '¿Es de verdad anónima la encuesta de Clima Organizacional?',
    respuesta:
      'Sí. El sistema guarda por separado quién ya respondió (para no dejarte responder dos veces la misma ronda) de qué respondiste — son dos tablas distintas, sin ninguna columna que las conecte. Además, ningún resultado agregado (ni de la empresa ni de un equipo) se muestra si hay menos de 5 respuestas en ese grupo, para que nunca se pueda adivinar la respuesta de una sola persona.',
  },
  {
    pregunta: '¿Quién puede leer los comentarios de la encuesta de Clima Organizacional?',
    respuesta:
      'Solo Talento Humano (admin_th). Ni el líder directo ni gerencia tienen acceso a los comentarios de texto libre, aunque sí pueden ver los números agregados (eNPS, índice de clima) de su alcance.',
  },
  {
    pregunta: '¿Puedo responder la encuesta de Clima Organizacional más de una vez en la misma ronda?',
    respuesta: 'No. Cada persona responde una sola vez por ronda; si ya respondiste, la pantalla te lo indica en vez de mostrarte el formulario de nuevo.',
  },
  {
    pregunta: 'Ya se registraron respuestas de Clima Organizacional pero el eNPS y el índice siguen en "—". ¿Es un error?',
    respuesta:
      'No, es a propósito. Por debajo del umbral de anonimato configurado (5 respuestas por defecto) en un grupo (toda la empresa o un equipo), el sistema no calcula ningún número agregado, para que nunca se pueda deducir la respuesta de una sola persona en un grupo chico. El número aparece solo en cuanto se alcanza el umbral.',
  },
  {
    pregunta: '¿Puedo cambiar las preguntas de la encuesta de Clima Organizacional?',
    respuesta:
      'Puedes editar el texto de cada una (la pregunta de eNPS y las 6 afirmaciones) desde Administración → Configuración, sección "Preguntas de Clima Organizacional". Lo que no se puede cambiar es cuántas preguntas hay ni cuáles dimensiones miden — eso queda fijo a propósito, para que el índice de clima se pueda comparar de una ronda a otra.',
  },
  {
    pregunta: '¿El umbral de 5 respuestas de Clima Organizacional se puede cambiar según el tamaño de mi empresa?',
    respuesta:
      'Sí. En Administración → Configuración, sección "Umbral de anonimato de Clima Organizacional", puedes dejarlo como una cantidad fija de respuestas (5 por defecto, pero editable a cualquier número) o cambiarlo a un porcentaje de la planta activa de cada grupo — así el mínimo escala solo según el tamaño de la empresa o del equipo, en vez de quedar fijo.',
  },
];
