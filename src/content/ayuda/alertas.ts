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
