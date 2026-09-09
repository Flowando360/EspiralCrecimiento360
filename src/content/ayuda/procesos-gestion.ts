import type { ModuloAyuda } from '@/types/ayuda';

export const moduloProcesosGestion: ModuloAyuda = {
  slug: 'procesos-gestion',
  titulo: 'Procesos y Sistemas de Gestión',
  descripcion:
    'Procesos documentados, matriz de riesgos y checklist de cumplimiento normativo (ISO 9001, SARLAFT/SAGRILAFT, PTEE) — la base del paquete de Evidencia de auditoría.',
  paginas: [
    {
      slug: 'indice',
      ruta: '/procesos-gestion',
      titulo: 'Procesos y Sistemas de Gestión',
      resumen:
        'Tres bloques en una sola pantalla: procesos documentados (con acceso a su tablero kanban), matriz de riesgos y controles, y el tablero de checklist de cumplimiento por marco normativo.',
      camposYBotones: [
        {
          nombre: 'Procesos documentados',
          explicacion: 'Área/proceso, nombre, descripción y versión. Registra qué procesos de la empresa ya están documentados y cuándo se actualizaron por última vez. Cada proceso tiene un ícono de tablero para entrar a su kanban.',
        },
        {
          nombre: 'Matriz de riesgos y controles',
          explicacion: 'Cada riesgo con su marco normativo (ISO 9001, SARLAFT/SAGRILAFT, PTEE o interno), probabilidad, impacto y el control asociado para mitigarlo.',
        },
        {
          nombre: 'Tablero de checklist de cumplimiento',
          explicacion: 'Columnas por estado (No cumple / Cumple parcial / Cumple / No aplica) para los ítems de cada marco normativo (ISO 9001, SARLAFT/SAGRILAFT, PTEE). Arrastra una tarjeta a otra columna para cambiar su estado. Un filtro arriba del tablero permite ver un solo marco normativo a la vez.',
        },
        {
          nombre: 'Adjuntar evidencia (al crear un ítem)',
          explicacion: 'Al agregar un ítem al checklist se puede subir un archivo que respalda el cumplimiento — queda guardado en un bucket privado y se incluye en el paquete de Evidencia de auditoría. La tarjeta muestra un clip cuando ya tiene evidencia adjunta.',
        },
      ],
      notas: [
        'Pueden ver esta pantalla: admin_th, líder y gerencia. Editar (agregar/eliminar procesos, riesgos e ítems, arrastrar tarjetas del checklist a otro estado) es exclusivo de admin_th.',
        'Todo lo que se registra aquí alimenta directamente el informe Evidencia de auditoría (Informes → Evidencia de auditoría), sin necesidad de volver a cargarlo.',
      ],
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
  ],
};
