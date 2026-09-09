import type { ModuloAyuda } from '@/types/ayuda';

export const moduloComunicacion: ModuloAyuda = {
  slug: 'comunicacion',
  titulo: 'Mensajes y Notificaciones',
  descripcion: 'Mensajería directa entre personas y el centro de notificaciones — distintos del feed corporativo, que es de difusión general.',
  paginas: [
    {
      slug: 'mensajes',
      ruta: '/mensajes',
      titulo: 'Mensajes',
      resumen: 'Mensajería directa 1 a 1 entre cualquier par de personas de la empresa, distinta del feed corporativo (que es de difusión general, no privado).',
      camposYBotones: [
        { nombre: 'Nuevo mensaje', explicacion: 'Elige a cualquier persona de tu empresa para iniciar una conversación.' },
        { nombre: 'Lista de conversaciones', explicacion: 'Ordenadas por el mensaje más reciente, con el número de mensajes sin leer.' },
      ],
      notas: ['No hay restricción de organigrama: cualquiera le puede escribir a cualquiera dentro de su propia empresa.'],
    },
    {
      slug: 'hilo-mensaje',
      ruta: '/mensajes/*',
      titulo: 'Conversación',
      resumen: 'El hilo de mensajes con una persona específica.',
      camposYBotones: [
        { nombre: 'Campo de texto', explicacion: 'Escribe y presiona Enter (o el botón de enviar) para mandar el mensaje.' },
      ],
      notas: ['Al abrir una conversación, los mensajes que te enviaron quedan marcados como leídos automáticamente.'],
    },
    {
      slug: 'notificaciones',
      ruta: '/notificaciones',
      titulo: 'Notificaciones',
      resumen: 'Recordatorios y avisos dirigidos a ti (fechas próximas de alertas, entre otros) — se generan solos, no se crean a mano. Distinto del ícono de Alertas, que muestra el detalle de fechas clave.',
      camposYBotones: [
        { nombre: 'Marcar como leída', explicacion: 'Icono de check en una notificación puntual.' },
        { nombre: 'Marcar todas como leídas', explicacion: 'Aparece cuando tienes notificaciones sin leer.' },
      ],
      notas: [
        'Las mismas notificaciones también se intentan enviar por correo (cuando la empresa tiene configurado el servicio de envío); verlas aquí no depende de que el correo haya llegado.',
      ],
    },
  ],
};
