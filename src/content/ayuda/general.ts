import type { ModuloAyuda } from '@/types/ayuda';

export const moduloGeneral: ModuloAyuda = {
  slug: 'general',
  titulo: 'Inicio y Mi Perfil',
  descripcion: 'La pantalla de bienvenida y tu propia ficha personal.',
  paginas: [
    {
      slug: 'inicio',
      ruta: '/inicio',
      titulo: 'Inicio',
      resumen:
        'La primera pantalla al entrar. Se adapta según tu rol: Talento Humano y Gerencia ven el panorama completo de la empresa; un líder ve el resumen de su equipo; un colaborador ve accesos directos a su propio espacio.',
      camposYBotones: [
        { nombre: 'Nuestro propósito', explicacion: 'Tarjeta con el propósito superior de la empresa (definido en Identidad Organizacional), visible para todos los roles si ya está cargado.' },
        { nombre: 'Tarjetas de indicadores', explicacion: 'Colaboradores activos, promedio de Hacer y Deber, alertas críticas abiertas, cumplimiento de Saber, alineación talento-rol (visible para admin_th y gerencia).' },
        { nombre: 'Comparativo: ciclo actual vs. anterior', explicacion: 'Para admin_th y gerencia: promedio de Hacer y Deber del último ciclo, con la variación contra el ciclo anterior. Enlace a "Ver histórico completo".' },
        { nombre: 'Próximas alertas', explicacion: 'Las alertas de vencimiento más urgentes de toda la empresa, con enlace a "Ver todas".' },
        { nombre: 'Tarjetas de acceso rápido', explicacion: 'Para líder y colaborador: atajos a Mi equipo, Planes de Desarrollo, Mi Perfil y Formación.' },
        { nombre: 'Encuentros de Crecimiento pendientes', explicacion: 'Lista, para cualquier rol, de las valoraciones que te faltan por hacer (autoevaluación, o valorar a tu líder, un par o un colaborador a cargo) — clic en cualquiera te lleva directo al formulario. Así es como se llega a "Valorar (Hacer/Deber)": no hay otro camino en el menú, siempre aparece desde acá.' },
      ],
      notas: [
        'Lo que ves aquí depende 100% de tu rol — no es una pantalla que se configure, se arma sola con datos reales.',
        'Las fichas de valoración (con sus preguntas) se generan solas cuando admin_th abre un Encuentro de Crecimiento desde el detalle de un ciclo — incluyendo las del bloque "Roles y Funciones", que salen directo del perfil de cargo de cada persona. Si alguien no ve nada en "Encuentros de Crecimiento pendientes" después de que se generó el ciclo, revisa si le corresponde alguna tarea como evaluador en el organigrama.',
      ],
    },
    {
      slug: 'mi-perfil',
      ruta: '/mi-perfil',
      titulo: 'Mi Perfil',
      resumen:
        'Tu propia ficha 360°: quién eres para la organización, tu cargo, tu líder, y el estado de tus cuatro dimensiones (Ser, Saber, Hacer, Deber).',
      camposYBotones: [
        { nombre: 'Encabezado', explicacion: 'Nombre, cargo, área, fecha de ingreso y líder directo.' },
        { nombre: 'Tarjetas SER / SABER / HACER / DEBER', explicacion: 'Estado de cada dimensión: si tu Guía del Flow está completa, tu % de cumplimiento de Saber, y el semáforo (Alto/Medio/Bajo) de Hacer y Deber según tu último Encuentro de Crecimiento.' },
        { nombre: 'Mi Guía del Flow', explicacion: 'Si ya se cargó tu Guía del Flow, aquí ves tus talentos naturales y tu propósito, tal como quedaron documentados.' },
        { nombre: 'Cómo te gusta que te llamen', explicacion: 'Un apodo o diminutivo opcional (ej. "Vale" en vez de "Valentina"). Si lo defines, reemplaza tu primer nombre en el saludo de Inicio y en el encabezado — en toda la app.' },
        { nombre: 'Mis fechas personales', explicacion: 'Fecha de matrimonio y de baby shower (si aplica) — el sistema le avisa a tu líder para celebrar contigo. Y, aparte, si estás en embarazo y tu fecha probable de parto: esto es privado, solo lo ves tú y Talento Humano, tu líder no tiene acceso.' },
        { nombre: 'Mis fechas especiales', explicacion: 'Una lista abierta de fechas que quieras que se celebren contigo — cumpleaños, día de tu profesión, cualquier aniversario que se te ocurra —, cada una con su propia descripción libre. A diferencia de "Mis fechas personales", puedes agregar cuantas quieras. Tu líder directo y Talento Humano también pueden agregarte fechas especiales desde tu ficha.' },
        { nombre: 'Mis incapacidades', explicacion: 'Solo aparece si tienes alguna registrada. Las incapacidades y licencias que Talento Humano te haya cargado (tipo, fechas, entidad que la certifica y el soporte, si lo adjuntaron) — de solo lectura, las registra Talento Humano cuando recibe tu certificado.' },
      ],
      notas: [
        'Si ves el mensaje de que tu usuario no está vinculado a una ficha, pide a Talento Humano que te asocie desde Administración → Usuarios.',
        'Cada quien registra sus propias fechas personales — ni siquiera admin_th puede cargarlas por otra persona todavía. Las fechas especiales sí las puede agregar también Talento Humano o tu líder directo (a diferencia de las fechas personales).',
        'Cada fecha especial genera una alerta con el próximo aniversario, visible en Alertas — igual que ya pasa con cumpleaños o aniversario de bodas.',
      ],
    },
    {
      slug: 'inicio-sesion',
      ruta: '/login',
      titulo: 'Inicio de sesión',
      resumen:
        'Entrada a Espiral de Crecimiento 360° para las cuentas de cada empresa. Puedes entrar con tu usuario de inicio de sesión o con tu correo.',
      camposYBotones: [
        { nombre: 'Usuario o correo', explicacion: 'Escribe tu usuario (por ejemplo, nombre.apellido) o el correo de tu cuenta. Ambos sirven.' },
        { nombre: 'Contraseña', explicacion: 'La contraseña que te entregó tu administrador o la que definiste al cambiarla.' },
        { nombre: 'Entrar', explicacion: 'Valida tus datos. Si tu cuenta no tiene perfil activo, o si la empresa está desactivada, el sistema te lo indica con un mensaje y no te deja entrar.' },
      ],
      proceso: [
        'Abre la dirección del aplicativo y pulsa "Entrar" o escribe /login.',
        'Escribe tu usuario o tu correo y tu contraseña.',
        'Al entrar verás, en la parte superior: el logo y el nombre de Espiral de Crecimiento 360°, el logo y el nombre de tu empresa, y los colores de tu empresa.',
      ],
      notas: [
        'Si tu empresa fue desactivada por el proveedor, no podrás entrar hasta que se reactive. El mensaje te pide contactar al proveedor de Espiral de Crecimiento 360°.',
        'Al cerrar sesión desde el menú, tu sesión termina en ese navegador.',
        'Si olvidaste tu contraseña, pulsa “¿Olvidaste tu contraseña?” debajo del formulario, escribe tu correo y abre el enlace que llega por correo para definir una contraseña nueva (mínimo 8 caracteres).',
      ],
    },
    {
      slug: 'encabezado',
      ruta: '/inicio',
      titulo: 'Encabezado: marca de Espiral y de tu empresa',
      resumen:
        'La barra superior muestra la marca de Espiral de Crecimiento 360° y la de tu empresa, y usa los colores que tu empresa definió.',
      camposYBotones: [
        { nombre: 'Logo y nombre de Espiral de Crecimiento 360°', explicacion: 'Siempre visibles a la izquierda. Al hacer clic llevan a Inicio.' },
        { nombre: 'Logo y nombre de tu empresa', explicacion: 'A la derecha del logo de Espiral, separados por una línea. Aparecen cuando la empresa tiene logo y nombre cargados.' },
        { nombre: 'Colores', explicacion: 'La barra toma el color secundario de tu empresa; los acentos (como el nombre de la empresa) usan su color de acento; los botones principales usan su color de marca.' },
        { nombre: 'Menú (☰ en pantallas pequeñas)', explicacion: 'Abre la lista de módulos a los que tu rol y tu rol personalizado te dan acceso.' },
      ],
      notas: [
        'Los colores y el logo de tu empresa los define el equipo proveedor. Si algo no se ve bien, avisa para revisarlo.',
      ],
    },
  ],
};
