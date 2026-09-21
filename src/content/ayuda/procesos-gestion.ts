import type { ModuloAyuda } from '@/types/ayuda';

export const moduloProcesosGestion: ModuloAyuda = {
  slug: 'procesos-gestion',
  titulo: 'Procesos y Sistemas de Gestión',
  descripcion:
    'Mapa de procesos, caracterización, gestión documental, matriz de riesgos y oportunidades cuantitativa, auditorías internas con hallazgos, ACPM, gestión de cambio, matriz de requisitos legales y diagnóstico ISO 9001:2015 — el ciclo PHVA completo del sistema de gestión, base del paquete de Evidencia de auditoría.',
  paginas: [
    {
      slug: 'indice',
      ruta: '/procesos-gestion',
      titulo: 'Procesos y Sistemas de Gestión',
      resumen:
        'Mapa de procesos (con vista de cuadro y de interacciones), matriz de riesgos y controles, y el tablero de checklist de cumplimiento por marco normativo, en una sola pantalla.',
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
          nombre: 'Matriz de riesgos y oportunidades',
          explicacion:
            'Metodología cuantitativa real (no una versión genérica): cada fila es un riesgo o una oportunidad (ISO 9001 numeral 6.1 exige gestionar ambos), con marco normativo, categoría (Estratégico/Operativo/Financiero/Legal/Reputacional), descripción, consecuencia, impacto y probabilidad en escala 1-3. El nivel "Inherente" se calcula solo (impacto × probabilidad = 1 a 9, Bajo/Medio/Alto para riesgos, Bajo/Alto/Clave para oportunidades). Si hay control, su efectividad se califica 0-5 (0=No existe control … 5=Eficaz) y el nivel "Residual" se recalcula solo, reduciendo el inherente según esa efectividad — nunca se elige a mano. Con frecuencia de revisión definida (trimestral/semestral/anual), aparece una etiqueta roja "Revisión vencida" cuando ya pasó ese tiempo desde la última confirmación. Registrar uno con control definido suma 10 puntos al ranking de Nexa.',
        },
        {
          nombre: 'Marcar revisado (admin_th)',
          explicacion: 'Ícono de refrescar junto a un riesgo con frecuencia de revisión definida: confirma que sigue vigente hoy sin necesidad de abrir el formulario completo de edición (para volver a calificarlo, usa "Editar"). Suma 5 puntos al ranking de Nexa.',
        },
        {
          nombre: 'Crear ACPM desde un riesgo (admin_th)',
          explicacion: 'Ícono de lista junto a cada riesgo: abre el tablero de ACPM con una nueva tarjeta pre-vinculada a ese riesgo como origen.',
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
        'El Procedimiento de Gestión Documental digitalizado: solicitar crear, actualizar o anular un documento, aprobarlo, y difundirlo con confirmación de lectura — todo con trazabilidad completa, sin depender del correo.',
      camposYBotones: [
        {
          nombre: 'Nueva solicitud (admin_th y líder)',
          explicacion:
            'Elige el proceso y el tipo de solicitud (crear / actualizar / anular). Para "crear" se indica nombre y tipo de documento (procedimiento, política, formato, instructivo o registro — un registro es el diligenciado/evidencia, distinto del formato que es la plantilla en blanco); para "actualizar" o "anular" se elige el documento existente. Se puede adjuntar el borrador del archivo.',
        },
        {
          nombre: 'Solicitudes pendientes (admin_th)',
          explicacion: 'Aprobar o rechazar cada solicitud, con un comentario opcional. Al aprobar una solicitud de "crear", el documento se publica con un código automático (ej. PM-1-PO-001). Al aprobar una "actualizar", se archiva la versión anterior en el historial y sube la versión (v001 → v002…), y se reinicia el conteo de confirmaciones de lectura porque es contenido nuevo. Al aprobar una "anular", el documento pasa a Obsoleto.',
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
        'Pueden ver esta pantalla: admin_th, líder y gerencia. Solicitar documentos: admin_th y líder. Aprobar o rechazar solicitudes: exclusivo de admin_th.',
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
          explicacion: 'Origen (hallazgo de auditoría, riesgo, indicador, PQRS o mejora propia), tipo de acción (correctiva/preventiva/mejora), descripción, metodología de análisis de causa (5 porqués, Ishikawa o libre) y fecha compromiso. Si se llega desde el botón "Crear ACPM" de un hallazgo, un riesgo o una brecha del Diagnóstico ISO 9001, el origen ya viene vinculado o la descripción ya viene sugerida. Suma 10 puntos al ranking de Nexa, para el responsable de la ACPM (o para quien la crea, si no tiene responsable asignado).',
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
          nombre: 'Evaluar y resolver (admin_th)',
          explicacion: 'Registra la evaluación del impacto (bajo/medio/alto) y aprueba o rechaza. Una solicitud aprobada se puede marcar como "Implementada" cuando el cambio ya se hizo.',
        },
      ],
      notas: ['Pueden ver esta pantalla: admin_th, líder y gerencia. Solicitar: admin_th y líder. Evaluar, aprobar/rechazar y marcar implementado: exclusivo de admin_th.'],
    },
    {
      slug: 'matriz-legal',
      ruta: '/procesos-gestion/legal',
      titulo: 'Matriz de requisitos legales',
      resumen:
        'Normas, leyes y reglamentos aplicables por proceso (GC-MT-001), con su artículo, si se cumple, el soporte de cumplimiento y las acciones a seguir cuando no se cumple — distinta de la matriz de riesgos (que gestiona riesgos/oportunidades) y del checklist de cumplimiento (que es por marco normativo genérico, no por norma puntual).',
      camposYBotones: [
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
