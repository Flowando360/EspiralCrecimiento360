import type { ModuloAyuda } from '@/types/ayuda';

export const moduloAlertas: ModuloAyuda = {
  slug: 'alertas',
  titulo: 'Alertas y cumplimiento SST',
  descripcion: 'Fechas clave que vencen: contratos, SST, formación, ciclos y fechas de cultura.',
  paginas: [
    {
      slug: 'alertas',
      ruta: '/alertas',
      titulo: 'Alertas y fechas clave',
      resumen:
        'Lista de alertas pendientes o notificadas: vencimientos de contratos, exámenes/certificaciones/EPP de SST, formación, Ciclos de Crecimiento y fechas de cultura (cumpleaños, aniversarios).',
      camposYBotones: [
        { nombre: '← Volver al inicio', explicacion: 'Enlace al comienzo de la pantalla para regresar al Inicio después de pulsar «Ver todas».' },
        { nombre: 'Filtro por categoría', explicacion: 'Botones arriba de la lista (Contractual, SST, Desempeño, Formación, Dotación, Bienestar y cultura), cada uno con cuántas alertas tiene. Sirve para que cada persona de Talento Humano se concentre en lo suyo; «Todas» vuelve a mezclarlas.' },
        { nombre: 'Evaluar período de prueba antes de confirmar', explicacion: 'Cada día el sistema revisa a quienes están por cumplir (o ya cumplieron) sus dos primeros meses y siguen sin confirmarse: les crea una alerta de atención «Evaluar el período de prueba de … antes de confirmar», una sola por persona. Para contratos a término fijo el plazo legal puede ser menor (la quinta parte del contrato); la alerta usa el máximo de dos meses, así que revisa la fecha real en el contrato.' },
        { nombre: 'Punto de color (severidad)', explicacion: 'Informativa, atención o crítica — según qué tan cerca está el vencimiento.' },
        { nombre: 'Etiqueta de tipo', explicacion: 'Contrato, SST, formación, ciclo o cultura.' },
        { nombre: 'Días restantes', explicacion: 'Cuenta regresiva (o "Hace X días" si ya venció) hasta la fecha objetivo.' },
        { nombre: 'Marcar como resuelta (✓)', explicacion: 'Solo admin_th. La alerta ya se atendió (ej. se renovó el examen).' },
        { nombre: 'Descartar (✕)', explicacion: 'Solo admin_th. La alerta no aplica o fue un falso positivo.' },
      ],
      notas: [
        'Un colaborador solo ve sus propias alertas. admin_th, líder y gerencia ven las que les corresponde según su alcance.',
        'Las alertas se generan automáticamente por el sistema (vencimientos calculados) — no se crean a mano.',
      ],
    },
  ],
};
