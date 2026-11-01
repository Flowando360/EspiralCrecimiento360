'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const RespuestaSchema = z.object({
  evaluacionTareaId: z.string().uuid(),
  evaluacionItemId: z.string().uuid(),
  nota: z.number().int().min(1).max(5),
  observacion: z.string().optional(),
  resultadoReal: z.string().optional(), // solo aplica al bloque "Roles y Funciones"
});

/**
 * Guarda (o actualiza) UNA calificación, ahora contra un ítem de la
 * evaluación (evaluacion_items) en vez de directo contra el catálogo de
 * competencias — así cada evaluación conserva sus propios ítems aunque el
 * catálogo general cambie después, y cualquier ítem (de cualquiera de los
 * 5 bloques) puede llevar observación.
 *
 * El trigger de Postgres (fn_trigger_respuesta_evaluacion) recalcula los
 * índices de la persona evaluada en el mismo instante.
 */
export async function guardarRespuesta(input: z.infer<typeof RespuestaSchema>) {
  const parsed = RespuestaSchema.parse(input);
  const supabase = createClient();

  // Se busca la respuesta y se actualiza o inserta, en vez de usar upsert/ON CONFLICT:
  // el índice único de (tarea, ítem) es PARCIAL en la base de datos y PostgreSQL no lo
  // acepta como destino de ON CONFLICT (error 42P10), lo que impedía guardar cualquier nota.
  const valores = {
    nota: parsed.nota,
    observacion: parsed.observacion ?? null,
    resultado_real: parsed.resultadoReal ?? null,
  };
  const buscar = () =>
    supabase
      .from('respuestas_evaluacion')
      .select('id')
      .eq('evaluacion_tarea_id', parsed.evaluacionTareaId)
      .eq('evaluacion_item_id', parsed.evaluacionItemId)
      .maybeSingle();

  const { data: existente, error: errBuscar } = await buscar();
  if (errBuscar) return { ok: false, error: errBuscar.message };

  let error: { message: string; code?: string } | null = null;
  if (existente) {
    ({ error } = await supabase.from('respuestas_evaluacion').update(valores).eq('id', existente.id));
  } else {
    ({ error } = await supabase.from('respuestas_evaluacion').insert({
      evaluacion_tarea_id: parsed.evaluacionTareaId,
      evaluacion_item_id: parsed.evaluacionItemId,
      ...valores,
    }));
    // Dos clics casi simultáneos: la otra inserción ganó; se actualiza esa.
    if (error?.code === '23505') {
      const { data: ganadora } = await buscar();
      if (ganadora) ({ error } = await supabase.from('respuestas_evaluacion').update(valores).eq('id', ganadora.id));
    }
  }

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath('/espiral-crecimiento/ciclos');
  return { ok: true };
}
