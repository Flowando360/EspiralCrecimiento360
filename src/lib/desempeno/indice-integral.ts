/**
 * Índice de desempeño integral (modelo integral §6.3-6.5): sintetiza SABER, HACER y DEBER, ponderados
 * según el nivel del cargo, manteniendo visibles los resultados por dimensión. El SER NO entra: se presenta en
 * paralelo, con sus hallazgos, y nunca se suma a las demás dimensiones.
 */

export interface PesosDimensiones {
  saber: number; // porcentaje 0-100
  hacer: number;
  deber: number;
}

/** Punto de partida editable por nivel de cargo (el ejemplo ilustrativo del modelo: 25 / 40 / 35). */
export const PESOS_POR_DEFECTO: PesosDimensiones = { saber: 25, hacer: 40, deber: 35 };

/**
 * SABER se mide como porcentaje de cumplimiento del perfil del cargo (0-100); Hacer y Deber, en la escala de 1 a 5.
 * Para integrarlos se lleva el porcentaje a la misma escala, de forma lineal: 0 % = 1, 100 % = 5.
 */
export function saberAEscala5(porcentaje: number): number {
  const p = Math.max(0, Math.min(100, porcentaje));
  return Math.round((1 + (4 * p) / 100) * 100) / 100;
}

export interface AporteDimension {
  dimension: 'saber' | 'hacer' | 'deber';
  /** Valor en escala 1-5 (null si no hay dato). */
  valor: number | null;
  /** Peso configurado (%) y peso efectivo (%) tras excluir lo que no tiene dato. */
  pesoConfigurado: number;
  pesoEfectivo: number;
  /** Aporte al índice (valor × peso efectivo / 100). */
  aporte: number | null;
}

export interface IndiceIntegral {
  indice: number | null;
  semaforo: 'alto' | 'medio' | 'bajo' | null;
  aportes: AporteDimension[];
  /** true si falta alguna dimensión: el índice se recalcula con las que sí tienen dato. */
  incompleto: boolean;
  dimensionesSinDato: ('saber' | 'hacer' | 'deber')[];
}

export function semaforoIntegral(indice: number | null): 'alto' | 'medio' | 'bajo' | null {
  if (indice == null) return null;
  return indice >= 4.0 ? 'alto' : indice >= 3.5 ? 'medio' : 'bajo';
}

/**
 * Calcula el índice con los pesos dados. Si una dimensión no tiene dato (p. ej. aún no hay Saber verificado),
 * se excluye y los pesos de las demás se reescalan a 100 %; el resultado se marca como incompleto y se dice cuál falta,
 * en vez de tratar la ausencia como cero.
 */
export function calcularIndiceIntegral(
  valores: { saberPct: number | null; hacer: number | null; deber: number | null },
  pesos: PesosDimensiones = PESOS_POR_DEFECTO
): IndiceIntegral {
  const dims: { dimension: 'saber' | 'hacer' | 'deber'; valor: number | null; peso: number }[] = [
    { dimension: 'saber', valor: valores.saberPct == null ? null : saberAEscala5(valores.saberPct), peso: pesos.saber },
    { dimension: 'hacer', valor: valores.hacer, peso: pesos.hacer },
    { dimension: 'deber', valor: valores.deber, peso: pesos.deber },
  ];
  const conDato = dims.filter((d) => d.valor != null && d.peso > 0);
  const sumaPesos = conDato.reduce((s, d) => s + d.peso, 0);

  const aportes: AporteDimension[] = dims.map((d) => {
    const pesoEfectivo = d.valor != null && d.peso > 0 && sumaPesos > 0 ? Math.round((d.peso / sumaPesos) * 10000) / 100 : 0;
    return {
      dimension: d.dimension,
      valor: d.valor,
      pesoConfigurado: d.peso,
      pesoEfectivo,
      aporte: d.valor != null && pesoEfectivo > 0 ? Math.round(d.valor * (pesoEfectivo / 100) * 100) / 100 : null,
    };
  });

  const indice = sumaPesos > 0 ? Math.round(conDato.reduce((s, d) => s + (d.valor as number) * (d.peso / sumaPesos), 0) * 100) / 100 : null;
  const sinDato = dims.filter((d) => d.valor == null && d.peso > 0).map((d) => d.dimension);
  return { indice, semaforo: semaforoIntegral(indice), aportes, incompleto: sinDato.length > 0, dimensionesSinDato: sinDato };
}

export function pesosValidos(p: PesosDimensiones): boolean {
  const todos = [p.saber, p.hacer, p.deber];
  return todos.every((x) => Number.isFinite(x) && x >= 0 && x <= 100) && Math.abs(p.saber + p.hacer + p.deber - 100) < 0.01;
}

// ── Umbrales críticos ────────────────────────────────────────────────────────

export interface NotaPorFuente {
  tipoEvaluador: string;
  nota: number;
}

export interface PesosFuentes {
  lider: number;
  par: number;
  colaborador_a_cargo: number;
  cliente_interno?: number;
}

/**
 * Nota consolidada de un criterio con la misma lógica del índice: promedio por fuente (líder, pares, colaboradores a cargo)
 * y media ponderada por el peso de cada fuente, reescalada a las que sí respondieron. La autoevaluación no cuenta.
 */
export function notaConsolidada(notas: NotaPorFuente[], pesos: PesosFuentes): number | null {
  const fuentes: (keyof PesosFuentes)[] = ['lider', 'par', 'colaborador_a_cargo', 'cliente_interno'];
  let suma = 0;
  let sumaPesos = 0;
  for (const f of fuentes) {
    const delas = notas.filter((n) => n.tipoEvaluador === f).map((n) => n.nota);
    const peso = pesos[f] ?? 0;
    if (delas.length === 0 || peso <= 0) continue;
    suma += (delas.reduce((a, b) => a + b, 0) / delas.length) * peso;
    sumaPesos += peso;
  }
  return sumaPesos > 0 ? Math.round((suma / sumaPesos) * 100) / 100 : null;
}

export interface CriterioConUmbral {
  titulo: string;
  umbral: number;
  justificacion: string | null;
  consolidada: number | null;
}

/** Criterios cuya nota consolidada quedó por debajo de su mínimo crítico. */
export function criteriosBajoUmbral(criterios: CriterioConUmbral[]): CriterioConUmbral[] {
  return criterios.filter((c) => c.consolidada != null && c.consolidada < c.umbral).sort((a, b) => (a.consolidada as number) - (b.consolidada as number));
}
