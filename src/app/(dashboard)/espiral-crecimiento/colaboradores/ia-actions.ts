'use server';

import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';

const CAMPOS = ['nombre_completo', 'numero_documento', 'email', 'telefono'] as const;
type CampoExtraido = (typeof CAMPOS)[number];
type DatosExtraidos = Partial<Record<CampoExtraido, string>>;

/**
 * Lee una hoja de vida (CV) en PDF con Claude y devuelve los datos básicos
 * que se pueden usar para prellenar la ficha del colaborador (nombre,
 * documento, correo, teléfono) — la persona que registra sigue pudiendo
 * corregir cualquier campo antes de guardar, esto solo ahorra la digitación
 * inicial. No guarda el archivo en ningún lado (eso se sigue haciendo aparte,
 * desde "Documentos" en la ficha, como ya funcionaba) ni toca la base de
 * datos — es una lectura puntual.
 *
 * Solo admin_th, y solo PDF: Claude no lee .doc/.docx directamente, y
 * convertirlos en el servidor es una pieza adicional que no vale la pena
 * para este alcance.
 */
export async function extraerDatosHojaVida(formData: FormData) {
  const perfil = await getPerfilActual();
  if (!perfil || perfil.rol !== 'admin_th') return { ok: false as const, error: 'No autorizado' };

  const archivo = formData.get('archivo') as File | null;
  if (!archivo || archivo.size === 0) return { ok: false as const, error: 'Selecciona un archivo' };

  const esPdf = archivo.type === 'application/pdf' || archivo.name.toLowerCase().endsWith('.pdf');
  if (!esPdf) {
    return {
      ok: false as const,
      error: 'Por ahora la lectura automática solo funciona con PDF. Sube un .pdf, o si no, llena los campos a mano.',
    };
  }

  // Límite generoso para una hoja de vida (la API de Anthropic acepta hasta
  // 32MB por documento) — se acota antes para no gastar la llamada en algo
  // que de todos modos va a fallar.
  if (archivo.size > 15 * 1024 * 1024) {
    return { ok: false as const, error: 'El archivo es muy pesado (máx. 15MB). Comprímelo o sube uno más liviano.' };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      ok: false as const,
      error: 'La lectura automática con IA no está configurada (falta ANTHROPIC_API_KEY). Llena los campos a mano.',
    };
  }

  const bytes = await archivo.arrayBuffer();
  const base64 = Buffer.from(bytes).toString('base64');

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-5',
        max_tokens: 512,
        tools: [
          {
            name: 'datos_hoja_vida',
            description: 'Datos personales y de contacto encontrados en la hoja de vida.',
            input_schema: {
              type: 'object',
              properties: {
                nombre_completo: { type: 'string', description: 'Nombre completo de la persona, o "" si no aparece' },
                numero_documento: { type: 'string', description: 'Número de cédula/documento de identidad, o "" si no aparece' },
                email: { type: 'string', description: 'Correo electrónico, o "" si no aparece' },
                telefono: { type: 'string', description: 'Teléfono o celular de contacto, o "" si no aparece' },
              },
              required: ['nombre_completo', 'numero_documento', 'email', 'telefono'],
            },
          },
        ],
        tool_choice: { type: 'tool', name: 'datos_hoja_vida' },
        messages: [
          {
            role: 'user',
            content: [
              { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64 } },
              {
                type: 'text',
                text:
                  'Extrae de esta hoja de vida el nombre completo, número de documento de identidad, correo ' +
                  'electrónico y teléfono de la persona (la dueña de la hoja de vida, no de referencias). Si algún ' +
                  'dato no aparece con claridad, déjalo como cadena vacía — no lo inventes.',
              },
            ],
          },
        ],
      }),
    });

    const data = await r.json();
    if (!r.ok) {
      console.error('Error de la API de Anthropic (hoja de vida):', r.status, JSON.stringify(data));
      return { ok: false as const, error: 'No se pudo leer el archivo con IA. Llena los campos a mano.' };
    }

    const usoDeHerramienta = (data?.content ?? []).find((b: { type: string }) => b.type === 'tool_use');
    const input = (usoDeHerramienta?.input ?? {}) as DatosExtraidos;

    const datos: DatosExtraidos = {};
    for (const campo of CAMPOS) {
      const valor = input[campo];
      if (typeof valor === 'string' && valor.trim()) datos[campo] = valor.trim();
    }

    if (Object.keys(datos).length === 0) {
      return { ok: false as const, error: 'No se encontraron datos claros en el archivo. Llena los campos a mano.' };
    }

    return { ok: true as const, datos };
  } catch (e) {
    console.error('Error de red leyendo hoja de vida con Anthropic:', e);
    return { ok: false as const, error: 'Hubo un error leyendo el archivo. Intenta de nuevo.' };
  }
}
