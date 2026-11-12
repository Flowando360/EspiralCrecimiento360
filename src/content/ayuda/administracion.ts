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
        { nombre: '+ Nuevo cargo', explicacion: 'Crea un cargo desde cero, sin necesidad de un Excel. Pide nombre, proceso o área y si tiene personal a cargo; al crearlo te lleva a su edición para completar el manual de funciones, las habilidades, los riesgos, los exámenes y el EPP.' },
        { nombre: 'Importar desde Excel', explicacion: 'Sube el archivo con el formato FORSST-61 del perfil de cargo; el sistema previsualiza los datos leídos (con advertencias si algo no se pudo interpretar) antes de guardarlos.' },
        { nombre: 'Nombre del cargo', explicacion: 'Clic para ver el detalle completo del perfil.' },
        { nombre: 'Área / proceso', explicacion: 'Se guarda unificada: «administrativo», «Administrativo» y «ADMINISTRATIVO» quedan como una sola área, para que los informes por área no la partan en varias.' },
      ],
      proceso: [
        'Para crear un cargo desde cero: pulsa "+ Nuevo cargo", escribe el nombre y el área, "Crear cargo y continuar", y completa sus datos en la pantalla de edición (guarda los datos generales con "Guardar cambios"; cada lista de funciones, habilidades, decisiones, riesgos, exámenes y EPP se agrega con su propio botón "Agregar").',
        'Para traer un cargo que ya tienes en Excel: abre "Importar desde Excel" y sube el archivo del cargo (mismo formato que la plantilla FORSST-61).',
        'Revisa la vista previa: cuenta de campos leídos y advertencias si algo quedó vacío o no se reconoció.',
        'Confirma para guardar — si el cargo ya existe (por nombre), se actualiza; si no, se crea uno nuevo.',
      ],
      notas: ['Al importar, los campos no definidos en el Excel no se sobrescriben (se conserva lo que ya había).'],
    },
    {
      slug: 'nuevo-cargo',
      ruta: '/administracion/cargos/nuevo',
      titulo: 'Nuevo cargo',
      resumen: 'Formulario corto para crear un cargo desde cero. Al crearlo te lleva a la edición completa del perfil.',
      camposYBotones: [
        { nombre: 'Nombre del cargo (obligatorio)', explicacion: 'No puede repetirse dentro de la empresa.' },
        { nombre: 'Proceso o área', explicacion: 'Opcional, por ejemplo "Administrativo" o "Producción".' },
        { nombre: 'Tiene personal a cargo', explicacion: 'Marca si el cargo dirige personas; cambia la ponderación y los bloques de su evaluación.' },
        { nombre: 'Crear cargo y continuar', explicacion: 'Crea el cargo y abre su pantalla de edición.' },
      ],
      notas: ['Exclusivo de admin_th.'],
    },
    {
      slug: 'editar-cargo',
      ruta: '/administracion/cargos/*/editar',
      titulo: 'Editar un cargo y su manual de funciones',
      resumen:
        'Todo el perfil del cargo en una sola pantalla: datos generales, formación y competencias, niveles de autoridad, responsabilidades, SG-SST y las listas de habilidades, funciones, decisiones, riesgos, exámenes y EPP.',
      camposYBotones: [
        { nombre: 'Identificación, Formación y competencias, Niveles de autoridad, Responsabilidades, SG-SST', explicacion: 'Campos del perfil (objetivo, formación requerida, experiencia mínima en meses, a quién reporta, etc.). Se guardan juntos con "Guardar cambios".' },
        { nombre: 'Habilidades funcionales y técnicas', explicacion: 'Cada habilidad con su tipo y su nivel esperado (bajo, medio o alto). Alimentan el checklist de Saber de quienes ocupan el cargo.' },
        { nombre: 'Funciones principales', explicacion: 'Cada función con su proceso y su periodicidad. Es el manual de funciones: lo ve cada colaborador en su ficha y es la base del bloque "Roles y funciones" de su evaluación de Hacer.' },
        { nombre: 'Decisiones, factores de riesgo, exámenes médicos y EPP', explicacion: 'Listas que se agregan una por una. Los riesgos, exámenes y EPP también alimentan el plan de inducción del cargo.' },
      ],
      notas: [
        'Cualquier cambio se refleja de inmediato en la ficha de cada colaborador con ese cargo, en el organigrama y en los informes: todos leen el cargo en vivo, no una copia.',
        'Cada lista agrega un elemento por vez. Si agregas dos veces la misma habilidad con el mismo nombre, queda repetida; elimina la sobrante con el ícono de papelera.',
      ],
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
      resumen: 'Define quién reporta a quién — la única fuente de la que se deduce automáticamente quiénes son pares y quiénes son colaboradores a cargo. Se puede armar por líder (eliges un líder y marcas su equipo) o por persona (eliges el líder de cada una).',
      camposYBotones: [
        { nombre: 'Para revisar', explicacion: 'Panel de vacíos: líderes cuyo cargo tiene personal a cargo pero todavía no tienen equipo (pulsa su nombre para asignarlo) y personas sin líder y sin equipo. Aparece solo si hay algo que revisar.' },
        { nombre: 'Por líder: asignar su equipo', explicacion: 'Elige un líder en la lista (o llega desde el botón «Equipo a cargo» de su ficha). Marca las personas que le reportan y pulsa «Guardar equipo». Quien ya tenía otro líder pasará a este (se ve «Pasará de …»); quien desmarques queda sin líder hasta que lo asignes a otro. No deja marcar a un jefe del líder (evita ciclos en el organigrama).' },
        { nombre: 'Por persona: elegir su líder directo', explicacion: 'Tabla con un selector de líder por cada colaborador (o «Sin líder (nivel 1)» para gerencia). Es el mismo dato que el editor por líder: los dos caminos quedan siempre consistentes.' },
      ],
      notas: [
        'Aparecen las personas activas y las que están en período de prueba (antes estas últimas no salían y por eso algunos líderes nuevos «no aparecían»).',
        'Un ciclo ya generado no cambia solo. Cuando termines de ordenar el equipo, entra al ciclo y vuelve a pulsar «Generar Encuentros de Crecimiento»: respeta lo ya generado, agrega lo nuevo y retira las tareas de acompañantes que ya no corresponden (solo las que nadie ha empezado a responder).',
        'Al crear un colaborador nuevo se elige su líder en el mismo formulario: queda en el organigrama de inmediato.',
      ],
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
        'Todo lo que guardes aquí se usa automáticamente en varios lugares: Gino (el asistente con IA de Nexa) lo usa como contexto para responder alineado con la empresa, aparece como tarjeta en el dashboard de Inicio, se referencia en los informes PDI y 360°, y genera los puntos comunes del Plan de inducción.',
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
        { nombre: 'Rol personalizado (opcional)', explicacion: 'Aparece solo si la empresa ya creó roles en Roles y permisos. Al crear o editar un usuario puedes asignarle uno. Limita los módulos del menú que esa persona ve; el rol de sistema sigue decidiendo qué datos puede ver. Déjalo en "Sin rol personalizado" para usar solo el rol de sistema.' },
        { nombre: 'Búsqueda y filtros', explicacion: 'Encima de la tabla: busca por nombre, usuario o correo (sin importar tildes) y filtra por rol, estado (activos o inactivos) y si tiene ficha de colaborador vinculada. «Limpiar filtros» muestra todos otra vez.' },
        { nombre: 'Ficha de colaborador (selector «Sin ficha de colaborador»)', explicacion: 'Una cuenta de acceso (usuario y contraseña) y una ficha de colaborador (cargo, líder, hoja de vida, evaluaciones) son dos cosas distintas que se unen aquí. Al pulsar Editar, el selector lista únicamente las fichas activas que todavía no tienen cuenta: no son «perfiles de esa persona», solo las fichas disponibles. Si ninguna es de ella, déjalo en «Sin ficha». Para darle ficha y cargo a una persona que solo tiene cuenta: ve a Espiral 360° → Colaboradores → Nuevo colaborador, elige su cargo y líder (el formulario ofrece vincular cuentas sin ficha) o crea la ficha primero y luego vincúlala aquí con Editar → Guardar. Sin ficha, la persona no aparece en el organigrama ni en las evaluaciones.' },
        { nombre: 'Tabla de usuarios', explicacion: 'Nombre (con el apodo debajo si esa persona ya definió uno), correo, Usuario, rol, si la cuenta está activa, y una columna de Acciones.' },
        { nombre: 'Usuario', explicacion: 'Lo que la persona escribe en el login en vez del correo completo (ver "Usuario o correo" en el login). Es un dato propio de la cuenta, independiente del correo — siempre primernombre.primerapellido, sugerido automáticamente a partir del nombre, pero editable por admin_th en cualquier momento (por ejemplo si dos personas chocan, o si el nombre trae un error). Cambiarlo no cambia el correo de la cuenta.' },
        { nombre: 'Editar', explicacion: 'Cambia nombre, apodo ("cómo le gusta que le llamen"), usuario, correo, rol o ficha de colaborador vinculada de una cuenta ya existente, sin salir de la tabla.' },
        { nombre: 'Ficha de colaborador (al editar)', explicacion: 'Debajo del rol: vincula la cuenta a una ficha de colaborador activa que todavía no tenga cuenta, la cambia por otra o la desvincula ("Sin ficha de colaborador"). Sirve para cuentas creadas sin ficha, como la de Talento Humano. Las cuentas sin ficha muestran "Sin ficha de colaborador" bajo el nombre.' },
        { nombre: 'Restablecer contraseña', explicacion: 'Genera una nueva contraseña temporal para esa cuenta (editable antes de guardar). Al guardar, se muestra una única vez para copiarla y compartirla con la persona por un canal seguro — igual que al crear la cuenta, no depende de correo de invitación.' },
        { nombre: 'Retirar / Reactivar', explicacion: 'Deja la cuenta inactiva y le bloquea el acceso de verdad (no puede volver a iniciar sesión) — es reversible, "Reactivar" la devuelve al estado normal en cualquier momento. No aparece sobre tu propia cuenta. También ocurre automáticamente al registrar la salida de la persona desde el Historial de su ficha (ver Espiral de Crecimiento → Historial).' },
        { nombre: 'Eliminar', explicacion: 'Borra la cuenta por completo — a diferencia de "Retirar", esto NO se puede deshacer. Puede fallar si esa persona tiene actividad registrada en el sistema (por ejemplo, certificó una verificación de Saber, resolvió una alerta, o publicó en el feed de Nexa); en ese caso no borra nada y sugiere usar "Retirar" en su lugar. No aparece sobre tu propia cuenta.' },
      ],
      notas: [
        'Roles y su alcance: admin_th ve y edita todo; líder ve su equipo y su propia información; colaborador se ve solo a sí mismo; gerencia ve reportes agregados; auditor_externo solo ve, de solo lectura, nombre/cargo de los colaboradores y sus certificaciones de hoja de vida — pensado para entregar evidencia a una auditoría sin exponer el resto del sistema.',
        'Sin ficha de colaborador, una cuenta puede entrar y ver, pero no participar en lo que se registra a nombre de un colaborador: cazar y proponer en la Cacería Makigami, recibir puntos y reconocimientos, cursos asignados, etc. Si una ficha ya está vinculada a otra cuenta no aparece en la lista (una ficha, una cuenta).',
        'El apodo también lo puede fijar cada persona por sí misma desde Mi Perfil — ver Inicio y Mi Perfil. El usuario de login, en cambio, solo lo fija admin_th (no hay autoservicio para eso todavía).',
      ],
    },
    {
      slug: 'roles-permisos',
      ruta: '/administracion/roles',
      titulo: 'Roles y permisos',
      resumen:
        'Crea roles propios para tu empresa y decide, módulo por módulo, qué puede leer, escribir y borrar quien los tenga. Luego asígnalos desde Usuarios y roles.',
      camposYBotones: [
        { nombre: 'Buscadores', explicacion: 'Una casilla arriba de la lista busca roles por nombre; otra, dentro del rol, busca un módulo en la tabla de permisos.' },
        { nombre: 'Lista de roles', explicacion: 'Roles creados en la empresa, con cuántos usuarios los tienen. Haz clic en uno para editarlo.' },
        { nombre: 'Nuevo rol', explicacion: 'Crea un rol con nombre (mínimo 2 caracteres) y descripción opcional. Nace con Inicio y Mi perfil en lectura, y el resto sin acceso.' },
        { nombre: 'Nombre y descripción', explicacion: 'Se pueden cambiar en cualquier momento con "Guardar cambios".' },
        { nombre: 'Matriz de permisos (Leer / Escribir / Borrar)', explicacion: 'Una fila por módulo: Inicio, Mi perfil, Espiral de Crecimiento 360°, Reclutamiento, Nexa, Procesos, Informes, Dotaciones y Administración. Escribir marca Leer automáticamente; Borrar marca Escribir y Leer.' },
        { nombre: 'Guardar cambios', explicacion: 'Guarda la matriz y los datos del rol.' },
        { nombre: 'Eliminar rol', explicacion: 'Borra el rol. Los usuarios que lo tenían quedan solo con su rol de sistema. Pide confirmación y avisa cuántos usuarios se verán afectados.' },
      ],
      proceso: [
        'Crear el rol: pulsa "Nuevo rol", escribe el nombre (por ejemplo, "Gerencia de solo lectura") y guarda.',
        'Marcar permisos: en la matriz, activa Leer en los módulos que debe ver. Activa Escribir solo donde debe modificar datos, y Borrar solo donde debe eliminar.',
        'Guardar y asignar: pulsa "Guardar cambios" y luego asigna el rol a los usuarios desde Usuarios y roles → Rol personalizado.',
      ],
      notas: [
        'Un rol personalizado no da acceso a datos que el rol de sistema del usuario no ve. Por ejemplo, un colaborador con un rol personalizado no puede ver la información de todo el equipo, aunque la matriz lo permita.',
        'La lectura controla qué módulos aparecen en el menú y también bloquea sus pantallas: si alguien sin lectura en Nexa escribe la dirección de una pantalla de Nexa, vuelve al Inicio. Gino (el chat con IA), la ayuda, las alertas, los mensajes y el cambio de contraseña están disponibles para todos.',
        'Escribir y Borrar se guardan para aplicarlos en cada acción; mientras esa parte esté pendiente, no los uses como única protección de información sensible.',
        'Las pantallas que el menú agrupa bajo otro módulo siguen a ese módulo: por ejemplo, Formación individual, Reconocimientos y Clima Organizacional pertenecen a Espiral 360°, y Simulacros pertenece a Procesos.',
        'Solo el administrador de la empresa (admin_th) ve y edita los roles de su empresa.',
      ],
    },
    {
      slug: 'respaldo-datos',
      ruta: '/administracion/respaldo',
      titulo: 'Respaldo de datos',
      resumen:
        'Descarga todos los datos de tu empresa en un archivo ZIP, con un CSV por tabla. Sirve como copia fuera de la plataforma o para migrar la información.',
      camposYBotones: [
        { nombre: 'Descargar respaldo completo (.zip)', explicacion: 'Genera el ZIP con todas las tablas de tu empresa. Puede tardar según el volumen de datos.' },
        { nombre: 'LEEME.txt (dentro del ZIP)', explicacion: 'Fecha y hora del respaldo, cantidad de tablas, filas por tabla, y las notas de formato.' },
        { nombre: 'Archivos CSV', explicacion: 'Están en UTF-8 con BOM, para que Excel abra bien las tildes y las eñes. Las celdas con listas u objetos van en formato JSON.' },
      ],
      notas: [
        'El respaldo contiene datos personales completos. Guárdalo en un lugar con acceso restringido.',
        'Solo el administrador de la empresa puede descargar su propio respaldo. El respaldo de otras empresas lo descarga el equipo proveedor, y queda registrado en la bitácora.',
        'Las tablas que no pertenecen a ninguna empresa (catálogos globales de la plataforma) no se incluyen en el respaldo de una empresa.',
      ],
    },
    {
      slug: 'dotaciones-hub',
      ruta: '/administracion/dotaciones',
      titulo: 'Dotaciones (acceso a los módulos)',
      resumen:
        'Punto de entrada único de Dotaciones desde Administración. Desde aquí se va a Gestión de dotaciones, al Catálogo e inventario y al Seguimiento por persona.',
      camposYBotones: [
        { nombre: 'Gestión de dotaciones', explicacion: 'Registra las entregas de uniformes y EPP, con su acta de entrega y su confirmación de recibido. Ver el módulo Dotaciones.' },
        { nombre: 'Catálogo e inventario', explicacion: 'Artículos, tallas y stock disponible.' },
        { nombre: 'Seguimiento por persona', explicacion: 'Lo que tiene cada colaborador, lo que le falta y si es elegible según la normativa.' },
      ],
    },
    {
      slug: 'guias-flow-hub',
      ruta: '/administracion/guias-flow',
      titulo: 'Guías del Flow (acceso a los módulos)',
      resumen:
        'Punto de entrada desde Administración a la gestión de las Guías del Flow: invitaciones a las personas y seguimiento de sus respuestas.',
      camposYBotones: [
        { nombre: 'Invitaciones', explicacion: 'Envía la invitación a la Guía del Flow a una persona. Ver “Guías del Flow · Invitaciones”.' },
        { nombre: 'Seguimiento', explicacion: 'Estado de cada guía: invitada, en curso o completada. Ver “Guías del Flow · Seguimiento”.' },
      ],
    },
    {
      slug: 'parametros-legales',
      ruta: '/administracion/parametros-legales',
      titulo: 'Parámetros legales',
      resumen:
        'Valores legales que cambian cada año, como el salario mínimo (SMLMV). El sistema los usa para calcular la elegibilidad de dotación de cada entrega.',
      camposYBotones: [
        { nombre: 'Año', explicacion: 'Año al que aplica el valor. Hay un valor por año.' },
        { nombre: 'SMLMV', explicacion: 'Salario mínimo legal mensual vigente de ese año. La elegibilidad de una entrega usa el SMLMV del año de la entrega.' },
      ],
      notas: [
        'Si no hay SMLMV cargado para el año de una entrega, la elegibilidad de dotación no se puede calcular: cárgalo antes de registrar entregas de ese año.',
        'Solo admin_th puede cambiar estos valores.',
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
        { nombre: 'Umbral de difusión documental', explicacion: '% de confirmaciones de lectura necesarias para que un documento del módulo de Procesos y Sistemas de Gestión se considere "difusión completa" (100% por defecto). Se usa en Procesos y Sistemas de Gestión → Gestión documental.' },
        { nombre: 'Estructura de código documental', explicacion: 'Prefijo por tipo de documento (procedimiento/política/formato/instructivo/registro), separador y dígitos del consecutivo, con un ejemplo en vivo del código que resulta. Se usa cada vez que se aprueba y publica un documento en Gestión documental.' },
        { nombre: 'Escala de valoración de Riesgos', explicacion: 'Las etiquetas de los 3 grados de probabilidad e impacto (para riesgos y para oportunidades por separado) y en qué valor caen los cortes de "bajo" y "medio/alto" de la valoración 1-9. Se usa en Procesos y Sistemas de Gestión → Riesgos y oportunidades; la fórmula (impacto × probabilidad) no cambia, solo los nombres y los cortes.' },
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
