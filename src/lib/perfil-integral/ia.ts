import type { ContextoBrief } from '@/lib/brief/contexto';
import type { CamposPerfilIntegral } from './borrador';

export const IA_PERFIL_DISPONIBLE = () => Boolean(process.env.ANTHROPIC_API_KEY);

const CLAVES: (keyof CamposPerfilIntegral)[] = ['hipotesis_ser', 'lectura_saber', 'lectura_hacer', 'lectura_deber', 'interpretacion', 'acciones'];

/**
 * Mejora el borrador del perfil integral con Claude. Solo recibe datos ya cruzados (sin documentos ni aspectos íntimos
 * del Ser) y tiene prohibido inventar. La IA propone; quien revisa decide. Si falla, se conserva el borrador automático.
 */
export async function mejorarPerfilConIA(ctx: ContextoBrief, borrador: CamposPerfilIntegral): Promise<CamposPerfilIntegral | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  const datos = {
    persona: ctx.colaborador,
    ciclo: ctx.ciclo,
    ser: { disponible: ctx.ser.disponible, fortalezas: ctx.ser.fortalezas, aAcompanar: ctx.ser.aAcompanar, informe: ctx.ser.informeLider?.slice(0, 1500) ?? null },
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
  };

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      signal: AbortSignal.timeout(45000),
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL_PERFIL || 'claude-sonnet-5-5',
        max_tokens: 4000,
        system:
          'Eres un asistente de Talento Humano que redacta el perfil integral de talento de una persona para su líder y Talento Humano, ' +
          'en español y con tuteo hacia quien lo lee. Recibes datos ya cruzados (Ser, Saber, Hacer, Deber) y un borrador. Reescríbelo con claridad y calidez, ' +
          'breve (máximo 3 frases por campo; las acciones, hasta 6 viñetas que empiecen con "• "). Reglas: usa SOLO los datos entregados; no inventes cifras, hechos, causas ni diagnósticos; ' +
          'el Ser son HIPÓTESIS y recursos para conversar, nunca conclusiones ni explicación automática del desempeño, y nunca hables de aspectos psicológicos, clínicos o de salud; ' +
          'no califiques a la persona como individuo, describe resultados y posibles caminos; termina las acciones con acordar evidencias y una fecha de seguimiento. ' +
          'Responde únicamente un objeto JSON con las claves: ' + CLAVES.join(', ') + ', todas con texto.',
        messages: [{ role: 'user', content: `DATOS:\n${JSON.stringify(datos)}\n\nBORRADOR AUTOMÁTICO:\n${JSON.stringify(borrador)}` }],
      }),
    });
    if (!r.ok) {
      console.error('[perfil-ia] la API respondió', r.status);
      return null;
    }
    const j = await r.json();
    const texto: string = ((j?.content ?? []) as { type: string; text?: string }[]).filter((b) => b.type === 'text').map((b) => b.text ?? '').join('\n');
    const m = texto.match(/\{[\s\S]*\}/);
    if (!m) return null;
    const o = JSON.parse(m[0]);
    const salida = {} as CamposPerfilIntegral;
    for (const k of CLAVES) {
      const v = typeof o[k] === 'string' ? o[k] : Array.isArray(o[k]) ? o[k].map((x: unknown) => `• ${String(x).replace(/^•\s*/, '')}`).join('\n') : '';
      if (!v.trim()) return null;
      salida[k] = v.trim();
    }
    return salida;
  } catch (e) {
    console.error('[perfil-ia] error', (e as Error).message);
    return null;
  }
}
