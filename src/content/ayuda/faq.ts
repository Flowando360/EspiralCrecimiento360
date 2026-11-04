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
    respuesta:
      'Pulsa “¿Olvidaste tu contraseña?” en la pantalla de inicio de sesión, escribe tu correo y abre el enlace que llega por correo. Si no llega en unos minutos, revisa la carpeta de spam. Si sigue sin llegar, pide a tu administrador que revise tu cuenta.',
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
    respuesta: 'Entra a Mensajes (ícono en la barra superior) → "Nuevo mensaje", elige a la persona y escribe. Puedes escribirle a cualquiera de tu empresa, no solo a tu equipo.',
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
    pregunta: '¿Quién puede entrar al panel del proveedor?',
    respuesta:
      'Solo las cuentas del equipo proveedor de Espiral, registradas como proveedor activo, con su propio inicio de sesión en /proveedor/login. Ninguna cuenta de empresa cliente lo ve, ni siquiera con el rol admin_th.',
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
  {
    pregunta: '¿Qué es la Cacería Makigami y por qué está en Nexa?',
    respuesta:
      'Es un juego de equipo para mejorar procesos de oficina. Se dibuja un proceso real paso a paso (quién hace qué, cuánto tarda, cuánto espera), todos "cazan" lo que sobra (esperas, doble digitación, firmas innecesarias...), se proponen y votan mejoras, y las aprobadas se vuelven ACPM de mejora. Está en Nexa porque también es formación: enseña a ver desperdicios en el propio trabajo. Guía completa: Centro de Ayuda → Nexa → Cacería Makigami.',
  },
  {
    pregunta: 'En la Cacería Makigami me sale "Tu usuario no tiene ficha de colaborador". ¿Qué hago?',
    respuesta:
      'Tu cuenta de acceso no está vinculada a tu ficha de colaborador, y sin ella no puedes cazar, proponer, votar ni ganar puntos. Pídele a Talento Humano que la vincule en Administración → Usuarios y roles → Editar → "Ficha de colaborador".',
  },
  {
    pregunta: 'Cacé desperdicios en la Cacería Makigami pero no veo los puntos en Reconocimientos. ¿Por qué?',
    respuesta:
      'Es a propósito: los puntos de cazar y de proponer se entregan todos juntos cuando el facilitador cierra esa fase (al pasar a Rediseño y al cerrar el reto), para que nadie gane puntos marcando y desmarcando. Mientras tanto aparecen como "puntos en juego" en el ranking del reto. Los 40 puntos de una propuesta aprobada sí llegan al instante.',
  },
  {
    pregunta: '¿Por qué no me deja entrar a la plataforma aunque mi contraseña es correcta?',
    respuesta:
      'Puede haber tres causas: tu cuenta no tiene un perfil activo en tu empresa, tu empresa fue desactivada por el proveedor, o estás intentando entrar al panel del proveedor con una cuenta de empresa. El mensaje de error te indica cuál es, o puedes pedir a tu administrador que lo revise.',
  },
  {
    pregunta: '¿Puedo entrar con mi correo en vez de con mi usuario?',
    respuesta:
      'Sí. En el inicio de sesión puedes escribir tu usuario (por ejemplo, nombre.apellido) o el correo de tu cuenta; cualquiera de los dos funciona.',
  },
  {
    pregunta: '¿Por qué veo el logo y los colores de mi empresa y no los de Espiral?',
    respuesta:
      'El encabezado muestra los dos: a la izquierda el logo y el nombre de Espiral de Crecimiento 360°, y a la derecha el logo y el nombre de tu empresa. Los colores de la barra y de los acentos son los de tu empresa.',
  },
  {
    pregunta: '¿Cómo descargo un respaldo de mis datos?',
    respuesta:
      'Como administrador de tu empresa, entra a Administración → Respaldo de datos y pulsa “Descargar respaldo completo”. Recibirás un ZIP con un CSV por tabla y un archivo LEEME.txt. Guárdalo en un lugar con acceso restringido, porque contiene datos personales.',
  },
  {
    pregunta: '¿Qué diferencia hay entre el rol de sistema y un rol personalizado?',
    respuesta:
      'El rol de sistema (admin_th, líder, colaborador, gerencia o auditor_externo) decide qué datos puede ver cada persona. Un rol personalizado, que creas en Administración → Roles y permisos, decide qué módulos del menú ve y qué puede escribir o borrar. No da acceso a datos que el rol de sistema no ve.',
  },
  {
    pregunta: '¿Cómo creo un rol personalizado y lo asigno a alguien?',
    respuesta:
      'En Administración → Roles y permisos, pulsa “Nuevo rol”, escribe el nombre, marca los permisos por módulo y pulsa “Guardar cambios”. Luego, en Administración → Usuarios y roles, edita el usuario y elige el rol en “Rol personalizado”.',
  },
  {
    pregunta: '¿Qué pasa si desactivan mi empresa?',
    respuesta:
      'Ninguno de sus usuarios puede entrar hasta que la empresa se reactive. Los datos no se borran: al reactivarla, todo vuelve a estar disponible.',
  },
  {
    pregunta: '¿Por qué hay personas con cuenta que no aparecen como colaboradores?',
    respuesta:
      'Una cuenta puede existir sin ficha de colaborador (por ejemplo, un administrador o un auditor externo). Si la persona sí debe aparecer como colaboradora, pide a tu administrador que vincule su cuenta con su ficha en Administración → Usuarios y roles → Editar → Ficha de colaborador.',
  },
  {
    pregunta: '¿Cómo hago una acción y no sé dónde está?',
    respuesta:
      'Abre el Centro de Ayuda (el ícono de ? en la barra superior) y escribe lo que quieres hacer, con tus palabras, por ejemplo “cómo creo un usuario”. Si la respuesta está en el manual, verás los pasos directamente. Si no la encuentras, pulsa “¿No encontraste lo que necesitas? Envía tu requerimiento” y responde tres preguntas: qué pasa, qué esperabas que pasara y cómo imaginas la solución.',
  },
  {
    pregunta: '¿Qué pasa con mi requerimiento después de enviarlo?',
    respuesta:
      'Queda registrado para el equipo de Espiral, que lo revisa desde su panel y puede cambiar su estado (nuevo, en revisión, resuelto o descartado). Si el correo está configurado, también llega por correo al equipo. Puedes adjuntar capturas, PDF, Word, texto u hojas de cálculo que ayuden a explicar la idea (hasta 5 archivos y 4 MB en total).',
  },
  {
    pregunta: '¿Cómo creo un cargo nuevo si no tengo el perfil en Excel?',
    respuesta:
      'Entra a Administración → Cargos y perfiles y pulsa "+ Nuevo cargo". Escribe el nombre y el área, pulsa "Crear cargo y continuar" y completa su manual de funciones, sus habilidades, los riesgos, los exámenes y el EPP. También puedes importar un Excel en formato FORSST 61.',
  },
  {
    pregunta: '¿Cómo armo el Saber de una persona sin digitar todo a mano?',
    respuesta:
      'Carga primero su hoja de vida (formación, certificaciones, cursos y experiencia) en su ficha. Luego entra a Saber y pulsa "Generar checklist desde cargo y hoja de vida": el aplicativo cruza lo que exige el cargo con lo que la persona acreditó y te deja cada ítem listo para revisar como Cumple, Parcial o No cumple.',
  },
  {
    pregunta: '¿Por qué el Hacer y el Deber de una persona salen en blanco?',
    respuesta:
      'Porque todavía no hay respuestas del líder en ese ciclo. Apenas el líder guarda sus notas, el índice, la brecha y el semáforo aparecen solos. Verifica que el Encuentro de Crecimiento esté generado y que el líder lo tenga pendiente en su Inicio.',
  },
  {
    pregunta: '¿Cómo registro una acción de desarrollo para una brecha que detecté?',
    respuesta:
      'Abre el resultado del Encuentro de Crecimiento de la persona y pulsa "Nueva acción de desarrollo", en Plan de Desarrollo. Te sugiere los ítems que el líder calificó con 2 o menos; toca uno, escribe la acción y la fecha compromiso y guarda. Puede hacerlo Talento Humano o el líder directo.',
  },
  {
    pregunta: '¿Cómo envío un candidato al líder para que lo evalúe?',
    respuesta:
      'En el tablero de la vacante, debajo de las columnas, está "Evaluación por el líder". Elige al líder evaluador, los días que podrá ver al candidato y pulsa "Enviar al líder". El líder recibe un aviso en Notificaciones y deja sus apreciaciones en Reclutamiento.',
  },
  {
    pregunta: 'El líder que busco no aparece al enviar un candidato. ¿Qué pasa?',
    respuesta:
      'Solo aparecen líderes que tienen usuario con rol Líder vinculado a su ficha de colaborador. Créalo o corrígelo en Administración → Usuarios y roles.',
  },
  {
    pregunta: 'Una persona descartada vuelve a postularse. ¿Se crea otro registro?',
    respuesta:
      'No. El aplicativo la reconoce por su documento o su correo y suma el proceso nuevo a su misma ficha. En el tablero verás "Ya participó antes" con el resultado y el motivo del descarte anterior, y en su ficha queda todo el histórico.',
  },
  {
    pregunta: '¿Se borran los datos de un candidato rechazado?',
    respuesta:
      'No. Nada se borra automáticamente: el histórico se conserva. Si una persona pide suprimir sus datos, la solicitud llega al Banco de candidatos, tú la respondes y decides manualmente si los eliminas. Marcarla como atendida solo registra tu respuesta.',
  },
  {
    pregunta: '¿Qué pasa con la hoja de vida de un candidato al contratarlo?',
    respuesta:
      'Al pulsar "Contratado — crear colaborador" el alta trae el nombre, el correo, el teléfono, el documento y el cargo, y la hoja de vida del candidato pasa sola a los documentos del colaborador.',
  },
  {
    pregunta: '¿Cómo registro la salida de una persona?',
    respuesta:
      'En su ficha entra a Historial → Agregar movimiento y elige "Salida" con la fecha y el motivo. En un solo paso la ficha queda Inactiva y, si tenía cuenta de acceso, se retira. Después puedes llenar la entrevista de salida. La rotación se actualiza sola en Indicadores.',
  },
  {
    pregunta: '¿Dónde modifico los datos de un colaborador?',
    respuesta:
      'Solo Talento Humano: Espiral 360° → Colaboradores → clic en el nombre → botón «Editar» (lápiz) arriba a la derecha de la ficha. Allí cambias datos personales, cargo, líder directo, fecha de ingreso, contrato, estado, salario y afiliaciones. «Editar» no deja registro en el Historial: si cambias cargo o líder, anótalo también en Historial → Agregar movimiento.',
  },
  {
    pregunta: '¿Dónde le asigno cargo, líder y ficha a una persona que solo tiene cuenta?',
    respuesta:
      'La cuenta (usuario y contraseña) y la ficha (cargo, líder, evaluaciones) son distintas. Crea la ficha en Espiral 360° → Colaboradores → Nuevo colaborador eligiendo su cargo y líder y vinculando su cuenta, o créala y luego vincúlala en Administración → Usuarios y roles → Editar con el selector de ficha. Ese selector solo lista fichas activas que todavía no tienen cuenta; si ninguna es de la persona, déjalo en «Sin ficha».',
  },
  {
    pregunta: '¿Dónde veo qué personas tiene a cargo un líder?',
    respuesta:
      'En Espiral 360° → Colaboradores, elige el nombre del líder en el selector «Todos los líderes»: se listan sus subalternos con cargo, área y estado. También en Administración → Organigrama (filtro «Líder directo») y, al generar encuentros, en Ciclos → «Un equipo».',
  },
  {
    pregunta: '¿Cómo cambio mi contraseña? ¿Es obligatorio cambiar la clave inicial?',
    respuesta:
      'No es obligatorio, pero es lo recomendable. Pulsa el icono de llave de la barra superior (Cambiar mi contraseña): escribe tu contraseña actual, la nueva (mínimo 8 caracteres) y repítela. Cualquier persona con usuario puede hacerlo. Si olvidaste la actual, usa «Olvidé mi contraseña» en el inicio de sesión.',
  },
  {
    pregunta: '¿Por qué no puedo generar los Encuentros de Crecimiento de un equipo?',
    respuesta:
      'Si el botón aparece deshabilitado es porque todas las personas de ese equipo (o esa persona) ya tienen su encuentro en este ciclo; la lista «Ya generado / Por generar» lo muestra. Generar puede tardar uno o dos minutos: espera el mensaje «Listo» sin cerrar la página.',
  },
  {
    pregunta: '¿Qué diferencia hay entre «Guardar avance» y «Enviar valoración»?',
    respuesta:
      '«Guardar avance» guarda tu borrador: puedes salir, volver y cambiar lo que quieras. «Enviar valoración» (se activa al responder todos los ítems) la entrega de forma definitiva: queda en solo lectura, ya no se puede modificar y recién ahí cuenta en los resultados. En tu Inicio sigue como pendiente hasta que la envíes.',
  },
  {
    pregunta: 'Una persona es valorada por su líder y por varios pares. ¿Cómo se combinan?',
    respuesta:
      'Dentro de cada grupo se promedia (4 pares cuentan como una sola fuente «pares»). Luego se ponderan los grupos: con personal a cargo, líder 40 %, pares 30 % y colaboradores a cargo 30 %; sin personal a cargo, líder 60 % y pares 40 %. La autoevaluación no entra en el índice, solo sirve para la brecha. Solo cuentan valoraciones enviadas.',
  },
  {
    pregunta: '¿Cómo busco a una persona o filtro una lista?',
    respuesta:
      'Encima de las tablas hay una casilla de búsqueda (sin importar tildes) y filtros desplegables. En Colaboradores filtras por nombre, cargo, líder directo y «Solo líderes de área»; en Usuarios y roles, por rol, estado y ficha; también en Cargos, Organigrama, Banco de candidatos, informes de PDI, Formación, SST y Cultura, y en el detalle de un ciclo. «Limpiar filtros» vuelve a mostrar todo.',
  },
  {
    pregunta: 'Un líder no ve a todo su equipo o una persona nueva no sale en el organigrama. ¿Qué hago?',
    respuesta:
      'Entra a Administración → Editar organigrama. En «Para revisar» ves los líderes sin equipo y las personas sin líder. Elige al líder en «Por líder», marca las personas que le reportan y pulsa «Guardar equipo». Luego, en el ciclo, vuelve a pulsar «Generar Encuentros de Crecimiento»: agrega lo nuevo sin tocar lo que ya se generó.',
  },
  {
    pregunta: '¿Cómo elimino un ciclo que creé por error o de pruebas?',
    respuesta:
      'En Espiral 360° → Ciclos de Crecimiento, pulsa «Eliminar ciclo» en su tarjeta (o dentro de su detalle), revisa el aviso de lo que se perderá y escribe ELIMINAR. Es definitivo, así que úsalo solo con ciclos de prueba o sin valoraciones reales.',
  },
  {
    pregunta: '¿Eliminar a un colaborador borra su historia?',
    respuesta:
      'La ficha y todo lo asociado se borran, pero antes queda un registro en Colaboradores → «Histórico de eliminados» (cargo, líder, fechas, motivo y movimientos). Si la persona solo dejó la empresa, es mejor «Salida» desde su Historial: queda inactiva y conserva toda su información.',
  },
  {
    pregunta: '¿La operación es igual para todas las empresas?',
    respuesta:
      'Sí: el aplicativo funciona igual para cualquier empresa. Los datos (personas, cargos, ciclos, usuarios) son independientes por empresa y nada de una se ve en otra.',
  },
];
