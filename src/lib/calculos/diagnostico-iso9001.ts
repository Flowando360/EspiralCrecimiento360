export type NivelDiagnostico = 'no_cumple' | 'cumple_minimamente' | 'en_desarrollo' | 'cumple_parcialmente' | 'cumple_completamente' | 'no_aplica';

/** Escala real de 5 niveles (Documentos/Diagnostico ISO 9001.xlsx), no 4. */
export const PUNTAJE_NIVEL: Record<Exclude<NivelDiagnostico, 'no_aplica'>, number> = {
  no_cumple: 0,
  cumple_minimamente: 0.25,
  en_desarrollo: 0.5,
  cumple_parcialmente: 0.75,
  cumple_completamente: 1,
};

/**
 * Peso de cada cláusula en el puntaje general — tomado literalmente de la
 * hoja "Criterios" del Excel real: la 8 (Operación) pesa el doble que la
 * mayoría porque es "el corazón del SGC". Suma 1.00. Es fijo por la norma,
 * no configurable por empresa, por eso vive en código y no en la BD.
 */
export const PESO_CLAUSULA: Record<number, number> = {
  4: 0.1,
  5: 0.15,
  6: 0.15,
  7: 0.15,
  8: 0.25,
  9: 0.15,
  10: 0.05,
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
  peso: number;
  itemsRespondidos: number;
  itemsAplicables: number;
  itemsTotal: number;
  puntaje: number | null; // 0-100%, null = todavía nada respondido o aplicable
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
 * general, con la metodología real: dentro de cada cláusula es un promedio
 * simple de los ítems aplicables (así lo hace su Excel: cláusula 4 con
 * puntajes 1/0/0/0.25 da 0.3125 = promedio de los 4); el puntaje general es
 * la suma de (promedio de cada cláusula × su peso) — verificado contra las
 * cifras de su hoja "Criterios" ("Nivel esperado" × "Resultado" por
 * cláusula), no un promedio simple de las 28 respuestas.
 *
 * "No aplica" se excluye del promedio (no cuenta ni a favor ni en contra);
 * un ítem sin responder tampoco entra al promedio todavía, pero sí se
 * cuenta como pendiente.
 */
export function calcularDiagnosticoIso9001(items: ItemDiagnostico[], respuestas: RespuestaDiagnostico[]): ResultadoDiagnostico {
  const nivelPorItem = new Map(respuestas.map((r) => [r.item_id, r.nivel]));

  const clausulas = Array.from(new Set(items.map((i) => i.clausula))).sort((a, b) => a - b);

  const porClausula: PuntajeClausula[] = clausulas.map((clausula) => {
    const itemsDeClausula = items.filter((i) => i.clausula === clausula);
    let sumaFraccion = 0;
    let itemsAplicables = 0;
    let itemsRespondidos = 0;

    for (const item of itemsDeClausula) {
      const nivel = nivelPorItem.get(item.id);
      if (!nivel) continue;
      itemsRespondidos += 1;
      if (nivel === 'no_aplica') continue;
      itemsAplicables += 1;
      sumaFraccion += PUNTAJE_NIVEL[nivel];
    }

    return {
      clausula,
      peso: PESO_CLAUSULA[clausula] ?? 0,
      itemsRespondidos,
      itemsAplicables,
      itemsTotal: itemsDeClausula.length,
      puntaje: itemsAplicables > 0 ? Math.round((sumaFraccion / itemsAplicables) * 100) : null,
    };
  });

  let sumaPonderada = 0;
  let pesoConDatos = 0;
  for (const c of porClausula) {
    if (c.puntaje === null) continue;
    sumaPonderada += (c.puntaje / 100) * c.peso;
    pesoConDatos += c.peso;
  }

  const respondidosGeneral = porClausula.reduce((acc, c) => acc + c.itemsRespondidos, 0);

  return {
    // Se re-normaliza por el peso de las cláusulas que sí tienen datos, para
    // que un diagnóstico a medio llenar no aparezca artificialmente bajo
    // solo porque las cláusulas sin responder cuentan como 0.
    puntajeGeneral: pesoConDatos > 0 ? Math.round((sumaPonderada / pesoConDatos) * 100) : null,
    itemsRespondidos: respondidosGeneral,
    itemsTotal: items.length,
    porClausula,
  };
}
