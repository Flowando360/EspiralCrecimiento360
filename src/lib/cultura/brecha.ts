/**
 * Brecha cultural (informe de Luisa 6.6). Funciones puras.
 * Brecha = frecuencia deseada - frecuencia actual (escala 1 a 5). Positiva = falta que ocurra más.
 * Un grupo solo muestra números si hay al menos `umbral` envíos distintos (personas), para proteger el anonimato.
 */

export interface RespuestaCultura {
  envio_id: string;
  comportamiento_id: string;
  actual: number;
  deseada: number;
  area: string | null;
  sede_id: string | null;
  equipo_lider_id: string | null;
}

export interface ComportamientoCultura {
  id: string;
  dimension: string;
  enunciado: string;
}

export interface FilaBrecha {
  id: string;
  titulo: string;
  actual: number;
  deseada: number;
  brecha: number;
}

export interface ResultadoBrecha {
  personas: number;
  oculto: boolean;
  porDimension: FilaBrecha[];
  porComportamiento: (FilaBrecha & { dimension: string })[];
}

function media(v: number[]): number {
  return Math.round((v.reduce((a, b) => a + b, 0) / v.length) * 100) / 100;
}

function fila(id: string, titulo: string, rs: RespuestaCultura[]): FilaBrecha {
  const actual = media(rs.map((r) => r.actual));
  const deseada = media(rs.map((r) => r.deseada));
  return { id, titulo, actual, deseada, brecha: Math.round((deseada - actual) * 100) / 100 };
}

export function calcularBrecha(resps: RespuestaCultura[], comps: ComportamientoCultura[], umbral: number): ResultadoBrecha {
  const personas = new Set(resps.map((r) => r.envio_id)).size;
  if (personas < umbral || personas === 0) return { personas, oculto: true, porDimension: [], porComportamiento: [] };
  const dimDe = new Map(comps.map((c) => [c.id, c.dimension]));
  const porDim = new Map<string, RespuestaCultura[]>();
  const porComp = new Map<string, RespuestaCultura[]>();
  for (const r of resps) {
    const d = dimDe.get(r.comportamiento_id);
    if (!d) continue;
    if (!porDim.has(d)) porDim.set(d, []);
    porDim.get(d)!.push(r);
    if (!porComp.has(r.comportamiento_id)) porComp.set(r.comportamiento_id, []);
    porComp.get(r.comportamiento_id)!.push(r);
  }
  const textoDe = new Map(comps.map((c) => [c.id, c.enunciado]));
  return {
    personas,
    oculto: false,
    porDimension: Array.from(porDim.entries())
      .map(([d, rs]) => fila(d, d, rs))
      .sort((a, b) => b.brecha - a.brecha),
    porComportamiento: Array.from(porComp.entries())
      .map(([id, rs]) => ({ ...fila(id, textoDe.get(id) ?? '', rs), dimension: dimDe.get(id) ?? '' }))
      .sort((a, b) => b.brecha - a.brecha),
  };
}
