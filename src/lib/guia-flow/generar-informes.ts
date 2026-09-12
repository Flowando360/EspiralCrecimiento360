import type { SupabaseClient } from '@supabase/supabase-js';

// ── Informes sintetizados (IA) — núcleo reusable ────────────────────────────
// Extraído de colaboradores/[id]/guia-flow/actions.ts para poder llamarlo
// tanto desde la acción manual (con sesión, RLS activo) como desde el
// endpoint que dispara guiadelflow apenas alguien termina su Guía del Flow, y
// desde el cron de respaldo — ninguno de los dos tiene sesión de usuario, así
// que usan el cliente admin. Por eso el filtro de "no sensible" se hace acá
// mismo en código, no solo se confía en RLS (que con el cliente admin queda
// sin efecto): ver 0051_ser_privacidad_organizacional.sql.

const SYSTEM_INFORME_LIDER = `Eres un asistente de Talento Humano. A partir de una lista de aspectos profesionales evaluados en escala 1-5 (talentos, propósito, estilo de liderazgo, comunicación, trabajo en equipo, compromiso, adaptación al cambio, negociación, recursividad), escribe en español un informe breve (200-300 palabras) dirigido al LÍDER de esa persona, para que enfoque su Plan de Desarrollo Individual.

Estructura: (1) talentos a aprovechar, (2) qué la/lo motiva, (3) cómo comunicarse y liderarla/o, (4) 2-3 sugerencias concretas para el PDI. Tono profesional, cálido y orientado a la acción.

IMPORTANTE: solo tienes los aspectos de la lista. No tienes ni debes mencionar infancia, pasado, estabilidad emocional, felicidad, dependencia, sanación, frustración, sentido de pertenencia ni ningún tema psicológico o de vida personal — esa información existe pero es privada y nunca te fue entregada. No la inventes ni sugieras que existe.`;

const SYSTEM_INFORME_COLABORADOR = `Eres un asistente de desarrollo profesional. A partir de una lista de aspectos profesionales evaluados en escala 1-5 (talentos, propósito, estilo de liderazgo, comunicación, trabajo en equipo, compromiso, adaptación al cambio, negociación, recursividad), escribe en español un informe breve (200-300 palabras) dirigido DIRECTAMENTE a esa persona (en segunda persona, tono cercano y alentador), que le ayude a recordar en qué es fuerte profesionalmente y en qué puede seguir trabajando.

Aclara que esto es un complemento breve, no un reemplazo de su Guía del Flow completa (que ya recibió por su cuenta). Cierra con una invitación a seguir explorando esa Guía si quiere profundizar en su autoconocimiento.

IMPORTANTE: solo tienes los aspectos de la lista. No tienes ni debes mencionar infancia, pasado, estabilidad emocional, felicidad, dependencia, sanación, frustración, sentido de pertenencia ni ningún tema psicológico o de vida personal — esa información existe pero es privada y nunca te fue entregada. No la inventes ni sugieras que existe.`;

async function pedirInformeAClaude(apiKey: string, system: string, listaAspectos: string): Promise<string> {
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: 'claude-sonnet-5',
      max_tokens: 700,
      system,
      messages: [{ role: 'user', content: `Aspectos evaluados (escala 1-5):\n${listaAspectos}` }],
    }),
  });
  const data = await r.json();
  if (!r.ok) {
    console.error('Error de la API de Anthropic (informe Ser):', r.status, JSON.stringify(data));
    throw new Error('Hubo un problema consultando la IA. Ya quedó registrado para revisión.');
  }
  return data?.content?.[0]?.text ?? '';
}

/**
 * Genera (o regenera) los dos informes sintetizados de una aplicación de la
 * Guía del Flow, a partir de los puntajes ya cargados de los aspectos NO
 * sensibles. No hace ningún chequeo de permisos de usuario — eso es
 * responsabilidad de quien llama (la acción con sesión valida rol/equipo; el
 * endpoint y el cron validan el secreto compartido / CRON_SECRET).
 */
export async function generarInformesParaGuia(
  supabase: SupabaseClient,
  guiaDelFlowId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { ok: false, error: 'Falta configurar ANTHROPIC_API_KEY para poder generar el informe.' };
  }

  const { data: puntajesRaw } = await supabase
    .from('ser_puntajes')
    .select('puntaje, nota, ser_aspectos(nombre, sensible)')
    .eq('guia_del_flow_id', guiaDelFlowId);

  const aspectos = ((puntajesRaw ?? []) as any[])
    // Defensa en profundidad: con el cliente admin (sin sesión) RLS no
    // filtra los aspectos sensibles, así que se excluyen acá explícitamente.
    .filter((p) => p.ser_aspectos?.nombre && p.ser_aspectos?.sensible === false)
    .map((p) => (p.nota ? `${p.ser_aspectos.nombre}: ${p.nota} (${p.puntaje}/5)` : `${p.ser_aspectos.nombre}: ${p.puntaje}/5`));

  if (aspectos.length === 0) {
    return { ok: false, error: 'No hay puntajes de aspectos con relevancia laboral cargados todavía.' };
  }

  const listaAspectos = aspectos.join('\n');

  let informeLider: string;
  let informeColaborador: string;
  try {
    [informeLider, informeColaborador] = await Promise.all([
      pedirInformeAClaude(apiKey, SYSTEM_INFORME_LIDER, listaAspectos),
      pedirInformeAClaude(apiKey, SYSTEM_INFORME_COLABORADOR, listaAspectos),
    ]);
  } catch (e: any) {
    return { ok: false, error: e.message ?? 'Error generando los informes' };
  }

  const ahora = new Date().toISOString();
  const { error: errorUpdate } = await supabase
    .from('guia_del_flow')
    .update({
      informe_lider: informeLider,
      informe_lider_generado_at: ahora,
      informe_colaborador: informeColaborador,
      informe_colaborador_generado_at: ahora,
    })
    .eq('id', guiaDelFlowId);

  if (errorUpdate) return { ok: false, error: errorUpdate.message };

  return { ok: true };
}
