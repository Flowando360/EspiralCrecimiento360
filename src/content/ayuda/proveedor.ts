import type { ModuloAyuda } from '@/types/ayuda';

export const moduloProveedor: ModuloAyuda = {
  slug: 'proveedor',
  titulo: 'Panel del proveedor (Espiral de Crecimiento 360°)',
  descripcion:
    'Panel del equipo proveedor de la plataforma: crea y administra las empresas clientes, sus administradores, su marca y su estado, y descarga sus respaldos. Tiene su propio inicio de sesión, separado de las cuentas de cada empresa. Ninguna empresa cliente ve este panel.',
  paginas: [
    {
      slug: 'inicio-sesion',
      ruta: '/proveedor/login',
      titulo: 'Inicio de sesión del proveedor',
      resumen:
        'Entrada exclusiva para el equipo proveedor. Usa el correo y la contraseña de una cuenta registrada como proveedor activo.',
      camposYBotones: [
        { nombre: 'Correo', explicacion: 'El correo de la cuenta del proveedor (no el usuario de las empresas).' },
        { nombre: 'Contraseña', explicacion: 'La contraseña de esa cuenta.' },
        { nombre: 'Entrar', explicacion: 'Valida la contraseña y comprueba que la cuenta sea proveedor activo. Si no, cierra la sesión y muestra un mensaje genérico.' },
      ],
      notas: [
        'Si entras con una cuenta de empresa (por ejemplo, un administrador de cliente), el panel no te reconoce: no tiene acceso a la plataforma completa.',
        'Si la cuenta del proveedor está desactivada, el acceso se rechaza aunque la contraseña sea correcta.',
      ],
    },
    {
      slug: 'empresas',
      ruta: '/proveedor',
      titulo: 'Empresas clientes',
      resumen:
        'Lista de todas las empresas de la plataforma, con su estado, usuarios y colaboradores activos, plan de membresía y facturación. Desde aquí se crean empresas nuevas y se entra al detalle de cada una.',
      camposYBotones: [
        { nombre: 'Nombre de la empresa', explicacion: 'Enlace a la ficha de la empresa (pantalla de detalle).' },
        { nombre: 'Usuarios activos', explicacion: 'Cuentas activas de esa empresa.' },
        { nombre: 'Colaboradores', explicacion: 'Fichas de colaborador activas de esa empresa.' },
        { nombre: 'Plan', explicacion: 'Piloto, Estándar o Premium. Se cambia directamente en la fila y se guarda con su botón.' },
        { nombre: 'Precio mensual / Facturación / Próximo pago', explicacion: 'Datos comerciales de la membresía, editables por fila.' },
        { nombre: 'Nueva empresa', explicacion: 'Abre el formulario para crear una empresa con su marca y su administrador (ver la pantalla de detalle para los pasos).' },
        { nombre: 'Respaldo por empresa', explicacion: 'Descarga el ZIP con todos los datos de esa empresa (un CSV por tabla).' },
      ],
      notas: [
        'Crear una empresa nueva también le copia su configuración base: escala de niveles, competencias con sus criterios y parámetros legales de la empresa plantilla.',
        'Si el nombre de una empresa aparece en gris o sin enlace, recarga la página: puede que el despliegue no esté completo.',
      ],
    },
    {
      slug: 'detalle-empresa',
      ruta: '/proveedor/empresas/*',
      titulo: 'Detalle de una empresa',
      resumen:
        'Ficha completa de una empresa: sus números, su marca, su estado, sus usuarios, su configuración base y sus accesos. Es el lugar para administrar una empresa de principio a fin.',
      camposYBotones: [
        { nombre: 'Números (Usuarios, Colaboradores activos, Cargos, Vacantes)', explicacion: 'Conteos actuales de esa empresa.' },
        { nombre: 'Activar / Desactivar empresa', explicacion: 'Si la desactivas, ninguno de sus usuarios puede entrar hasta que la actives de nuevo. Pide confirmación. Los datos no se borran.' },
        { nombre: 'Descargar respaldo', explicacion: 'ZIP con un CSV por tabla de esa empresa, más un archivo LEEME con el conteo de filas. Cada descarga queda en la bitácora.' },
        { nombre: 'Datos y marca', explicacion: 'Nombre, logo (ruta o URL) y los tres colores de la marca: principal, secundario y acento. Se guarda con Guardar datos.' },
        { nombre: 'Crear administrador de la empresa', explicacion: 'Crea la cuenta de administrador (rol admin_th) con nombre, usuario de inicio de sesión, correo y contraseña temporal. Esa persona crea después los demás usuarios y roles.' },
        { nombre: 'Completar configuración base', explicacion: 'Copia la escala de niveles, las competencias con criterios y los parámetros legales que falten. No cambia lo que la empresa ya tiene.' },
        { nombre: 'Usuarios de esta empresa', explicacion: 'Lista de cuentas con usuario, rol y estado.' },
      ],
      proceso: [
        'Crear una empresa: en Empresas, pulsa "Nueva empresa", completa nombre, identificador, plan, logo, colores y los datos del administrador, y guarda.',
        'Entregar el acceso: copia el usuario y la contraseña temporal que muestra la pantalla, y entrégalos por un canal seguro. Cada persona debe cambiarla al entrar.',
        'Verificar: entra con el administrador en /login y revisa que aparezca el logo, el nombre y los colores de la empresa.',
      ],
      notas: [
        'Desactivar una empresa es reversible y no borra nada. Úsalo para suspender el acceso de un cliente.',
        'El identificador (slug) de la empresa no puede repetirse entre empresas.',
        'Cambiar los colores afecta a toda la empresa al entrar de nuevo: la barra usa el color secundario y los acentos usan el color de acento.',
      ],
    },
    {
      slug: 'equipo',
      ruta: '/proveedor/equipo',
      titulo: 'Equipo proveedor',
      resumen:
        'Cuentas del equipo proveedor que pueden entrar al panel. Solo los propietarios ven esta pantalla y gestionan el equipo.',
      camposYBotones: [
        { nombre: 'Rol: propietario', explicacion: 'Puede gestionar el equipo proveedor, además de todo lo que hace un operador.' },
        { nombre: 'Rol: operador', explicacion: 'Opera las empresas (crear, editar, respaldar), sin gestionar el equipo.' },
        { nombre: 'Activar / Desactivar', explicacion: 'Permite o retira el acceso al panel de una cuenta del equipo. No puedes desactivar tu propia cuenta.' },
        { nombre: 'Nueva cuenta', explicacion: 'Crea una cuenta del equipo con nombre, correo, rol y contraseña temporal.' },
        { nombre: 'Último acceso', explicacion: 'Fecha y hora de la última vez que la cuenta entró al panel.' },
      ],
      notas: ['Si no ves esta opción en el menú, tu cuenta es de operador: pide a un propietario que gestione el equipo.'],
    },
    {
      slug: 'bitacora',
      ruta: '/proveedor/bitacora',
      titulo: 'Bitácora',
      resumen:
        'Registro de las últimas 200 acciones del equipo proveedor sobre las empresas: quién hizo qué, cuándo y sobre qué empresa.',
      camposYBotones: [
        { nombre: 'Cuándo', explicacion: 'Fecha y hora de la acción.' },
        { nombre: 'Quién', explicacion: 'Nombre de la cuenta del proveedor que la hizo.' },
        { nombre: 'Acción', explicacion: 'Lo que se hizo: crear_empresa, membresia, datos_empresa, activar_empresa, desactivar_empresa, crear_administrador, completar_configuracion_base, descargar_respaldo, crear_proveedor, activar_proveedor, desactivar_proveedor.' },
        { nombre: 'Empresa', explicacion: 'La empresa afectada (cuando aplica).' },
        { nombre: 'Detalle', explicacion: 'Datos resumidos de la acción, como el usuario creado o el plan asignado.' },
      ],
      notas: ['La bitácora no se puede editar ni borrar desde la aplicación.'],
    },
  ],
};
