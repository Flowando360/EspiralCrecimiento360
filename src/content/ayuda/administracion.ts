import type { ModuloAyuda } from '@/types/ayuda';

export const moduloAdministracion: ModuloAyuda = {
  slug: 'administracion',
  titulo: 'Administración',
  descripcion: 'Configuración de la empresa: cargos, organigrama, identidad, usuarios y ponderaciones. Acceso exclusivo de admin_th.',
  paginas: [
    {
      slug: 'cargos',
      ruta: '/administracion/cargos',
      titulo: 'Cargos y perfiles',
      resumen:
        'Plantilla estándar de la dimensión Saber por cargo: formación, habilidades funcionales y técnicas, destrezas y experiencia mínima.',
      camposYBotones: [
        { nombre: 'Importar desde Excel', explicacion: 'Sube el archivo con el formato FORSST-61 del perfil de cargo; el sistema previsualiza los datos leídos (con advertencias si algo no se pudo interpretar) antes de guardarlos.' },
        { nombre: 'Nombre del cargo', explicacion: 'Clic para ver el detalle completo del perfil.' },
      ],
      proceso: [
        'Abre "Importar desde Excel" y sube el archivo del cargo (mismo formato que la plantilla FORSST-61).',
        'Revisa la vista previa: cuenta de campos leídos y advertencias si algo quedó vacío o no se reconoció.',
        'Confirma para guardar — si el cargo ya existe (por nombre), se actualiza; si no, se crea uno nuevo.',
      ],
      notas: ['Al importar, los campos no definidos en el Excel no se sobrescriben (se conserva lo que ya había).'],
    },
    {
      slug: 'detalle-cargo',
      ruta: '/administracion/cargos/*',
      titulo: 'Detalle de un cargo',
      resumen: 'Vista del perfil completo del cargo importado: formación, habilidades, funciones principales, decisiones que toma, factores de riesgo, exámenes médicos requeridos, EPP, y el plan de inducción específico del cargo.',
      camposYBotones: [
        { nombre: 'Plan de inducción específico', explicacion: 'Editable por admin_th. Se genera automáticamente a partir del perfil del cargo (funciones, riesgos, EPP, exámenes de ingreso, formación mínima); puedes agregar o quitar puntos.' },
      ],
      notas: ['Cada sección solo aparece si tiene datos cargados — no se muestran secciones vacías.'],
    },
    {
      slug: 'organigrama-editar',
      ruta: '/administracion/organigrama',
      titulo: 'Editar organigrama',
      resumen: 'Define el líder directo de cada persona — la única fuente de verdad de la que se deduce automáticamente quiénes son pares y quiénes son colaboradores a cargo.',
      camposYBotones: [{ nombre: 'Selector de líder directo', explicacion: 'Por cada colaborador, elige quién es su líder (o "Sin líder" si es nivel 1).' }],
      notas: ['Cambiar el líder aquí afecta de inmediato la arquitectura de acompañantes del próximo ciclo.'],
    },
    {
      slug: 'identidad-organizacional',
      ruta: '/administracion/identidad',
      titulo: 'Identidad Organizacional',
      resumen: 'Propósito superior, declaración de creencias, visión, principios y valores de la empresa — visibles para todos y usados como referencia en Encuentros de Crecimiento y en el feed de Nexa.',
      camposYBotones: [
        { nombre: 'Propósito Superior / Declaración de creencias / Visión', explicacion: 'Textos libres, se guardan con el botón "Guardar".' },
        { nombre: 'Principios y Valores', explicacion: 'Listas editables por separado, se agregan/eliminan elemento por elemento.' },
      ],
      notas: [
        'Todo lo que guardes aquí se usa automáticamente en varios lugares: el Asistente IA de Nexa lo usa como contexto para responder alineado con la empresa, aparece como tarjeta en el dashboard de Inicio, se referencia en los informes PDI y 360°, y genera los puntos comunes del Plan de inducción.',
      ],
    },
    {
      slug: 'guias-flow-invitaciones',
      ruta: '/administracion/guias-flow/invitaciones',
      titulo: 'Guías del Flow · Invitaciones',
      resumen:
        'Genera los links de invitación al cuestionario de la Guía del Flow (guiadelflow) para tus colaboradores, uno o varios a la vez.',
      camposYBotones: [
        { nombre: 'Seleccionar quienes no tienen Guía', explicacion: 'Marca de una vez a todos los que todavía no tienen "Guía generada".' },
        { nombre: 'Generar N links', explicacion: 'Crea una invitación nueva por cada persona seleccionada, cada una ligada a su colaborador_id exacto (no depende de que escriba bien su correo al registrarse).' },
        { nombre: 'Estado', explicacion: '"Sin invitar", "Invitación pendiente" (link generado, todavía sin usar) o "Guía generada" (ya completó su cuestionario y quedó sincronizada acá).' },
      ],
      notas: ['Solo aparecen colaboradores internos activos o en período de prueba.'],
    },
    {
      slug: 'guias-flow-seguimiento',
      ruta: '/administracion/guias-flow/seguimiento',
      titulo: 'Guías del Flow · Seguimiento',
      resumen:
        'Quiénes ya se registraron o respondieron su Guía del Flow, en qué estado está cada uno, qué documentos se le mandaron por correo y cuándo — solo de tu empresa.',
      camposYBotones: [
        { nombre: 'Estado', explicacion: 'Registrado sin terminar, generando documentos, error, entregada por correo, o un estado manual ("Entregada y gestionada" / "No aplica") cuando se resolvió por fuera del sistema.' },
        { nombre: 'Documentos enviados', explicacion: 'Solo el nombre de lo que se mandó a su correo (Guía del Flow, Carta) — no se puede descargar desde acá.' },
        { nombre: 'Fecha', explicacion: 'La fecha en la que se llegó al estado que tiene activo ahora (cuándo se envió el correo, cuándo se completó el cuestionario, o cuándo se marcó el estado manual, según el caso).' },
      ],
      notas: [
        'A quien todavía no ha respondido nada se le hace seguimiento en la otra pestaña, Invitaciones.',
        'El PDF completo de la Guía le llega a cada persona directo a su correo, por fuera de este sistema — acá solo se ve si se mandó y cuándo.',
      ],
    },
    {
      slug: 'sincronizaciones-guia-flow',
      ruta: '/administracion/sincronizaciones-guia-flow',
      titulo: 'Sincronizaciones Guía del Flow',
      resumen:
        'Bitácora de cada intento automático de vincular una Guía del Flow (generada en guiadelflow) con un colaborador de aquí, por correo — incluidos los intentos que no encontraron a nadie.',
      camposYBotones: [
        { nombre: 'Resultado', explicacion: '"Vinculado" (se cargaron sus 18 aspectos e informes), "Sin coincidencia" (ningún colaborador tiene ese correo), "Correo ambiguo" (coincide con más de uno, no se adivina) o "Error".' },
        { nombre: 'Colaborador vinculado', explicacion: 'Solo aparece cuando el resultado fue "Vinculado". Lleva directo a su Guía del Flow.' },
      ],
      notas: [
        'Si alguien aparece con "Sin coincidencia" y sabes que sí es colaborador de la empresa, revisa que el correo que usó al registrarse en guiadelflow sea exactamente el mismo que tiene cargado en su ficha (Documentos y certificado laboral → o donde se edite el correo del colaborador).',
      ],
    },
    {
      slug: 'usuarios-roles',
      ruta: '/administracion/usuarios',
      titulo: 'Usuarios y roles',
      resumen: 'Crea cuentas de acceso para los colaboradores y administra sus roles.',
      camposYBotones: [
        { nombre: 'Nuevo usuario', explicacion: 'Elige un colaborador sin cuenta todavía, su nombre completo (con el usuario ya sugerido a partir del nombre — editable), correo, rol (admin_th/líder/colaborador/gerencia/auditor_externo) y una contraseña temporal.' },
        { nombre: 'Tabla de usuarios', explicacion: 'Nombre (con el apodo debajo si esa persona ya definió uno), correo, Usuario, rol, si la cuenta está activa, y una columna de Acciones.' },
        { nombre: 'Usuario', explicacion: 'Lo que la persona escribe en el login en vez del correo completo (ver "Usuario o correo" en el login). Es un dato propio de la cuenta, independiente del correo — siempre primernombre.primerapellido, sugerido automáticamente a partir del nombre, pero editable por admin_th en cualquier momento (por ejemplo si dos personas chocan, o si el nombre trae un error). Cambiarlo no cambia el correo de la cuenta.' },
        { nombre: 'Editar', explicacion: 'Cambia nombre, apodo ("cómo le gusta que le llamen"), usuario, correo o rol de una cuenta ya existente, sin salir de la tabla.' },
        { nombre: 'Restablecer contraseña', explicacion: 'Genera una nueva contraseña temporal para esa cuenta (editable antes de guardar). Al guardar, se muestra una única vez para copiarla y compartirla con la persona por un canal seguro — igual que al crear la cuenta, no depende de correo de invitación.' },
        { nombre: 'Retirar / Reactivar', explicacion: 'Deja la cuenta inactiva y le bloquea el acceso de verdad (no puede volver a iniciar sesión) — es reversible, "Reactivar" la devuelve al estado normal en cualquier momento. No aparece sobre tu propia cuenta. También ocurre automáticamente al registrar la salida de la persona desde el Historial de su ficha (ver Espiral de Crecimiento → Historial).' },
        { nombre: 'Eliminar', explicacion: 'Borra la cuenta por completo — a diferencia de "Retirar", esto NO se puede deshacer. Puede fallar si esa persona tiene actividad registrada en el sistema (por ejemplo, certificó una verificación de Saber, resolvió una alerta, o publicó en el feed de Nexa); en ese caso no borra nada y sugiere usar "Retirar" en su lugar. No aparece sobre tu propia cuenta.' },
      ],
      notas: [
        'Roles y su alcance: admin_th ve y edita todo; líder ve su equipo y su propia información; colaborador se ve solo a sí mismo; gerencia ve reportes agregados; auditor_externo solo ve, de solo lectura, nombre/cargo de los colaboradores y sus certificaciones de hoja de vida — pensado para entregar evidencia a una auditoría sin exponer el resto del sistema.',
        'El apodo también lo puede fijar cada persona por sí misma desde Mi Perfil — ver Inicio y Mi Perfil. El usuario de login, en cambio, solo lo fija admin_th (no hay autoservicio para eso todavía).',
      ],
    },
    {
      slug: 'salarios',
      ruta: '/administracion/salarios',
      titulo: 'Salarios',
      resumen:
        'Actualiza el salario registrado de varios colaboradores a la vez — pensado para las alzas anuales de salario mínimo (legal o el que fije la empresa), no para gestión de nómina.',
      camposYBotones: [
        { nombre: 'Colaboradores con salario actual…', explicacion: 'Filtro que decide a quién afecta el cambio: igual a, menor o igual a, o mayor o igual a un monto de referencia.' },
        { nombre: 'Acción', explicacion: '"Fijar el salario en un nuevo valor" deja a todos los que cumplen el filtro con el mismo salario nuevo. "Subir un porcentaje" incrementa el salario de cada quien sobre su propio valor actual (no queda igual para todos).' },
        { nombre: 'Fecha de vigencia', explicacion: 'Fecha del alza; queda como fecha del movimiento en el historial de cada persona.' },
        { nombre: 'Nota', explicacion: 'Opcional, texto libre (ej. "Ajuste salario mínimo legal 2027"); se agrega a la descripción del movimiento en el historial.' },
        { nombre: 'Ver a quiénes afecta', explicacion: 'Muestra la lista de colaboradores que cumplen el filtro con su salario actual y el nuevo, antes de aplicar nada.' },
        { nombre: 'Aplicar a N colaboradores', explicacion: 'Confirma el cambio: actualiza el salario de cada persona en la lista y deja un movimiento "Aumento salarial" en su historial.' },
      ],
      proceso: [
        'Define el filtro (comparador + monto) y la acción (fijar valor o subir porcentaje), con su fecha de vigencia.',
        'Haz clic en "Ver a quiénes afecta" y revisa la tabla de salario actual → salario nuevo.',
        'Si todo se ve correcto, haz clic en "Aplicar a N colaboradores" para confirmar.',
      ],
      notas: [
        'Solo afecta a colaboradores activos e internos (no contratistas externos, no gente ya retirada).',
        'El cambio se vuelve a calcular en el servidor al aplicar (no depende de lo que se veía en pantalla), así que si alguien cambió de salario justo antes de confirmar, igual queda correcto.',
        'Este sistema no calcula nómina, prestaciones ni topes legales (SMMLV, auxilio de transporte, UVT) — el salario es un dato de referencia que aquí solo se edita en bloque, igual que se podría editar uno por uno desde la ficha de cada colaborador (Documentos → Contrato).',
      ],
    },
    {
      slug: 'configuracion',
      ruta: '/administracion/configuracion',
      titulo: 'Configuración',
      resumen: 'Datos legales de la empresa (para el certificado laboral) y los pesos de ponderación entre las distintas fuentes de valoración (líder, pares, colaboradores a cargo).',
      camposYBotones: [
        { nombre: 'Datos de la empresa', explicacion: 'NIT, dirección, teléfono, ciudad, y nombre/cargo de quien firma el certificado laboral. Se usan cada vez que se genera un certificado desde la ficha de un colaborador.' },
        { nombre: 'Porcentajes por fuente', explicacion: 'Deben sumar 100% en cada grupo (con equipo / sin equipo).' },
        { nombre: 'Cursos para brecha de Hacer / de Deber', explicacion: 'Elige qué curso(s) de Nexa se asignan automáticamente cuando el motor de PDI automático detecta una brecha en esa dimensión. Se puede dejar sin cursos configurados (entonces solo se crea el PDI, sin formación asociada).' },
        { nombre: 'Preguntas de Clima Organizacional', explicacion: 'El enunciado de la pregunta de eNPS y de cada una de las 6 afirmaciones (reconocimiento, liderazgo, desarrollo, comunicación, condiciones, pertenencia) que responde la gente en Nexa → Clima Organizacional. Se puede adaptar el texto al lenguaje de la empresa; dejar un campo vacío usa el texto por defecto.' },
        { nombre: 'Umbral de anonimato de Clima Organizacional', explicacion: 'El mínimo de respuestas que debe haber en un grupo antes de mostrar resultados agregados. "Cantidad fija" pide un número exacto (5 por defecto); "Porcentaje de la planta" calcula el mínimo como un % de la planta activa de cada grupo (toda la empresa o el equipo de un líder), redondeando siempre hacia arriba y sin bajar nunca de 1.' },
      ],
      notas: [
        'Los porcentajes de ponderación solo se pueden editar mientras el ciclo está en estado "planeado" — una vez abierto un ciclo, sus pesos ya no se pueden cambiar, para no afectar Encuentros de Crecimiento en curso. Los datos de la empresa, en cambio, se pueden editar en cualquier momento.',
        'El motor automático de brechas → formación se explica en detalle en Espiral de Crecimiento → Planes de Desarrollo Individual (PDI).',
        'Las 7 preguntas de Clima Organizacional (eNPS + 6 dimensiones) son fijas en cuanto a cuántas y cuáles son — solo se edita el texto de cada una, no se pueden agregar ni quitar preguntas. Es a propósito: así el índice de clima se puede seguir comparando entre rondas.',
        'Con "Porcentaje de la planta", el umbral de un equipo se calcula sobre la planta de ESE equipo (no de toda la empresa) — un equipo chico y uno grande pueden terminar con umbrales distintos en la misma ronda.',
      ],
    },
  ],
};
