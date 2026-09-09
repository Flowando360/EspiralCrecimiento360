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

  const { error } = await supabase.from('respuestas_evaluacion').upsert(
    {
      evaluacion_tarea_id: parsed.evaluacionTareaId,
      evaluacion_item_id: parsed.evaluacionItemId,
      nota: parsed.nota,
      observacion: parsed.observacion ?? null,
      resultado_real: parsed.resultadoReal ?? null,
    },
    { onConflict: 'evaluacion_tarea_id,evaluacion_item_id' }
  );

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath('/espiral-crecimiento/ciclos');
  return { ok: true };
}
