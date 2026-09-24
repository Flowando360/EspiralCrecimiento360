import type { ModuloAyuda } from '@/types/ayuda';

export const moduloNexa: ModuloAyuda = {
  slug: 'nexa',
  titulo: 'Nexa · Cultura y Formación',
  descripcion:
    'Comunicación corporativa, formación gamificada, Cacería Makigami (mejora de procesos Lean en equipo), reconocimientos, simulacros de seguridad, directorio de aliados y el asistente de IA.',
  paginas: [
    {
      slug: 'feed',
      ruta: '/nexa/feed',
      titulo: 'Feed corporativo',
      resumen:
        'Comunicados, políticas de SST, logros y anuncios, visibles para toda la empresa, con adjuntos opcionales.',
      camposYBotones: [
        { nombre: 'Publicar', explicacion: 'Solo admin_th y líder. Tipo (anuncio/política SST/logro/general), título y contenido.' },
        { nombre: 'Fijar arriba del feed', explicacion: 'Solo admin_th. Mantiene la publicación siempre visible primero.' },
        { nombre: 'Adjunto: Documento', explicacion: 'Sube un PDF, Word o imagen; se muestra como tarjeta con nombre, tamaño y botón de descarga.' },
        { nombre: 'Adjunto: Link externo', explicacion: 'Pega una URL y el botón "Vista previa" trae automáticamente título, imagen y descripción del sitio (si los tiene).' },
        { nombre: 'Adjunto: Video o imagen', explicacion: 'Se sube y se muestra directamente dentro de la publicación, sin necesidad de descargar.' },
        { nombre: 'Me gusta', explicacion: 'Cualquier persona puede reaccionar a una publicación. Vuelve a hacer clic para quitar tu reacción.' },
      ],
      proceso: [
        'Elige el tipo de publicación y escribe el título (el contenido es opcional).',
        'Si quieres adjuntar algo, elige Documento, Link o Video/imagen y complétalo.',
        'Publica — aparece de inmediato para toda la empresa.',
      ],
      notas: [
        'Solo una publicación puede combinarse con un solo tipo de adjunto a la vez (no varios adjuntos juntos).',
        'El módulo de Procesos también publica aquí automáticamente: al aprobar la creación o actualización de un documento que requiere confirmación de lectura, aparece un anuncio con un link directo a la confirmación — nadie tiene que redactarlo.',
      ],
    },
    {
      slug: 'formacion',
      ruta: '/nexa/formacion',
      titulo: 'Formación y SST',
      resumen:
        'Para un colaborador: sus cursos asignados, cada uno con barra de progreso o con un quiz de verificación (según cómo lo haya armado admin_th). Para admin_th: el catálogo completo de cursos gamificados, con creación, asignación y gestión del quiz de cada curso.',
      camposYBotones: [
        { nombre: 'Nuevo curso (admin_th)', explicacion: 'Título, descripción, categoría (inducción SST, alturas, manejo de cargas, EPP, protocolos de emergencia, cultura, técnico, otro), duración y puntos que otorga.' },
        { nombre: 'Asignar (admin_th)', explicacion: 'Por cada curso: asignarlo a todo un cargo (con nivel de riesgo y si es obligatorio) o directamente a una persona (con fecha límite).' },
        { nombre: 'Gestionar (admin_th)', explicacion: 'Lleva a la pantalla de preguntas del quiz de ese curso (ver "Quiz de un curso" más abajo).' },
        { nombre: 'Control deslizante de avance (colaborador, cursos sin quiz)', explicacion: 'Ajusta tu % de avance en un curso asignado y presiona "Guardar avance", o "Marcar como completado" para ponerlo en 100% de una vez.' },
        { nombre: 'Tomar el quiz (colaborador, cursos con quiz)', explicacion: 'Si el curso tiene preguntas configuradas, en vez de la barra deslizante aparece este botón: abre las preguntas de opción múltiple, y al enviarlas muestra el puntaje. Si no alcanzas el % mínimo, puedes reintentar.' },
      ],
      notas: [
        'El estado del curso (asignado/en curso/completado) se calcula solo. En cursos con quiz, se completa automáticamente al aprobar (alcanzar el % mínimo definido por admin_th); en cursos sin quiz, al llegar al 100% de avance o marcarlo como completado.',
      ],
    },
    {
      slug: 'quiz-curso',
      ruta: '/nexa/formacion/*/quiz',
      titulo: 'Quiz de un curso',
      resumen: 'Solo admin_th. Arma las preguntas de opción múltiple que verifican si la persona realmente aprendió el contenido del curso, en vez de solo autorreportar su avance.',
      camposYBotones: [
        { nombre: '% mínimo para aprobar', explicacion: 'Umbral configurable por curso (70% por defecto). Si el colaborador no lo alcanza, el curso no se marca como completado y puede reintentar el quiz.' },
        { nombre: 'Agregar pregunta', explicacion: 'Enunciado más hasta 4 opciones; marca con el punto cuál es la correcta. Se necesitan al menos 2 opciones con texto.' },
        { nombre: 'Ícono de basura junto a una pregunta', explicacion: 'La elimina del quiz (y sus opciones) permanentemente.' },
      ],
      notas: [
        'Un curso sin ninguna pregunta sigue funcionando con el % de avance autorreportado de siempre — el quiz es opcional por curso.',
        'La respuesta correcta nunca se le muestra al colaborador ni siquiera técnicamente (no viaja a su navegador) — solo se calcula al enviar las respuestas.',
      ],
    },
    {
      slug: 'makigami',
      ruta: '/nexa/makigami',
      titulo: 'Cacería Makigami: qué es y para qué sirve',
      resumen:
        'Imagina que pides un paquete de hojas y llega 12 días después, aunque el trabajo real de todos los que intervinieron sumó 3 horas. ¿Dónde se fueron los otros 11 días? Esperando una firma, pasando papeles de un área a otra, digitando lo mismo dos veces... Makigami (en japonés, "rollo de papel") es una técnica para DIBUJAR un proceso de la empresa paso a paso, con quién hace cada cosa y cuánto se tarda, para que ese tiempo perdido se VEA. En la Cacería Makigami esa técnica es un juego de equipo: alguien dibuja el proceso, todos entran a "cazar" lo que sobra (los desperdicios), proponen cómo arreglarlo y votan las mejores ideas, y las aprobadas se vuelven mejoras reales. Mientras tanto, cada quien gana puntos e insignias. Sirve para aprender a ver ineficiencias en tu propio trabajo (por eso vive en Nexa, como formación) y para mejorar los procesos de verdad, con evidencia para ISO 9001.',
      camposYBotones: [
        { nombre: 'Retos', explicacion: 'Cada tarjeta es un proceso que se está analizando. La etiqueta de color dice en qué va: ✏️ En mapeo (lo están dibujando; todavía no puedes jugar), 🎯 Cacería abierta (¡entra a cazar!), 💡 En rediseño (entra a proponer y votar mejoras) o 🎉 Cerrado (mira los resultados). También ves cuántos pasos tiene, cuántas cazas lleva, cuántas personas han participado y qué tan eficiente es el proceso hoy. Toca la tarjeta para entrar.' },
        { nombre: 'Nuevo reto (solo Talento Humano y líderes)', explicacion: 'Crea un reto nuevo. Llena: título (mejor una pregunta que enganche, ej. "¿Por qué una compra de papelería tarda 2 semanas?"), qué problema quieres resolver, el proceso del mapa de procesos al que pertenece (opcional), dónde empieza y dónde termina el proceso, y hasta cuándo estará abierta la cacería. Quien lo crea queda como FACILITADOR: lo dibuja y lo va pasando de fase.' },
        { nombre: 'Mis insignias', explicacion: 'Tus logros sumando todas las cacerías. Las que todavía no tienes se ven en gris. 🎯 Cazador: cazaste 10 desperdicios o más. 🦅 Ojo de Halcón: fuiste el primero en ver 3 desperdicios que luego el equipo confirmó. 🧠 Arquitecto del Proceso: te aprobaron una propuesta de mejora. ⚡ Ahorrador de Tiempo: tus mejoras aprobadas le quitan 1 día o más al proceso.' },
        { nombre: 'Mejores cazadores', explicacion: 'Las 5 personas que mejor han cazado en toda la empresa. Primero cuenta cuántas veces fueron pioneras de un hallazgo confirmado y luego cuántas cazas hicieron.' },
        { nombre: 'Aprende a cazar: los 8 desperdicios', explicacion: 'La "guía de campo" del cazador. Un desperdicio es todo lo que gasta tiempo o esfuerzo pero no le sirve a quien recibe el resultado. Los 8 son: ⏳ Esperas (algo quieto en una bandeja esperando firma o respuesta), 🔀 Traspasos innecesarios (el trabajo pasa por manos que no le aportan), ✍️ Sobreprocesamiento (digitar dos veces, aprobar lo ya aprobado), 🔁 Errores y reprocesos (devolver y rehacer), 🔍 Búsqueda de información (buscar archivos o datos que deberían estar a mano), 📥 Trabajo acumulado (solicitudes represadas), 📄 Sobreproducción (informes o copias que nadie usa) y 💡 Talento no aprovechado (gente haciendo tareas mecánicas, o ideas que nadie escucha).' },
      ],
      proceso: [
        'Un reto pasa por 4 fases, siempre en este orden: 1) MAPEO: el facilitador dibuja el proceso tal como ocurre hoy. 2) CACERÍA: todos marcan los desperdicios que ven. 3) REDISEÑO: todos proponen mejoras y votan; el facilitador aprueba las que van. 4) RESULTADOS: se ve cuánto más rápido queda el proceso y se publica en el Feed.',
        'Si eres colaborador, no tienes que dibujar nada. Espera el anuncio "🎯 ¡Abrió la Cacería Makigami!" en el Feed, o entra a Nexa → Cacería Makigami y busca un reto con la etiqueta 🎯 Cacería abierta.',
        'Entra al reto, recorre el tablero y caza los desperdicios que veas. El paso a paso detallado está en la página "Tablero de un reto Makigami" de este manual.',
        'Cuando el reto pase a 💡 Rediseño, vuelve a entrar: propón cómo arreglar lo que se cazó y vota las ideas de tus compañeros que más te gusten.',
        'Cuando el reto se cierre, mira el resultado (ej. "de 12 días a 6 días"), tus puntos en Nexa → Reconocimientos y tus insignias aquí mismo.',
        'Si eres facilitador (Talento Humano o líder): crea el reto con "Nuevo reto", dibuja el proceso, abre la cacería, pásalo a Rediseño cuando se cumpla la fecha, aprueba las mejores propuestas y ciérralo. Todo el detalle está en la página siguiente.',
      ],
      notas: [
        'Para cazar, proponer y votar necesitas una ficha de colaborador vinculada a tu cuenta. Si ves "Tu usuario no tiene ficha de colaborador", pídele a Talento Humano que te la vincule en Administración → Usuarios y roles → Editar.',
        'No hay respuestas malas: si crees que algo es un desperdicio, cázalo. Si otras personas piensan lo mismo, el hallazgo queda "validado por el equipo".',
        'Cómo se ganan puntos (se suman al ranking de Nexa → Reconocimientos): 3 por cada desperdicio que caces (hasta 12 cazas por reto), 15 extra si fuiste el primero en ver un desperdicio y luego 2 personas más lo confirmaron, 10 por cada propuesta de mejora que no descarten y 40 si aprueban tu propuesta.',
        'Los puntos de cazar y proponer NO llegan al instante: se entregan todos juntos cuando el facilitador cierra esa fase. Mientras tanto, el ranking del reto los muestra como "puntos en juego". Así nadie gana puntos marcando y desmarcando.',
        'Crear retos: Talento Humano y líderes. Un líder solo maneja los retos que él mismo creó; Talento Humano puede manejarlos todos.',
      ],
    },
    {
      slug: 'makigami-reto',
      ruta: '/nexa/makigami/*',
      titulo: 'Tablero de un reto Makigami: paso a paso',
      resumen:
        'Esta es la pantalla donde se juega. Arriba está la línea de fases (en cuál va el reto), luego la barra de eficiencia (cuánto del tiempo del proceso sirve de verdad) y abajo el tablero Makigami, el "rollo de papel" digital. Se lee así: cada FILA (carril) es una persona o área que participa (Solicitante, Compras, Gerencia...). Cada COLUMNA es un paso, en orden de izquierda a derecha. Cada TARJETA dice qué se hace en ese paso. Las FLECHAS muestran hacia dónde va el trabajo: gris y recta si sigue en la misma área, naranja y punteada si salta a otra área (eso es un "traspaso", y ahí suele perderse tiempo). Debajo del tablero hay dos filas con el tiempo de TRABAJO y de ESPERA de cada paso; las esperas de un día o más salen en rojo. En el celular, desliza el tablero de lado con el dedo para ver todos los pasos.',
      camposYBotones: [
        { nombre: 'Línea de fases (arriba)', explicacion: 'Las 4 fases del reto; la que va en curso se ve resaltada. El facilitador ve aquí el botón verde para pasar a la siguiente fase (siempre pide confirmación) y "Volver a…" para regresar a la anterior si algo quedó mal.' },
        { nombre: 'Barra de eficiencia', explicacion: 'Tiempo total del proceso, cuánto de ese tiempo agrega valor, la eficiencia en % (en procesos de oficina lo normal es que sea bajísima, como 1% o 2%), cuántos traspasos entre áreas hay, cuántos desperdicios se han cazado y cuántas personas han participado. La barra de colores reparte el tiempo: verde = agrega valor, amarillo = necesario pero no agrega valor, rojo = trabajo que es desperdicio, rayas rosadas = esperas.' },
        { nombre: 'Etiquetas AV / NAV-N / NAV en las tarjetas', explicacion: 'La clasificación que el facilitador le dio a cada paso. AV = Agrega Valor (lo que quien recibe el resultado de verdad necesita). NAV-N = No Agrega Valor pero es Necesario (ej. algo que exige una norma). NAV = No Agrega Valor: desperdicio puro, candidato a eliminarse.' },
        { nombre: 'Brillo rojo y 🔥 en las tarjetas', explicacion: 'El mapa de calor: mientras más desperdicios le han cazado a un paso, más brilla en naranja o rojo y mayor es el número junto al 🔥. Así se ve de un vistazo dónde está el problema.' },
        { nombre: 'Los 8 botones de desperdicio', explicacion: 'Aparecen al tocar un paso durante la Cacería (en el panel de la derecha; en el celular, debajo del tablero). Toca uno para cazarlo: se pone rojo. Tócalo otra vez para quitar tu caza. El número al lado dice cuántas personas lo han cazado; con 3 aparece un ✓ rojo: validado por el equipo. Si dejas el mouse sobre un botón, ves un ejemplo de ese desperdicio.' },
        { nombre: '¿Por qué? (opcional)', explicacion: 'Cajita debajo de los botones para explicar lo que viste (ej. "Se digita dos veces la misma información"). Escríbela ANTES de tocar el botón del desperdicio: se guarda con esa caza y los demás la ven en "Quién lo vio".' },
        { nombre: 'Quién lo vio', explicacion: 'Debajo de los botones: quién cazó primero cada desperdicio (el pionero), cuántas personas lo confirmaron y los comentarios que dejaron.' },
        { nombre: 'Cazadores de este reto', explicacion: 'El ranking del reto, con los puntos de cada persona, cuántas cazas lleva (🎯) y cuántas veces fue pionera de un hallazgo validado (🦅). Tu fila se resalta en verde.' },
        { nombre: 'Simulador (fase de Rediseño)', explicacion: 'El recuadro verde y azul: muestra el tiempo de hoy → el tiempo si se aplicaran las mejoras, y el % que se ahorra. Marca la casilla "Simular" en las propuestas que quieras probar y mira cómo cambia en vivo; los pasos que se eliminarían se ven apagados y tachados en el tablero. Es solo una simulación: no aprueba ni cambia nada.' },
        { nombre: '💡 Propón una mejora (fase de Rediseño)', explicacion: 'Elige a qué paso aplica tu idea (o "Todo el proceso"), qué tipo de cambio es (eliminar el paso, simplificar, automatizar, combinar pasos u otra mejora), descríbela y estima cuánto tiempo ahorraría. Toca "Proponer".' },
        { nombre: '👍 (votar)', explicacion: 'Vota las propuestas de otras personas que te parezcan buenas; tócalo otra vez para quitar tu voto. No puedes votar las tuyas. Las más votadas aparecen primero.' },
        { nombre: 'Aprobar / Descartar / Reabrir (solo facilitador)', explicacion: 'Decide qué propuestas se van a hacer. Las aprobadas se ven en verde; las descartadas quedan en gris al final. Una propuesta que ya tiene ACPM no se puede reabrir ni descartar desde aquí.' },
        { nombre: 'Crear ACPM de mejora (solo Talento Humano)', explicacion: 'En una propuesta aprobada: la convierte en una ACPM de mejora en Procesos → ACPM, con el autor de la idea como responsable. Así la mejora tiene dueño, plan y seguimiento hasta comprobar que funcionó. Después aparece el código de la ACPM (ej. ACPM-006) con un enlace.' },
        { nombre: 'Carriles y "+ Paso aquí" (solo facilitador, fase de Mapeo)', explicacion: 'En el panel "Carriles" se agregan, renombran, ordenan (↑ ↓) o eliminan las filas. En el tablero, el recuadro punteado "+ Paso aquí" al final de cada carril abre el formulario para agregar un paso de esa área.' },
      ],
      proceso: [
        'SI ERES EL FACILITADOR: DIBUJAR EL PROCESO (fase Mapeo).',
        'Antes de empezar, reúnete 30 minutos con quienes hacen el proceso y pregúntales cómo pasa DE VERDAD, no como dice el manual. Buscamos la realidad, con todas sus vueltas.',
        'En el panel "Carriles", escribe cada persona o área que participa (ej. Solicitante, Líder del área, Compras, Gerencia, Proveedor) y toca "+ Carril". Ordénalos con las flechas ↑ ↓.',
        'En el tablero, toca "+ Paso aquí" en el carril de quien hace el PRIMER paso y llena el formulario: ¿Quién lo hace?; ¿Qué hace? (verbo + objeto, ej. "Firma la solicitud"); tiempo de trabajo (lo que de verdad tarda haciéndolo); espera (cuánto se queda quieto antes de que alguien haga el siguiente paso, en minutos, horas o días); documento o sistema que usa; y clasificación (AV, NAV-N o NAV; si no estás seguro, déjalo sin clasificar). Toca "Agregar paso".',
        'El formulario queda abierto y limpio para el siguiente paso: si lo hace otra área, cambia "¿Quién lo hace?". Repite hasta el último paso del proceso.',
        '¿Te equivocaste? Toca la tarjeta del paso para corregirla, moverla antes o después con las flechas ← →, o eliminarla.',
        'Revisa la barra de eficiencia: si los números tienen sentido (tiempo total, traspasos), el mapa está listo.',
        'Toca "🎯 Abrir la cacería" y confirma. Sale solo un anuncio en el Feed invitando a toda la empresa. Desde ese momento el mapa ya no se puede editar, salvo que regreses a Mapeo.',
        'PARA TODOS: CAZAR DESPERDICIOS (fase Cacería).',
        'Entra al reto. Verás el aviso naranja "¡La cacería está abierta!", cuántos días quedan y cuántas cazas llevas.',
        'Toca la tarjeta de un paso. Verás qué se hace, cuánto tarda, cuánto espera y los 8 botones de desperdicio.',
        'Pregúntate: ¿esto le sirve a quien recibe el resultado? ¿Se espera mucho? ¿Se hace dos veces? ¿Pasa por manos que no aportan? Si ves un desperdicio, (opcional) escribe por qué en la cajita y toca el botón. Te sale un aviso: "¡Eres el pionero!" si fuiste el primero, o "confirmaste lo que otros vieron".',
        'Repite con todos los pasos que quieras. Pista: las esperas largas (en rojo debajo del tablero) y las flechas naranjas punteadas casi siempre esconden desperdicios.',
        'SI ERES EL FACILITADOR: PASAR A REDISEÑO.',
        'Cuando llegue la fecha límite, toca "💡 Cerrar cacería y pasar a Rediseño" y confirma. En ese momento se entregan los puntos de la cacería.',
        'PARA TODOS: PROPONER Y VOTAR (fase Rediseño).',
        'Mira el mapa de calor: los pasos más rojos son los que más le duelen al equipo. En "💡 Propón una mejora" elige el paso, el tipo de cambio, describe tu idea y estima cuánto tiempo ahorraría. Toca "Proponer". Truco: si tocas primero una tarjeta del tablero, queda preseleccionada en tu propuesta.',
        'Lee las propuestas de tus compañeros y vota con 👍 las que más te gusten.',
        'Juega con el simulador: marca "Simular" en varias propuestas y mira cuánto se encoge el proceso.',
        'SI ERES EL FACILITADOR: DECIDIR Y CERRAR.',
        'Toca "Aprobar" en las propuestas que se van a hacer y "Descartar" en las que no. Cada aprobación le da 40 puntos al autor en ese momento.',
        'Si eres Talento Humano, toca "Crear ACPM de mejora" en cada propuesta aprobada para que tenga responsable y seguimiento en Procesos → ACPM. Sin ACPM, la mejora se queda en idea.',
        'Toca "🎉 Cerrar el reto y publicar resultados" y confirma. Se entregan los puntos por proponer y, si hubo mejoras aprobadas, sale en el Feed el logro "de X días a Y días".',
        'DESPUÉS DEL RETO (para que la mejora sea real): haz seguimiento a cada ACPM hasta cerrarla como eficaz, actualiza el procedimiento del proceso en Procesos → Documentos para que el cambio quede por escrito y, si quieres comprobar que el tiempo de verdad bajó, crea un indicador en el proceso (ej. "Días promedio de una compra").',
      ],
      notas: [
        'Los tiempos se suman en orden: el tiempo total del proceso es la suma de todo el trabajo y todas las esperas. Un "día" son 24 horas de calendario, porque así se viven las esperas.',
        'El simulador nunca descuenta el tiempo que sí agrega valor: ese trabajo hay que hacerlo sí o sí.',
        'Si el facilitador regresa de fase, los puntos ya entregados no se repiten ni se quitan. La aprobación de una propuesta se paga una sola vez, aunque se reabra y se vuelva a aprobar.',
        'Eliminar un reto (ícono de basura en la línea de fases, solo facilitador) borra el mapa, las cazas y las propuestas, pero cada persona conserva los puntos que ya ganó.',
        'En el celular: desliza el tablero de lado con el dedo; al tocar un paso, su panel aparece debajo del tablero.',
      ],
    },
    {
      slug: 'notebook',
      ruta: '/nexa/notebook',
      titulo: 'Mi cuaderno',
      resumen: 'Espacio de apuntes personales de tu propio proceso de aprendizaje — estrictamente privado, nadie más los puede ver, ni siquiera Talento Humano.',
      camposYBotones: [
        { nombre: 'Nueva nota', explicacion: 'Crea una nota con título y contenido libre.' },
        { nombre: 'Guardar', explicacion: 'Aparece cuando editas una nota existente; guarda los cambios.' },
        { nombre: 'Ícono de basura', explicacion: 'Elimina la nota.' },
      ],
    },
    {
      slug: 'reconocimientos',
      ruta: '/nexa/reconocimientos',
      titulo: 'Reconocimientos',
      resumen:
        'Ranking de puntos y muro de los últimos reconocimientos otorgados en la empresa. Desde que existe el módulo de Procesos, este mismo ranking también suma automáticamente los puntos que se ganan ahí.',
      camposYBotones: [
        { nombre: 'Otorgar reconocimiento', explicacion: 'admin_th y líder. Elige a la persona (el líder solo ve su propio equipo), escribe el motivo y los puntos.' },
        {
          nombre: 'Pestaña "Por puntos"',
          explicacion:
            'Suma de puntos por persona, de mayor a menor (top 10). Tu propia fila queda resaltada en verde si estás dentro del top 10; si no, aparece tu posición exacta debajo de la lista, para que siempre sepas dónde estás sin importar el puesto.',
        },
        {
          nombre: 'Pestaña "Por cumplimiento"',
          explicacion:
            'Ranking alternativo que no compara puntos brutos sino % de lo asignado que está al día — para que quien lidera un proceso de 1-2 personas no quede en desventaja frente a un equipo grande. Solo cuenta riesgos con frecuencia de revisión definida y ACPM ya cerradas o con fecha de compromiso vencida (lo que todavía está en curso y dentro de plazo no suma ni resta). Muestra "cumplidos/asignados" junto al porcentaje.',
        },
        {
          nombre: 'Puntos automáticos del módulo de Procesos',
          explicacion:
            'Confirmar lectura de un documento: 5 pts. Marcar un riesgo revisado a tiempo: 5 pts. Registrar un riesgo/oportunidad con control definido: 10 pts. Registrar una ACPM: 10 pts. Completar todo el plan de acción de una ACPM: 20 pts. Cerrar una ACPM validada como eficaz: 60 pts (el máximo — cerrarla como "no eficaz" no resta puntos, para no castigar la honestidad en la validación).',
        },
        {
          nombre: 'Puntos de la Cacería Makigami',
          explicacion:
            'Cada reto de Nexa → Cacería Makigami suma aquí sus puntos al cerrar cada fase: 3 por caza (máx. 12 por persona y reto), 15 al pionero de un hallazgo validado, 10 por propuesta de mejora y 40 por propuesta aprobada. El motivo aparece como "Cacería Makigami «nombre del reto»: …".',
        },
      ],
      notas: [
        'Los puntos de riesgos y ACPM hoy solo los puede generar admin_th, porque esas pantallas son de edición exclusiva suya — ambos rankings reflejarán más personas a medida que esos permisos se abran más adelante.',
        'La pestaña "Por cumplimiento" solo lista a quien ya tiene algo asignado como responsable de un riesgo o una ACPM — quien no tiene nada asignado todavía no aparece ahí (no es que tenga 0%).',
      ],
    },
    {
      slug: 'simulacros',
      ruta: '/nexa/simulacros',
      titulo: 'Simulacros y dinámicas en vivo',
      resumen: 'Programación de simulacros de seguridad y dinámicas de cultura.',
      camposYBotones: [
        { nombre: 'Nuevo simulacro (admin_th)', explicacion: 'Título, descripción, fecha y número de participantes esperados.' },
        { nombre: 'Tarjeta de simulacro', explicacion: 'Clic para entrar al detalle y registrar asistencia/valoración.' },
      ],
    },
    {
      slug: 'detalle-simulacro',
      ruta: '/nexa/simulacros/*',
      titulo: 'Detalle de un simulacro',
      resumen: 'Registro de quién asistió y su valoración de desempeño (1-5).',
      camposYBotones: [
        { nombre: 'Asistió (admin_th)', explicacion: 'Casilla por persona.' },
        { nombre: 'Valoración (admin_th)', explicacion: 'De 1 a 5, opcional.' },
        { nombre: 'Guardar', explicacion: 'Guarda esa fila individualmente.' },
      ],
      notas: ['Líder y colaborador ven de solo lectura los participantes que la empresa permite ver (su equipo o ellos mismos).'],
    },
    {
      slug: 'clima',
      ruta: '/nexa/clima',
      titulo: 'Clima Organizacional',
      resumen:
        'Mediciones periódicas de eNPS y compromiso (6 dimensiones), organizadas por rondas. Diseñado para que las respuestas sean anónimas de verdad: no hay ninguna forma de saber qué respondió una persona en particular.',
      camposYBotones: [
        { nombre: 'Abrir nueva ronda de clima (admin_th)', explicacion: 'Le pone nombre a la medición (ej. "Clima 2do semestre 2026") y la deja abierta para que todos respondan. Solo puede haber una ronda abierta a la vez.' },
        { nombre: 'Cerrar ronda (admin_th)', explicacion: 'Fija los resultados de la ronda abierta. Después de cerrarla ya nadie puede responderla.' },
        { nombre: 'Tu opinión', explicacion: 'El formulario que responde cualquier persona con ficha de colaborador (incluidos líderes y gerencia): eNPS (0-10) más 6 afirmaciones de acuerdo/desacuerdo (1-5) sobre reconocimiento, liderazgo, desarrollo, comunicación, condiciones de trabajo y pertenencia, y un comentario libre opcional. Solo se puede responder una vez por ronda.' },
        { nombre: 'Resultados por ronda (admin_th y gerencia)', explicacion: 'Tabla con el eNPS y el índice de clima general de cada ronda, a nivel de toda la empresa.' },
        { nombre: 'Clima de tu equipo (líder)', explicacion: 'La misma idea que "Resultados por ronda", pero calculada solo con las respuestas del equipo de ese líder.' },
        { nombre: 'Comentarios (admin_th)', explicacion: 'Los comentarios de texto libre que la gente fue dejando, sin ningún dato de quién los escribió.' },
      ],
      notas: [
        'Anonimato real, no solo de nombre: la tabla que registra quién ya respondió (para no dejar responder dos veces) está separada de la tabla que guarda qué respondió, y no hay ninguna columna que las conecte entre sí.',
        'Los resultados de una empresa o de un equipo se ocultan (aparecen como "—") mientras haya menos de 5 respuestas en ese grupo — así nunca se puede deducir la respuesta de una sola persona en un equipo chico.',
        'Los comentarios de texto libre —lo más fácil de reconocer a simple vista— solo los puede leer Talento Humano; ni el líder directo ni gerencia tienen acceso a ellos, aunque sí ven los números agregados.',
        'El enunciado de las 7 preguntas (eNPS + 6 dimensiones) se puede adaptar al lenguaje de la empresa desde Administración → Configuración — las preguntas en sí (cuántas y cuáles) se mantienen fijas para poder comparar el índice de clima de una ronda a otra.',
        'El umbral de 5 respuestas también es configurable por admin_th (Administración → Configuración): se puede dejar como una cantidad fija distinta, o cambiar a un % de la planta activa de cada grupo, para que el mínimo escale con el tamaño de la empresa.',
      ],
    },
    {
      slug: 'directorio-aliados',
      ruta: '/nexa/directorio',
      titulo: 'Directorio de aliados',
      resumen: 'Libreta de contactos de ARL, asesores SST y proveedores de formación certificada, para toda la empresa.',
      camposYBotones: [
        { nombre: 'Nuevo aliado (admin_th)', explicacion: 'Nombre, tipo (ARL/asesor SST/proveedor de formación/otro), contacto y notas.' },
        { nombre: 'Ícono de basura (admin_th)', explicacion: 'Elimina el aliado del directorio, con confirmación.' },
      ],
    },
    {
      slug: 'asistente-ia',
      ruta: '/nexa/asistente',
      titulo: 'Asistente IA',
      resumen:
        'Chat que responde dudas normativas y de procedimiento apoyándose en los documentos de políticas propias que admin_th haya cargado (reglamento SST, manual interno), además del propósito/valores de la empresa. Si no tiene ningún documento relevante para una pregunta normativa, lo dice en vez de inventar una respuesta.',
      camposYBotones: [
        { nombre: 'Campo de pregunta', explicacion: 'Escribe tu duda y presiona enviar; la respuesta aparece en el chat.' },
        { nombre: 'Base documental (admin_th)', explicacion: 'Botón que lleva a la pantalla donde se cargan los documentos que usa el asistente (ver "Base documental del asistente" más abajo).' },
      ],
      notas: [
        'Requiere que Talento Humano/soporte técnico haya configurado la clave de la IA en el servidor. Si no está configurada, el chat lo avisa en vez de fallar en silencio.',
        'Cada pregunta y respuesta queda registrada para trazabilidad, aunque no es visible dentro de la app para ningún rol todavía.',
      ],
    },
    {
      slug: 'documentos-politica',
      ruta: '/nexa/asistente/documentos',
      titulo: 'Base documental del asistente',
      resumen: 'Solo admin_th. Aquí se cargan los documentos propios (reglamento SST, manual interno, políticas) que el Asistente IA usa como referencia antes de responder.',
      camposYBotones: [
        { nombre: 'Subir el PDF', explicacion: 'El texto se extrae automáticamente del archivo — no hace falta transcribirlo a mano.' },
        { nombre: 'Pegar el texto', explicacion: 'Alternativa a subir un PDF: pega directamente el texto de la política (útil si no tienes el archivo a mano, o solo quieres cargar un fragmento).' },
        { nombre: 'Categoría', explicacion: 'SST, Políticas, Procedimientos u Otro — solo de referencia, no cambia cómo el asistente busca en el documento.' },
        { nombre: 'Casilla Activo/Inactivo', explicacion: 'Desactiva un documento para que el asistente deje de usarlo, sin borrarlo.' },
      ],
      notas: [
        'El asistente busca automáticamente los documentos más relacionados con cada pregunta — no hay que indicarle a mano cuál usar.',
      ],
    },
  ],
};
