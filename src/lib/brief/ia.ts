import type { ContextoBrief } from './contexto';
import type { CamposBrief } from './borrador';

export const IA_BRIEF_DISPONIBLE = () => Boolean(process.env.ANTHROPIC_API_KEY);

const CLAVES: (keyof CamposBrief)[] = ['talento_central', 'resumen_ser', 'resumen_saber', 'resumen_hacer', 'resumen_deber', 'sugerencias_enfoque'];

/**
 * Mejora la redacción del borrador con Claude. Solo recibe los datos ya cruzados
 * (nunca documentos ni aspectos íntimos del Ser) y no puede inventar información.
 * Si falla o no hay clave, devuelve null y se conserva el borrador automático.
 */
export async function mejorarBorradorConIA(ctx: ContextoBrief, borrador: CamposBrief): Promise<CamposBrief | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  const datos = {
    persona: ctx.colaborador,
    ciclo: ctx.ciclo,
    ser: { ...ctx.ser, informeLider: ctx.ser.informeLider?.slice(0, 1500) ?? null },
    saber: ctx.saber,
    desempeno: {
      indiceHacer: ctx.desempeno.indiceHacer,
      indiceDeber: ctx.desempeno.indiceDeber,
      semaforoHacer: ctx.desempeno.semaforoHacer,
      semaforoDeber: ctx.desempeno.semaforoDeber,
      brechaHacer: ctx.desempeno.brechaHacer,
      brechaDeber: ctx.desempeno.brechaDeber,
      items: ctx.desempeno.items.slice(0, 40),
    },
    planesAbiertos: ctx.planesAbiertos,
  };

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      signal: AbortSignal.timeout(45000),
      body: JSON.stringify({
        model: 'claude-sonnet-5',
        max_tokens: 4000,
        system:
          'Eres un asistente de Talento Humano que prepara al líder para una conversación de retroalimentación. ' +
          'Recibes datos ya cruzados de una persona (Ser, Saber, Hacer y Deber) y un borrador. Reescríbelo en español, con tuteo hacia el líder, ' +
          'claro, humano y breve (máximo 3 frases por campo, sugerencias hasta 5 frases). Usa SOLO los datos entregados: no inventes cifras, hechos, ' +
          'diagnósticos ni causas. No hables de aspectos psicológicos o de salud. Enfoca la conversación en el crecimiento y termina las sugerencias ' +
          'con el Acuerdo de crecimiento. Responde únicamente un objeto JSON con las claves: ' +
          CLAVES.join(', ') + '.',
        messages: [{ role: 'user', content: `DATOS:\n${JSON.stringify(datos)}\n\nBORRADOR AUTOMÁTICO:\n${JSON.stringify(borrador)}` }],
      }),
    });
    if (!r.ok) {
      console.error('[brief-ia] la API respondió', r.status);
      return null;
    }
    const j = await r.json();
    const texto: string = ((j?.content ?? []) as { type: string; text?: string }[])
      .filter((b) => b.type === 'text')
      .map((b) => b.text ?? '')
      .join('\n');
    const m = texto.match(/\{[\s\S]*\}/);
    if (!m) {
      console.error('[brief-ia] la respuesta no trae JSON');
      return null;
    }
    const o = JSON.parse(m[0]);
    const salida = {} as CamposBrief;
    for (const k of CLAVES) {
      if (typeof o[k] !== 'string' || !o[k].trim()) {
        console.error('[brief-ia] falta o no es texto la clave', k);
        return null;
      }
      salida[k] = o[k].trim();
    }
    return salida;
  } catch (e) {
    console.error('[brief-ia] error', (e as Error).message);
    return null;
  }
}
