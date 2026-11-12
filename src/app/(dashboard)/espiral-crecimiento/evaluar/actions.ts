'use server';

import { createClient } from '@/lib/supabase/server';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { registrarAuditoria } from '@/lib/auditoria/registrar';

const MENSAJE_ENVIADA = 'Esta valoración ya fue enviada y no se puede modificar';

async function tareaYaEnviada(supabase: ReturnType<typeof createClient>, tareaId: string) {
  const { data } = await supabase.from('evaluacion_tareas').select('completada').eq('id', tareaId).maybeSingle();
  return Boolean(data?.completada);
}

/** Una respuesta es una nota de 1 a 5 o un «No aplica» (que no cuenta como cero y debe justificarse al enviar). */
const NotaSchema = z.number().int().min(1).max(5).nullable();

const RespuestaSchema = z.object({
  evaluacionTareaId: z.string().uuid(),
  evaluacionItemId: z.string().uuid(),
  nota: NotaSchema,
  noAplica: z.boolean().default(false),
  observacion: z.string().optional(),
  resultadoReal: z.string().optional(), // solo aplica al bloque "Roles y Funciones"
});

function consistente(r: { nota: number | null; noAplica: boolean }): boolean {
  return r.noAplica ? r.nota === null : r.nota !== null;
}

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

  if (await tareaYaEnviada(supabase, parsed.evaluacionTareaId)) {
    return { ok: false, error: MENSAJE_ENVIADA };
  }

  // Se busca la respuesta y se actualiza o inserta, en vez de usar upsert/ON CONFLICT:
  // el índice único de (tarea, ítem) es PARCIAL en la base de datos y PostgreSQL no lo
  // acepta como destino de ON CONFLICT (error 42P10), lo que impedía guardar cualquier nota.
  if (!consistente(parsed)) return { ok: false, error: 'Elige una nota de 1 a 5 o «No aplica»' };
  const valores = {
    nota: parsed.noAplica ? null : parsed.nota,
    no_aplica: parsed.noAplica,
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

const BorradorSchema = z.object({
  evaluacionTareaId: z.string().uuid(),
  respuestas: z
    .array(
      z.object({
        evaluacionItemId: z.string().uuid(),
        nota: NotaSchema,
        noAplica: z.boolean().default(false),
        observacion: z.string().optional(),
        resultadoReal: z.string().optional(),
      })
    )
    .max(500),
});

/** Guarda de una vez todas las respuestas que la persona lleva (guardado parcial / borrador). */
export async function guardarBorrador(input: z.infer<typeof BorradorSchema>) {
  const parsed = BorradorSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: 'Datos inválidos' };
  const supabase = createClient();

  if (await tareaYaEnviada(supabase, parsed.data.evaluacionTareaId)) {
    return { ok: false as const, error: MENSAJE_ENVIADA };
  }
  if (parsed.data.respuestas.length === 0) return { ok: true as const, guardadas: 0 };
  if (!parsed.data.respuestas.every(consistente)) return { ok: false as const, error: 'Cada ítem debe tener una nota de 1 a 5 o «No aplica»' };

  const { error } = await supabase.from('respuestas_evaluacion').upsert(
    parsed.data.respuestas.map((r) => ({
      evaluacion_tarea_id: parsed.data.evaluacionTareaId,
      evaluacion_item_id: r.evaluacionItemId,
      nota: r.noAplica ? null : r.nota,
      no_aplica: r.noAplica,
      observacion: r.observacion || null,
      resultado_real: r.resultadoReal || null,
    })),
    { onConflict: 'evaluacion_tarea_id,evaluacion_item_id' }
  );
  if (error) return { ok: false as const, error: error.message };
  return { ok: true as const, guardadas: parsed.data.respuestas.length };
}

/**
 * Envía la valoración: exige que todos los ítems activos estén respondidos y
 * la marca como enviada. Desde ese momento ya no admite cambios (también lo
 * impide un candado en la base de datos) y empieza a contar en los resultados.
 */
export async function enviarValoracion(input: { evaluacionTareaId: string }) {
  const perfil = await getPerfilActual();
  if (!perfil?.colaborador_id) return { ok: false as const, error: 'No autorizado' };
  const tareaId = z.string().uuid().safeParse(input.evaluacionTareaId);
  if (!tareaId.success) return { ok: false as const, error: 'Datos inválidos' };

  const supabase = createClient();
  const { data: tarea } = await supabase
    .from('evaluacion_tareas')
    .select('id, evaluacion_id, completada, evaluador_colaborador_id')
    .eq('id', tareaId.data)
    .maybeSingle();
  if (!tarea || tarea.evaluador_colaborador_id !== perfil.colaborador_id) {
    return { ok: false as const, error: 'No encontramos esta valoración entre tus tareas' };
  }
  if (tarea.completada) return { ok: false as const, error: MENSAJE_ENVIADA };

  const { data: items } = await supabase
    .from('evaluacion_items')
    .select('id')
    .eq('evaluacion_id', tarea.evaluacion_id)
    .eq('activo', true);
  const idsActivos = new Set((items ?? []).map((i) => i.id));
  const { data: respuestas } = await supabase
    .from('respuestas_evaluacion')
    .select('evaluacion_item_id, no_aplica, observacion')
    .eq('evaluacion_tarea_id', tarea.id);
  const respondidos = new Set((respuestas ?? []).map((r) => r.evaluacion_item_id).filter((id): id is string => id != null && idsActivos.has(id)));
  const faltan = idsActivos.size - respondidos.size;
  if (idsActivos.size === 0) return { ok: false as const, error: 'Esta valoración no tiene ítems para enviar' };
  if (faltan > 0) {
    return { ok: false as const, error: `Aún faltan ${faltan} ${faltan === 1 ? 'ítem' : 'ítems'} por responder. Complétalos y vuelve a enviar.` };
  }

  // «No aplica» exige una justificación breve y no puede ser la respuesta a todo.
  const activas = (respuestas ?? []).filter((r) => r.evaluacion_item_id != null && idsActivos.has(r.evaluacion_item_id));
  const sinJustificar = activas.filter((r) => r.no_aplica && (r.observacion ?? '').trim().length < 5).length;
  if (sinJustificar > 0) {
    return { ok: false as const, error: `Marcaste ${sinJustificar} ${sinJustificar === 1 ? 'ítem' : 'ítems'} como «No aplica» sin explicar por qué. Agrega una breve observación en cada uno.` };
  }
  if (activas.length > 0 && activas.every((r) => r.no_aplica)) {
    return { ok: false as const, error: 'No puedes marcar todos los ítems como «No aplica»: debe quedar al menos uno valorado.' };
  }

  const { error } = await supabase
    .from('evaluacion_tareas')
    .update({ completada: true, fecha_completada: new Date().toISOString() })
    .eq('id', tarea.id)
    .eq('completada', false);
  if (error) return { ok: false as const, error: error.message };

  await registrarAuditoria(perfil, {
    modulo: 'valoraciones',
    accion: 'valoracion.enviar',
    resumen: `${perfil.nombre_completo} envió una valoración (${activas.length} ítems)`,
    objetoTipo: 'evaluacion_tarea',
    objetoId: tarea.id,
    detalle: { evaluacion_id: tarea.evaluacion_id },
  });

  revalidatePath('/espiral-crecimiento/ciclos');
  revalidatePath('/inicio');
  revalidatePath(`/espiral-crecimiento/evaluar/${tarea.evaluacion_id}`);
  return { ok: true as const };
}

/**
 * Reabre una valoración ya enviada para que su evaluador la corrija (solo Talento Humano).
 * Exige un motivo, deja el cambio en la bitácora de auditoría y, como la valoración vuelve a
 * borrador, sus notas dejan de contar en los resultados hasta que se envíe de nuevo.
 */
export async function reabrirValoracion(input: { evaluacionTareaId: string; motivo: string }) {
  const perfil = await getPerfilActual();
  if (!perfil || perfil.rol !== 'admin_th') return { ok: false as const, error: 'Solo Talento Humano puede reabrir una valoración' };
  const tareaId = z.string().uuid().safeParse(input.evaluacionTareaId);
  const motivo = (input.motivo ?? '').trim();
  if (!tareaId.success) return { ok: false as const, error: 'Datos inválidos' };
  if (motivo.length < 10) return { ok: false as const, error: 'Explica el motivo de la reapertura (mínimo 10 caracteres)' };

  const supabase = createClient();
  const { data: tarea } = await supabase
    .from('evaluacion_tareas')
    .select(
      `id, evaluacion_id, completada, fecha_completada, tipo_evaluador,
       evaluador:evaluador_colaborador_id(nombre_completo, empresa_id),
       evaluacion:evaluaciones(colaborador:colaborador_evaluado_id(nombre_completo))`
    )
    .eq('id', tareaId.data)
    .maybeSingle();
  const evaluador = (Array.isArray(tarea?.evaluador) ? tarea?.evaluador[0] : tarea?.evaluador) as any;
  if (!tarea || evaluador?.empresa_id !== perfil.empresa_id) return { ok: false as const, error: 'No encontramos esa valoración' };
  if (!tarea.completada) return { ok: false as const, error: 'Esta valoración ya está abierta (en borrador)' };

  const { error } = await supabase
    .from('evaluacion_tareas')
    .update({ completada: false, fecha_completada: null })
    .eq('id', tarea.id)
    .eq('completada', true);
  if (error) return { ok: false as const, error: error.message };

  const evaluacion = (Array.isArray(tarea.evaluacion) ? tarea.evaluacion[0] : tarea.evaluacion) as any;
  const evaluado = (Array.isArray(evaluacion?.colaborador) ? evaluacion?.colaborador[0] : evaluacion?.colaborador) as any;
  await registrarAuditoria(perfil, {
    modulo: 'valoraciones',
    accion: 'valoracion.reabrir',
    resumen: `Reabrió la valoración de ${evaluador?.nombre_completo ?? 'un evaluador'} (${tarea.tipo_evaluador}) sobre ${evaluado?.nombre_completo ?? 'una persona'}`,
    objetoTipo: 'evaluacion_tarea',
    objetoId: tarea.id,
    detalle: { motivo, evaluacion_id: tarea.evaluacion_id, enviada_el: tarea.fecha_completada },
  });

  revalidatePath('/espiral-crecimiento/ciclos');
  revalidatePath('/inicio');
  revalidatePath(`/espiral-crecimiento/evaluaciones/${tarea.evaluacion_id}/valoraciones`);
  return { ok: true as const };
}
