import type { ModuloAyuda } from '@/types/ayuda';

export const moduloProcesosGestion: ModuloAyuda = {
  slug: 'procesos-gestion',
  titulo: 'Procesos y Sistemas de Gestión',
  descripcion:
    'Mapa de procesos, caracterización, gestión documental, matriz de riesgos y oportunidades con ciclo de revisión, auditorías internas con hallazgos, ACPM y gestión de cambio — el ciclo PHVA completo del sistema de gestión, base del paquete de Evidencia de auditoría.',
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
            'Cada fila es un riesgo o una oportunidad (ISO 9001 numeral 6.1 exige gestionar ambos), con su marco normativo, probabilidad, impacto, control, riesgo residual (el nivel que queda después del control) y, si se le define una frecuencia de revisión (trimestral/semestral/anual), una etiqueta roja "Revisión vencida" cuando ya pasó esa frecuencia desde la última vez que se confirmó.',
        },
        {
          nombre: 'Marcar revisado (admin_th)',
          explicacion: 'Ícono de refrescar junto a un riesgo con frecuencia de revisión definida: confirma que se revisó hoy sin necesidad de abrir el formulario completo de edición.',
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
          explicacion: 'Lista de los documentos (procedimientos, políticas, formatos, instructivos) que pertenecen a este proceso, con acceso directo a su ficha en Gestión documental.',
        },
        { nombre: 'Ver tablero', explicacion: 'Accede al pipeline visual del proceso (kanban de casos), igual que en la versión anterior del módulo.' },
      ],
      notas: ['Pueden ver esta ficha: admin_th, líder y gerencia. Agregar o eliminar entradas/actividades/salidas es exclusivo de admin_th.'],
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
          nombre: 'Exportar acta de difusión',
          explicacion: 'Genera un PDF con el resumen de confirmaciones (quién, cuándo, comentarios) y la línea de tiempo de versiones del documento — listo para entregar en auditoría (ISO 9001 numeral 7.5.3).',
        },
        { nombre: 'Historial de versiones', explicacion: 'Dentro de la ficha de cada documento: cada versión anterior, cuándo se archivó y el resumen del cambio.' },
      ],
      notas: [
        'Pueden ver esta pantalla: admin_th, líder y gerencia. Solicitar documentos: admin_th y líder. Aprobar o rechazar solicitudes: exclusivo de admin_th.',
        'Solo la versión vigente de un documento es visible para la empresa; las versiones obsoletas quedan en un repositorio que solo admin_th puede consultar.',
        'En esta primera versión, la confirmación de lectura llega a quienes ya tienen acceso al módulo (admin_th, líder, gerencia). Abrirla a todos los colaboradores a través del Feed de Nexa queda para una siguiente fase.',
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
      ],
      notas: [
        'Pueden ver esta pantalla: admin_th, líder, gerencia y auditor_externo (solo lectura). Crear auditorías, agregar hallazgos y arrastrar tarjetas es exclusivo de admin_th.',
        'Un hallazgo puede dar origen a una ACPM — se relaciona al crear la ACPM desde la pantalla de ACPM, eligiendo "Hallazgo de auditoría" como origen.',
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
          nombre: 'Nueva ACPM (admin_th)',
          explicacion: 'Origen (hallazgo de auditoría, riesgo, indicador, PQRS o mejora propia), tipo de acción (correctiva/preventiva/mejora), descripción, metodología de análisis de causa (5 porqués, Ishikawa o libre) y fecha compromiso.',
        },
        { nombre: 'Tablero de 7 columnas', explicacion: 'Arrastra una tarjeta para avanzarla en el ciclo. Haz clic en una tarjeta para abrir su detalle.' },
        {
          nombre: 'Plan de acción (dentro del detalle)',
          explicacion: 'Lista de tareas con casilla de completado — el contador "X/Y tareas" se ve también en la tarjeta del tablero.',
        },
        {
          nombre: 'Validar eficacia',
          explicacion:
            'Disponible cuando la ACPM está en la columna "Validación de eficacia": responde si la acción eliminó la causa raíz. "Sí" cierra la ACPM como efectiva; "No" la reabre — no basta con que las tareas estén marcadas completas para cerrarla.',
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
  ],
};
