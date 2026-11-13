import type { SupabaseClient } from '@supabase/supabase-js';

// ── Informes sintetizados (IA) — núcleo reusable ────────────────────────────
// Extraído de colaboradores/[id]/guia-flow/actions.ts para poder llamarlo
// tanto desde la acción manual (con sesión, RLS activo) como desde el
// endpoint que dispara guiadelflow apenas alguien termina su Guía del Flow, y
// desde el cron de respaldo — ninguno de los dos tiene sesión de usuario, así
// que usan el cliente admin. Por eso el filtro de "no sensible" se hace acá
// mismo en código, no solo se confía en RLS (que con el cliente admin queda
// sin efecto): ver 0051_ser_privacidad_organizacional.sql.

const SYSTEM_INFORME_LIDER = `Eres un asistente de Talento Humano. A partir de un esquema de aspectos con relevancia laboral (talentos, propósito, liderazgo, comunicación, trabajo en equipo, compromiso, adaptación al cambio, negociación, recursividad, inteligencias), cada uno con título, descripción y una lectura descriptiva (para aprovechar, en equilibrio o para acompañar; no es una nota), escribe en español un informe breve (200-300 palabras) dirigido al LÍDER de esa persona, para que enfoque su Plan de Desarrollo Individual.

Estructura: (1) talentos a aprovechar, (2) qué motiva a la persona, (3) cómo comunicarse con la persona y acompañar su trabajo, (4) 2-3 sugerencias concretas para el PDI. Tono profesional, cálido y orientado a la acción.

Formato y estilo: usa títulos cortos con ## y, si ayuda, viñetas con guion; sin tablas. No uses números, notas, puntajes ni escalas (el Ser se describe, no se califica). Lenguaje neutro en género: di "la persona" o "esta persona", nunca "la/lo", "ella" ni "él", y evita adjetivos o participios con género ("sujeta", "motivado", "capaz de ella"): usa construcciones como "tiene capacidad de…", "se motiva cuando…".

IMPORTANTE: solo tienes los aspectos de la lista. No tienes ni debes mencionar infancia, pasado, estabilidad emocional, felicidad, dependencia, sanación, frustración, sentido de pertenencia ni ningún tema psicológico o de vida personal — esa información existe pero es privada y nunca te fue entregada. No la inventes ni sugieras que existe.`;

const SYSTEM_INFORME_COLABORADOR = `Eres un asistente de desarrollo profesional. A partir de un esquema de aspectos con relevancia laboral (talentos, propósito, liderazgo, comunicación, trabajo en equipo, compromiso, adaptación al cambio, negociación, recursividad, inteligencias), cada uno con título, descripción y una lectura descriptiva (para aprovechar, en equilibrio o para acompañar; no es una nota), escribe en español un informe breve (200-300 palabras) dirigido DIRECTAMENTE a esa persona (en segunda persona, tono cercano y alentador), que le ayude a recordar en qué es fuerte profesionalmente y en qué puede seguir trabajando.

Aclara que esto es un complemento breve, no un reemplazo de su Guía del Flow completa (que ya recibió por su cuenta). Cierra con una invitación a seguir explorando esa Guía si quiere profundizar en su autoconocimiento.

Formato y estilo: párrafos cortos, con uno o dos títulos con ## si ayuda; sin tablas. No uses números, notas, puntajes ni escalas. No asumas el género de la persona: evita adjetivos con género (di "tienes una gran capacidad", no "eres muy bueno/buena").

IMPORTANTE: solo tienes los aspectos de la lista. No tienes ni debes mencionar infancia, pasado, estabilidad emocional, felicidad, dependencia, sanación, frustración, sentido de pertenencia ni ningún tema psicológico o de vida personal — esa información existe pero es privada y nunca te fue entregada. No la inventes ni sugieras que existe.`;

async function pedirInformeAClaude(apiKey: string, system: string, listaAspectos: string): Promise<string> {
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: 'claude-sonnet-5',
      max_tokens: 1500,
      system,
      messages: [{ role: 'user', content: `Esquema del Ser (descriptivo, sin nota):\n${listaAspectos}` }],
    }),
  });
  const data = await r.json();
  if (!r.ok) {
    console.error('Error de la API de Anthropic (informe Ser):', r.status, JSON.stringify(data));
    throw new Error('Hubo un problema consultando la IA. Ya quedó registrado para revisión.');
  }
  // La respuesta puede traer otros bloques antes del texto (p. ej. de razonamiento): se toma el de tipo texto.
  const bloque = ((data?.content ?? []) as any[]).find((b) => b?.type === 'text');
  return (bloque?.text as string | undefined)?.trim() ?? '';
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
    .select('nota, descripcion, aprovechar, acompanar, enfoque, ser_aspectos(nombre, sensible)')
    .eq('guia_del_flow_id', guiaDelFlowId);

  const aspectos = ((puntajesRaw ?? []) as any[])
    // Defensa en profundidad: con el cliente admin (sin sesión) RLS no
    // filtra los aspectos sensibles, así que se excluyen acá explícitamente.
    .filter((p) => p.ser_aspectos?.nombre && p.ser_aspectos?.sensible === false)
    // Un aspecto sin título ni descripción no dice nada (son restos de cuando el Ser tenía puntaje): no entra.
    .filter((p) => p.nota || p.descripcion)
    .map((p) => {
      const lectura =
        p.enfoque === 'aprovechar' ? 'para aprovechar' : p.enfoque === 'acompanar' ? 'para acompañar' : p.enfoque === 'equilibrado' ? 'en equilibrio' : null;
      return [
        `${p.ser_aspectos.nombre}${p.nota ? `: ${p.nota}` : ''}${lectura ? ` [${lectura}]` : ''}`,
        p.descripcion ? `  Descripción: ${p.descripcion}` : null,
        p.aprovechar ? `  Aprovecharlo: ${p.aprovechar}` : null,
        p.acompanar ? `  Acompañar: ${p.acompanar}` : null,
      ]
        .filter(Boolean)
        .join('\n');
    });

  if (aspectos.length === 0) {
    return { ok: false, error: 'El esquema del Ser está vacío. Invita a la persona a su Guía del Flow o completa al menos un aspecto (título o descripción) antes de generar la síntesis.' };
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

  // Una respuesta vacía no debe borrar la síntesis que ya existía.
  if (!informeLider || !informeColaborador) {
    return { ok: false, error: 'La IA no devolvió texto. Intenta de nuevo en un momento.' };
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
