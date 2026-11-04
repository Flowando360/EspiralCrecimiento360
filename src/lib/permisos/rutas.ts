/**
 * A qué módulo de permisos pertenece cada ruta del dashboard. Debe coincidir con
 * el menú (barra-superior.tsx): lo que el menú agrupa bajo un módulo se bloquea
 * con ese mismo módulo. Se usa en el middleware para que un rol personalizado no
 * dependa solo de ocultar el menú: si el módulo no tiene lectura, la ruta no abre.
 *
 * Devuelve null cuando la ruta es libre para cualquier usuario con sesión
 * (ayuda, alertas, notificaciones, mensajes, cambiar contraseña, Gino…).
 */
export type ModuloRuta =
  | 'inicio'
  | 'mi_perfil'
  | 'espiral_360'
  | 'reclutamiento'
  | 'nexa'
  | 'procesos'
  | 'informes'
  | 'dotaciones'
  | 'administracion';

// Primero lo más específico. `exacta: true` = solo esa ruta, sin subrutas.
const REGLAS: { prefijo: string; modulo: ModuloRuta | null; exacta?: boolean }[] = [
  // Gino (el chat con IA) es un amigo para todos; su base documental sí es de Nexa.
  { prefijo: '/nexa/asistente', modulo: null, exacta: true },
  // El menú agrupa estas pantallas de /nexa y /administracion bajo otros módulos.
  { prefijo: '/nexa/formacion', modulo: 'espiral_360' },
  { prefijo: '/nexa/reconocimientos', modulo: 'espiral_360' },
  { prefijo: '/nexa/clima', modulo: 'espiral_360' },
  { prefijo: '/nexa/simulacros', modulo: 'procesos' },
  { prefijo: '/administracion/guias-flow', modulo: 'espiral_360' },
  { prefijo: '/administracion/sincronizaciones-guia-flow', modulo: 'espiral_360' },
  { prefijo: '/administracion/dotaciones', modulo: 'dotaciones' },
  // Por módulo.
  { prefijo: '/nexa', modulo: 'nexa' },
  { prefijo: '/administracion', modulo: 'administracion' },
  { prefijo: '/espiral-crecimiento', modulo: 'espiral_360' },
  { prefijo: '/reclutamiento', modulo: 'reclutamiento' },
  { prefijo: '/procesos-gestion', modulo: 'procesos' },
  { prefijo: '/informes', modulo: 'informes' },
  { prefijo: '/dotacion', modulo: 'dotaciones' },
  { prefijo: '/mi-perfil', modulo: 'mi_perfil' },
  { prefijo: '/inicio', modulo: 'inicio' },
];

export function moduloDeRuta(pathname: string): ModuloRuta | null {
  const ruta = pathname.replace(/\/+$/, '') || '/';
  for (const r of REGLAS) {
    if (ruta === r.prefijo) return r.modulo;
    if (!r.exacta && ruta.startsWith(r.prefijo + '/')) return r.modulo;
  }
  return null;
}

/**
 * ¿Puede abrir esta ruta alguien con un rol personalizado?
 * `permisos` es la lista de módulos con lectura del rol. Inicio nunca se bloquea
 * (es adonde se redirige) y una ruta libre siempre se abre.
 */
export function rutaPermitida(pathname: string, modulosConLectura: Set<string>): boolean {
  const modulo = moduloDeRuta(pathname);
  if (modulo === null || modulo === 'inicio') return true;
  return modulosConLectura.has(modulo);
}
