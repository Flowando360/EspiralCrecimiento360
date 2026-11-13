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

/**
 * Alfa de Cronbach del instrumento (consistencia interna de las afirmaciones de 1 a 5), informe de Luisa 11.1.
 * Solo usa respuestas que contestaron TODAS las afirmaciones. Devuelve null si no hay datos suficientes
 * (menos de 2 afirmaciones, menos de 3 personas o varianza total cero).
 */
export function alfaCronbach(resps: RespuestaClima[]): { alfa: number; personas: number; items: number } | null {
  const claves = DIMENSIONES_CLIMA.map((d) => d.clave);
  const completas = resps.filter((r) => claves.every((c) => typeof r[c] === 'number'));
  const n = completas.length;
  const k = claves.length;
  if (n < 3 || k < 2) return null;
  const varianza = (v: number[]) => {
    const m = v.reduce((a, b) => a + b, 0) / v.length;
    return v.reduce((a, b) => a + (b - m) ** 2, 0) / (v.length - 1);
  };
  const sumaVarItems = claves.reduce((acc, c) => acc + varianza(completas.map((r) => r[c] as number)), 0);
  const varTotal = varianza(completas.map((r) => claves.reduce((a, c) => a + (r[c] as number), 0)));
  if (varTotal === 0) return null;
  return { alfa: Math.round(((k / (k - 1)) * (1 - sumaVarItems / varTotal)) * 100) / 100, personas: n, items: k };
}

export function interpretarAlfa(alfa: number): string {
  if (alfa >= 0.9) return 'excelente';
  if (alfa >= 0.8) return 'buena';
  if (alfa >= 0.7) return 'aceptable';
  if (alfa >= 0.6) return 'débil';
  return 'insuficiente';
}

function alfaDeColumnas(filas: number[][]): number | null {
  const n = filas.length;
  const k = filas[0]?.length ?? 0;
  if (n < 3 || k < 2) return null;
  const varianza = (v: number[]) => {
    const m = v.reduce((a, b) => a + b, 0) / v.length;
    return v.reduce((a, b) => a + (b - m) ** 2, 0) / (v.length - 1);
  };
  const sumaVarItems = Array.from({ length: k }, (_, j) => varianza(filas.map((f) => f[j]!))).reduce((a, b) => a + b, 0);
  const varTotal = varianza(filas.map((f) => f.reduce((a, b) => a + b, 0)));
  if (varTotal === 0) return null;
  return Math.round(((k / (k - 1)) * (1 - sumaVarItems / varTotal)) * 100) / 100;
}

/**
 * Confiabilidad de una ronda COMPLETA (3 afirmaciones por dimensión): alfa de cada dimensión (3 ítems) y alfa global (27
 * ítems), usando solo a quienes respondieron todos los ítems. Con menos de 3 personas completas devuelve null.
 */
export function alfaPorItems(resps: RespuestaClima[]): { global: number | null; personas: number; porDimension: { clave: ClaveDimensionClima; titulo: string; alfa: number | null }[] } | null {
  const completas = resps
    .map((r) => (r as any).respuestas_items as Record<string, number[]> | null | undefined)
    .filter((it): it is Record<string, number[]> => !!it && DIMENSIONES_CLIMA.every((d) => Array.isArray(it[d.clave]) && it[d.clave]!.length === 3));
  if (completas.length < 3) return null;
  return {
    personas: completas.length,
    global: alfaDeColumnas(completas.map((it) => DIMENSIONES_CLIMA.flatMap((d) => it[d.clave]!))),
    porDimension: DIMENSIONES_CLIMA.map((d) => ({ clave: d.clave, titulo: d.label, alfa: alfaDeColumnas(completas.map((it) => it[d.clave]!)) })),
  };
}
