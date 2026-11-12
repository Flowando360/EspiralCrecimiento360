import { claveArea, crearNormalizadorAreas } from '@/lib/areas';
import { createClient } from '@/lib/supabase/server';

/**
 * Filtros por área y por líder directo que comparten los informes
 * (informe de pruebas, hallazgo 6.1: "filtros mínimos en todos los informes").
 * Viajan en la URL (?area=…&liderId=…), así los botones de PDF/Excel los heredan.
 */
export interface FiltrosEquipo {
  area?: string;
  liderId?: string;
}

export function leerFiltrosEquipo(sp: { get(k: string): string | null } | Record<string, string | string[] | undefined>): FiltrosEquipo {
  const leer = (k: string): string | undefined => {
    const v = typeof (sp as any).get === 'function' ? (sp as any).get(k) : (sp as any)[k];
    const t = Array.isArray(v) ? v[0] : v;
    return t && String(t).trim() ? String(t).trim() : undefined;
  };
  return { area: leer('area'), liderId: leer('liderId') };
}

export function hayFiltrosEquipo(f: FiltrosEquipo): boolean {
  return Boolean(f.area || f.liderId);
}

/** ¿La persona pertenece al área y/o al equipo del líder elegidos? */
export function coincideEquipo(
  co: { lider_id?: string | null; cargo?: { proceso_area?: string | null } | null } | null | undefined,
  f: FiltrosEquipo
): boolean {
  if (!co) return false;
  if (f.liderId && co.lider_id !== f.liderId) return false;
  if (f.area && claveArea(co.cargo?.proceso_area) !== claveArea(f.area)) return false;
  return true;
}

/** Texto para anexar a los enlaces de descarga ("&area=…" ya con el "?" o "&" correcto). */
export function queryFiltrosEquipo(f: FiltrosEquipo, base = ''): string {
  const p = new URLSearchParams(base.replace(/^\?/, ''));
  if (f.area) p.set('area', f.area);
  if (f.liderId) p.set('liderId', f.liderId);
  const s = p.toString();
  return s ? `?${s}` : '';
}

/** Describe el filtro activo para títulos de PDF/Excel: "Área: Administrativo · Equipo de Ana". */
export function describirFiltrosEquipo(f: FiltrosEquipo, nombreLider?: string | null): string | null {
  const partes: string[] = [];
  if (f.area) partes.push(`Área: ${f.area}`);
  if (f.liderId) partes.push(`Equipo de ${nombreLider ?? 'un líder'}`);
  return partes.length ? partes.join(' · ') : null;
}

/** Áreas y líderes disponibles para el selector, según el alcance del usuario. */
export async function opcionesFiltroEquipo(perfil: { empresa_id: string; rol: string; colaborador_id: string | null }) {
  const supabase = createClient();
  let q = supabase
    .from('colaboradores')
    .select('id, lider_id, cargo:cargo_id(proceso_area)')
    .eq('empresa_id', perfil.empresa_id)
    .eq('es_externo', false)
    .in('estado', ['activo', 'periodo_prueba', 'en_proceso_salida']);
  if (perfil.rol === 'lider' && perfil.colaborador_id) q = q.eq('lider_id', perfil.colaborador_id);
  const { data } = await q;
  const filas = (data ?? []) as any[];

  const normalizar = crearNormalizadorAreas(filas.map((f) => f.cargo?.proceso_area));
  const areas = Array.from(new Set(filas.map((f) => normalizar(f.cargo?.proceso_area)).filter(Boolean) as string[])).sort((a, b) =>
    a.localeCompare(b, 'es')
  );

  const idsLideres = Array.from(new Set(filas.map((f) => f.lider_id).filter(Boolean) as string[]));
  let lideres: { id: string; nombre: string }[] = [];
  if (idsLideres.length > 0) {
    const { data: ls } = await supabase.from('colaboradores').select('id, nombre_completo').in('id', idsLideres);
    lideres = ((ls ?? []) as any[])
      .map((l) => ({ id: l.id as string, nombre: l.nombre_completo as string }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  }
  return { areas, lideres };
}
