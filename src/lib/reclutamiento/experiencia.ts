// Cálculo de tiempo de experiencia. Regla del requerimiento (§10.5): los
// periodos que se superponen no se cuentan dos veces al medir tiempo total.

export interface PeriodoLaboral {
  inicio: Date;
  /** Fin del periodo. Para un cargo en curso, la fecha de hoy. */
  fin: Date;
}

/** Suma de meses de los periodos, fusionando los que se superponen. */
export function mesesFusionados(periodos: PeriodoLaboral[]): number {
  const ordenados = periodos
    .filter((p) => p.fin.getTime() > p.inicio.getTime())
    .map((p) => ({ inicio: p.inicio.getTime(), fin: p.fin.getTime() }))
    .sort((a, b) => a.inicio - b.inicio);

  const fusionados: Array<{ inicio: number; fin: number }> = [];
  for (const p of ordenados) {
    const ultimo = fusionados[fusionados.length - 1];
    if (ultimo && p.inicio <= ultimo.fin) {
      ultimo.fin = Math.max(ultimo.fin, p.fin);
    } else {
      fusionados.push({ ...p });
    }
  }

  const DIA_MS = 24 * 60 * 60 * 1000;
  const dias = fusionados.reduce((total, p) => total + (p.fin - p.inicio) / DIA_MS, 0);
  return Math.round(dias / 30.44);
}

/** Años con un decimal, para mostrar en la ficha. */
export function aniosDesdeMeses(meses: number): number {
  return Math.round((meses / 12) * 10) / 10;
}
