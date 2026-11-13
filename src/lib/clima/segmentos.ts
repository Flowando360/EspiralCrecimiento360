/**
 * Clima por segmento (área, líder, sede) con anonimato. Funciones puras.
 * Un segmento solo muestra números si tiene al menos `umbral` respuestas (el mismo umbral de la empresa).
 */

export const DIMENSIONES_CLIMA = [
  { clave: 'reconocimiento', label: 'Reconocimiento' },
  { clave: 'liderazgo', label: 'Liderazgo' },
  { clave: 'desarrollo', label: 'Desarrollo' },
  { clave: 'comunicacion', label: 'Comunicación' },
  { clave: 'condiciones', label: 'Condiciones físicas' },
  { clave: 'pertenencia', label: 'Pertenencia' },
  { clave: 'relaciones_pares', label: 'Relaciones entre pares' },
  { clave: 'compensacion', label: 'Compensación' },
  { clave: 'equidad', label: 'Equidad' },
] as const;

export type ClaveDimensionClima = (typeof DIMENSIONES_CLIMA)[number]['clave'];

export interface RespuestaClima {
  enps: number;
  area: string | null;
  sede_id: string | null;
  equipo_lider_id: string | null;
  [k: string]: unknown;
}

export interface ResumenClima {
  n: number;
  oculto: boolean;
  enps: number | null;
  indice: number | null;
  dimensiones: Record<ClaveDimensionClima, number | null>;
}

export function umbralClima(
  cfg: { tipo?: string | null; cantidad?: number | null; porcentaje?: number | null },
  poblacion: number
): number {
  if (cfg.tipo === 'porcentaje' && cfg.porcentaje) return Math.max(1, Math.ceil((poblacion * Number(cfg.porcentaje)) / 100));
  return cfg.cantidad ?? 5;
}

function prom(vals: number[]): number | null {
  return vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 100) / 100 : null;
}

export function resumirClima(resps: RespuestaClima[], umbral: number): ResumenClima {
  const n = resps.length;
  const vacio = Object.fromEntries(DIMENSIONES_CLIMA.map((d) => [d.clave, null])) as Record<ClaveDimensionClima, number | null>;
  if (n === 0 || n < umbral) return { n, oculto: true, enps: null, indice: null, dimensiones: vacio };
  const prom_ = (res: RespuestaClima[]) => {
    const dimensiones = { ...vacio };
    for (const d of DIMENSIONES_CLIMA) {
      const v = res.map((r) => r[d.clave]).filter((x): x is number => typeof x === 'number');
      // Una dimensión nueva solo se muestra si al menos `umbral` personas la respondieron (rondas viejas no la tienen).
      dimensiones[d.clave] = v.length >= umbral ? prom(v) : null;
    }
    return dimensiones;
  };
  const dimensiones = prom_(resps);
  const medias = Object.values(dimensiones).filter((x): x is number => x !== null);
  const promotores = resps.filter((r) => r.enps >= 9).length;
  const detractores = resps.filter((r) => r.enps <= 6).length;
  return {
    n,
    oculto: false,
    enps: Math.round((100 * (promotores - detractores)) / n),
    indice: prom(medias),
    dimensiones,
  };
}
