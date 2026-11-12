/**
 * Apoyo de IA para el análisis FODA (informe de pruebas, 9.3). La IA solo PROPONE:
 *  - priorización de cada factor (impacto y probabilidad, 1 a 3) con una sugerencia de qué hacer;
 *  - estrategias cruzadas (FO, FA, DO, DA) que combinan factores concretos del propio análisis.
 * Lo que devuelve se valida y se guarda como propuesta; Talento Humano aprueba o descarta.
 */

export type TipoFactor = 'fortaleza' | 'oportunidad' | 'debilidad' | 'amenaza';
export type TipoEstrategia = 'fo' | 'fa' | 'do' | 'da';

export interface FactorEntrada {
  tipo: TipoFactor;
  descripcion: string;
}

/** Qué dos tipos de factor debe cruzar cada estrategia. */
export const CRUCE_ESTRATEGIA: Record<TipoEstrategia, [TipoFactor, TipoFactor]> = {
  fo: ['fortaleza', 'oportunidad'],
  fa: ['fortaleza', 'amenaza'],
  do: ['debilidad', 'oportunidad'],
  da: ['debilidad', 'amenaza'],
};

export const MODELO_FODA = process.env.ANTHROPIC_MODEL_FODA || 'claude-sonnet-5-5';

const ETIQUETA: Record<TipoFactor, string> = { fortaleza: 'Fortaleza', oportunidad: 'Oportunidad', debilidad: 'Debilidad', amenaza: 'Amenaza' };

function listarFactores(factores: FactorEntrada[]): string {
  return factores.map((f, i) => `${i + 1}. [${ETIQUETA[f.tipo]}] ${f.descripcion}`).join('\n');
}

async function llamar(system: string, user: string, herramienta: { name: string; description: string; input_schema: Record<string, unknown> }): Promise<{ ok: true; input: any } | { ok: false; error: string }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return { ok: false, error: 'La IA no está configurada (falta ANTHROPIC_API_KEY). Puedes agregar las estrategias a mano.' };
  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: MODELO_FODA,
        max_tokens: 3000,
        system,
        tools: [herramienta],
        tool_choice: { type: 'tool', name: herramienta.name },
        messages: [{ role: 'user', content: user }],
      }),
    });
    const data = await r.json();
    if (!r.ok) {
      console.error('Error de la API de Anthropic (FODA):', r.status, JSON.stringify(data));
      return { ok: false, error: 'La IA no pudo responder ahora. Intenta de nuevo en un momento.' };
    }
    const uso = (data?.content ?? []).find((b: { type: string }) => b.type === 'tool_use');
    if (!uso?.input) return { ok: false, error: 'La IA no devolvió un resultado utilizable. Intenta de nuevo.' };
    return { ok: true, input: uso.input };
  } catch (e) {
    console.error('Error de red consultando Anthropic (FODA):', e);
    return { ok: false, error: 'No se pudo conectar con la IA. Intenta de nuevo.' };
  }
}

const BASE_SISTEMA =
  'Eres un asesor de gestión organizacional para empresas colombianas. Trabajas SOLO con los factores del análisis FODA que se te dan: ' +
  'no inventes hechos, cifras ni datos de la empresa que no estén en ellos. Escribe en español, en frases cortas, concretas y accionables.';

export interface PriorizacionIA {
  indice: number; // 1-based
  impacto: 1 | 2 | 3;
  probabilidad: 1 | 2 | 3;
  sugerencia: string;
}

/** Propone impacto, probabilidad y qué hacer con cada factor. */
export async function priorizarFactoresIA(empresa: string, factores: FactorEntrada[]): Promise<{ ok: true; items: PriorizacionIA[] } | { ok: false; error: string }> {
  const res = await llamar(
    BASE_SISTEMA +
      ' Para cada factor propón: impacto (1 bajo, 2 medio, 3 alto) en la empresa y probabilidad (1 baja, 2 media, 3 alta) de que ocurra o se aproveche. ' +
      'Y una sugerencia breve (máx. 25 palabras) que empiece con una de estas tres decisiones: «Convertir en riesgo formal», «Llevar al plan de trabajo» o «Solo seguimiento», seguida del porqué.',
    `Empresa: ${empresa}\n\nFactores del análisis FODA:\n${listarFactores(factores)}\n\nPriorízalos todos.`,
    {
      name: 'priorizacion_foda',
      description: 'Impacto, probabilidad y sugerencia para cada factor del FODA.',
      input_schema: {
        type: 'object',
        properties: {
          factores: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                indice: { type: 'integer', description: 'Número del factor tal como aparece en la lista (empieza en 1).' },
                impacto: { type: 'integer', enum: [1, 2, 3] },
                probabilidad: { type: 'integer', enum: [1, 2, 3] },
                sugerencia: { type: 'string' },
              },
              required: ['indice', 'impacto', 'probabilidad', 'sugerencia'],
            },
          },
        },
        required: ['factores'],
      },
    }
  );
  if (!res.ok) return res;

  const vistos = new Set<number>();
  const items: PriorizacionIA[] = [];
  for (const f of (res.input.factores ?? []) as any[]) {
    const indice = Number(f.indice);
    const impacto = Number(f.impacto);
    const probabilidad = Number(f.probabilidad);
    if (!Number.isInteger(indice) || indice < 1 || indice > factores.length || vistos.has(indice)) continue;
    if (![1, 2, 3].includes(impacto) || ![1, 2, 3].includes(probabilidad)) continue;
    vistos.add(indice);
    items.push({ indice, impacto: impacto as 1 | 2 | 3, probabilidad: probabilidad as 1 | 2 | 3, sugerencia: String(f.sugerencia ?? '').trim().slice(0, 300) });
  }
  if (items.length === 0) return { ok: false, error: 'La IA no devolvió una priorización válida. Intenta de nuevo.' };
  return { ok: true, items };
}

export interface EstrategiaIA {
  tipo: TipoEstrategia;
  descripcion: string;
  indices: number[]; // 1-based
}

/** Propone estrategias que cruzan factores concretos (hasta 3 por tipo). */
export async function generarEstrategiasIA(empresa: string, factores: FactorEntrada[]): Promise<{ ok: true; estrategias: EstrategiaIA[] } | { ok: false; error: string }> {
  const res = await llamar(
    BASE_SISTEMA +
      ' Construye estrategias cruzadas (matriz TOWS) de cuatro tipos: ' +
      'FO = usar fortalezas para aprovechar oportunidades; FA = usar fortalezas para enfrentar amenazas; ' +
      'DO = superar debilidades aprovechando oportunidades; DA = reducir debilidades y evitar amenazas. ' +
      'Máximo 3 estrategias por tipo, solo si hay factores que realmente se puedan cruzar. Cada estrategia debe ser una acción concreta (qué se haría) y citar los números de los factores que cruza: ' +
      'al menos uno de cada uno de los dos tipos que ese cruce combina. No repitas ideas.',
    `Empresa: ${empresa}\n\nFactores del análisis FODA:\n${listarFactores(factores)}\n\nPropón las estrategias.`,
    {
      name: 'estrategias_foda',
      description: 'Estrategias cruzadas FO, FA, DO y DA basadas en los factores dados.',
      input_schema: {
        type: 'object',
        properties: {
          estrategias: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                tipo: { type: 'string', enum: ['fo', 'fa', 'do', 'da'] },
                descripcion: { type: 'string', description: 'La acción estratégica, máx. 40 palabras.' },
                indices: { type: 'array', items: { type: 'integer' }, description: 'Números de los factores que cruza.' },
              },
              required: ['tipo', 'descripcion', 'indices'],
            },
          },
        },
        required: ['estrategias'],
      },
    }
  );
  if (!res.ok) return res;

  const porTipo: Record<TipoEstrategia, number> = { fo: 0, fa: 0, do: 0, da: 0 };
  const estrategias: EstrategiaIA[] = [];
  for (const e of (res.input.estrategias ?? []) as any[]) {
    const tipo = e.tipo as TipoEstrategia;
    if (!(tipo in CRUCE_ESTRATEGIA) || porTipo[tipo] >= 3) continue;
    const descripcion = String(e.descripcion ?? '').trim();
    if (!descripcion) continue;
    const indices = Array.from(new Set(((e.indices ?? []) as unknown[]).map(Number))).filter((i) => Number.isInteger(i) && i >= 1 && i <= factores.length);
    // Debe cruzar de verdad: al menos un factor de cada uno de los dos tipos del cruce.
    const [a, b] = CRUCE_ESTRATEGIA[tipo];
    const tipos = new Set(indices.map((i) => factores[i - 1]!.tipo));
    if (!tipos.has(a) || !tipos.has(b)) continue;
    porTipo[tipo]++;
    estrategias.push({ tipo, descripcion: descripcion.slice(0, 600), indices });
  }
  if (estrategias.length === 0) return { ok: false, error: 'La IA no pudo armar estrategias que crucen tus factores. Revisa que tengas fortalezas, oportunidades, debilidades y amenazas, e intenta de nuevo.' };
  return { ok: true, estrategias };
}
