import type { ModuloAyuda } from '@/types/ayuda';

export const moduloProcesosGestion: ModuloAyuda = {
  slug: 'procesos-gestion',
  titulo: 'Procesos y Sistemas de Gestión',
  descripcion:
    'Mapa de procesos, caracterización, gestión documental, análisis de contexto (FODA), matriz de riesgos y oportunidades cuantitativa, auditorías internas con hallazgos, riesgos, ACPM, gestión de cambio, matriz de requisitos legales y diagnóstico ISO 9001:2015 — el ciclo PHVA completo del sistema de gestión, con trazabilidad entre todos los módulos (un riesgo, un hallazgo o una debilidad del contexto pueden generar una acción en ACPM sin volver a explicar de dónde salió), base del paquete de Evidencia de auditoría.',
  paginas: [
    {
      slug: 'indice',
      ruta: '/procesos-gestion',
      titulo: 'Procesos y Sistemas de Gestión',
      resumen:
        'Mapa de procesos (con vista de cuadro y de interacciones) y el tablero de checklist de cumplimiento por marco normativo, en una sola pantalla. La matriz de riesgos y oportunidades tiene su propia pantalla (botón "Riesgos").',
      camposYBotones: [
        {
          nombre: 'Mapa de procesos',
          explicacion:
            'Organiza los procesos documentados en Estratégicos, Misionales, de Apoyo y de Evaluación. Cada proceso tiene un código autogenerado (ej. PE-1, PM-2), tipo, área, responsable, objetivo y los marcos normativos a los que aplica (ISO 9001, SST, SARLAFT/SAGRILAFT, PTEE, Interno). Un proceso creado antes de este bloque aparece "Sin clasificar" hasta que se edite y se le asigne un tipo.',
        },
        {
          nombre: 'Nuevo proceso (admin_th)',
          explicacion:
            'Wizard de 4 pasos: Identidad (nombre, tipo, área, responsable, versión, objetivo) → Marcos normativos → Interacciones (qué procesos me entregan algo y a cuáles les entrego algo) → Confirmación. El código se genera solo, según el tipo elegido.',
        },
        {
          nombre: 'Vista de cuadro',
          explicacion: 'Tabla ordenable por código, nombre, tipo, estado o fecha de actualización — útil para buscar rápido o priorizar procesos obsoletos o en definición.',
        },
        {
          nombre: 'Vista de interacciones',
          explicacion:
            'Generada automáticamente a partir de lo que cada proceso declaró que recibe y entrega en el wizard — nadie dibuja el mapa a mano. Distingue interacciones de flujo de valor y de apoyo.',
        },
        {
          nombre: 'Estado del proceso',
          explicacion: 'Vigente / En definición / Obsoleto — editable directamente desde la tarjeta del mapa (admin_th). Un proceso obsoleto se muestra atenuado.',
        },
        {
          nombre: 'Índice de madurez',
          explicacion:
            'Barra de progreso en cada tarjeta y columna en la vista de cuadro: 0-100%, 20 puntos por cada uno de 5 criterios — caracterización completa, indicador con medición en los últimos 6 meses, riesgos actualizados (<6 meses), documentos vigentes, y sin ACPM vencidas. Da una priorización visual inmediata de qué proceso necesita atención, sin generar informes manuales.',
        },
        {
          nombre: 'Tablero de checklist de cumplimiento',
          explicacion: 'Columnas por estado (No cumple / Cumple parcial / Cumple / No aplica) para los ítems de cada marco normativo. Arrastra una tarjeta a otra columna para cambiar su estado. Un filtro arriba del tablero permite ver un solo marco normativo a la vez.',
        },
        {
          nombre: 'Adjuntar evidencia (al crear un ítem del checklist)',
          explicacion: 'Al agregar un ítem al checklist se puede subir un archivo que respalda el cumplimiento — queda guardado en un bucket privado y se incluye en el paquete de Evidencia de auditoría.',
        },
      ],
      notas: [
        'Pueden ver esta pantalla: admin_th, líder y gerencia. Crear/editar procesos, marcos, interacciones, riesgos e ítems del checklist es exclusivo de admin_th.',
        'Todo lo que se registra aquí alimenta directamente el informe Evidencia de auditoría (Informes → Evidencia de auditoría), sin necesidad de volver a cargarlo.',
      ],
    },
    {
      slug: 'ficha-proceso',
      ruta: '/procesos-gestion/*',
      titulo: 'Ficha de un proceso',
      resumen:
        'La caracterización completa de un proceso específico: ficha SIPOC (entradas, actividades y salidas) más los documentos vinculados a él.',
      camposYBotones: [
        {
          nombre: 'Caracterización (SIPOC)',
          explicacion:
            'Tres columnas — Entradas, Actividades, Salidas — mismo formato que la plantilla de caracterización de procesos que ya usas en papel. Cada entrada o salida puede indicar de qué proceso viene o a cuál va.',
        },
        {
          nombre: 'Documentos vinculados',
          explicacion: 'Lista de los documentos (procedimientos, políticas, formatos, instructivos, registros) que pertenecen a este proceso, con acceso directo a su ficha en Gestión documental.',
        },
        {
          nombre: 'Indicadores',
          explicacion:
            'Matriz de indicadores del proceso: nombre, fórmula/fuente, meta, unidad, sentido (mayor es mejor / menor es mejor) e histórico de mediciones por período. Cada indicador muestra si la última medición "Cumple" o "No cumple" la meta.',
        },
        { nombre: 'Ver tablero', explicacion: 'Accede al pipeline visual del proceso (kanban de casos), igual que en la versión anterior del módulo.' },
      ],
      notas: ['Pueden ver esta ficha: admin_th, líder y gerencia. Agregar o eliminar entradas/actividades/salidas, indicadores y mediciones es exclusivo de admin_th.'],
    },
    {
      slug: 'tablero-proceso',
      ruta: '/procesos-gestion/*/tablero',
      titulo: 'Tablero de un proceso',
      resumen:
        'El pipeline visual de un proceso específico (por ejemplo, selección de personal o gestión de compras): columnas configurables por las que se mueven las tarjetas (casos), igual al lenguaje visual de un pipeline de reclutamiento.',
      camposYBotones: [
        { nombre: 'Configurar etapas (admin_th)', explicacion: 'Agrega, renombra, reordena o elimina las columnas del tablero, y les asigna un color entre 8 disponibles. Si el proceso no tiene tablero todavía, aparece un botón para crearlo con etapas típicas por defecto.' },
        { nombre: 'Agregar tarjeta', explicacion: 'Título, descripción, responsable, prioridad (baja/media/alta) y fecha límite.' },
        { nombre: 'Arrastrar tarjeta', explicacion: 'Mueve una tarjeta entre columnas (cambia su etapa) o dentro de la misma columna (cambia su orden). El contador de cada columna se actualiza solo.' },
        { nombre: 'Fecha límite en rojo', explicacion: 'Cuando una tarjeta tiene fecha límite vencida, su fecha se resalta en rojo — misma señal visual en Planes de Desarrollo Individual.' },
      ],
      notas: [
        'Pueden ver este tablero: admin_th, líder y gerencia. Configurar etapas, arrastrar tarjetas y editar/eliminar casos es exclusivo de admin_th.',
      ],
    },
    {
      slug: 'gestion-documental',
      ruta: '/procesos-gestion/documentos',
      titulo: 'Gestión documental',
      resumen:
        'El Procedimiento de Gestión Documental digitalizado, con el flujo completo de control documental: Borrador → En revisión → En validación → Aprobado (Vigente) — cada etapa con su propio responsable opcional, y trazabilidad completa hasta la difusión con confirmación de lectura.',
      camposYBotones: [
        {
          nombre: 'Nueva solicitud (admin_th y líder)',
          explicacion:
            'Elige el proceso y el tipo de solicitud (crear / actualizar / anular). Para "crear" se indica nombre y tipo de documento (procedimiento, política, formato, instructivo o registro — un registro es el diligenciado/evidencia, distinto del formato que es la plantilla en blanco); para "actualizar" o "anular" se elige el documento existente. Se puede adjuntar el borrador del archivo, y opcionalmente elegir un revisor y un validador — si se dejan en blanco, cualquier admin_th puede resolver esa etapa. Queda guardada como "Borrador", todavía no entra a ningún flujo de aprobación.',
        },
        {
          nombre: 'Borradores',
          explicacion: 'Quien la creó (o admin_th) puede "Enviar a revisión" cuando esté lista, o "Cancelar" si ya no aplica — mientras está en borrador se puede seguir ajustando fuera de la plataforma sin que nadie más la vea todavía como pendiente.',
        },
        {
          nombre: 'En revisión',
          explicacion: 'El revisor asignado a la solicitud (o cualquier admin_th si no se asignó ninguno) la aprueba — pasa a "En validación" — o la rechaza, con un comentario opcional. Alguien sin ese rol asignado solo puede ver la solicitud, no resolverla.',
        },
        {
          nombre: 'En validación',
          explicacion:
            'El validador asignado (o cualquier admin_th) da el visto bueno final: "Aprobar y publicar" es el paso que de verdad genera el código automático (ej. PM-1-PO-001, con la estructura de prefijos/separador/consecutivo configurable en Administración → Configuración), sube la versión (v001 → v002…), archiva la anterior en el historial, reinicia el conteo de confirmaciones de lectura y anuncia en el Feed. También puede rechazarla aquí, con comentario.',
        },
        {
          nombre: 'Listado Maestro',
          explicacion: 'Todos los documentos vigentes, con su código, proceso, tipo, versión vigente y estado de difusión (cuántos confirmaron lectura).',
        },
        {
          nombre: 'Confirmar lectura',
          explicacion:
            'Dentro de la ficha de un documento que la requiere (procedimientos y políticas, por defecto), cualquier persona con acceso al módulo puede confirmar que lo leyó, con un comentario opcional. La barra de progreso compara contra el umbral de "difusión completa" configurable (Administración → Configuración).',
        },
        {
          nombre: 'Difusión automática al Feed',
          explicacion:
            'Al aprobar una solicitud de "crear" o "actualizar" cuyo documento requiere confirmación, se publica sola un anuncio en el Feed corporativo con un link directo a la confirmación — sin que nadie tenga que redactarlo ni recordar avisar. Confirmar lectura ahora suma 5 puntos al ranking de Nexa (Reconocimientos).',
        },
        {
          nombre: 'Exportar acta de difusión',
          explicacion: 'Genera un PDF con el resumen de confirmaciones (quién, cuándo, comentarios) y la línea de tiempo de versiones del documento — listo para entregar en auditoría (ISO 9001 numeral 7.5.3).',
        },
        { nombre: 'Historial de versiones', explicacion: 'Dentro de la ficha de cada documento: cada versión anterior, cuándo se archivó y el resumen del cambio.' },
      ],
      notas: [
        'Pueden ver esta pantalla: admin_th, líder y gerencia. Solicitar documentos: admin_th y líder. Enviar a revisión/cancelar un borrador: quien lo creó, o admin_th. Resolver "En revisión"/"En validación": la persona asignada a esa etapa, o admin_th (admin_th siempre puede resolver cualquier etapa, aunque haya alguien más asignado).',
        'Solo la versión vigente de un documento es visible para la empresa; las versiones obsoletas quedan en un repositorio que solo admin_th puede consultar.',
        'Confirmar lectura ya está abierto a cualquier colaborador (no solo a quien tiene acceso a este módulo) — ver la página "Confirmar lectura de un documento".',
      ],
    },
    {
      slug: 'confirmar-lectura-documento',
      ruta: '/procesos-gestion/documentos/*/confirmar',
      titulo: 'Confirmar lectura de un documento',
      resumen:
        'Pantalla angosta y de un solo propósito, abierta a cualquier colaborador de la empresa — no requiere acceso al módulo de Procesos. Se llega principalmente haciendo clic en el anuncio que aparece solo en el Feed cuando se publica o actualiza un documento.',
      camposYBotones: [
        { nombre: 'Ver documento', explicacion: 'Abre el archivo vigente en una pestaña nueva.' },
        { nombre: 'Confirmar que lo leí', explicacion: 'Registra la confirmación (con comentario opcional) y suma 5 puntos al ranking de Nexa (Reconocimientos). Si el documento no requiere confirmación, esta sección no aparece.' },
      ],
      notas: [
        'Visible para cualquier rol autenticado de la empresa (admin_th, líder, colaborador, gerencia) — a propósito no se abrió todo el módulo de Procesos, solo esta pantalla puntual.',
      ],
    },
    {
      slug: 'contexto',
      ruta: '/procesos-gestion/contexto',
      titulo: 'Contexto (análisis FODA)',
      resumen:
        'Debilidades, oportunidades, fortalezas y amenazas, registradas de forma estructurada (no un archivo suelto) — cada análisis queda guardado con fecha y responsable, para comparar en el tiempo. Se recomienda repetirlo al menos una vez al año.',
      camposYBotones: [
        { nombre: 'Nuevo análisis (admin_th)', explicacion: 'Crea una nueva corrida del FODA con responsable y notas opcionales, y abre su tablero de 4 columnas.' },
        { nombre: 'Agregar ítem', explicacion: 'Texto libre dentro de la columna correspondiente (Debilidad / Oportunidad / Fortaleza / Amenaza).' },
        {
          nombre: 'Crear acción (admin_th)',
          explicacion: 'Enlace bajo cada ítem: abre el tablero de ACPM con una nueva tarjeta pre-vinculada a ese ítem del contexto como origen — igual que ya funciona desde un riesgo o un hallazgo de auditoría.',
        },
        { nombre: 'Prioridad: impacto y probabilidad (admin_th)', explicacion: 'Cada factor tiene dos selectores (Bajo, Medio, Alto) y una insignia de Prioridad de 1 a 9 (impacto × probabilidad: rojo desde 6, amarillo desde 3). Dentro de cada columna los factores se ordenan de mayor a menor prioridad. Es la misma escala de 1 a 3 de Riesgos y oportunidades.' },
        { nombre: 'Priorizar con IA (admin_th)', explicacion: 'La IA propone el impacto y la probabilidad de todos los factores y una sugerencia de qué hacer con cada uno («Convertir en riesgo formal», «Llevar al plan de trabajo» o «Solo seguimiento»), que aparece en un recuadro verde bajo el factor. Es solo una propuesta: puedes cambiar los valores. El texto del análisis se envía al servicio de IA. Si la IA no está configurada en el servidor, lo avisa.' },
        { nombre: 'Convertir en riesgo / Pasar a oportunidades (admin_th)', explicacion: 'Crea el factor como riesgo (debilidades y amenazas) u oportunidad formal en Riesgos y oportunidades, con su impacto y probabilidad, y lo deja vinculado («Ya está en Riesgos»). Allí defines el control y las acciones. Las fortalezas no se convierten.' },
        { nombre: 'Estrategias cruzadas FO · FA · DO · DA', explicacion: 'Debajo de las cuatro columnas hay cuatro cuadrantes: FO (usar fortalezas para aprovechar oportunidades), FA (usar fortalezas para enfrentar amenazas), DO (superar debilidades aprovechando oportunidades) y DA (reducir debilidades y evitar amenazas). Cada estrategia muestra los factores que cruza.' },
        { nombre: 'Proponer estrategias con IA (admin_th)', explicacion: 'La IA arma hasta 3 estrategias por cuadrante usando solo tus factores, y cada una debe cruzar de verdad un factor de cada tipo. Nacen como «propuesta»: tú las apruebas o las descartas (también puedes recuperarlas o borrarlas). Nada se aplica solo. Necesitas al menos una fortaleza o debilidad y una oportunidad o amenaza.' },
        { nombre: 'Agregar estrategia a mano (admin_th)', explicacion: 'Escribe tu propia estrategia en el cuadrante y marca, si quieres, los factores que cruza. Queda aprobada.' },
        { nombre: 'Llevar al plan de trabajo (admin_th)', explicacion: 'Elige una fecha y la estrategia se crea como actividad programada en Plan de trabajo anual, vinculada («Ya está en el plan de trabajo»). Así el FODA termina en acciones con responsable, fecha y seguimiento.' },
        { nombre: 'Crear gestión de cambio', explicacion: 'Ícono junto a "Crear acción": abre Gestión de cambio con una solicitud pre-vinculada a ese ítem, para cuando el hallazgo del contexto amerita un cambio mayor y no solo una ACPM.' },
      ],
      notas: [
        'Pueden ver esta pantalla: admin_th, líder y gerencia. Crear análisis, agregar/editar/eliminar ítems es exclusivo de admin_th.',
        'Es la pieza que antes faltaba del ciclo PHVA: sin esto, las debilidades y oportunidades del contexto quedaban solo en un documento aparte, sin conectar con ACPM.',
        'La IA solo propone (prioridad, sugerencias y estrategias); nunca crea riesgos ni actividades por su cuenta. Lo que sale de ella se marca como propuesta o recuadro de sugerencia hasta que tú decides.',
        'La IA solo trabaja con lo que registraste en el análisis: no consulta datos externos ni inventa información de la empresa.',
      ],
    },
    {
      slug: 'auditorias-internas',
      ruta: '/procesos-gestion/auditorias',
      titulo: 'Auditorías internas',
      resumen:
        'Planeación, ejecución y hallazgos de tus auditorías internas — distinto del informe Evidencia de auditoría, que empaqueta evidencia PARA el auditor externo. Aquí se audita, allá se entrega lo auditado.',
      camposYBotones: [
        {
          nombre: 'Nueva auditoría (admin_th)',
          explicacion:
            'Objetivo, alcance, marco normativo, auditor (uno de la plataforma, o el nombre de un auditor externo en texto libre) y qué procesos cubre — una auditoría puede cubrir varios procesos a la vez.',
        },
        { nombre: 'Código automático', explicacion: 'Cada auditoría recibe un código (AI-001, AI-002…) al crearse.' },
        {
          nombre: 'Tablero de hallazgos',
          explicacion:
            'Dentro de cada auditoría: 5 columnas fijas (Abierto → Análisis de causa → Plan de acción → Seguimiento → Cerrado). Cada hallazgo es NC Mayor, NC Menor, Observación u Oportunidad de mejora, con el requisito/numeral incumplido y el proceso específico al que aplica.',
        },
        {
          nombre: 'Crear ACPM (admin_th)',
          explicacion: 'Enlace "Crear ACPM" en cada hallazgo (excepto oportunidades de mejora): abre el tablero de ACPM con una nueva tarjeta pre-vinculada a ese hallazgo como origen — no hay que volver a explicar de dónde viene.',
        },
      ],
      notas: [
        'Pueden ver esta pantalla: admin_th, líder, gerencia y auditor_externo (solo lectura). Crear auditorías, agregar hallazgos y arrastrar tarjetas es exclusivo de admin_th.',
      ],
    },
    {
      slug: 'riesgos',
      ruta: '/procesos-gestion/riesgos',
      titulo: 'Riesgos y oportunidades',
      resumen:
        'Metodología cuantitativa real (no una versión genérica): cada fila es un riesgo o una oportunidad (ISO 9001 numeral 6.1 exige gestionar ambos). Antes vivía dentro de la pantalla principal de Procesos; ahora es su propio módulo, entre Auditorías internas y ACPM.',
      camposYBotones: [
        {
          nombre: 'Matriz de riesgos y oportunidades',
          explicacion:
            'Marco normativo, categoría (Estratégico/Operativo/Financiero/Legal/Reputacional), descripción, consecuencia, impacto y probabilidad en escala 1-3 (las etiquetas de cada grado y dónde caen los cortes de bajo/medio/alto son configurables por empresa en Administración → Configuración). El nivel "Inherente" se calcula solo (impacto × probabilidad = 1 a 9, Bajo/Medio/Alto para riesgos, Bajo/Alto/Clave para oportunidades). Si hay control, su efectividad se califica 0-5 (0=No existe control … 5=Eficaz) y el nivel "Residual" se recalcula solo, reduciendo el inherente según esa efectividad — nunca se elige a mano. Con frecuencia de revisión definida (trimestral/semestral/anual), aparece una etiqueta roja "Revisión vencida" cuando ya pasó ese tiempo desde la última confirmación. Registrar uno con control definido suma 10 puntos al ranking de Nexa.',
        },
        {
          nombre: 'Marcar revisado (admin_th)',
          explicacion: 'Ícono de refrescar junto a un riesgo con frecuencia de revisión definida: confirma que sigue vigente hoy sin necesidad de abrir el formulario completo de edición (para volver a calificarlo, usa "Editar"). Suma 5 puntos al ranking de Nexa.',
        },
        {
          nombre: 'Crear ACPM desde un riesgo (admin_th)',
          explicacion: 'Ícono de lista junto a cada riesgo: abre el tablero de ACPM con una nueva tarjeta pre-vinculada a ese riesgo como origen. Si ya existen ACPM vinculadas, aparece un contador "N acción(es) ACPM relacionada(s)" debajo del riesgo.',
        },
        {
          nombre: 'Crear gestión de cambio desde un riesgo (admin_th)',
          explicacion: 'Ícono junto al de "Crear ACPM": para cuando el riesgo amerita evaluar un cambio de proceso/sistema/estructura, no solo una acción puntual.',
        },
      ],
      notas: ['Pueden ver esta pantalla: admin_th, líder y gerencia. Crear, editar, marcar revisado y crear ACPM/cambio desde un riesgo es exclusivo de admin_th.'],
    },
    {
      slug: 'acpm',
      ruta: '/procesos-gestion/acpm',
      titulo: 'ACPM — Acciones Correctivas, Preventivas y de Mejora',
      resumen:
        'El ciclo completo de una ACPM, no solo "tareas completadas": Registro → Análisis de causa → Plan de acción → Seguimiento → Validación de eficacia → Cerrada efectiva (o Reabierta si la causa no se eliminó).',
      camposYBotones: [
        {
          nombre: 'Estadísticas del encabezado',
          explicacion: 'Total de ACPM, cerradas efectivas, reabiertas y la tasa de eficacia global (% de las resueltas que se cerraron como efectivas) — el dato que hoy pocas organizaciones tienen sistematizado.',
        },
        {
          nombre: 'Nueva ACPM (admin_th)',
          explicacion: 'Origen (hallazgo de auditoría, riesgo, análisis de contexto, revisión de proceso, indicador, PQRS o mejora propia), tipo de acción (correctiva/preventiva/mejora), descripción, metodología de análisis de causa (5 porqués, Ishikawa o libre) y fecha compromiso. Si se llega desde el botón "Crear ACPM"/"Crear acción" de un hallazgo, un riesgo, un ítem de contexto o una brecha del Diagnóstico ISO 9001, el origen ya viene vinculado o la descripción ya viene sugerida. Suma 10 puntos al ranking de Nexa, para el responsable de la ACPM (o para quien la crea, si no tiene responsable asignado).',
        },
        {
          nombre: 'Origen con enlace (en la tarjeta y en el detalle)',
          explicacion: 'Cuando el origen es un riesgo, un hallazgo o un ítem de contexto, aparece como enlace ("Origen: Riesgo →") que lleva directo al registro de origen — para no tener que recordar mentalmente de dónde salió cada ACPM.',
        },
        { nombre: 'Tablero de 7 columnas', explicacion: 'Arrastra una tarjeta para avanzarla en el ciclo. Haz clic en una tarjeta para abrir su detalle.' },
        {
          nombre: 'Plan de acción (dentro del detalle)',
          explicacion: 'Lista de tareas con casilla de completado — el contador "X/Y tareas" se ve también en la tarjeta del tablero. Completar la última tarea pendiente suma 20 puntos al ranking de Nexa.',
        },
        {
          nombre: 'Validar eficacia',
          explicacion:
            'Disponible cuando la ACPM está en la columna "Validación de eficacia": responde si la acción eliminó la causa raíz. "Sí" cierra la ACPM como efectiva (suma 60 puntos — el máximo del módulo) y "No" la reabre sin restar puntos, para no castigar la honestidad en la validación — no basta con que las tareas estén marcadas completas para cerrarla.',
        },
      ],
      notas: [
        'Pueden ver esta pantalla: admin_th, líder y gerencia. Crear, editar, mover tarjetas, agregar tareas y validar eficacia es exclusivo de admin_th.',
        'La tasa de eficacia (cuántas ACPM se cerraron como efectivas vs. reabiertas) es un dato que hoy pocas organizaciones tienen sistematizado — vale la pena revisarlo periódicamente en este tablero.',
      ],
    },
    {
      slug: 'gestion-cambio',
      ruta: '/procesos-gestion/cambios',
      titulo: 'Gestión de cambio',
      resumen:
        'Evalúa el impacto de un cambio a un proceso, documento, sistema o estructura antes de aprobarlo (ISO 9001 numeral 6.3) — distinto de Gestión documental, que versiona un documento puntual.',
      camposYBotones: [
        { nombre: 'Nueva solicitud (admin_th y líder)', explicacion: 'Proceso afectado, título, descripción, tipo de cambio (proceso/documento/sistema/estructura/otro) y motivo.' },
        {
          nombre: 'Origen opcional (riesgo o contexto)',
          explicacion: 'No toda gestión de cambio tiene que venir de un riesgo o del contexto — por eso esto nunca es obligatorio. Se activa llegando desde el enlace "Crear gestión de cambio" de un riesgo o de un ítem del análisis de contexto, y queda vinculado con un enlace de vuelta al origen.',
        },
        {
          nombre: 'Evaluar y resolver (admin_th)',
          explicacion: 'Registra la evaluación del impacto (bajo/medio/alto) y aprueba o rechaza. Una solicitud aprobada se puede marcar como "Implementada" cuando el cambio ya se hizo.',
        },
      ],
      notas: ['Pueden ver esta pantalla: admin_th, líder y gerencia. Solicitar: admin_th y líder. Evaluar, aprobar/rechazar y marcar implementado: exclusivo de admin_th.'],
    },
    {
      slug: 'plan-trabajo-anual',
      ruta: '/procesos-gestion/plan-trabajo',
      titulo: 'Plan de trabajo anual',
      resumen:
        'Registro único de todas las actividades de Gestión Humana del año (SST, bienestar, formación y sistemas de gestión) con su programación, ejecución, cobertura, presupuesto y evidencias. De ese mismo registro salen el plan de trabajo, el plan de formación y sus indicadores, así no hay que llevarlos aparte en Excel.',
      camposYBotones: [
        { nombre: 'Pestañas Plan de trabajo / Plan de formación / SG-SST', explicacion: 'Tres vistas del mismo registro: todo el plan, solo las actividades de formación (capacitaciones, inducciones) o solo las del SG-SST. Con las flechas ‹ › cambias de año.' },
        { nombre: 'Tarjetas de cumplimiento', explicacion: 'Cumplimiento a la fecha (de las actividades cuya fecha ya llegó, cuántas se ejecutaron; verde desde 90 %, amarillo desde 70 %), atrasadas, cobertura (personas alcanzadas frente al objetivo) y horas ejecutadas frente a las programadas. Cada una tiene su «i».' },
        { nombre: 'Filtros', explicacion: 'Por sistema (SG-SST, ISO 9001, bienestar y clima, formación), tipo de actividad (simulacro, pausa activa, inspección, capacitación, celebración, auditoría interna, comité…) y estado.' },
        { nombre: 'Nueva actividad (admin_th)', explicacion: 'Nombre, tipo, sistema al que aporta, fecha programada, responsable, población objetivo (todos, un área o un cargo), personas objetivo, presupuesto estimado, aliado o proveedor del Directorio de aliados de Nexa y estado (programada, en curso, ejecutada, reprogramada, cancelada).' },
        { nombre: 'Editar para registrar la ejecución (admin_th)', explicacion: 'Al ejecutarla pon el estado «Ejecutada» y llena fecha de ejecución, personas alcanzadas, horas, presupuesto ejecutado y la calificación o NPS del evento. Si no pones fecha de ejecución se usa la de hoy.' },
        { nombre: 'Evidencias', explicacion: 'Fotografías, listas de asistencia escaneadas o actas en PDF (JPG, PNG, WebP o PDF, hasta 4 MB cada uno), guardadas en un espacio privado de tu empresa. Las ve cualquiera que pueda abrir el plan; solo admin_th sube o quita.' },
        { nombre: 'ACPM (admin_th)', explicacion: 'Si la actividad reveló un hallazgo (una capacitación que mostró una brecha crítica, una inspección con una condición insegura), lo conviertes en una acción de mejora en Procesos → ACPM, que queda vinculada a la actividad para cerrar el ciclo PHVA.' },
        { nombre: 'Exportar a Excel', explicacion: 'Descarga el plan del año con los filtros activos (una hoja con las actividades y otra con los indicadores), listo para presentar a la gerencia o a una auditoría.' },
      ],
      notas: [
        'Una actividad «atrasada» es la que tenía fecha programada anterior a hoy y sigue sin ejecutarse. Las canceladas no cuentan en el cumplimiento.',
        'Pueden ver el plan admin_th, líder y gerencia; crear y editar es solo de admin_th.',
        'Los indicadores de cumplimiento del plan, del plan de formación y de actividades SST también aparecen en Espiral 360° → Indicadores.',
      ],
    },
    {
      slug: 'matriz-comunicaciones',
      ruta: '/procesos-gestion/comunicaciones',
      titulo: 'Matriz de comunicaciones',
      resumen:
        'Qué se comunica, a quién, por qué canal, con qué frecuencia y quién responde. Hace parte de la planeación (ISO 9001, requisito 7.4). La ven admin_th, líder y gerencia; solo admin_th edita.',
      camposYBotones: [
        { nombre: 'Agregar comunicación (admin_th)', explicacion: 'Qué se comunica (ej. Política de calidad), a quién (ej. todo el personal, clientes), canal (correo, cartelera, reunión, WhatsApp…), frecuencia (ej. mensual), proceso (opcional) y responsable (opcional).' },
        { nombre: 'Eliminar', explicacion: 'Quita una fila de la matriz.' },
      ],
    },
    {
      slug: 'detalle-auditoria',
      ruta: '/procesos-gestion/auditorias/*',
      titulo: 'Detalle de una auditoría interna',
      resumen:
        'Una auditoría con su código (AI-001…), estado, marco normativo, procesos cubiertos, auditor, fecha planeada y alcance, más el tablero de sus hallazgos.',
      camposYBotones: [
        { nombre: 'Tablero de hallazgos', explicacion: 'Cinco columnas: Abierto → Análisis de causa → Plan de acción → Seguimiento → Cerrado. Arrastra una tarjeta para cambiar su estado (admin_th).' },
        { nombre: 'Nuevo hallazgo (admin_th)', explicacion: 'Proceso (opcional), tipo (NC Mayor, NC Menor, Observación u Oportunidad de mejora), descripción y requisito o numeral incumplido (opcional).' },
        { nombre: 'Crear ACPM desde un hallazgo', explicacion: 'Cada hallazgo puede originar una acción en Procesos → ACPM ya vinculada a él.' },
      ],
    },
    {
      slug: 'detalle-documento',
      ruta: '/procesos-gestion/documentos/*',
      titulo: 'Detalle de un documento',
      resumen:
        'Un documento del sistema de gestión con su código, tipo, versión vigente y proceso, la difusión (quién confirmó la lectura) y el historial de versiones.',
      camposYBotones: [
        { nombre: 'Difusión', explicacion: 'Cuántas personas con acceso confirmaron la lectura frente al umbral que fijó admin_th en Configuración. Cuando se llega al umbral la difusión se considera completa.' },
        { nombre: 'Confirmar lectura', explicacion: 'Cualquier persona con ficha de colaborador puede confirmar que leyó el documento, con un comentario o pregunta opcional. Solo aparece si el documento exige confirmación y aún no la has hecho. Suma puntos en Nexa.' },
        { nombre: 'Historial de versiones', explicacion: 'Las versiones anteriores del documento; si no hay, esta es la primera.' },
      ],
    },
    {
      slug: 'detalle-contexto',
      ruta: '/procesos-gestion/contexto/*',
      titulo: 'Detalle de un análisis FODA',
      resumen:
        'El análisis de una fecha: sus cuatro columnas de factores (debilidades, oportunidades, fortalezas y amenazas), la priorización y las estrategias cruzadas. Ver también la página «Contexto (análisis FODA)».',
      camposYBotones: [
        { nombre: 'Factores y prioridad', explicacion: 'Cada factor tiene impacto y probabilidad (Bajo, Medio, Alto) y una prioridad de 1 a 9; se ordenan de mayor a menor. «Priorizar con IA» propone esos valores y una sugerencia; tú decides.' },
        { nombre: 'Crear acción, gestión de cambio, convertir en riesgo', explicacion: 'Cada factor se puede llevar a una ACPM, a Gestión de cambio o (debilidades, amenazas y oportunidades) a Riesgos y oportunidades.' },
        { nombre: 'Estrategias FO · FA · DO · DA', explicacion: 'Cuatro cuadrantes con las estrategias que cruzan los factores. «Proponer estrategias con IA» las genera como propuesta para que las apruebes o descartes; también puedes escribirlas y llevarlas al Plan de trabajo anual con una fecha.' },
      ],
    },
    {
      slug: 'importar-matriz-legal',
      ruta: '/procesos-gestion/legal/importar',
      titulo: 'Importar la matriz legal desde Excel',
      resumen:
        'Migra la matriz de requisitos legales que ya tienes en Excel (hasta 500 por archivo), con revisión fila por fila antes de guardar. Solo admin_th. Ver también la página «Matriz de requisitos legales».',
      camposYBotones: [
        { nombre: 'Plantilla y encabezados', explicacion: 'Solo la norma es obligatoria. Acepta tus propios encabezados (Norma, Año, Descripción, Cumple, Fecha de revisión…) en cualquier orden.' },
        { nombre: 'Cumple y proceso', explicacion: '«Cumple» acepta Cumple, No cumple o Sin evaluar. El proceso se enlaza por nombre o código; si no existe, el requisito queda sin proceso.' },
        { nombre: 'Duplicados', explicacion: 'Si la misma norma y artículo ya están en la matriz, esa fila se omite.' },
      ],
    },
    {
      slug: 'matriz-legal',
      ruta: '/procesos-gestion/legal',
      titulo: 'Matriz de requisitos legales',
      resumen:
        'Normas, leyes y reglamentos aplicables por proceso (GC-MT-001), con su artículo, si se cumple, el soporte de cumplimiento y las acciones a seguir cuando no se cumple — distinta de la matriz de riesgos (que gestiona riesgos/oportunidades) y del checklist de cumplimiento (que es por marco normativo genérico, no por norma puntual).',
      camposYBotones: [
        { nombre: 'Importar desde Excel (admin_th)', explicacion: 'Migra la matriz que ya tienes en Excel sin volver a digitarla: descargas la plantilla (o pegas tus columnas en ella; basta con que los encabezados se parezcan), la subes y revisas fila por fila antes de guardar. Solo la norma es obligatoria; «Cumple» acepta Cumple, No cumple o Sin evaluar; el proceso se enlaza por nombre o código. Si una misma norma + artículo ya está en la matriz, esa fila se omite. Máximo 500 requisitos por archivo.' },
        { nombre: 'Nuevo requisito legal (admin_th)', explicacion: 'Norma/ley/reglamento, año, entidad emisora, asunto, artículo específico y a qué proceso aplica.' },
        { nombre: 'Cumple / No cumple / Sin evaluar (admin_th)', explicacion: 'Al marcar "No cumple" aparece un campo para las acciones a seguir. El soporte de cumplimiento queda como texto libre (referencia al documento que lo demuestra).' },
        { nombre: 'Marcar revisado (admin_th)', explicacion: 'Confirma que se revisó hoy sin cambiar la calificación — para eso está "Editar".' },
        { nombre: 'Contadores del encabezado', explicacion: 'Cuántos requisitos cumplen, no cumplen o siguen sin evaluar, de un vistazo.' },
      ],
      notas: ['Pueden ver esta pantalla: admin_th, líder y gerencia. Crear, editar y evaluar requisitos es exclusivo de admin_th.'],
    },
    {
      slug: 'diagnostico-iso9001',
      ruta: '/procesos-gestion/diagnostico-iso9001',
      titulo: 'Diagnóstico ISO 9001:2015',
      resumen:
        'Listado de las corridas del diagnóstico/autoevaluación frente a los 28 numerales auditables de la norma (cláusulas 4 a 10) — se puede repetir en el tiempo para comparar el avance.',
      camposYBotones: [
        { nombre: 'Nuevo diagnóstico (admin_th)', explicacion: 'Crea una corrida nueva y abre el formulario para empezar a responder.' },
        { nombre: 'Tarjeta de diagnóstico', explicacion: 'Fecha, quién lo realizó, estado (En progreso / Completado) y el puntaje general — clic para abrir el detalle.' },
      ],
      notas: [
        'Pueden ver esta pantalla: admin_th, líder y gerencia. Crear un diagnóstico es exclusivo de admin_th.',
        'Estructura y ponderación real de Diana (no es una versión genérica): 28 numerales de las cláusulas 4 a 10 — 1 a 3 son alcance/referencias/términos, no se evalúan. El numeral 8 (Operación) pesa el doble que la mayoría (25% del puntaje general) por ser "el corazón del SGC"; el detalle completo de pesos está en la pantalla de cada diagnóstico.',
      ],
    },
    {
      slug: 'detalle-diagnostico-iso9001',
      ruta: '/procesos-gestion/diagnostico-iso9001/*',
      titulo: 'Detalle de un diagnóstico ISO 9001',
      resumen:
        'El formulario y los resultados en una sola pantalla: cada numeral se responde con la escala real de 5 niveles (No cumple / Cumple mínimamente / En desarrollo / Cumple parcialmente / Cumple completamente / No aplica), y el puntaje se recalcula solo, ponderado por cláusula.',
      camposYBotones: [
        {
          nombre: 'Puntaje general y por cláusula',
          explicacion:
            'Dentro de una cláusula es el promedio simple de sus numerales (0-100%); el puntaje general es la suma de cada cláusula multiplicada por su peso (junto al nombre de cada cláusula aparece su % de peso). "No aplica" no cuenta ni a favor ni en contra; un numeral sin responder tampoco entra al promedio todavía, pero sí se cuenta como pendiente — y mientras el diagnóstico esté a medio llenar, el puntaje se re-normaliza contra el peso de las cláusulas que sí tienen datos, para no verse artificialmente bajo.',
        },
        { nombre: 'Nivel de cada numeral (admin_th)', explicacion: 'Clic en una de las 5 opciones para calificar — clic de nuevo sobre la misma la deja sin responder. Se guarda solo, sin botón de enviar.' },
        { nombre: 'Observación / evidencia (admin_th)', explicacion: 'Texto libre opcional por numeral, se guarda al salir del campo.' },
        { nombre: 'Crear ACPM para esta brecha (admin_th)', explicacion: 'Aparece en los numerales calificados "No cumple", "Cumple mínimamente" o "En desarrollo": abre el tablero de ACPM con el numeral ya referenciado como origen — no hay que volver a explicar de dónde salió.' },
        { nombre: 'Marcar como completado (admin_th)', explicacion: 'Cambia el estado de la corrida a "Completado" (se puede volver a "En progreso" si hace falta seguir ajustando).' },
      ],
      notas: ['Pueden ver este detalle: admin_th, líder y gerencia. Responder, agregar observaciones y marcar completado es exclusivo de admin_th.'],
    },
  ],
};
