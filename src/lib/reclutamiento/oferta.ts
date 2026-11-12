/**
 * Borrador de la oferta de una vacante a partir del perfil del cargo (objetivo, funciones, habilidades, formación y
 * experiencia). Funciona sin IA; con IA se mejora la redacción. La IA nunca inventa salario, beneficios ni condiciones:
 * solo reordena y redacta lo que ya está en el perfil y en los datos que Talento Humano escribió.
 */

export const MODALIDADES: { valor: 'presencial' | 'hibrido' | 'remoto'; etiqueta: string }[] = [
  { valor: 'presencial', etiqueta: 'Presencial' },
  { valor: 'hibrido', etiqueta: 'Híbrido' },
  { valor: 'remoto', etiqueta: 'Remoto' },
];

export const ETIQUETA_MODALIDAD: Record<string, string> = Object.fromEntries(MODALIDADES.map((m) => [m.valor, m.etiqueta]));

export interface PerfilCargoOferta {
  nombre: string;
  objetivo: string | null;
  funciones: string[];
  habilidades: string[];
  formacionNivel: string | null;
  formacionTitulo: string | null;
  experienciaMeses: number | null;
}

export interface OfertaGenerada {
  descripcion: string;
  requisitos: string;
}

const NIVEL_FORMACION: Record<string, string> = {
  bachillerato: 'Bachillerato',
  tecnico: 'Técnico',
  tecnologo: 'Tecnólogo',
  universitario: 'Universitario',
};

export function borradorOferta(p: PerfilCargoOferta, titulo: string): OfertaGenerada {
  const partes: string[] = [];
  partes.push(`Buscamos a alguien para el cargo de ${titulo || p.nombre}.`);
  if (p.objetivo) partes.push(p.objetivo.trim().replace(/\s+/g, ' '));
  if (p.funciones.length) partes.push(`Entre tus principales responsabilidades estarán: ${p.funciones.slice(0, 5).map((f) => f.trim().replace(/[.;]+$/, '').toLowerCase()).join('; ')}.`);

  const req: string[] = [];
  if (p.formacionNivel && NIVEL_FORMACION[p.formacionNivel]) req.push(`Formación: ${NIVEL_FORMACION[p.formacionNivel]}${p.formacionTitulo ? ` en ${p.formacionTitulo}` : ''}`);
  if (p.experienciaMeses) req.push(`Experiencia: mínimo ${p.experienciaMeses >= 12 ? `${Math.round((p.experienciaMeses / 12) * 10) / 10} año(s)` : `${p.experienciaMeses} meses`}`);
  for (const h of p.habilidades.slice(0, 6)) req.push(h);
  return { descripcion: partes.join(' '), requisitos: req.map((r) => `• ${r}`).join('\n') };
}

export const IA_OFERTA_DISPONIBLE = () => Boolean(process.env.ANTHROPIC_API_KEY);

export async function mejorarOfertaConIA(
  p: PerfilCargoOferta,
  datos: { titulo: string; modalidad?: string | null; ciudad?: string | null; horario?: string | null; tipoContrato?: string | null; beneficios?: string | null; empresa?: string | null },
  borrador: OfertaGenerada
): Promise<OfertaGenerada | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      signal: AbortSignal.timeout(45000),
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL_OFERTA || 'claude-sonnet-5-5',
        max_tokens: 2000,
        system:
          'Eres un redactor de ofertas laborales para una empresa colombiana. Recibes el perfil del cargo, datos de la vacante y un borrador. ' +
          'Escribe en español, claro, cálido y atractivo, en segunda persona (tú). Reglas estrictas: usa SOLO la información entregada; ' +
          'NO inventes salario, beneficios, horarios, ciudad, modalidad ni requisitos que no estén en los datos; no uses lenguaje discriminatorio ni pidas edad, sexo, estado civil o foto; ' +
          'no hables de la empresa más allá del nombre. "descripcion": máximo 120 palabras, en uno o dos párrafos cortos. "requisitos": hasta 8 viñetas, cada una en una línea que empiece con "• ". ' +
          'Responde únicamente un objeto JSON con las claves "descripcion" y "requisitos", ambas texto.',
        messages: [{ role: 'user', content: `PERFIL DEL CARGO:\n${JSON.stringify(p)}\n\nDATOS DE LA VACANTE:\n${JSON.stringify(datos)}\n\nBORRADOR:\n${JSON.stringify(borrador)}` }],
      }),
    });
    if (!r.ok) {
      console.error('[oferta-ia] la API respondió', r.status);
      return null;
    }
    const j = await r.json();
    const texto: string = ((j?.content ?? []) as { type: string; text?: string }[]).filter((b) => b.type === 'text').map((b) => b.text ?? '').join('\n');
    const m = texto.match(/\{[\s\S]*\}/);
    if (!m) return null;
    const o = JSON.parse(m[0]);
    const req = typeof o.requisitos === 'string' ? o.requisitos : Array.isArray(o.requisitos) ? o.requisitos.map((x: unknown) => `• ${String(x).replace(/^•\s*/, '')}`).join('\n') : '';
    if (typeof o.descripcion !== 'string' || !o.descripcion.trim() || !req.trim()) return null;
    return { descripcion: o.descripcion.trim(), requisitos: req.trim() };
  } catch (e) {
    console.error('[oferta-ia] error', (e as Error).message);
    return null;
  }
}
