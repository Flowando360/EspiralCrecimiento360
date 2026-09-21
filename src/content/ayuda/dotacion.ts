import type { ModuloAyuda } from '@/types/ayuda';

export const moduloDotacion: ModuloAyuda = {
  slug: 'dotacion',
  titulo: 'Dotación',
  descripcion:
    'Elementos personales (uniformes, EPP) y equipos de trabajo entregados a cada colaborador, con constancia de entrega, control de inventario por talla y alertas de vencimiento.',
  paginas: [
    {
      slug: 'index',
      ruta: '/dotacion',
      titulo: 'Gestión de Dotaciones',
      resumen: 'Historial de todas las entregas de dotación de la empresa — elementos personales (uniforme, botas, EPP) y equipos de trabajo (herramienta, cómputo, celular).',
      camposYBotones: [
        {
          nombre: 'Registrar entrega (admin_th)',
          explicacion:
            'Elige el colaborador y la categoría. Puede tomarse "Del catálogo" (elige artículo y talla ya cargados en el inventario — el stock baja solo) o "Texto libre" (nombre y talla escritos a mano, sin descontar inventario). La fecha de vencimiento/renovación se sugiere automáticamente a 4 meses desde la entrega (referencia legal usual de EPP/uniformes en Colombia), editable si aplica otro plazo.',
        },
        { nombre: 'Confirmar recibido', explicacion: 'El propio colaborador confirma que recibió el elemento — queda marcado como "Firmado" con fecha y hora.' },
        { nombre: 'Adjuntar acta (foto o PDF)', explicacion: 'Para cuando la constancia se firma en papel en vez de confirmarse en la plataforma. Puede adjuntarla admin_th o el propio colaborador dueño de la entrega.' },
        { nombre: 'Cambiar estado (admin_th)', explicacion: 'Entregado / Devuelto / Perdido / Dañado — el checklist de devolución al momento de un retiro, o para registrar pérdida/daño en cualquier momento.' },
        { nombre: 'Renovar antes de… (en rojo)', explicacion: 'Se resalta cuando la fecha de vencimiento está a 15 días o menos.' },
        { nombre: 'Catálogo e inventario / Reporte de consumo (admin_th)', explicacion: 'Accesos directos a las otras dos pantallas del módulo.' },
      ],
      notas: [
        'Cualquier rol con acceso al módulo (admin_th, líder, colaborador) ve el historial completo de la empresa, no solo el propio — lo que puede hacer cada quien sí varía: solo admin_th registra entregas y cambia estados; el colaborador únicamente confirma recibido y adjunta el acta de sus propias entregas.',
        'Desde la ficha de un colaborador (Espiral de Crecimiento) se puede filtrar directamente su historial de dotación.',
      ],
    },
    {
      slug: 'catalogo',
      ruta: '/dotacion/catalogo',
      titulo: 'Catálogo e inventario',
      resumen: 'Artículos que la empresa maneja en bodega, agrupados por categoría, con existencias por talla.',
      camposYBotones: [
        { nombre: 'Agregar artículo', explicacion: 'Categoría (texto libre, ej. Calzado, Camisas, Cascos), nombre, y si maneja tallas o no.' },
        { nombre: 'Agregar talla', explicacion: 'Talla (o "Única" si no aplica), stock inicial y stock mínimo antes de avisar.' },
        { nombre: 'Recibir en bodega', explicacion: 'Suma unidades al stock disponible cuando llega una compra del proveedor.' },
        { nombre: 'Stock mínimo', explicacion: 'Editable en línea — cuando el disponible cae a ese nivel o menos, la talla se resalta en rojo con un ícono de alerta.' },
        { nombre: 'Activar / desactivar artículo', explicacion: 'Un artículo desactivado deja de aparecer como opción al registrar una entrega nueva, pero no borra el historial de entregas ya hechas con él.' },
        { nombre: 'Eliminar', explicacion: 'Quita el artículo (o una talla) del catálogo por completo.' },
      ],
      notas: [
        'Exclusivo de admin_th.',
        'Registrar una entrega "Del catálogo" en la pantalla principal descuenta el stock disponible de la talla elegida automáticamente; una entrega "Texto libre" no toca el inventario.',
      ],
    },
    {
      slug: 'reporte',
      ruta: '/dotacion/reporte',
      titulo: 'Reporte de consumo de dotación',
      resumen: 'Cuántas dotaciones se han entregado, para proyectar compras futuras.',
      camposYBotones: [
        { nombre: 'Filtros', explicacion: 'Por área, por cargo y por mes — se pueden combinar.' },
        { nombre: 'Totales', explicacion: 'Número de entregas y de unidades entregadas, según el filtro activo.' },
        { nombre: 'Tablas agrupadas', explicacion: 'Por mes, por área y por cargo — cada una con su número de entregas y de unidades, para detectar dónde se consume más.' },
      ],
      notas: ['Exclusivo de admin_th.'],
    },
  ],
};
