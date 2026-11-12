/**
 * Equidad de la valoración: ¿algún líder califica sistemáticamente más alto o más bajo que el resto?, ¿en qué grupos la
 * autoevaluación se aleja de lo que ve el líder? Son señales para CALIBRAR (conversar entre líderes), no pruebas de sesgo:
 * una diferencia también puede reflejar desempeños realmente distintos. Todo grupo con menos personas que el umbral de
 * anonimato se oculta.
 */

export interface NotaTarea {
  tipo: string;
  evaluadorId: string;
  evaluadoId: string;
  /** Promedio de las notas de esa valoración (sin «No aplica»). */
  nota: number;
}

const r2 = (n: number) => Math.round(n * 100) / 100;
const media = (v: number[]) => (v.length ? v.reduce((a, b) => a + b, 0) / v.length : null);

export interface FilaSeveridad {
  liderId: string;
  personas: number;
  promedio: number;
  /** Promedio del líder menos el promedio de todos los líderes. Positivo = más benevolente que el resto. */
  diferencia: number;
  /** Desviación estándar de las notas que da (poca dispersión = califica a todos casi igual). */
  dispersion: number | null;
}

export interface ResultadoSeveridad {
  promedioGlobal: number | null;
  filas: FilaSeveridad[];
  /** Líderes con valoraciones pero con menos personas que el umbral (no se muestran). */
  ocultos: number;
}

export function severidadPorLider(tareas: NotaTarea[], umbral: number): ResultadoSeveridad {
  const delLider = tareas.filter((t) => t.tipo === 'lider');
  const global = media(delLider.map((t) => t.nota));
  const porLider = new Map<string, number[]>();
  for (const t of delLider) {
    if (!porLider.has(t.evaluadorId)) porLider.set(t.evaluadorId, []);
    porLider.get(t.evaluadorId)!.push(t.nota);
  }
  const filas: FilaSeveridad[] = [];
  let ocultos = 0;
  for (const [liderId, notas] of Array.from(porLider.entries())) {
    if (notas.length < umbral) {
      ocultos++;
      continue;
    }
    const m = media(notas) as number;
    const varianza = notas.reduce((s, x) => s + (x - m) ** 2, 0) / notas.length;
    filas.push({ liderId, personas: notas.length, promedio: r2(m), diferencia: r2(m - (global as number)), dispersion: r2(Math.sqrt(varianza)) });
  }
  filas.sort((a, b) => b.diferencia - a.diferencia);
  return { promedioGlobal: global == null ? null : r2(global), filas, ocultos };
}

export interface FilaBrechaGrupo {
  grupo: string;
  personas: number;
  promedioAuto: number;
  promedioLider: number;
  /** Autoevaluación menos valoración del líder. Positivo = la gente se ve mejor de como la ve su líder. */
  diferencia: number;
}

export interface ResultadoBrechaAutoLider {
  filas: FilaBrechaGrupo[];
  ocultos: number;
  global: { personas: number; diferencia: number } | null;
}

/** Autoevaluación vs líder por grupo. Solo cuentan personas que tienen ambas valoraciones. */
export function brechaAutoLiderPorGrupo(tareas: NotaTarea[], grupoDe: Map<string, string>, umbral: number): ResultadoBrechaAutoLider {
  const auto = new Map<string, number>();
  const lider = new Map<string, number[]>();
  for (const t of tareas) {
    if (t.tipo === 'autoevaluacion') auto.set(t.evaluadoId, t.nota);
    else if (t.tipo === 'lider') {
      if (!lider.has(t.evaluadoId)) lider.set(t.evaluadoId, []);
      lider.get(t.evaluadoId)!.push(t.nota);
    }
  }
  const porGrupo = new Map<string, { a: number; l: number }[]>();
  const todos: { a: number; l: number }[] = [];
  for (const [evaluadoId, a] of Array.from(auto.entries())) {
    const l = media(lider.get(evaluadoId) ?? []);
    if (l == null) continue;
    const par = { a, l };
    todos.push(par);
    const g = grupoDe.get(evaluadoId) ?? 'Sin grupo';
    if (!porGrupo.has(g)) porGrupo.set(g, []);
    porGrupo.get(g)!.push(par);
  }
  const filas: FilaBrechaGrupo[] = [];
  let ocultos = 0;
  for (const [grupo, pares] of Array.from(porGrupo.entries())) {
    if (pares.length < umbral) {
      ocultos++;
      continue;
    }
    const a = media(pares.map((p) => p.a)) as number;
    const l = media(pares.map((p) => p.l)) as number;
    filas.push({ grupo, personas: pares.length, promedioAuto: r2(a), promedioLider: r2(l), diferencia: r2(a - l) });
  }
  filas.sort((x, y) => y.diferencia - x.diferencia);
  const global = todos.length >= umbral ? { personas: todos.length, diferencia: r2((media(todos.map((p) => p.a)) as number) - (media(todos.map((p) => p.l)) as number)) } : null;
  return { filas, ocultos, global };
}

/** ¿La diferencia merece una conversación de calibración? */
export const UMBRAL_REVISION = 0.5;
export const requiereRevision = (diferencia: number) => Math.abs(diferencia) >= UMBRAL_REVISION;
