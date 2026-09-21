import type { ModuloAyuda } from '@/types/ayuda';

export const moduloReclutamiento: ModuloAyuda = {
  slug: 'reclutamiento',
  titulo: 'Reclutamiento y Selección',
  descripcion:
    'Banco de candidatos, vacantes y el proceso de selección de cada una — desde la postulación (por formulario público o registro manual) hasta la contratación, con entrevistas y verificación de referencias.',
  paginas: [
    {
      slug: 'index',
      ruta: '/reclutamiento',
      titulo: 'Reclutamiento y Selección',
      resumen: 'Listado de todas las vacantes de la empresa, con su estado y cuántos candidatos tiene cada una.',
      camposYBotones: [
        { nombre: 'Tarjeta de vacante', explicacion: 'Título, cargo vinculado, líder solicitante, fecha de apertura (y de cierre si ya cerró), número de candidatos postulados y estado (Abierta / En pausa / Cancelada / Cubierto / Cerrada).' },
        { nombre: 'Banco de candidatos', explicacion: 'Lleva al listado de todas las personas que se han postulado alguna vez, sin importar a qué vacante.' },
        { nombre: 'Nueva vacante (admin_th)', explicacion: 'Abre el formulario para crear una vacante nueva, vinculada a un Perfil de Cargo ya existente.' },
      ],
      notas: ['Pueden ver esta pantalla: admin_th y líder. Crear una vacante nueva es exclusivo de admin_th.'],
    },
    {
      slug: 'nueva-vacante',
      ruta: '/reclutamiento/vacantes/nueva',
      titulo: 'Nueva vacante',
      resumen: 'Formulario para abrir una vacante — se vincula a un Perfil de Cargo ya creado en Administración → Cargos, así el formulario público de postulación toma el título y la información del cargo automáticamente.',
      camposYBotones: [
        { nombre: 'Cargo', explicacion: 'El Perfil de Cargo al que pertenece la vacante. Si todavía no hay ninguno creado, la pantalla lo indica y no deja continuar hasta que exista al menos uno.' },
        { nombre: 'Título de la vacante', explicacion: 'Puede ser distinto al nombre del cargo (ej. "Auxiliar de logística — turno mañana").' },
        { nombre: 'Líder solicitante', explicacion: 'Opcional — quién pidió abrir la vacante.' },
        { nombre: 'Presupuesto salarial', explicacion: 'Opcional, solo visible internamente (nunca se muestra en el formulario público de postulación).' },
        { nombre: 'Descripción del perfil', explicacion: 'Opcional — contexto adicional que si se llena, sí aparece en el formulario público.' },
      ],
      notas: ['Exclusivo de admin_th.'],
    },
    {
      slug: 'detalle-vacante',
      ruta: '/reclutamiento/vacantes/*',
      titulo: 'Detalle de una vacante — tablero de postulaciones',
      resumen:
        'El pipeline de selección de una vacante específica: tablero kanban con los candidatos moviéndose por etapas, desde que se postulan hasta que se contratan o se descartan.',
      camposYBotones: [
        { nombre: 'Enlace público de postulación (admin_th)', explicacion: 'Un link (/postular/…) que se puede copiar y compartir por donde sea (redes, WhatsApp, correo) — cualquiera puede postularse ahí sin tener cuenta en la plataforma. Ver la página "Formulario público de postulación".' },
        { nombre: 'Editar vacante / Cambiar estado (admin_th)', explicacion: 'Edita los datos de la vacante o cambia su estado (Abierta / En pausa / Cancelada / Cubierto / Cerrada). Una vacante que no está "Abierta" deja de aceptar postulaciones nuevas desde el enlace público.' },
        {
          nombre: 'Tablero de 5 columnas',
          explicacion:
            'Postulados → Filtrados/Preseleccionados → En Entrevista → En Pruebas → Oferta. Arrastra la tarjeta de un candidato para avanzarlo. "Contratado" y "Descartado" no son columnas — son botones dentro de la tarjeta, para no perder el tablero de columnas activas, y quedan listados aparte debajo, sin perder el historial.',
        },
        { nombre: 'Agregar candidato (admin_th)', explicacion: 'Postula a esta vacante a alguien que ya está en el Banco de candidatos, o registra uno nuevo directamente desde aquí.' },
        { nombre: 'Calificación por estrellas', explicacion: 'Calificación rápida (1 a 5) de cada candidato, visible en su tarjeta del tablero.' },
        { nombre: 'Agendar entrevista', explicacion: 'Disponible cuando el candidato está en la columna "En Entrevista": fecha y hora, modalidad (presencial/virtual/telefónica) y entrevistador. El entrevistador asignado puede registrar el estado (Programada/Realizada/Cancelada) y sus notas, aunque no sea admin_th.' },
        { nombre: 'Contratar', explicacion: 'Marca al candidato como Contratado y muestra un enlace directo a "Nuevo colaborador" con nombre, correo, teléfono y cargo ya pre-llenados — no hay que volver a digitarlos.' },
        { nombre: 'Descartar', explicacion: 'Marca al candidato como Descartado, con un motivo opcional de texto libre.' },
      ],
      notas: [
        'Pueden ver este tablero: admin_th y líder. Arrastrar tarjetas, agregar candidatos, calificar, contratar/descartar y administrar entrevistas es exclusivo de admin_th (salvo que el líder sea justo el entrevistador asignado, en cuyo caso puede registrar esa entrevista puntual).',
      ],
    },
    {
      slug: 'postulacion-publica',
      ruta: '/postular/*',
      titulo: 'Formulario público de postulación',
      resumen:
        'Pantalla pública fuera de la plataforma (no requiere cuenta ni inicio de sesión) a la que llega cualquier persona desde el enlace que se comparte en el detalle de una vacante.',
      camposYBotones: [
        { nombre: 'Nombre completo (obligatorio)', explicacion: 'Único campo requerido.' },
        { nombre: 'Documento, teléfono, correo, LinkedIn', explicacion: 'Opcionales.' },
        { nombre: 'Hoja de vida', explicacion: 'Adjunta el archivo (PDF o Word, máx. 8 MB) — opcional, pero recomendable.' },
      ],
      notas: [
        'Si la vacante ya no está en estado "Abierta", la pantalla lo indica y no deja enviar la postulación.',
        'Cada envío crea (o reutiliza, si el candidato ya existía) un registro en el Banco de candidatos y lo postula automáticamente a esa vacante, apareciendo en la columna "Postulados" del tablero.',
      ],
    },
    {
      slug: 'candidatos',
      ruta: '/reclutamiento/candidatos',
      titulo: 'Banco de candidatos',
      resumen: 'Todas las personas que se han postulado (por el formulario público) o se han registrado manualmente, sin importar a cuántas vacantes hayan aplicado.',
      camposYBotones: [
        { nombre: 'Fila de candidato', explicacion: 'Nombre, datos de contacto, cuántas postulaciones tiene y su origen (Formulario público o Manual). Clic para abrir su ficha.' },
      ],
      notas: ['Pueden ver esta pantalla: admin_th y líder.'],
    },
    {
      slug: 'ficha-candidato',
      ruta: '/reclutamiento/candidatos/*',
      titulo: 'Ficha de un candidato',
      resumen: 'Hoja de vida, datos de contacto, historial de postulaciones a distintas vacantes, y verificación de referencias.',
      camposYBotones: [
        { nombre: 'Hoja de vida', explicacion: 'Ver/descargar el archivo cargado, o subir uno nuevo (admin_th).' },
        { nombre: 'Editar candidato (admin_th)', explicacion: 'Nombre, correo, teléfono, LinkedIn y notas internas.' },
        { nombre: 'Postulaciones', explicacion: 'Todas las vacantes a las que se ha postulado esta persona, con su etapa y calificación en cada una — clic lleva al tablero de esa vacante.' },
        { nombre: 'Verificación de referencias (admin_th)', explicacion: 'Agrega referencias (nombre, relación, teléfono) y las marca como "Verificada" una vez se confirmaron por fuera de la plataforma (llamada, correo, etc.).' },
      ],
      notas: ['Pueden ver esta ficha: admin_th y líder. Editar candidato, subir hoja de vida y administrar referencias es exclusivo de admin_th.'],
    },
  ],
};
