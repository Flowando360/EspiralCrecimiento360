'use server';

import { createClient } from '@/lib/supabase/server';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import type { HojaVidaFormacion } from '@/types/colaborador';

const TIPOS = ['academica', 'certificacion', 'curso', 'experiencia_laboral'] as const;

/**
 * Solo admin_th puede escribir en hoja_vida_formacion (misma regla que ya
 * aplica RLS: "hoja_vida: admin_th todo" es la única policy de insert/
 * update/delete; líder y colaborador solo tienen select).
 */
async function esAdminThDeEsteColaborador(colaboradorId: string) {
  const perfil = await getPerfilActual();
  if (!perfil || perfil.rol !== 'admin_th') return null;

  const supabase = createClient();
  const { data: colaborador } = await supabase
    .from('colaboradores')
    .select('id, empresa_id')
    .eq('id', colaboradorId)
    .maybeSingle();

  if (!colaborador || colaborador.empresa_id !== perfil.empresa_id) return null;
  return perfil;
}

function revalidar(colaboradorId: string) {
  revalidatePath(`/espiral-crecimiento/colaboradores/${colaboradorId}/hoja-vida`);
  revalidatePath(`/espiral-crecimiento/colaboradores/${colaboradorId}`);
  revalidatePath('/informes/sst');
}

const CamposSchema = z.object({
  colaboradorId: z.string().uuid(),
  tipo: z.enum(TIPOS),
  titulo: z.string().trim().min(1, 'El título es requerido'),
  institucion: z.string().trim().optional(),
  fechaInicio: z.string().optional(),
  fechaFin: z.string().optional(),
  fechaVencimiento: z.string().optional(),
  documentoUrl: z.string().trim().optional(),
});

export async function agregarEntradaHojaVida(input: z.infer<typeof CamposSchema>) {
  const parsed = CamposSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };

  const perfil = await esAdminThDeEsteColaborador(parsed.data.colaboradorId);
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const supabase = createClient();
  const { data, error } = await supabase
    .from('hoja_vida_formacion')
    .insert({
      colaborador_id: parsed.data.colaboradorId,
      tipo: parsed.data.tipo,
      titulo: parsed.data.titulo,
      institucion: parsed.data.institucion || null,
      fecha_inicio: parsed.data.fechaInicio || null,
      fecha_fin: parsed.data.fechaFin || null,
      fecha_vencimiento: parsed.data.fechaVencimiento || null,
      documento_url: parsed.data.documentoUrl || null,
    })
    .select('*')
    .single();

  if (error) return { ok: false as const, error: error.message };

  revalidar(parsed.data.colaboradorId);
  return { ok: true as const, item: data as unknown as HojaVidaFormacion };
}

const VerificarSchema = z.object({
  id: z.string().uuid(),
  colaboradorId: z.string().uuid(),
  verificado: z.boolean(),
});

export async function marcarVerificadoHojaVida(input: z.infer<typeof VerificarSchema>) {
  const parsed = VerificarSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: 'Datos inválidos' };

  const perfil = await esAdminThDeEsteColaborador(parsed.data.colaboradorId);
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const supabase = createClient();
  const { error } = await supabase
    .from('hoja_vida_formacion')
    .update({
      verificado: parsed.data.verificado,
      verificado_por: parsed.data.verificado ? perfil.usuario_id : null,
    })
    .eq('id', parsed.data.id)
    .eq('colaborador_id', parsed.data.colaboradorId);

  if (error) return { ok: false as const, error: error.message };

  revalidar(parsed.data.colaboradorId);
  return { ok: true as const };
}

const EliminarSchema = z.object({
  id: z.string().uuid(),
  colaboradorId: z.string().uuid(),
});

export async function eliminarEntradaHojaVida(input: z.infer<typeof EliminarSchema>) {
  const parsed = EliminarSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: 'Datos inválidos' };

  const perfil = await esAdminThDeEsteColaborador(parsed.data.colaboradorId);
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const supabase = createClient();
  const { error } = await supabase
    .from('hoja_vida_formacion')
    .delete()
    .eq('id', parsed.data.id)
    .eq('colaborador_id', parsed.data.colaboradorId);

  if (error) return { ok: false as const, error: error.message };

  revalidar(parsed.data.colaboradorId);
  return { ok: true as const };
}

// ── Importar formación desde la hoja de vida (PDF) que ya viene del proceso de selección (informe de Luisa 4.2) ──

export interface PropuestaFormacion {
  tipo: (typeof TIPOS)[number];
  titulo: string;
  institucion: string | null;
  fecha_inicio: string | null;
  fecha_fin: string | null;
}

const PropuestaSchema = z.object({
  tipo: z.enum(TIPOS),
  titulo: z.string().trim().min(1).max(200),
  institucion: z.string().trim().max(200).nullable().optional(),
  fecha_inicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  fecha_fin: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
});

/**
 * Lee con IA la hoja de vida (PDF) ya cargada en la ficha — la misma que viaja desde la selección al contratar — y PROPONE
 * los estudios, certificaciones, cursos y experiencias que encuentra. No guarda nada: Talento Humano revisa y confirma.
 */
export async function proponerFormacionDesdeHojaVida(colaboradorId: string) {
  const perfil = await esAdminThDeEsteColaborador(colaboradorId);
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return { ok: false as const, error: 'La lectura con IA no está configurada (falta ANTHROPIC_API_KEY).' };

  const supabase = createClient();
  const { data: col } = await supabase.from('colaboradores').select('hoja_vida_url').eq('id', colaboradorId).maybeSingle();
  const ruta = (col as any)?.hoja_vida_url as string | null;
  if (!ruta) return { ok: false as const, error: 'Esta persona no tiene hoja de vida cargada (súbela en Documentos).' };
  if (!ruta.toLowerCase().endsWith('.pdf')) return { ok: false as const, error: 'La lectura automática solo funciona con hojas de vida en PDF.' };

  const { data: archivo, error: errDescarga } = await supabase.storage.from('documentos-colaborador').download(ruta);
  if (errDescarga || !archivo) return { ok: false as const, error: 'No se pudo abrir la hoja de vida.' };
  if (archivo.size > 15 * 1024 * 1024) return { ok: false as const, error: 'La hoja de vida pesa más de 15 MB.' };
  const base64 = Buffer.from(await archivo.arrayBuffer()).toString('base64');

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL_HOJA_VIDA || 'claude-sonnet-5-5',
        max_tokens: 4000,
        tools: [
          {
            name: 'formacion_y_experiencia',
            description: 'Estudios, certificaciones, cursos y experiencia laboral que aparecen en la hoja de vida.',
            input_schema: {
              type: 'object',
              properties: {
                items: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      tipo: { type: 'string', enum: ['academica', 'certificacion', 'curso', 'experiencia_laboral'] },
                      titulo: { type: 'string', description: 'Título obtenido, nombre del curso o certificación, o cargo desempeñado' },
                      institucion: { type: 'string', description: 'Institución o empresa, o cadena vacía' },
                      fecha_inicio: { type: 'string', description: 'AAAA-MM-DD solo si aparece con claridad; si no, cadena vacía' },
                      fecha_fin: { type: 'string', description: 'AAAA-MM-DD solo si aparece con claridad; si no, cadena vacía' },
                    },
                    required: ['tipo', 'titulo'],
                  },
                },
              },
              required: ['items'],
            },
          },
        ],
        tool_choice: { type: 'tool', name: 'formacion_y_experiencia' },
        messages: [
          {
            role: 'user',
            content: [
              { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64 } },
              {
                type: 'text',
                text:
                  'Lista los estudios (academica), certificaciones, cursos y experiencia laboral de la dueña o dueño de esta hoja de vida. ' +
                  'Solo lo que aparece escrito: no inventes nada, no completes fechas que no se vean y no incluyas referencias personales. ' +
                  'Un registro por estudio, certificación, curso o cargo.',
              },
            ],
          },
        ],
      }),
    });
    const data = await r.json();
    if (!r.ok) {
      console.error('Error de la API de Anthropic (formación desde hoja de vida):', r.status, JSON.stringify(data));
      return { ok: false as const, error: 'No se pudo leer la hoja de vida con IA. Inténtalo de nuevo o cárgalo a mano.' };
    }
    const uso = (data?.content ?? []).find((b: { type: string }) => b.type === 'tool_use');
    const crudos: unknown[] = Array.isArray(uso?.input?.items) ? uso.input.items : [];
    const propuestas: PropuestaFormacion[] = [];
    for (const c of crudos.slice(0, 40)) {
      const limpio = { ...(c as Record<string, unknown>) } as Record<string, unknown>;
      for (const k of ['institucion', 'fecha_inicio', 'fecha_fin']) if (limpio[k] === '') limpio[k] = null;
      const v = PropuestaSchema.safeParse(limpio);
      if (v.success) {
        propuestas.push({
          tipo: v.data.tipo,
          titulo: v.data.titulo,
          institucion: v.data.institucion ?? null,
          fecha_inicio: v.data.fecha_inicio ?? null,
          fecha_fin: v.data.fecha_fin ?? null,
        });
      }
    }
    if (propuestas.length === 0) return { ok: false as const, error: 'No se encontraron estudios ni experiencia claros en la hoja de vida.' };
    return { ok: true as const, propuestas };
  } catch (e: any) {
    console.error('Error leyendo la hoja de vida con IA:', e);
    return { ok: false as const, error: 'No se pudo leer la hoja de vida con IA. Inténtalo de nuevo o cárgalo a mano.' };
  }
}

/** Guarda las propuestas que Talento Humano confirmó, sin duplicar lo que ya está y sin marcarlas como verificadas. */
export async function importarFormacionPropuesta(colaboradorId: string, items: PropuestaFormacion[]) {
  const perfil = await esAdminThDeEsteColaborador(colaboradorId);
  if (!perfil) return { ok: false as const, error: 'No autorizado' };
  const validas = items.map((i) => PropuestaSchema.safeParse(i)).filter((v) => v.success).map((v) => (v as any).data as z.infer<typeof PropuestaSchema>).slice(0, 40);
  if (validas.length === 0) return { ok: false as const, error: 'No hay registros válidos para agregar' };

  const supabase = createClient();
  const { data: existentes } = await supabase.from('hoja_vida_formacion').select('titulo').eq('colaborador_id', colaboradorId);
  const yaEstan = new Set((existentes ?? []).map((e: any) => String(e.titulo).trim().toLowerCase()));
  const nuevos = validas.filter((v) => !yaEstan.has(v.titulo.trim().toLowerCase()));
  if (nuevos.length === 0) return { ok: true as const, agregados: 0 };

  const { error } = await supabase.from('hoja_vida_formacion').insert(
    nuevos.map((v) => ({
      colaborador_id: colaboradorId,
      tipo: v.tipo,
      titulo: v.titulo,
      institucion: v.institucion ?? null,
      fecha_inicio: v.fecha_inicio ?? null,
      fecha_fin: v.fecha_fin ?? null,
      verificado: false,
    }))
  );
  if (error) return { ok: false as const, error: error.message };
  revalidar(colaboradorId);
  return { ok: true as const, agregados: nuevos.length };
}
