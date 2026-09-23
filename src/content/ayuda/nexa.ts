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
      titulo: 'Cacería Makigami',
      resumen:
        'Formación Lean en equipo: se dibuja un proceso administrativo real (quién hace qué, cuánto tarda, cuánto espera) y toda la empresa "caza" los desperdicios escondidos en él. Las mejores ideas se votan, se aprueban y pueden convertirse en ACPM de mejora. Cada reto pasa por 4 fases: Mapeo → Cacería → Rediseño → Resultados.',
      camposYBotones: [
        { nombre: 'Nuevo reto (admin_th y líder)', explicacion: 'Título, qué problema se quiere resolver, proceso del mapa de procesos (opcional), dónde empieza y termina el proceso, y fecha límite de la cacería. Quien lo crea queda como facilitador.' },
        { nombre: 'Mis insignias', explicacion: '🎯 Cazador (10+ cazas), 🦅 Ojo de Halcón (primero en ver 3 desperdicios que el equipo luego validó), 🧠 Arquitecto del Proceso (una propuesta aprobada) y ⚡ Ahorrador de Tiempo (mejoras aprobadas que ahorran 1 día o más). Se calculan sumando todas las cacerías; las que aún no tienes se ven en gris.' },
        { nombre: 'Mejores cazadores', explicacion: 'Top 5 de la empresa en todas las cacerías, ordenado primero por hallazgos validados como pionero y luego por cantidad de cazas.' },
        { nombre: 'Aprende a cazar', explicacion: 'Los 8 desperdicios Lean traducidos a la oficina (esperas, traspasos, sobreprocesamiento, errores, búsqueda de información, trabajo acumulado, sobreproducción y talento no aprovechado), con ejemplos.' },
      ],
      notas: [
        'Cualquier rol con ficha de colaborador puede cazar, proponer y votar. Crear retos es de admin_th y líder; un líder solo facilita los retos que él mismo creó (admin_th facilita todos).',
      ],
    },
    {
      slug: 'makigami-reto',
      ruta: '/nexa/makigami/*',
      titulo: 'Tablero de un reto Makigami',
      resumen:
        'El "rollo de papel" digital: cada fila (carril) es un rol o área, cada columna es un paso del proceso en orden. Las flechas punteadas en ámbar marcan los traspasos entre áreas. Debajo de los carriles están las filas de análisis (tiempo de trabajo y tiempo de espera de cada paso) y, arriba, la barra de eficiencia del proceso.',
      camposYBotones: [
        { nombre: 'Línea de fases', explicacion: 'Muestra en qué fase va el reto. El facilitador ve el botón para avanzar (con confirmación) y el de "Volver a" la fase anterior.' },
        { nombre: 'Carriles (facilitador, fase Mapeo)', explicacion: 'En el panel derecho: agregar, renombrar, subir/bajar o eliminar carriles. Eliminar un carril borra sus pasos.' },
        { nombre: '+ Paso aquí (facilitador, fase Mapeo)', explicacion: 'Columna al final de cada carril. Abre el formulario del paso: quién lo hace, qué hace, tiempo de trabajo, espera antes del siguiente paso (en minutos, horas o días calendario), documento o sistema que usa y clasificación Lean (AV agrega valor, NAV-N necesaria sin agregar valor, NAV desperdicio). El formulario queda abierto para seguir agregando pasos.' },
        { nombre: 'Tocar un paso', explicacion: 'En Mapeo (facilitador) abre su edición, con flechas para moverlo antes o después y botón Eliminar. En las demás fases abre su detalle y los desperdicios cazados.' },
        { nombre: 'Barra de eficiencia', explicacion: 'Tiempo total, tiempo que agrega valor, eficiencia (% del tiempo total que agrega valor), número de traspasos, desperdicios cazados y cazadores. La barra divide el tiempo en: agrega valor, necesario, trabajo que es desperdicio y esperas. Los pasos sin clasificar cuentan como necesarios.' },
        { nombre: 'Botones de desperdicio (fase Cacería)', explicacion: 'Al tocar un paso aparecen los 8 desperdicios: toca uno para cazarlo y vuelve a tocarlo para retirar tu caza. Puedes dejar un comentario de por qué, que se guarda con tu próxima caza. El número indica cuántas personas lo cazaron; con 3 queda "validado por el equipo" (✓ en rojo).' },
        { nombre: 'Mapa de calor', explicacion: 'Desde la Cacería, los pasos con más cazas brillan en naranja/rojo y muestran 🔥 con el total, para ver de un vistazo dónde se concentra el problema.' },
        { nombre: 'Propón una mejora (fase Rediseño)', explicacion: 'Paso al que aplica (o todo el proceso), tipo de acción (eliminar, simplificar, automatizar, combinar u otra), descripción y ahorro de tiempo estimado.' },
        { nombre: 'Votar (👍)', explicacion: 'Un voto por persona por propuesta; vuelve a tocar para quitarlo. No puedes votar tu propia propuesta.' },
        { nombre: 'Simulador', explicacion: 'Marca "Simular" en las propuestas para ver en vivo cómo se encoge el proceso (tiempo de hoy → tiempo rediseñado y % de reducción). Los pasos que se eliminarían se atenúan en el tablero. El tiempo que agrega valor nunca se descuenta. Al cerrar el reto, el simulador queda fijo con las mejoras aprobadas.' },
        { nombre: 'Aprobar / Descartar / Reabrir (facilitador)', explicacion: 'Resuelve cada propuesta. Una propuesta con ACPM ya creada no se puede reabrir ni descartar desde aquí.' },
        { nombre: 'Crear ACPM de mejora (solo admin_th)', explicacion: 'En una propuesta aprobada, crea una ACPM tipo "mejora" en Procesos → ACPM, con el autor como responsable y el reto como origen. Luego muestra el código de la ACPM con un enlace.' },
        { nombre: 'Cazadores de este reto', explicacion: 'Ranking del reto con puntos, cazas, veces como pionero validado e insignias ganadas.' },
      ],
      proceso: [
        'Mapeo: el facilitador crea los carriles y dibuja los pasos tal como ocurren hoy (no como dice el manual), con sus tiempos.',
        'Abrir la cacería: se publica automáticamente un anuncio en el Feed con el enlace al reto. El mapa ya no se puede editar salvo que el facilitador regrese a Mapeo.',
        'Cacería: todos recorren el tablero y cazan desperdicios. El primero en ver un desperdicio es el "pionero".',
        'Pasar a Rediseño: se cierran las cazas y se entregan los puntos de la cacería. Todos proponen y votan mejoras; el facilitador aprueba las que van.',
        'Cerrar el reto: se entregan los puntos por proponer y, si hay mejoras aprobadas, se publica el logro en el Feed ("de X días a Y días").',
      ],
      notas: [
        'Puntos (se suman al ranking de Reconocimientos): 3 por cada caza (máximo 12 cazas con puntos por persona y reto), 15 extra al pionero de cada hallazgo que llegue a 3 cazadores, 10 por cada propuesta no descartada y 40 cuando te aprueban una propuesta.',
        'Los puntos de cazar y proponer se entregan en lote al cerrar cada fase (no al marcar), así marcar y desmarcar no suma puntos. Mientras la fase está abierta, el ranking del reto los muestra como "puntos en juego". La aprobación de una propuesta se paga una sola vez, aunque se reabra y se vuelva a aprobar.',
        'Si el facilitador regresa de fase, los puntos ya entregados no se vuelven a entregar ni se retiran.',
        'Los tiempos se asumen en secuencia: el tiempo total del proceso es la suma del trabajo y la espera de todos los pasos. Los días son de calendario (24 h).',
        'Eliminar un reto borra su mapa, cazas y propuestas, pero conserva los puntos ya entregados.',
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
