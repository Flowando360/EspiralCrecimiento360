import type { ModuloAyuda } from '@/types/ayuda';

export const moduloNexa: ModuloAyuda = {
  slug: 'nexa',
  titulo: 'Nexa · Cultura y Formación',
  descripcion:
    'Comunicación corporativa, formación gamificada, reconocimientos, simulacros de seguridad, directorio de aliados y el asistente de IA.',
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
      notas: ['Solo una publicación puede combinarse con un solo tipo de adjunto a la vez (no varios adjuntos juntos).'],
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
      resumen: 'Ranking de puntos y muro de los últimos reconocimientos otorgados en la empresa.',
      camposYBotones: [
        { nombre: 'Otorgar reconocimiento', explicacion: 'admin_th y líder. Elige a la persona (el líder solo ve su propio equipo), escribe el motivo y los puntos.' },
        { nombre: 'Ranking de puntos', explicacion: 'Suma de puntos por persona, de mayor a menor.' },
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
