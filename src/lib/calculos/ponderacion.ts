/**
 * Réplica en TypeScript del cálculo que hace el trigger de Postgres
 * (fn_recalcular_resultados_evaluacion, en 0006_triggers_calculo_tiempo_real.sql).
 * Se usa para previsualizar en el cliente el efecto de cambiar los pesos de
 * ponderación desde el panel de Administración, antes de guardarlos.
 */

export interface PesosPonderacion {
  lider: number;
  pares: number;
  colaboradoresACargo: number;
}

export interface PromediosPorFuente {
  lider?: number;
  pares?: number;
  colaboradoresACargo?: number;
}

export function calcularIndiceConsolidado(
  promedios: PromediosPorFuente,
  pesos: PesosPonderacion,
  tienePersonalACargo: boolean
): number | null {
  const fuentes: { valor?: number; peso: number }[] = [
    { valor: promedios.lider, peso: pesos.lider },
    { valor: promedios.pares, peso: pesos.pares },
  ];

  if (tienePersonalACargo) {
    fuentes.push({ valor: promedios.colaboradoresACargo, peso: pesos.colaboradoresACargo });
  }

  const disponibles = fuentes.filter((f) => f.valor !== undefined);
  if (disponibles.length === 0) return null;

  const sumaPesos = disponibles.reduce((acc, f) => acc + f.peso, 0);
  const sumaPonderada = disponibles.reduce((acc, f) => acc + (f.valor as number) * f.peso, 0);

  return sumaPesos > 0 ? Math.round((sumaPonderada / sumaPesos) * 100) / 100 : null;
}

/** Pesos de referencia por defecto (Tabla 6 del documento) */
export const PESOS_REFERENCIA = {
  conEquipo: { lider: 0.4, pares: 0.3, colaboradoresACargo: 0.3 } satisfies PesosPonderacion,
  sinEquipo: { lider: 0.6, pares: 0.4, colaboradoresACargo: 0 } satisfies PesosPonderacion,
};
