import type { ModuloAyuda, PaginaAyuda } from '@/types/ayuda';
import { moduloGeneral } from './general';
import { moduloEspiralCrecimiento } from './espiral-crecimiento';
import { moduloNexa } from './nexa';
import { moduloAlertas } from './alertas';
import { moduloComunicacion } from './comunicacion';
import { moduloInformes } from './informes';
import { moduloAdministracion } from './administracion';
import { moduloProcesosGestion } from './procesos-gestion';
import { moduloMetaAdmin } from './meta-admin';

export { preguntasFrecuentes } from './faq';
export { glosario } from './glosario';
export { planPruebas } from './plan-pruebas';

export const MODULOS: ModuloAyuda[] = [
  moduloGeneral,
  moduloEspiralCrecimiento,
  moduloNexa,
  moduloAlertas,
  moduloComunicacion,
  moduloInformes,
  moduloAdministracion,
  moduloProcesosGestion,
  moduloMetaAdmin,
];

function coincideRuta(patron: string, pathname: string): boolean {
  const p = patron.split('/').filter(Boolean);
  const r = pathname.split('/').filter(Boolean);
  if (p.length !== r.length) return false;
  return p.every((seg, i) => seg === '*' || seg === r[i]);
}

/** Encuentra la página de ayuda que corresponde a la pantalla actual, para el panel contextual. */
export function buscarPaginaPorRuta(pathname: string): { modulo: ModuloAyuda; pagina: PaginaAyuda } | null {
  for (const modulo of MODULOS) {
    for (const pagina of modulo.paginas) {
      if (coincideRuta(pagina.ruta, pathname)) return { modulo, pagina };
    }
  }
  return null;
}

export function obtenerModulo(slug: string): ModuloAyuda | undefined {
  return MODULOS.find((m) => m.slug === slug);
}

export function obtenerPagina(moduloSlug: string, paginaSlug: string): PaginaAyuda | undefined {
  return obtenerModulo(moduloSlug)?.paginas.find((p) => p.slug === paginaSlug);
}
