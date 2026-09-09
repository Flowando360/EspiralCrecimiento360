import type { SeccionPlanPruebas } from '@/types/ayuda';

export const planPruebas: SeccionPlanPruebas[] = [
  {
    modulo: 'Acceso y permisos',
    escenarios: [
      {
        titulo: 'Inicio de sesión y cierre de sesión',
        rolNecesario: 'Cualquier usuario',
        pasos: [
          { paso: 'Entra a la URL del aplicativo sin haber iniciado sesión.', resultadoEsperado: 'Redirige a la pantalla de login.' },
          { paso: 'Ingresa un identificador válido (usuario o correo) con la contraseña equivocada.', resultadoEsperado: 'Muestra "Correo o contraseña incorrectos. Verifica con Talento Humano si no tienes acceso." y te deja en la misma pantalla.' },
          { paso: 'Ingresa tu usuario (ej. "juan.perez", sin @dominio) y tu contraseña correctos.', resultadoEsperado: 'Entra a Inicio, con el menú lateral acorde a tu rol — no hizo falta escribir el correo completo.' },
          { paso: 'Cierra sesión y vuelve a entrar, esta vez con el correo completo (ej. "juan.perez@marmolesyservicios.com") y la misma contraseña.', resultadoEsperado: 'También entra correctamente — usuario y correo llevan al mismo lugar.' },
          { paso: 'Escribe un usuario que no existe, con cualquier contraseña.', resultadoEsperado: 'Muestra el mismo mensaje genérico de error — no revela si el usuario existe o no.' },
          { paso: 'Presiona el botón de cerrar sesión (ícono de salida, arriba a la derecha).', resultadoEsperado: 'Vuelve a la pantalla de login.' },
        ],
      },
      {
        titulo: 'El menú y las pantallas respetan el rol',
        rolNecesario: 'Un colaborador y, por separado, un líder',
        pasos: [
          { paso: 'Inicia sesión como colaborador y revisa el menú lateral.', resultadoEsperado: 'No aparecen las secciones de Administración ni "Ciclos de Crecimiento".' },
          { paso: 'Intenta entrar directamente a una URL de administración (ej. /administracion/usuarios) escribiéndola en el navegador.', resultadoEsperado: 'Redirige a Inicio, no muestra la pantalla.' },
          { paso: 'Inicia sesión como líder y entra a Colaboradores.', resultadoEsperado: 'Solo ve a las personas que le reportan directamente, no a toda la empresa.' },
        ],
      },
      {
        titulo: 'El rol auditor_externo solo ve lo mínimo',
        rolNecesario: 'auditor_externo',
        pasos: [
          { paso: 'Inicia sesión con una cuenta con rol auditor_externo.', resultadoEsperado: 'El menú lateral solo muestra Colaboradores (nombre/cargo) e Informes → Evidencia de auditoría.' },
          { paso: 'Intenta entrar por URL a una pantalla fuera de su alcance (ej. /administracion/usuarios o /espiral-crecimiento/ciclos).', resultadoEsperado: 'Redirige a Inicio, no muestra datos.' },
          { paso: 'Entra a Colaboradores.', resultadoEsperado: 'Ve nombre y cargo de cada persona, sin datos sensibles (sin Hacer/Deber, sin salario, sin documentos).' },
        ],
      },
      {
        titulo: 'Retirar a alguien le bloquea el acceso de verdad',
        rolNecesario: 'admin_th y una cuenta de prueba retirada',
        pasos: [
          { paso: 'Como admin_th, entra a Usuarios y roles y retira una cuenta de prueba (ver el escenario de "Retirar y reactivar una cuenta" en Administración).', resultadoEsperado: 'Su Estado pasa a "Inactivo".' },
          { paso: 'Con esa cuenta ya con sesión abierta en otra pestaña o navegador (sin haber cerrado sesión), intenta navegar a cualquier pantalla del dashboard.', resultadoEsperado: 'Se le corta el acceso y termina redirigida a login, aunque nunca haya presionado "Cerrar sesión".' },
          { paso: 'Intenta iniciar sesión de nuevo con esa cuenta, usando su contraseña correcta.', resultadoEsperado: 'No logra entrar — muestra el mismo mensaje genérico de error que una contraseña incorrecta (el mensaje no distingue el motivo, a propósito).' },
          { paso: 'Como admin_th, reactiva esa cuenta desde Usuarios y roles.', resultadoEsperado: 'Puede volver a iniciar sesión con normalidad, con la misma contraseña de siempre.' },
        ],
      },
      {
        titulo: 'El panel Meta-Admin es exclusivo del equipo interno',
        rolNecesario: 'admin_th (para confirmar que NO entra) y una cuenta superadmin',
        pasos: [
          { paso: 'Inicia sesión como admin_th y escribe la URL /meta-admin directamente en el navegador.', resultadoEsperado: 'Redirige a Inicio — admin_th no tiene acceso, aunque sea el rol más alto dentro de su empresa.' },
          { paso: 'Inicia sesión con una cuenta marcada como superadmin (equipo interno de la alianza) y entra a /meta-admin.', resultadoEsperado: 'Carga la tabla de "Cuentas y membresías" con todas las empresas cliente del sistema, no solo la propia.' },
        ],
      },
    ],
  },
  {
    modulo: 'Administración',
    escenarios: [
      {
        titulo: 'Crear un usuario',
        rolNecesario: 'admin_th',
        pasos: [
          { paso: 'Entra a Usuarios y roles → "Nuevo usuario".', resultadoEsperado: 'Pide colaborador sin cuenta, correo, rol y contraseña temporal. El selector de rol incluye admin_th, líder, colaborador, gerencia y auditor_externo.' },
          { paso: 'Completa y guarda, eligiendo el rol auditor_externo.', resultadoEsperado: 'Aparece en la tabla de usuarios con ese rol; esa persona ya puede iniciar sesión con la contraseña temporal y solo ve lo permitido para auditor_externo.' },
        ],
      },
      {
        titulo: 'Editar los datos de un usuario existente (incluido su apodo y su usuario de login)',
        rolNecesario: 'admin_th',
        pasos: [
          { paso: 'En Usuarios y roles, presiona "Editar" en la fila de un usuario.', resultadoEsperado: 'La fila se convierte en un formulario con nombre, apodo, usuario, correo y rol editables.' },
          { paso: 'Cambia el rol de esa persona (por ejemplo, de colaborador a líder) y guarda.', resultadoEsperado: 'El cambio queda guardado; esa persona ve el menú de su nuevo rol la próxima vez que inicie sesión.' },
          { paso: 'Escribe algo en "Cómo le gusta que le llamen" y guarda.', resultadoEsperado: 'Debajo del nombre, en la tabla, aparece \'se hace llamar "..."\'.' },
          { paso: 'Cambia el correo de esa persona por uno nuevo y guarda.', resultadoEsperado: 'Queda actualizado en la tabla; esa persona debe usar el correo nuevo para iniciar sesión de ahí en adelante.' },
          { paso: 'Cambia el campo "Usuario" a algo distinto (ej. le agregas un número al final) y guarda.', resultadoEsperado: 'Queda actualizado en la columna Usuario, sin tocar el correo — esa persona ya debe usar el nuevo usuario para entrar sin escribir el correo completo.' },
          { paso: 'Intenta poner en "Usuario" el mismo valor que ya tiene otra cuenta.', resultadoEsperado: 'Muestra el mensaje "Ese usuario ya lo tiene otra cuenta — prueba con otro..." y no guarda el cambio.' },
        ],
      },
      {
        titulo: 'Al crear una cuenta, el usuario se sugiere solo desde el nombre',
        rolNecesario: 'admin_th',
        pasos: [
          { paso: 'Entra a Usuarios y roles → "Crear cuenta" y escribe un nombre completo, sin tocar el campo Usuario.', resultadoEsperado: 'El campo Usuario se llena solo con "primernombre.primerapellido" a medida que escribes el nombre.' },
          { paso: 'Ahora edita el campo Usuario a mano (por ejemplo, córrigelo o agrégale un número) y luego sigue escribiendo el nombre.', resultadoEsperado: 'El Usuario ya NO se sobreescribe solo — respeta lo que corregiste a mano.' },
          { paso: 'Completa el resto y crea la cuenta con un correo personal cualquiera (ej. un gmail), distinto del patrón nombre.apellido@empresa.', resultadoEsperado: 'La cuenta se crea igual; el usuario de login queda como lo definiste, sin importar cuál sea el correo real.' },
        ],
      },
      {
        titulo: 'Retirar y reactivar una cuenta',
        rolNecesario: 'admin_th',
        pasos: [
          { paso: 'En la fila de un usuario de prueba (que no seas tú), presiona "Retirar" y confirma la advertencia.', resultadoEsperado: 'El botón cambia a "Reactivar" y la columna Estado pasa a "Inactivo".' },
          { paso: 'Busca esa misma opción sobre tu propia fila.', resultadoEsperado: 'No aparece — no te puedes retirar a ti mismo.' },
          { paso: 'Presiona "Reactivar" sobre la cuenta que retiraste.', resultadoEsperado: 'Vuelve a "Activo" y puede iniciar sesión de nuevo con normalidad.' },
        ],
      },
      {
        titulo: 'Eliminar una cuenta definitivamente',
        rolNecesario: 'admin_th',
        pasos: [
          { paso: 'Presiona "Eliminar" sobre una cuenta de prueba recién creada, sin actividad registrada en el sistema, y confirma la advertencia de que no se puede deshacer.', resultadoEsperado: 'La fila desaparece por completo de la tabla — a diferencia de "Retirar", que solo la deja inactiva.' },
          { paso: 'Presiona "Eliminar" sobre una cuenta que sí tiene actividad registrada (por ejemplo, alguien que ya certificó una Verificación de Saber, resolvió una alerta o publicó en el feed de Nexa).', resultadoEsperado: 'Aparece un mensaje explicando que no se pudo eliminar por tener actividad registrada, sugiriendo usar "Retirar" en su lugar; la cuenta sigue existiendo intacta, no queda nada a medias.' },
          { paso: 'Busca esa misma opción sobre tu propia fila.', resultadoEsperado: 'No aparece — no te puedes eliminar a ti mismo.' },
        ],
      },
      {
        titulo: 'Restablecer la contraseña de un usuario',
        rolNecesario: 'admin_th',
        pasos: [
          { paso: 'En Usuarios y roles, presiona "Restablecer contraseña" en la fila de un usuario de prueba.', resultadoEsperado: 'Aparece una contraseña generada automáticamente, editable, con botones "Generar otra", "Guardar" y "Cancelar".' },
          { paso: 'Presiona "Generar otra" un par de veces y luego "Guardar".', resultadoEsperado: 'Muestra la contraseña guardada en un recuadro con botón "Copiar", con el aviso de que no se volverá a mostrar.' },
          { paso: 'Cierra ese aviso con "Listo" e inicia sesión con esa cuenta usando la contraseña nueva.', resultadoEsperado: 'Entra sin problema — la contraseña anterior ya no funciona.' },
        ],
      },
      {
        titulo: 'Importar el perfil de un cargo desde Excel',
        rolNecesario: 'admin_th',
        pasos: [
          { paso: 'Entra a Cargos y perfiles → "Importar desde Excel" y sube un archivo con el formato correcto.', resultadoEsperado: 'Muestra una vista previa con conteos y advertencias (si algo no se pudo leer).' },
          { paso: 'Confirma la importación.', resultadoEsperado: 'El cargo queda creado o actualizado, visible en el detalle del cargo.' },
        ],
      },
      {
        titulo: 'Detalle de un cargo y su plan de inducción específico',
        rolNecesario: 'admin_th',
        pasos: [
          { paso: 'Entra a Cargos y perfiles y haz clic en el nombre de un cargo con perfil ya importado.', resultadoEsperado: 'Abre el detalle con formación, habilidades, funciones, riesgos, EPP y exámenes médicos requeridos.' },
          { paso: 'Revisa el "Plan de inducción específico" ya generado.', resultadoEsperado: 'Trae puntos derivados automáticamente del perfil (funciones, riesgos, EPP, exámenes, formación mínima).' },
          { paso: 'Agrega un punto manual al plan de inducción de ese cargo y guarda.', resultadoEsperado: 'Queda agregado a la lista, y de ahí en adelante se asigna a cualquier persona que ingrese o cambie a ese cargo.' },
        ],
      },
      {
        titulo: 'Cargar la Guía del Flow en PDF de una persona',
        rolNecesario: 'admin_th',
        pasos: [
          { paso: 'Entra a Guías de colaboradores, elige una persona y sube su PDF de Guía del Flow.', resultadoEsperado: 'Aparece en la lista de "Guías ya cargadas" con la fecha de hoy.' },
          { paso: 'Entra a la ficha de esa persona → Guía del Flow.', resultadoEsperado: 'El link "Ver PDF" funciona y abre el documento cargado.' },
          { paso: 'Inicia sesión como esa persona y entra a Mi Perfil.', resultadoEsperado: 'También puede ver ahí su propia Guía del Flow, sin necesitar que nadie se la reenvíe.' },
        ],
      },
      {
        titulo: 'Editar el organigrama',
        rolNecesario: 'admin_th',
        pasos: [{ paso: 'Cambia el líder directo de una persona.', resultadoEsperado: 'Se refleja de inmediato en Colaboradores → Organigrama y en quién acompaña a quién.' }],
      },
      {
        titulo: 'Editar la identidad organizacional',
        rolNecesario: 'admin_th',
        pasos: [
          { paso: 'Edita el propósito superior y guarda.', resultadoEsperado: 'Se guarda y es visible para todos los roles.' },
          { paso: 'Agrega un valor a la lista.', resultadoEsperado: 'Aparece en la lista de valores.' },
        ],
      },
      {
        titulo: 'Editar ponderaciones antes de abrir un ciclo',
        rolNecesario: 'admin_th',
        pasos: [
          { paso: 'Con un ciclo en estado "planeado", entra a Configuración y cambia los pesos.', resultadoEsperado: 'Guarda correctamente si los porcentajes suman 100% en cada grupo.' },
          { paso: 'Abre ese ciclo y vuelve a Configuración.', resultadoEsperado: 'Ya no aparece ese ciclo como editable (mensaje de "no hay ningún ciclo planeado" si era el único).' },
        ],
      },
      {
        titulo: 'Alza salarial masiva',
        rolNecesario: 'admin_th',
        pasos: [
          { paso: 'Entra a Salarios, elige "igual a" e ingresa el salario actual de un colaborador de prueba, con acción "Fijar el salario en un nuevo valor" y un valor más alto.', resultadoEsperado: 'Al presionar "Ver a quiénes afecta" aparece ese colaborador en la tabla, con su salario actual y el nuevo.' },
          { paso: 'Presiona "Aplicar a N colaboradores".', resultadoEsperado: 'Muestra el mensaje de éxito con la cantidad actualizada; en la ficha de ese colaborador (Historial) aparece un nuevo movimiento "Aumento salarial" con el detalle del cambio.' },
          { paso: 'Repite el filtro con la acción "Subir un porcentaje" sobre un grupo con salarios distintos entre sí.', resultadoEsperado: 'En la vista previa, cada persona recibe un salario nuevo distinto (el mismo porcentaje aplicado sobre su propio salario actual, no un valor único para todos).' },
          { paso: 'Usa un filtro que no coincida con nadie (ej. un monto que nadie gana).', resultadoEsperado: 'Muestra "Nadie cumple ese filtro — nada para actualizar" y no hay botón para aplicar.' },
        ],
      },
    ],
  },
  {
    modulo: 'Espiral de Crecimiento — ciclo completo de Encuentros de Crecimiento',
    escenarios: [
      {
        titulo: 'Abrir un ciclo y generar Encuentros de Crecimiento',
        rolNecesario: 'admin_th',
        pasos: [
          { paso: 'Entra a Ciclos de Crecimiento → "Abrir nuevo ciclo".', resultadoEsperado: 'Formulario pide nombre y fechas.' },
          { paso: 'Completa y guarda.', resultadoEsperado: 'El nuevo ciclo aparece en la lista, en estado "Planeado" o "Abierto".' },
          { paso: 'Entra al detalle del ciclo y usa el panel de generación de Encuentros de Crecimiento para un líder con equipo.', resultadoEsperado: 'Se crean las tareas de autoevaluación, líder, pares y colaboradores a cargo para ese equipo.' },
        ],
      },
      {
        titulo: 'Responder un Encuentro de Crecimiento (Hacer/Deber)',
        rolNecesario: 'Cualquier rol con una tarea de valoración asignada',
        pasos: [
          { paso: 'Entra al Encuentro de Crecimiento pendiente (desde el detalle del ciclo o la notificación).', resultadoEsperado: 'Aparece la lista de ítems del bloque Hacer y Deber.' },
          { paso: 'Valora un ítem y escribe una observación.', resultadoEsperado: 'Se guarda de inmediato, sin botón de "enviar todo".' },
          { paso: 'Vuelve al detalle del ciclo.', resultadoEsperado: 'El % de avance de ese Encuentro de Crecimiento aumentó.' },
        ],
      },
      {
        titulo: 'Brief y Acuerdo de crecimiento',
        rolNecesario: 'Líder directo y admin_th',
        pasos: [
          { paso: 'Desde el detalle del ciclo, entra al Brief de un colaborador de tu equipo.', resultadoEsperado: 'Muestra el resultado de Hacer/Deber y un formulario editable.' },
          { paso: 'Completa y guarda el Brief.', resultadoEsperado: 'Queda guardado; el colaborador en crecimiento NO puede verlo.' },
          { paso: 'Entra al Acuerdo de crecimiento de la misma persona, completa los compromisos y firma.', resultadoEsperado: 'La casilla de firma queda marcada con la fecha.' },
          { paso: 'Inicia sesión como ese colaborador y firma su parte del acuerdo.', resultadoEsperado: 'Ambas firmas quedan registradas.' },
        ],
      },
      {
        titulo: 'Tablero kanban de Planes de Desarrollo Individual (PDI)',
        rolNecesario: 'Colaborador (arrastra lo propio) y admin_th/líder (arrastran lo de su alcance)',
        pasos: [
          { paso: 'Entra a Planes de Desarrollo Individual con un PDI existente en la columna "Pendiente".', resultadoEsperado: 'Ves 4 columnas fijas: Pendiente, En curso, Cumplido, Vencido, cada una con su contador.' },
          { paso: 'Arrastra esa tarjeta a la columna "Cumplido".', resultadoEsperado: 'La tarjeta queda en la nueva columna y se guarda la fecha de cumplimiento automáticamente (sin recargar la página).' },
          { paso: 'Arrastra una tarjeta con fecha de compromiso vencida a una columna distinta de "Cumplido".', resultadoEsperado: 'La fecha se muestra resaltada en rojo en la tarjeta.' },
          { paso: 'Inicia sesión como gerencia y entra a PDI.', resultadoEsperado: 'Ve el tablero pero no puede arrastrar tarjetas (solo lectura).' },
        ],
      },
      {
        titulo: 'Motor automático: brecha detectada genera PDI y formación solo',
        rolNecesario: 'admin_th (configurar) y los acompañantes de un Encuentro de Crecimiento (valorar)',
        pasos: [
          { paso: 'En Administración → Configuración, asigna al menos un curso a "Cursos para brecha de Hacer" (o de Deber).', resultadoEsperado: 'Queda guardado en la lista de esa dimensión.' },
          { paso: 'Completa todas las valoraciones pendientes de un Encuentro de Crecimiento (autoevaluación, líder, pares y colaboradores a cargo) hasta llegar a 100% de avance, dejando notas bajas en los ítems de Hacer o Deber.', resultadoEsperado: 'Al guardar la última respuesta, el % de avance del Encuentro de Crecimiento llega a 100%.' },
          { paso: 'Entra a Espiral de Crecimiento → Planes de Desarrollo Individual (PDI) de esa persona.', resultadoEsperado: 'Aparece un nuevo PDI con la insignia "Automático", origen Hacer o Deber (según cuál quedó en semáforo bajo).' },
          { paso: 'Entra a la formación de esa persona en Nexa.', resultadoEsperado: 'Aparece asignado el curso configurado en el paso 1, sin que nadie lo haya asignado a mano.' },
          { paso: 'Corrige una respuesta del mismo Encuentro de Crecimiento y deja que se recalcule.', resultadoEsperado: 'No se crea un segundo PDI automático duplicado para la misma persona, ciclo y dimensión.' },
        ],
      },
    ],
  },
  {
    modulo: 'Espiral de Crecimiento — ficha del colaborador',
    escenarios: [
      {
        titulo: 'Verificación de Saber',
        rolNecesario: 'admin_th o líder directo',
        pasos: [
          { paso: 'Entra a la ficha de un colaborador → Verificación de Saber.', resultadoEsperado: 'Ve los 4 bloques (formación, habilidades, certificaciones, experiencia) con lo que exige el cargo.' },
          { paso: 'Marca un ítem como "Cumple".', resultadoEsperado: 'Se guarda y el % de cumplimiento de la ficha se actualiza.' },
        ],
      },
      {
        titulo: 'Guía del Flow',
        rolNecesario: 'admin_th para crear/valorar; colaborador para comentar',
        pasos: [
          { paso: 'Como admin_th, crea una nueva aplicación de Guía del Flow para una persona sin registro previo.', resultadoEsperado: 'Aparecen los 4 bloques de aspectos, vacíos.' },
          { paso: 'Sube el PDF de la guía y valora un aspecto (1-5).', resultadoEsperado: 'El PDF queda accesible con un link temporal; el puntaje se guarda.' },
          { paso: 'Inicia sesión como esa persona y escribe un comentario en un aspecto.', resultadoEsperado: 'El comentario se guarda asociado a ese aspecto.' },
        ],
      },
      {
        titulo: 'Historial y entrevista de salida',
        rolNecesario: 'admin_th',
        pasos: [
          { paso: 'Entra al historial de un colaborador y registra un movimiento (ej. cambio de cargo).', resultadoEsperado: 'Aparece en la línea de tiempo con fecha y descripción.' },
          { paso: 'Diligencia la entrevista de salida.', resultadoEsperado: 'Se guarda; solo admin_th puede verla (ni el líder ni el colaborador).' },
        ],
      },
      {
        titulo: 'Mis fechas personales (aniversario de bodas, baby shower, embarazo)',
        rolNecesario: 'Colaborador (para cargar lo propio) y líder directo (para confirmar qué ve y qué no)',
        pasos: [
          { paso: 'Entra a Mi Perfil → "Mis fechas personales" y guarda una fecha de matrimonio y una de baby shower.', resultadoEsperado: 'Se guardan; aparece confirmación de "Guardado".' },
          { paso: 'Inicia sesión como el líder directo de esa persona y entra a Alertas.', resultadoEsperado: 'Aparecen las alertas de "Aniversario de bodas" y "Baby shower" de esa persona, con su fecha.' },
          { paso: 'Vuelve a Mi Perfil como el colaborador, marca "Estoy en embarazo" y guarda una fecha probable de parto.', resultadoEsperado: 'Se guarda correctamente.' },
          { paso: 'Inicia sesión otra vez como el líder directo y revisa Alertas y la ficha de esa persona.', resultadoEsperado: 'NO aparece ninguna alerta ni dato de embarazo — ese dato es privado, solo lo ve la propia persona y admin_th.' },
        ],
      },
    ],
  },
  {
    modulo: 'Espiral de Crecimiento — Inducción y Documentos',
    escenarios: [
      {
        titulo: 'Plan de inducción al registrar un ingreso',
        rolNecesario: 'admin_th',
        pasos: [
          { paso: 'Registra el ingreso (o cambio de cargo) de un colaborador con un cargo que ya tiene perfil cargado.', resultadoEsperado: 'Se genera automáticamente el checklist de inducción: puntos comunes + puntos específicos del cargo.' },
          { paso: 'Entra a la ficha de esa persona → Inducción.', resultadoEsperado: 'Ve la lista completa con la barra de avance en 0%.' },
        ],
      },
      {
        titulo: 'Marcar un punto de inducción como cumplido',
        rolNecesario: 'Líder directo o admin_th',
        pasos: [
          { paso: 'Marca un punto del checklist de inducción de un colaborador de su equipo.', resultadoEsperado: 'Queda marcado con quién lo marcó y la fecha; la barra de avance sube.' },
          { paso: 'Inicia sesión como un líder que NO es el directo de esa persona e intenta lo mismo.', resultadoEsperado: 'No puede ver ni marcar el checklist de esa persona.' },
        ],
      },
      {
        titulo: 'Cargar hoja de vida y contrato, y generar el certificado laboral',
        rolNecesario: 'admin_th',
        pasos: [
          { paso: 'Entra a la ficha de un colaborador → Documentos y sube el archivo de la hoja de vida.', resultadoEsperado: 'Queda disponible para descargar; se puede reemplazar por otro archivo después.' },
          { paso: 'Guarda el contrato (archivo) junto con el salario de la persona.', resultadoEsperado: 'Queda guardado; se puede editar después sin perder el histórico de otros documentos.' },
          { paso: 'Genera el certificado laboral sin marcar "Incluir el salario".', resultadoEsperado: 'Descarga un PDF con el logo de la empresa, cargo y fecha de ingreso, sin el dato de salario.' },
          { paso: 'Genera el certificado laboral marcando "Incluir el salario".', resultadoEsperado: 'El PDF trae el salario tal como quedó registrado en el contrato.' },
          { paso: 'Inicia sesión como el líder directo de esa persona y entra a su ficha.', resultadoEsperado: 'No aparece la sección de Documentos (solo admin_th y la propia persona la ven).' },
        ],
      },
      {
        titulo: 'Editar los datos de la empresa y confirmarlos en un certificado nuevo',
        rolNecesario: 'admin_th',
        pasos: [
          { paso: 'Entra a Administración → Configuración → "Datos de la empresa" y cambia, por ejemplo, el nombre de quien firma.', resultadoEsperado: 'Guarda correctamente.' },
          { paso: 'Genera un certificado laboral nuevo de cualquier colaborador.', resultadoEsperado: 'El PDF ya muestra el nuevo dato guardado.' },
        ],
      },
      {
        titulo: 'Registrar afiliaciones (EPS, ARL, AFP, caja de compensación)',
        rolNecesario: 'admin_th',
        pasos: [
          { paso: 'Entra a la ficha de un colaborador → Documentos → sección "Afiliaciones" y completa los 4 campos.', resultadoEsperado: 'Guarda correctamente y los valores quedan visibles al recargar la página.' },
          { paso: 'Inicia sesión como esa persona y entra a su propia ficha → Documentos.', resultadoEsperado: 'Ve sus afiliaciones, pero de solo lectura (sin campos editables).' },
          { paso: 'Inicia sesión como el líder directo de esa persona y entra a su ficha.', resultadoEsperado: 'No aparece la sección de Documentos en absoluto (mismo nivel de restricción que el contrato).' },
        ],
      },
    ],
  },
  {
    modulo: 'Espiral de Crecimiento — Historial, incapacidades y desvinculación',
    escenarios: [
      {
        titulo: 'Registrar una sanción con gravedad y soporte',
        rolNecesario: 'admin_th',
        pasos: [
          { paso: 'Entra a la ficha de un colaborador → Historial → "Agregar movimiento" → tipo "Sanción".', resultadoEsperado: 'Aparece un selector de gravedad (Leve/Grave/Gravísima) y un campo para adjuntar un archivo, además de la fecha y la descripción.' },
          { paso: 'Elige una gravedad, adjunta un PDF de prueba como soporte, y guarda.', resultadoEsperado: 'La sanción aparece en la línea de tiempo con su badge de gravedad y un ícono de clip para ver el soporte.' },
          { paso: 'Haz clic en el ícono de clip.', resultadoEsperado: 'Abre el archivo adjunto en una pestaña nueva.' },
          { paso: 'Inicia sesión como el líder directo de esa persona y entra al Historial.', resultadoEsperado: 'Ve la sanción (gravedad incluida) y puede abrir el soporte — el Historial completo es visible para el líder del equipo, no solo para admin_th.' },
        ],
      },
      {
        titulo: 'Registrar y consultar una incapacidad',
        rolNecesario: 'admin_th y, por separado, la propia persona',
        pasos: [
          { paso: 'Entra a la ficha de un colaborador → Incapacidades → "Registrar incapacidad".', resultadoEsperado: 'Pide tipo, fecha de inicio, fecha de fin, entidad que certifica (opcional) y soporte (opcional).' },
          { paso: 'Completa con una fecha de fin anterior a la de inicio e intenta guardar.', resultadoEsperado: 'Muestra un error y no guarda — la fecha de fin no puede ser antes que la de inicio.' },
          { paso: 'Corrige las fechas y guarda.', resultadoEsperado: 'Aparece en la lista con el tipo, el rango de fechas y la cantidad de días calculada sola.' },
          { paso: 'Inicia sesión como esa persona y entra a Mi Perfil.', resultadoEsperado: 'Ve la tarjeta "Mis incapacidades" con el registro, de solo lectura (sin poder editarlo ni borrarlo).' },
          { paso: 'Inicia sesión como el líder directo de esa persona.', resultadoEsperado: 'No tiene ninguna forma de ver esa incapacidad — ni en la ficha ni en ningún otro lugar (dato de salud, mismo nivel que Documentos).' },
        ],
      },
      {
        titulo: 'Registrar la salida de alguien (renuncia o despido) retira su cuenta en el mismo paso',
        rolNecesario: 'admin_th',
        pasos: [
          { paso: 'Elige un colaborador de prueba que tenga cuenta de acceso activa. Entra a su ficha → Historial → "Agregar movimiento" → tipo "Salida".', resultadoEsperado: 'Aparece un selector de motivo (renuncia voluntaria, despido, fin de contrato, mutuo acuerdo, jubilación, otro) — es obligatorio.' },
          { paso: 'Intenta guardar sin elegir motivo.', resultadoEsperado: 'Muestra "Elige el motivo de la salida" y no guarda.' },
          { paso: 'Elige un motivo (ej. "Renuncia voluntaria") y guarda.', resultadoEsperado: 'El movimiento aparece en la línea de tiempo.' },
          { paso: 'Vuelve a la ficha principal de esa persona.', resultadoEsperado: 'El estado ya muestra "Inactivo".' },
          { paso: 'Entra a Administración → Usuarios y roles y busca la cuenta de esa persona.', resultadoEsperado: 'Ya aparece como "Inactivo" — se retiró sola, sin que nadie tuviera que ir a presionar "Retirar" aparte.' },
          { paso: 'Intenta iniciar sesión con esa cuenta.', resultadoEsperado: 'No puede entrar — igual que cualquier cuenta retirada.' },
          { paso: 'De vuelta en la ficha, diligencia también la Entrevista de salida (fecha, motivo, comentarios).', resultadoEsperado: 'Se guarda por separado — registrar el movimiento "Salida" y diligenciar la Entrevista de salida son dos pasos independientes, ninguno reemplaza al otro.' },
        ],
      },
    ],
  },
  {
    modulo: 'Espiral de Crecimiento — Organigrama e Indicadores',
    escenarios: [
      {
        titulo: 'Consultar el organigrama en árbol',
        rolNecesario: 'admin_th, líder o gerencia',
        pasos: [
          { paso: 'Entra a Espiral de Crecimiento → Organigrama.', resultadoEsperado: 'Se ve la jerarquía completa en forma de árbol, empezando por quienes no tienen líder (nivel 1).' },
          { paso: 'Ubica a una persona con varios colaboradores a cargo.', resultadoEsperado: 'Aparecen desplegados debajo de ella, coincidiendo con lo configurado en Administración → Editar organigrama.' },
          { paso: 'Inicia sesión como colaborador y busca esta opción en el menú.', resultadoEsperado: 'No aparece — ese rol no tiene acceso a la vista de organigrama.' },
        ],
      },
      {
        titulo: 'Revisar el panorama de Indicadores',
        rolNecesario: 'admin_th, líder o gerencia',
        pasos: [
          { paso: 'Entra a Espiral de Crecimiento → Indicadores.', resultadoEsperado: 'Carga el índice general de Hacer/Deber, cumplimiento de Saber y alineación talento-rol, según tu alcance (equipo o toda la empresa).' },
          { paso: 'Revisa el mapa de equipos.', resultadoEsperado: 'Compara el promedio de Hacer, Deber y Saber de cada equipo, agrupado por líder.' },
          { paso: 'Baja hasta "Rotación de personal".', resultadoEsperado: 'Ves la tasa de rotación anual, la voluntaria, el conteo de salidas y el gráfico de tendencia mensual (12 meses).' },
          { paso: 'Registra la salida de un colaborador de prueba con antigüedad de más de 12 meses (Historial → "Agregar movimiento" → "Salida"), con motivo "Renuncia voluntaria".', resultadoEsperado: 'Al volver a Indicadores, la tasa de rotación anual y la voluntaria suben, y el mes correspondiente aparece en el gráfico de tendencia.' },
          { paso: 'Inicia sesión como líder y entra a Indicadores.', resultadoEsperado: 'Solo ve los datos de su propio equipo, no de toda la empresa.' },
        ],
      },
    ],
  },
  {
    modulo: 'Nexa — Clima Organizacional',
    escenarios: [
      {
        titulo: 'Abrir una ronda y responder de forma anónima',
        rolNecesario: 'admin_th (abre la ronda) y cualquier colaborador (responde)',
        pasos: [
          { paso: 'Como admin_th, entra a Nexa → Clima Organizacional y presiona "Abrir nueva ronda de clima", con un nombre de prueba.', resultadoEsperado: 'Aparece "Ronda abierta: [nombre]" con el botón "Cerrar ronda".' },
          { paso: 'Intenta abrir una segunda ronda mientras la primera sigue abierta.', resultadoEsperado: 'El botón para abrir ya no aparece (solo se ve la ronda abierta) — no se puede tener dos rondas abiertas a la vez.' },
          { paso: 'Inicia sesión como un colaborador con ficha propia y entra a Clima Organizacional.', resultadoEsperado: 'Ve la sección "Tu opinión" con el formulario: eNPS (0-10) y 6 afirmaciones (1-5).' },
          { paso: 'Intenta enviar el formulario dejando alguna pregunta sin responder.', resultadoEsperado: 'El botón "Enviar respuesta" permanece deshabilitado hasta completar todas las preguntas obligatorias (el comentario es el único campo opcional).' },
          { paso: 'Completa todo, agrega un comentario, y envía.', resultadoEsperado: 'Muestra el mensaje de agradecimiento; si recargas la página, ya no te vuelve a mostrar el formulario, sino el aviso de que ya respondiste.' },
          { paso: 'Intenta responder la misma ronda una segunda vez (por ejemplo, llamando de nuevo a enviar sin recargar).', resultadoEsperado: 'Muestra "Ya respondiste esta ronda." y no se guarda una segunda respuesta.' },
        ],
      },
      {
        titulo: 'El umbral de anonimato oculta resultados con pocas respuestas',
        rolNecesario: 'admin_th y al menos 5 colaboradores de prueba',
        pasos: [
          { paso: 'Con una ronda abierta y menos de 5 respuestas registradas, entra como admin_th o gerencia a "Resultados por ronda".', resultadoEsperado: 'La fila de esa ronda muestra "— (menos de 5 respuestas)" en eNPS y "—" en índice de clima, aunque el conteo de respuestas si sea visible.' },
          { paso: 'Haz que 5 colaboradores distintos respondan esa ronda.', resultadoEsperado: 'Al llegar a la quinta respuesta, eNPS e índice de clima general ya muestran un número.' },
          { paso: 'Inicia sesión como el líder de un equipo con menos de 5 respuestas propias en esa ronda y entra a "Clima de tu equipo".', resultadoEsperado: 'Mismo comportamiento: "— (menos de 5 respuestas)" hasta que su equipo llegue a 5.' },
        ],
      },
      {
        titulo: 'Los comentarios de texto libre son exclusivos de admin_th',
        rolNecesario: 'admin_th, gerencia y líder',
        pasos: [
          { paso: 'Con al menos una respuesta que incluya comentario, entra como admin_th a Clima Organizacional.', resultadoEsperado: 'La sección "Comentarios" (al final de la pantalla) muestra ese texto, sin ningún nombre ni referencia a quién lo escribió.' },
          { paso: 'Inicia sesión como gerencia y entra a la misma pantalla.', resultadoEsperado: 'Ve "Resultados por ronda" (los números), pero la sección "Comentarios" no aparece en absoluto.' },
          { paso: 'Inicia sesión como el líder de esa persona y entra a la misma pantalla.', resultadoEsperado: 'Ve "Clima de tu equipo" (los números de su equipo), pero tampoco ve ninguna sección de comentarios.' },
        ],
      },
      {
        titulo: 'Configurar el umbral de anonimato',
        rolNecesario: 'admin_th',
        pasos: [
          { paso: 'Entra a Administración → Configuración → "Umbral de anonimato de Clima Organizacional" y cambia "Cantidad fija" de 5 a 2, guarda.', resultadoEsperado: 'Guarda correctamente con el aviso "Guardado".' },
          { paso: 'Con una ronda que ya tenga 2 respuestas (menos de 5), entra como admin_th a "Resultados por ronda".', resultadoEsperado: 'Esa ronda ya muestra un número de eNPS e índice de clima, en vez de "—" — el umbral nuevo (2) ya se aplicó.' },
          { paso: 'Cambia la configuración a "Porcentaje de la planta" con un valor alto (ej. 50%), guarda, y vuelve a "Resultados por ronda".', resultadoEsperado: 'Si el número de respuestas de esa ronda queda por debajo del 50% de la planta activa, el resultado vuelve a mostrar "— (menos de N respuestas)", con el N recalculado según el tamaño real de la empresa.' },
          { paso: 'Deja la configuración de nuevo en "Cantidad fija" = 5.', resultadoEsperado: 'Vuelve al comportamiento por defecto original.' },
        ],
      },
      {
        titulo: 'Editar el texto de las preguntas',
        rolNecesario: 'admin_th',
        pasos: [
          { paso: 'Entra a Administración → Configuración → "Preguntas de Clima Organizacional" y cambia el texto de la afirmación de "reconocimiento".', resultadoEsperado: 'Guarda correctamente con el aviso "Guardado".' },
          { paso: 'Con una ronda abierta, entra a Nexa → Clima Organizacional (sin haber respondido esa ronda).', resultadoEsperado: 'El formulario muestra el nuevo texto para esa afirmación, en vez del texto por defecto.' },
          { paso: 'Vuelve a Configuración y borra el texto de esa misma pregunta, dejando el campo vacío, y guarda.', resultadoEsperado: 'El formulario de Clima Organizacional vuelve a mostrar el texto por defecto de esa pregunta.' },
        ],
      },
      {
        titulo: 'Cerrar una ronda',
        rolNecesario: 'admin_th',
        pasos: [
          { paso: 'Con una ronda abierta, presiona "Cerrar ronda".', resultadoEsperado: 'Desaparece el aviso de "Ronda abierta" y vuelve a aparecer el botón "Abrir nueva ronda de clima".' },
          { paso: 'Inicia sesión como un colaborador que no había respondido esa ronda y entra a Clima Organizacional.', resultadoEsperado: 'Ya no puede responderla — la sección "Tu opinión" indica que no hay ninguna ronda abierta en este momento.' },
          { paso: 'Como admin_th, revisa "Resultados por ronda".', resultadoEsperado: 'La ronda cerrada sigue apareciendo en la tabla, con su estado en "cerrada" y sus resultados fijos.' },
        ],
      },
    ],
  },
  {
    modulo: 'Mi Perfil, apodo y Mis fechas especiales',
    escenarios: [
      {
        titulo: 'Fijar tu apodo y verlo reflejado en la app',
        rolNecesario: 'Cualquier usuario con ficha de colaborador',
        pasos: [
          { paso: 'Entra a Mi Perfil → "Cómo te gusta que te llamen" y escribe un apodo (ej. "Vale" en vez de "Valentina").', resultadoEsperado: 'Guarda y muestra confirmación.' },
          { paso: 'Ve a Inicio.', resultadoEsperado: 'El saludo usa tu apodo ("Hola, Vale") en vez de tu primer nombre legal.' },
          { paso: 'Revisa la esquina superior derecha del encabezado.', resultadoEsperado: 'También muestra tu apodo ahí.' },
          { paso: 'Borra el apodo y guarda vacío.', resultadoEsperado: 'El saludo y el encabezado vuelven a mostrar tu primer nombre legal.' },
        ],
      },
      {
        titulo: 'Cada persona administra sus propias fechas especiales',
        rolNecesario: 'Cualquier usuario con ficha de colaborador',
        pasos: [
          { paso: 'Entra a Mi Perfil → "Mis fechas especiales" y agrega una (ej. "Día de mi profesión" con una fecha).', resultadoEsperado: 'Aparece en la lista de inmediato.' },
          { paso: 'Agrega una segunda fecha especial distinta.', resultadoEsperado: 'Ambas quedan en la lista, ordenadas por fecha.' },
          { paso: 'Elimina una de las dos.', resultadoEsperado: 'Desaparece de la lista al confirmar.' },
        ],
      },
      {
        titulo: 'admin_th y el líder directo registran fechas especiales del equipo',
        rolNecesario: 'admin_th y, por separado, un líder',
        pasos: [
          { paso: 'Como admin_th, entra a la ficha de cualquier colaborador de la empresa → "Fechas especiales" y agrega una.', resultadoEsperado: 'Se guarda y aparece en la lista.' },
          { paso: 'Inicia sesión como el líder directo de esa persona y entra a la misma ficha.', resultadoEsperado: 'También ve la pestaña "Fechas especiales" y puede agregar/eliminar fechas de esa persona.' },
        ],
      },
      {
        titulo: 'Un líder no puede tocar las fechas especiales de alguien fuera de su equipo',
        rolNecesario: 'Líder',
        pasos: [
          { paso: 'Inicia sesión como líder y entra a la ficha de alguien que NO es de su equipo directo.', resultadoEsperado: 'No aparece la pestaña "Fechas especiales" (igual que el resto de secciones restringidas de esa ficha).' },
          { paso: 'Si conoces la URL directa de fechas especiales de esa persona (copiándola de otra ficha y cambiando el id) e intentas entrar así.', resultadoEsperado: 'No carga ni permite agregar nada — queda bloqueado igual que por el menú.' },
        ],
      },
      {
        titulo: 'La fecha especial aparece en Alertas con el próximo aniversario',
        rolNecesario: 'Cualquier usuario con una fecha especial registrada',
        pasos: [
          { paso: 'Con una fecha especial ya guardada (propia o de tu equipo), entra a Alertas.', resultadoEsperado: 'Aparece con el badge "Fecha especial" y la fecha del próximo aniversario.' },
          { paso: 'Edita esa fecha (cámbiala) desde donde la registraste originalmente.', resultadoEsperado: 'La alerta se actualiza con la nueva fecha, sin quedar una alerta vieja duplicada.' },
          { paso: 'Elimina la fecha especial.', resultadoEsperado: 'La alerta correspondiente desaparece también de Alertas.' },
        ],
      },
    ],
  },
  {
    modulo: 'Nexa — Feed corporativo',
    escenarios: [
      {
        titulo: 'Publicar con cada tipo de adjunto',
        rolNecesario: 'admin_th o líder',
        pasos: [
          { paso: 'Publica un comunicado sin adjunto.', resultadoEsperado: 'Aparece en el feed solo con texto.' },
          { paso: 'Publica uno con un documento adjunto (PDF o imagen).', resultadoEsperado: 'Aparece como tarjeta con nombre, tamaño y botón de descarga funcional.' },
          { paso: 'Publica uno con un link externo y usa "Vista previa".', resultadoEsperado: 'Trae título/imagen/descripción del sitio (si el sitio los tiene) antes de publicar.' },
          { paso: 'Publica uno con un video o imagen destacada.', resultadoEsperado: 'Se reproduce/visualiza directo en el feed, sin necesitar descarga.' },
          { paso: 'Como admin_th, marca una publicación como "Fijar arriba del feed".', resultadoEsperado: 'Queda siempre primera en la lista.' },
        ],
      },
      {
        titulo: 'Reaccionar a una publicación',
        rolNecesario: 'Cualquier usuario',
        pasos: [
          { paso: 'Presiona "Me gusta" en una publicación del feed.', resultadoEsperado: 'Sube el contador y el botón queda marcado como activo.' },
          { paso: 'Vuelve a presionarlo.', resultadoEsperado: 'Se quita la reacción y baja el contador.' },
        ],
      },
    ],
  },
  {
    modulo: 'Nexa — Formación, reconocimientos, simulacros y directorio',
    escenarios: [
      {
        titulo: 'Crear y asignar un curso',
        rolNecesario: 'admin_th',
        pasos: [
          { paso: 'Crea un curso nuevo con categoría, duración y puntos.', resultadoEsperado: 'Aparece en el catálogo.' },
          { paso: 'Asígnalo a un cargo completo.', resultadoEsperado: 'Queda vinculado a ese cargo con su nivel de riesgo.' },
          { paso: 'Asígnalo directamente a una persona.', resultadoEsperado: 'Aparece en "Mi formación" de esa persona.' },
        ],
      },
      {
        titulo: 'Marcar avance de un curso (sin quiz)',
        rolNecesario: 'Colaborador',
        pasos: [
          { paso: 'Entra a Formación y SST y ajusta el control de avance de un curso asignado que NO tenga quiz configurado.', resultadoEsperado: 'Guarda el % y el estado pasa a "en curso".' },
          { paso: 'Presiona "Marcar como completado".', resultadoEsperado: 'Queda en 100% y estado "completado"; ya no se puede seguir editando.' },
        ],
      },
      {
        titulo: 'Armar y tomar el quiz de un curso',
        rolNecesario: 'admin_th (arma el quiz) y colaborador (lo toma)',
        pasos: [
          { paso: 'Como admin_th, entra al catálogo de Formación y SST y presiona "Gestionar" en un curso.', resultadoEsperado: 'Abre la pantalla del quiz de ese curso, vacía si es la primera vez.' },
          { paso: 'Define el % mínimo de aprobación y agrega 2 o 3 preguntas de opción múltiple, marcando una opción correcta en cada una.', resultadoEsperado: 'Cada pregunta aparece en la lista con la opción correcta señalada con un ícono.' },
          { paso: 'Asigna ese curso a un colaborador (si no lo tenía ya) e inicia sesión como esa persona.', resultadoEsperado: 'En su tarjeta del curso aparece el botón "Tomar el quiz" en vez de la barra de avance.' },
          { paso: 'Responde el quiz dejando alguna respuesta incorrecta a propósito, por debajo del % mínimo, y envíalo.', resultadoEsperado: 'Muestra el puntaje obtenido y el mensaje de que no se alcanzó el mínimo, con opción de "Reintentar".' },
          { paso: 'Reintenta el quiz respondiendo todo correctamente.', resultadoEsperado: 'Muestra el puntaje en 100% (o por encima del mínimo) y el curso pasa a estado "completado" automáticamente.' },
        ],
      },
      {
        titulo: 'Otorgar un reconocimiento',
        rolNecesario: 'admin_th o líder',
        pasos: [
          { paso: 'Otorga un reconocimiento con puntos y motivo a una persona.', resultadoEsperado: 'Aparece en el muro de reconocimientos y sube en el ranking de puntos.' },
        ],
      },
      {
        titulo: 'Registrar un simulacro',
        rolNecesario: 'admin_th',
        pasos: [
          { paso: 'Crea un nuevo simulacro con fecha y participantes esperados.', resultadoEsperado: 'Aparece en el listado.' },
          { paso: 'Entra al detalle y marca asistencia + valoración de una persona.', resultadoEsperado: 'Queda guardado por fila.' },
        ],
      },
      {
        titulo: 'Administrar el directorio de aliados',
        rolNecesario: 'admin_th',
        pasos: [
          { paso: 'Agrega un aliado (ARL, asesor SST, etc.) con contacto.', resultadoEsperado: 'Aparece en la tabla, visible para toda la empresa.' },
          { paso: 'Elimínalo.', resultadoEsperado: 'Pide confirmación y luego desaparece de la lista.' },
        ],
      },
      {
        titulo: 'Mi cuaderno personal',
        rolNecesario: 'Cualquier usuario',
        pasos: [
          { paso: 'Entra a Nexa → Mi cuaderno y crea una nota.', resultadoEsperado: 'Queda guardada y visible en la lista.' },
          { paso: 'Edítala y luego elimínala.', resultadoEsperado: 'Los cambios y la eliminación se reflejan de inmediato.' },
          { paso: 'Inicia sesión como admin_th y busca alguna forma de ver las notas de otra persona.', resultadoEsperado: 'No existe ninguna pantalla que las muestre — son estrictamente privadas.' },
        ],
      },
    ],
  },
  {
    modulo: 'Nexa — Asistente IA y base documental',
    escenarios: [
      {
        titulo: 'Cargar un documento de política y que el asistente lo use',
        rolNecesario: 'admin_th (carga el documento) y cualquier usuario (le pregunta al asistente)',
        pasos: [
          { paso: 'Como admin_th, entra a Nexa → Asistente IA → "Base documental" y pega un texto corto de una política de ejemplo (ej. "Los EPP se entregan cada 6 meses").', resultadoEsperado: 'El documento aparece en la lista, activo, con la cantidad de caracteres cargados.' },
          { paso: 'Ve al chat del Asistente IA y pregunta algo directamente relacionado con ese texto.', resultadoEsperado: 'La respuesta incorpora la información del documento cargado (no una respuesta genérica).' },
          { paso: 'Desactiva ese documento (casilla Activo/Inactivo) y vuelve a hacer la misma pregunta.', resultadoEsperado: 'El asistente ya no usa ese documento como referencia.' },
          { paso: 'Pregunta algo normativo para lo que no hay ningún documento cargado ni activo.', resultadoEsperado: 'El asistente dice explícitamente que no tiene esa información, en vez de inventar una respuesta.' },
        ],
      },
    ],
  },
  {
    modulo: 'Progressive Web App (instalación en celular)',
    escenarios: [
      {
        titulo: 'Instalar la app desde el navegador del celular',
        rolNecesario: 'Cualquier usuario',
        pasos: [
          { paso: 'Abre la URL de la app en Chrome de un Android.', resultadoEsperado: 'El navegador ofrece la opción "Instalar app" o "Agregar a pantalla de inicio" (automática o desde el menú de tres puntos).' },
          { paso: 'Instálala y ábrela desde el ícono en la pantalla de inicio.', resultadoEsperado: 'Abre a pantalla completa, sin la barra de direcciones del navegador, con el isotipo de Flow, Nexus y Visión como ícono.' },
          { paso: 'Repite en un iPhone con Safari, usando el botón de compartir → "Agregar a pantalla de inicio".', resultadoEsperado: 'Mismo resultado: ícono propio, abre a pantalla completa.' },
          { paso: 'Con la app instalada, navega por un par de pantallas y luego apaga los datos/wifi del celular.', resultadoEsperado: 'La app no se queda mostrando información vieja como si fuera actual — al no haber conexión, las pantallas con datos no cargan (a propósito no se guarda información sensible en caché).' },
        ],
      },
    ],
  },
  {
    modulo: 'Alertas',
    escenarios: [
      {
        titulo: 'Resolver o descartar una alerta',
        rolNecesario: 'admin_th',
        pasos: [
          { paso: 'Entra a Alertas y marca una como resuelta.', resultadoEsperado: 'Cambia a "Marcada como resuelta" y sale de la lista de pendientes.' },
          { paso: 'Descarta otra alerta.', resultadoEsperado: 'Cambia a "Descartada" y sale de la lista de pendientes.' },
        ],
      },
      {
        titulo: 'Un colaborador solo ve sus propias alertas',
        rolNecesario: 'Colaborador',
        pasos: [{ paso: 'Entra a Alertas.', resultadoEsperado: 'Solo aparecen alertas de esa persona, no de toda la empresa.' }],
      },
    ],
  },
  {
    modulo: 'Informes',
    escenarios: [
      {
        titulo: 'Exportar cada informe',
        rolNecesario: 'admin_th, líder o gerencia según el informe',
        pasos: [
          { paso: 'Entra a cada uno de los 8 informes exportables (360°, PDI, SST, Brechas, Formación, Cultura y Engagement, Consolidado Gerencial, Histórico Comparativo).', resultadoEsperado: 'Cada uno carga con datos reales, sin errores.' },
          { paso: 'Presiona "Exportar PDF" en cada uno.', resultadoEsperado: 'Descarga un PDF legible con la información correspondiente.' },
          { paso: 'Presiona "Exportar Excel" en cada uno.', resultadoEsperado: 'Descarga un archivo .xlsx con la misma información en formato tabla.' },
        ],
      },
      {
        titulo: 'Los 4 informes nuevos respetan el alcance por rol',
        rolNecesario: 'admin_th, líder o gerencia según el informe',
        pasos: [
          { paso: 'Entra a Informes → Formación con cualquier rol.', resultadoEsperado: 'Carga sin error, con el estado de cursos según el alcance de ese rol (equipo o toda la empresa).' },
          { paso: 'Entra a Informes → Cultura y Engagement como admin_th, líder y gerencia.', resultadoEsperado: 'Los tres roles pueden verlo, con datos consistentes.' },
          { paso: 'Entra a Informes → Consolidado Gerencial como líder (no admin_th ni gerencia).', resultadoEsperado: 'No tiene acceso — es exclusivo de admin_th y gerencia.' },
          { paso: 'Entra a Informes → Histórico Comparativo.', resultadoEsperado: 'Muestra la comparación entre el ciclo actual y el anterior, igual que el widget de Inicio.' },
        ],
      },
      {
        titulo: 'Evidencia de auditoría: descarga y alcance',
        rolNecesario: 'auditor_externo y, por separado, admin_th',
        pasos: [
          { paso: 'Con datos ya cargados en Procesos y Sistemas de Gestión (al menos un proceso, un riesgo y un ítem de checklist con evidencia adjunta), inicia sesión como auditor_externo y entra a Informes → Evidencia de auditoría.', resultadoEsperado: 'Ve las 4 tarjetas de paquete (Completo, SST, ISO 9001, SARLAFT/SAGRILAFT) con los conteos reales.' },
          { paso: 'Descarga el "Paquete completo".', resultadoEsperado: 'Baja un archivo ZIP con un PDF de portada, un Excel de detalle y los archivos de evidencia adjuntos al checklist.' },
          { paso: 'Descarga el paquete "ISO 9001" únicamente.', resultadoEsperado: 'El ZIP trae solo lo correspondiente a ese marco normativo (menos contenido que el paquete completo).' },
          { paso: 'Inicia sesión como admin_th y repite la descarga.', resultadoEsperado: 'También puede acceder y descargar — no es exclusivo del auditor externo.' },
        ],
      },
    ],
  },
  {
    modulo: 'Procesos y Sistemas de Gestión',
    escenarios: [
      {
        titulo: 'Registrar un proceso documentado',
        rolNecesario: 'admin_th',
        pasos: [
          { paso: 'Entra a Procesos y Sistemas de Gestión y agrega un proceso con área, nombre, descripción y versión.', resultadoEsperado: 'Aparece en la lista de "Procesos documentados" con la fecha de actualización de hoy.' },
          { paso: 'Elimínalo.', resultadoEsperado: 'Desaparece de la lista de inmediato.' },
        ],
      },
      {
        titulo: 'Registrar un riesgo en la matriz',
        rolNecesario: 'admin_th',
        pasos: [
          { paso: 'Agrega un riesgo eligiendo marco normativo (ISO 9001 / SARLAFT-SAGRILAFT / PTEE / Interno), probabilidad, impacto y un control asociado.', resultadoEsperado: 'Aparece en la matriz con la etiqueta de marco normativo y el color según el impacto (verde/amarillo/rojo).' },
        ],
      },
      {
        titulo: 'Tablero de checklist de cumplimiento con evidencia adjunta',
        rolNecesario: 'admin_th',
        pasos: [
          { paso: 'Agrega un ítem de checklist para un marco normativo, adjuntando un archivo como evidencia.', resultadoEsperado: 'Aparece como tarjeta en la columna "No cumple" (estado inicial por defecto) con el ícono de clip indicando que tiene evidencia.' },
          { paso: 'Arrastra esa tarjeta hasta la columna "Cumple".', resultadoEsperado: 'La tarjeta queda en la nueva columna y el contador de cada columna se actualiza.' },
          { paso: 'Usa el filtro de marco normativo arriba del tablero para ver solo ISO 9001.', resultadoEsperado: 'Solo se muestran las tarjetas de ese marco normativo en las 4 columnas.' },
        ],
      },
      {
        titulo: 'Tablero kanban de un proceso',
        rolNecesario: 'admin_th',
        pasos: [
          { paso: 'Entra al tablero de un proceso que todavía no tiene etapas.', resultadoEsperado: 'Aparece el botón "Crear tablero con etapas por defecto".' },
          { paso: 'Créalo, y luego usa "Configurar etapas" para renombrar una columna y agregar una nueva con un color distinto.', resultadoEsperado: 'Los cambios se reflejan de inmediato en el tablero.' },
          { paso: 'Agrega una tarjeta con responsable, prioridad y fecha límite vencida.', resultadoEsperado: 'La tarjeta aparece en la columna elegida, con su fecha límite resaltada en rojo.' },
          { paso: 'Arrastra la tarjeta a otra columna.', resultadoEsperado: 'Cambia de columna y el contador de cada una se actualiza.' },
        ],
      },
      {
        titulo: 'Un líder consulta pero no edita',
        rolNecesario: 'Líder',
        pasos: [
          { paso: 'Inicia sesión como líder y entra a Procesos y Sistemas de Gestión.', resultadoEsperado: 'Puede ver los tres bloques (procesos, riesgos, tablero de checklist), pero no aparecen los formularios para agregar/eliminar ni puede arrastrar tarjetas — solo lectura.' },
        ],
      },
    ],
  },
  {
    modulo: 'Meta-Admin (equipo interno de la alianza)',
    escenarios: [
      {
        titulo: 'Editar el plan y la facturación de una empresa cliente',
        rolNecesario: 'Cuenta superadmin',
        pasos: [
          { paso: 'Entra a /meta-admin y localiza una empresa en la tabla.', resultadoEsperado: 'Ve usuarios activos y colaboradores activos de esa empresa (conteos de solo lectura).' },
          { paso: 'Cambia su Plan a "Premium", ajusta el precio mensual, el estado de facturación a "Pendiente" y la fecha de próximo pago, y presiona "Guardar" en esa fila.', resultadoEsperado: 'El botón muestra "Guardando…" y luego "Guardado"; al recargar la página, los valores nuevos siguen ahí.' },
          { paso: 'Repite el cambio en otra fila (otra empresa).', resultadoEsperado: 'Solo se actualiza esa empresa — las demás filas no cambian.' },
        ],
      },
    ],
  },
  {
    modulo: 'Comunicación — Mensajes y Notificaciones',
    escenarios: [
      {
        titulo: 'Enviar y leer un mensaje directo',
        rolNecesario: 'Cualquier usuario',
        pasos: [
          { paso: 'Entra a Mensajes → "Nuevo mensaje" y elige a cualquier persona de la empresa (no necesariamente de tu equipo).', resultadoEsperado: 'Se abre el hilo de conversación.' },
          { paso: 'Escribe y envía un mensaje.', resultadoEsperado: 'Aparece en el hilo; en el otro usuario sube el contador de mensajes sin leer en el encabezado.' },
          { paso: 'Inicia sesión como el destinatario y abre esa conversación.', resultadoEsperado: 'El mensaje queda marcado como leído automáticamente y el contador baja.' },
        ],
      },
      {
        titulo: 'Un colaborador (no solo admin_th) ve a toda la empresa en "Nuevo mensaje"',
        rolNecesario: 'Colaborador',
        pasos: [
          { paso: 'Inicia sesión como colaborador y entra a Mensajes → "Nuevo mensaje".', resultadoEsperado: 'El selector trae el listado completo de personas activas de la empresa, no solo de tu equipo — y no aparece nadie con cuenta retirada.' },
          { paso: 'Entra a una conversación que ya tenías con alguien.', resultadoEsperado: 'Se ve el nombre real de esa persona (no la palabra genérica "Usuario").' },
        ],
      },
      {
        titulo: 'Notificaciones y marcado de leídas',
        rolNecesario: 'Cualquier usuario',
        pasos: [
          { paso: 'Genera una alerta próxima a vencer para una persona (o espera a que el proceso automático la cree).', resultadoEsperado: 'Aparece una notificación nueva para esa persona, con el contador en el ícono de sobre del encabezado.' },
          { paso: 'Entra a Notificaciones y marca una como leída.', resultadoEsperado: 'Baja el contador; esa notificación ya no cuenta como pendiente.' },
          { paso: 'Presiona "Marcar todas como leídas".', resultadoEsperado: 'El contador queda en cero.' },
        ],
      },
    ],
  },
  {
    modulo: 'Centro de Ayuda',
    escenarios: [
      {
        titulo: 'Ayuda contextual y búsqueda',
        rolNecesario: 'Cualquier usuario',
        pasos: [
          { paso: 'Desde cualquier pantalla, presiona el ícono "?" del encabezado.', resultadoEsperado: 'Abre un panel con la ayuda de la pantalla en la que estás.' },
          { paso: 'Desde el Centro de Ayuda, busca un término (ej. "brief").', resultadoEsperado: 'Muestra resultados relevantes de manual, FAQ y glosario.' },
          { paso: 'Entra al Glosario y busca un término.', resultadoEsperado: 'Filtra la lista en tiempo real.' },
        ],
      },
    ],
  },
];
