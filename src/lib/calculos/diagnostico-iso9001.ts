export type NivelDiagnostico = 'no_cumple' | 'cumple_parcial' | 'cumple' | 'no_aplica';

export const PUNTAJE_NIVEL: Record<Exclude<NivelDiagnostico, 'no_aplica'>, number> = {
  no_cumple: 0,
  cumple_parcial: 50,
  cumple: 100,
};

export interface ItemDiagnostico {
  id: string;
  clausula: number;
  numeral: string;
  titulo: string;
}

export interface RespuestaDiagnostico {
  item_id: string;
  nivel: NivelDiagnostico | null;
}

export interface PuntajeClausula {
  clausula: number;
  itemsRespondidos: number;
  itemsAplicables: number;
  itemsTotal: number;
  puntaje: number | null; // null = todavía nada respondido o aplicable
}

export interface ResultadoDiagnostico {
  puntajeGeneral: number | null;
  itemsRespondidos: number;
  itemsTotal: number;
  porClausula: PuntajeClausula[];
}

const TITULO_CLAUSULA: Record<number, string> = {
  4: 'Contexto de la organización',
  5: 'Liderazgo',
  6: 'Planificación',
  7: 'Apoyo',
  8: 'Operación',
  9: 'Evaluación del desempeño',
  10: 'Mejora',
};

export function tituloClausula(clausula: number): string {
  return TITULO_CLAUSULA[clausula] ?? `Cláusula ${clausula}`;
}

/**
 * Calcula el puntaje del diagnóstico ISO 9001 (0-100%) por cláusula y
 * general. "No aplica" se excluye del promedio (no cuenta ni a favor ni en
 * contra); un ítem sin responder tampoco entra al promedio todavía, pero sí
 * se cuenta como pendiente para mostrar el avance.
 */
export function calcularDiagnosticoIso9001(items: ItemDiagnostico[], respuestas: RespuestaDiagnostico[]): ResultadoDiagnostico {
  const nivelPorItem = new Map(respuestas.map((r) => [r.item_id, r.nivel]));

  const clausulas = Array.from(new Set(items.map((i) => i.clausula))).sort((a, b) => a - b);

  const porClausula: PuntajeClausula[] = clausulas.map((clausula) => {
    const itemsDeClausula = items.filter((i) => i.clausula === clausula);
    let sumaPuntaje = 0;
    let itemsAplicables = 0;
    let itemsRespondidos = 0;

    for (const item of itemsDeClausula) {
      const nivel = nivelPorItem.get(item.id);
      if (!nivel) continue;
      itemsRespondidos += 1;
      if (nivel === 'no_aplica') continue;
      itemsAplicables += 1;
      sumaPuntaje += PUNTAJE_NIVEL[nivel];
    }

    return {
      clausula,
      itemsRespondidos,
      itemsAplicables,
      itemsTotal: itemsDeClausula.length,
      puntaje: itemsAplicables > 0 ? Math.round(sumaPuntaje / itemsAplicables) : null,
    };
  });

  let sumaGeneral = 0;
  let aplicablesGeneral = 0;
  let respondidosGeneral = 0;
  for (const item of items) {
    const nivel = nivelPorItem.get(item.id);
    if (!nivel) continue;
    respondidosGeneral += 1;
    if (nivel === 'no_aplica') continue;
    aplicablesGeneral += 1;
    sumaGeneral += PUNTAJE_NIVEL[nivel];
  }

  return {
    puntajeGeneral: aplicablesGeneral > 0 ? Math.round(sumaGeneral / aplicablesGeneral) : null,
    itemsRespondidos: respondidosGeneral,
    itemsTotal: items.length,
    porClausula,
  };
}
