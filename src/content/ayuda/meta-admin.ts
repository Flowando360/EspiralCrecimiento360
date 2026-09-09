import type { ModuloAyuda } from '@/types/ayuda';

export const moduloMetaAdmin: ModuloAyuda = {
  slug: 'meta-admin',
  titulo: 'Meta-Admin (equipo interno de la alianza)',
  descripcion:
    'Panel exclusivo del equipo interno Flowando/Nexus/V&E: cuentas y membresías de todas las empresas cliente. No es visible para ninguna empresa cliente, ni siquiera para admin_th.',
  paginas: [
    {
      slug: 'cuentas-membresias',
      ruta: '/meta-admin',
      titulo: 'Cuentas y membresías',
      resumen:
        'Tabla con todas las empresas cliente del sistema (no solo la propia): usuarios y colaboradores activos de cada una, su plan de membresía y el estado de facturación.',
      camposYBotones: [
        { nombre: 'Usuarios activos / Colaboradores activos', explicacion: 'Conteos de solo lectura por empresa, para dimensionar el uso real de cada cliente.' },
        { nombre: 'Plan', explicacion: 'Piloto, Estándar o Premium — editable por fila.' },
        { nombre: 'Precio mensual', explicacion: 'Valor que se factura a esa empresa. Editable por fila.' },
        { nombre: 'Facturación', explicacion: 'Al día, Pendiente o Vencido — editable por fila.' },
        { nombre: 'Próximo pago', explicacion: 'Fecha del siguiente cobro. Editable por fila.' },
        { nombre: 'Guardar', explicacion: 'Guarda los cambios de esa fila (empresa) únicamente.' },
      ],
      notas: [
        'Acceso exclusivo de cuentas marcadas como "superadmin" (equipo interno de la alianza) — ni admin_th ni gerencia de una empresa cliente pueden ver ni entrar a esta pantalla, sin importar su rol.',
        'Corresponde al Modelo de Negocio Espiral Evolutiva (secc. 5): permite a la alianza ver de un vistazo el estado comercial de todas las empresas que usan el sistema, sin mezclar esa información con los datos operativos de cada empresa.',
      ],
    },
  ],
};
