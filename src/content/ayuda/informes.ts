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
        { nombre: 'Filtro por área y líder', explicacion: 'Elige un área o proceso y/o un líder directo (su equipo) y pulsa Aplicar: el informe y sus descargas de PDF/Excel quedan solo con esa gente. «Quitar filtros» vuelve a la vista completa. El líder solo ve su propio equipo, así que no tiene selector de líder.' },
        { nombre: 'Filtro por persona', explicacion: 'Igual que en los demás informes: según tu rol.' },
        { nombre: 'Exportar PDF / Exportar Excel', explicacion: 'Descarga del informe.' },
      ],
    },
    {
      slug: 'sst',
      ruta: '/informes/sst',
      titulo: 'Informe de Seguimiento SST',
      resumen: 'Certificaciones, vencimientos y alertas SST abiertas, con la evidencia documental disponible.',
      camposYBotones: [{ nombre: 'Exportar PDF / Exportar Excel', explicacion: 'Descarga del informe.' }],
      notas: ['Visible para admin_th, líder y gerencia.'],
    },
    {
      slug: 'brechas',
      ruta: '/informes/brechas',
      titulo: 'Informe de Brechas por dimensión',
      resumen: 'Comparativo de Ser, Saber, Hacer y Deber por equipo o área, para priorizar dónde intervenir con formación.',
      camposYBotones: [
        { nombre: 'Filtro por área y líder', explicacion: 'Elige un área o proceso y/o un líder directo (su equipo) y pulsa Aplicar: el informe y sus descargas de PDF/Excel quedan solo con esa gente. «Quitar filtros» vuelve a la vista completa. El líder solo ve su propio equipo, así que no tiene selector de líder.' },
        { nombre: 'Exportar PDF / Exportar Excel', explicacion: 'Descarga del informe.' }],
      notas: ['Visible para admin_th, líder y gerencia.', 'El Ser se describe, no se califica: la columna solo cuenta cuántas personas tienen Guía del Flow.', 'Por privacidad, un grupo con menos personas con dato que el umbral de anonimato (5 por defecto, se cambia en Administración → Configuración) muestra «Menos de N personas» en lugar del promedio.'],
    },
    {
      slug: 'equidad',
      ruta: '/informes/equidad',
      titulo: 'Equidad de la valoración',
      resumen: 'Señales para calibrar la valoración: qué líderes califican sistemáticamente más alto o más bajo que el resto y en qué grupos la autoevaluación se aleja de lo que ve el líder.',
      camposYBotones: [
        { nombre: 'Ciclo', explicacion: 'Elige un ciclo o «Todos los ciclos» y pulsa Ver.' },
        { nombre: 'Severidad por líder', explicacion: 'Promedio de las valoraciones que da cada líder frente al promedio de todos los líderes. Positivo = más benevolente, negativo = más exigente. Si la diferencia llega a 0,5 o más se marca «conversar». La dispersión baja indica que califica a casi todos igual.' },
        { nombre: 'Autoevaluación frente al líder', explicacion: 'Por área o por equipo: promedio de la autoevaluación menos el de la valoración del líder, solo de personas con ambas. Positivo = la gente se ve mejor de como la ve su líder.' },
      ],
      proceso: [
        'Elige el ciclo y revisa las filas marcadas «conversar».',
        'Reúne a los líderes implicados y revisa casos concretos con evidencia, no solo los promedios.',
        'Acuerden criterios comunes y, si hace falta, ajusten las guías de valoración de las competencias.',
      ],
      notas: [
        'Solo Talento Humano. Una diferencia no prueba un sesgo: puede reflejar desempeños realmente distintos; úsala para conversar.',
        'Por privacidad, solo aparecen líderes y grupos con al menos el mínimo de personas valoradas (5 por defecto, se cambia en Administración → Configuración); el resto se cuenta como ocultos.',
        'Solo cuentan valoraciones enviadas y no se tienen en cuenta los «No aplica».',
      ],
    },
    {
      slug: 'formacion',
      ruta: '/informes/formacion',
      titulo: 'Informe de Formación',
      resumen: 'Cursos y rutas de aprendizaje asignados en Nexa, con su estado y % de avance, persona por persona.',
      camposYBotones: [
        { nombre: 'Filtro por área y líder', explicacion: 'Elige un área o proceso y/o un líder directo (su equipo) y pulsa Aplicar: el informe y sus descargas de PDF/Excel quedan solo con esa gente. «Quitar filtros» vuelve a la vista completa. El líder solo ve su propio equipo, así que no tiene selector de líder.' },
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
      camposYBotones: [
        { nombre: 'Filtro por área y líder', explicacion: 'Elige un área o proceso y/o un líder directo (su equipo) y pulsa Aplicar: el informe y sus descargas de PDF/Excel quedan solo con esa gente. «Quitar filtros» vuelve a la vista completa. El líder solo ve su propio equipo, así que no tiene selector de líder.' },
        { nombre: 'Exportar PDF / Exportar Excel', explicacion: 'Descarga del informe.' }],
      notas: ['Visible solo para admin_th y gerencia.', 'Con un filtro activo, Saber, «con Guía y desempeño sin alerta» y alertas no se muestran: solo existen a nivel empresa.', 'Las áreas (o el filtro) con menos personas con dato que el umbral de anonimato no muestran promedios de Hacer y Deber: aparece «Menos de N personas».'],
    },
    {
      slug: 'historico',
      ruta: '/informes/historico',
      titulo: 'Histórico Comparativo entre Ciclos',
      resumen: 'Evolución del promedio de Hacer y Deber de un Ciclo de Crecimiento al siguiente, con la variación marcada (↑/↓) contra el ciclo anterior.',
      camposYBotones: [
        { nombre: 'Filtro por área y líder', explicacion: 'Elige un área o proceso y/o un líder directo (su equipo) y pulsa Aplicar: el informe y sus descargas de PDF/Excel quedan solo con esa gente. «Quitar filtros» vuelve a la vista completa. El líder solo ve su propio equipo, así que no tiene selector de líder.' },
        { nombre: 'Exportar PDF / Exportar Excel', explicacion: 'Descarga del informe.' }],
      notas: [
        'Visible para admin_th, líder (su equipo) y gerencia.',
        'Un resumen de los dos ciclos más recientes también aparece como widget en el dashboard de Inicio.',
        'Por privacidad, si en un ciclo hay menos personas con resultado que el umbral de anonimato (5 por defecto, se cambia en Administración → Configuración), ese ciclo muestra «Menos de N personas» en lugar del promedio.',
        'Formación y PDI son listados persona por persona (no promedios), por eso el umbral no aplica ahí.',
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
