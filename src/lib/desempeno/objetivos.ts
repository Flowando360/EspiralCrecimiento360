export type ResultadoObjetivo = 'cumplido' | 'parcial' | 'no_cumplido';

export const ETIQUETA_RESULTADO_OBJETIVO: Record<ResultadoObjetivo, string> = {
  cumplido: 'Cumplido',
  parcial: 'Parcial',
  no_cumplido: 'No cumplido',
};

const PUNTOS: Record<ResultadoObjetivo, number> = { cumplido: 100, parcial: 50, no_cumplido: 0 };

export interface ObjetivoLite {
  resultado: string | null;
  aceptado_en?: string | null;
}

export interface CumplimientoObjetivos {
  total: number;
  cerrados: number;
  aceptados: number;
  /** % de cumplimiento sobre los objetivos ya cerrados (cumplido 100, parcial 50, no cumplido 0); null si ninguno está cerrado. */
  porcentaje: number | null;
}

export function calcularCumplimientoObjetivos(objetivos: ObjetivoLite[]): CumplimientoObjetivos {
  const cerrados = objetivos.filter((o) => o.resultado && o.resultado in PUNTOS);
  const porcentaje =
    cerrados.length === 0 ? null : Math.round(cerrados.reduce((a, o) => a + PUNTOS[o.resultado as ResultadoObjetivo], 0) / cerrados.length);
  return { total: objetivos.length, cerrados: cerrados.length, aceptados: objetivos.filter((o) => o.aceptado_en).length, porcentaje };
}
