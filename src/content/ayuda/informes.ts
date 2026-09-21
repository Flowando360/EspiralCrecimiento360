import type { ModuloAyuda } from '@/types/ayuda';

export const moduloInformes: ModuloAyuda = {
  slug: 'informes',
  titulo: 'Informes',
  descripcion: 'Los nueve informes del sistema. Los primeros ocho (360°, PDI, SST, Brechas, Formación, Cultura y Engagement, Consolidado Gerencial, Histórico Comparativo) se pueden exportar a PDF y Excel; el noveno (Evidencia de auditoría) descarga un paquete ZIP para entregar a un auditor externo.',
  paginas: [
    {
      slug: 'indice',
      ruta: '/informes',
      titulo: 'Informes',
      resumen: 'Punto de entrada a los cuatro informes disponibles, filtrados según lo que tu rol puede ver.',
      camposYBotones: [
        { nombre: 'Tarjeta de informe', explicacion: 'Clic para entrar. Solo aparecen los informes que tu rol tiene permitido consultar.' },
      ],
    },
    {
      slug: 'evaluacion-360',
      ruta: '/informes/360',
      titulo: 'Encuentro de Crecimiento 360° Integrado',
      resumen: 'Resultado consolidado de Ser, Saber, Hacer y Deber de una persona, con el detalle de lo que respondió cada acompañante.',
      camposYBotones: [
        { nombre: 'Filtro por persona', explicacion: 'admin_th, líder y gerencia pueden elegir a quién consultar; un colaborador solo ve el suyo.' },
        { nombre: 'Exportar PDF / Exportar Excel', explicacion: 'Descarga el informe completo en el formato elegido.' },
      ],
    },
    {
      slug: 'pdi',
      ruta: '/informes/pdi',
      titulo: 'Informe de Plan de Desarrollo Individual',
      resumen: 'Brechas detectadas, el plan de acción definido para cada una, y su estado de cumplimiento.',
      camposYBotones: [
        { nombre: 'Filtro por persona', explicacion: 'Igual que en los demás informes: según tu rol.' },
        { nombre: 'Exportar PDF / Exportar Excel', explicacion: 'Descarga del informe.' },
      ],
    },
    {
      slug: 'sst',
      ruta: '/informes/sst',
      titulo: 'Informe de Cumplimiento SST',
      resumen: 'Certificaciones, vencimientos y alertas SST abiertas, con la evidencia documental disponible.',
      camposYBotones: [{ nombre: 'Exportar PDF / Exportar Excel', explicacion: 'Descarga del informe.' }],
      notas: ['Visible para admin_th, líder y gerencia.'],
    },
    {
      slug: 'brechas',
      ruta: '/informes/brechas',
      titulo: 'Informe de Brechas por dimensión',
      resumen: 'Comparativo de Ser, Saber, Hacer y Deber por equipo o área, para priorizar dónde intervenir con formación.',
      camposYBotones: [{ nombre: 'Exportar PDF / Exportar Excel', explicacion: 'Descarga del informe.' }],
      notas: ['Visible para admin_th, líder y gerencia.'],
    },
    {
      slug: 'formacion',
      ruta: '/informes/formacion',
      titulo: 'Informe de Formación',
      resumen: 'Cursos y rutas de aprendizaje asignados en Nexa, con su estado y % de avance, persona por persona.',
      camposYBotones: [
        { nombre: 'Tarjetas de resumen', explicacion: 'Total de asignaciones, cuántas están completadas y el % de cumplimiento general.' },
        { nombre: 'Exportar PDF / Exportar Excel', explicacion: 'Descarga del informe.' },
      ],
      notas: ['admin_th y gerencia ven toda la empresa; líder ve su equipo; colaborador ve solo lo propio.'],
    },
    {
      slug: 'cultura',
      ruta: '/informes/cultura',
      titulo: 'Informe de Cultura y Engagement',
      resumen: 'Reconocimientos recibidos, reacciones dadas en el feed corporativo y formación de cultura completada, por persona — combina las señales reales que registra Nexa en vez de inventar un puntaje único de "cultura".',
      camposYBotones: [{ nombre: 'Exportar PDF / Exportar Excel', explicacion: 'Descarga del informe.' }],
      notas: ['Visible para admin_th, líder (su equipo) y gerencia.'],
    },
    {
      slug: 'consolidado',
      ruta: '/informes/consolidado',
      titulo: 'Informe Consolidado Gerencial',
      resumen: 'Los mismos indicadores del dashboard de Inicio, con un desglose por área — pensado para presentar o imprimir en una reunión de junta, no para navegar el día a día.',
      camposYBotones: [{ nombre: 'Exportar PDF / Exportar Excel', explicacion: 'Descarga del informe.' }],
      notas: ['Visible solo para admin_th y gerencia.'],
    },
    {
      slug: 'historico',
      ruta: '/informes/historico',
      titulo: 'Histórico Comparativo entre Ciclos',
      resumen: 'Evolución del promedio de Hacer y Deber de un Ciclo de Crecimiento al siguiente, con la variación marcada (↑/↓) contra el ciclo anterior.',
      camposYBotones: [{ nombre: 'Exportar PDF / Exportar Excel', explicacion: 'Descarga del informe.' }],
      notas: [
        'Visible para admin_th, líder (su equipo) y gerencia.',
        'Un resumen de los dos ciclos más recientes también aparece como widget en el dashboard de Inicio.',
      ],
    },
    {
      slug: 'evidencia-auditoria',
      ruta: '/informes/evidencia-auditoria',
      titulo: 'Evidencia de auditoría',
      resumen:
        'Descarga un paquete ZIP (PDF de portada + Excel de detalle + documentos adjuntos) listo para entregar a un auditor externo, con certificaciones SST, checklist, riesgos y oportunidades, auditorías internas, ACPM, gestión de cambio y procesos documentados.',
      camposYBotones: [
        { nombre: 'Paquete completo', explicacion: 'SST + ISO 9001 + SARLAFT/SAGRILAFT + PTEE, todo en un solo ZIP.' },
        { nombre: 'Paquetes por marco normativo', explicacion: 'SST, ISO 9001 o SARLAFT/SAGRILAFT por separado, cuando el auditor solo pide uno. Las auditorías internas se filtran por el marco de cada paquete; ACPM y Gestión de cambio se incluyen siempre, porque son evidencia de mejora continua que aplica a cualquier marco.' },
        {
          nombre: 'Compartir con un auditor externo (admin_th y gerencia)',
          explicacion:
            'Genera un enlace temporal (/auditoria/…) de solo lectura para un auditor puntual que no tiene cuenta en la plataforma — elige el paquete, la vigencia en días (máximo 90) y una nota opcional para identificarlo. El auditor entra sin iniciar sesión, ve el mismo resumen numérico de esta pantalla y descarga el ZIP. Cada enlace lleva cuántas veces se consultó y cuándo fue la última vez, y se puede revocar antes de que venza. Complementa al rol auditor_externo (pensado para auditores recurrentes con cuenta propia); no lo reemplaza.',
        },
      ],
      notas: [
        'Pensado para el rol auditor_externo (acceso de solo lectura), aunque admin_th y gerencia también pueden entrar y descargarlo directamente.',
        'La información sale de Procesos y Sistemas de Gestión completo (mapa, riesgos, auditorías internas, ACPM, gestión de cambio, checklist) y del módulo SST — no duplica datos, solo los empaqueta.',
      ],
    },
    {
      slug: 'revision-direccion',
      ruta: '/informes/revision-direccion',
      titulo: 'Revisión por la Dirección',
      resumen:
        'El informe que antes tomaba días de consolidación manual, armado solo: auditorías, riesgos, ACPM, indicadores, documentos, gestión de cambio, y su cruce con Formación (Nexa) y PDI (Espiral de Crecimiento) — filtrable por período.',
      camposYBotones: [
        { nombre: 'Selector de período', explicacion: 'Desde/Hasta — por defecto, los últimos 90 días. Todas las estadísticas se recalculan en vivo, nunca se guarda una copia vieja.' },
        {
          nombre: 'Cambios de contexto y Decisiones (admin_th)',
          explicacion: 'Las únicas dos secciones que requieren texto humano — el resto del informe se calcula solo. Se guardan ligadas al período exacto que se está viendo.',
        },
      ],
      notas: [
        'Visible para admin_th y gerencia.',
        'La sección de indicadores "fuera de meta" compara la última medición registrada contra la meta, sin importar cuándo se hizo esa medición.',
      ],
    },
  ],
};
