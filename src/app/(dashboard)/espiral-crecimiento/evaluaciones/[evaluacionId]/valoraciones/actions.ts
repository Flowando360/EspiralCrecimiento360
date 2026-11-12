'use server';

import { createClient } from '@/lib/supabase/server';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { registrarAuditoria } from '@/lib/auditoria/registrar';
import { primero } from '@/lib/utils';

const Schema = z.object({ evaluacionId: z.string().uuid(), evaluadorId: z.string().uuid() });

/** Talento Humano invita a una persona (cliente interno) a valorar a quien evalúa esta evaluación. */
export async function invitarClienteInterno(input: z.infer<typeof Schema>) {
  const p = Schema.safeParse(input);
  if (!p.success) return { ok: false as const, error: 'Datos inválidos' };
  const perfil = await getPerfilActual();
  if (!perfil || perfil.rol !== 'admin_th') return { ok: false as const, error: 'Solo Talento Humano puede invitar clientes internos' };

  const supabase = createClient();
  const { data: ev } = await supabase
    .from('evaluaciones')
    .select('id, colaborador:colaborador_evaluado_id(id, nombre_completo, empresa_id)')
    .eq('id', p.data.evaluacionId)
    .maybeSingle();
  const evaluado = primero(ev?.colaborador as any) as any;
  if (!ev || evaluado?.empresa_id !== perfil.empresa_id) return { ok: false as const, error: 'Evaluación no encontrada' };
  if (p.data.evaluadorId === evaluado.id) return { ok: false as const, error: 'La persona no puede valorarse a sí misma como cliente' };

  const { data: persona } = await supabase.from('colaboradores').select('id, nombre_completo, empresa_id, es_externo').eq('id', p.data.evaluadorId).maybeSingle();
  if (!persona || persona.empresa_id !== perfil.empresa_id || persona.es_externo) return { ok: false as const, error: 'Persona no encontrada' };

  const { data: ya } = await supabase.from('evaluacion_tareas').select('id').eq('evaluacion_id', ev.id).eq('evaluador_colaborador_id', persona.id).maybeSingle();
  if (ya) return { ok: false as const, error: 'Esa persona ya tiene una valoración asignada en esta evaluación' };

  const { error } = await supabase.from('evaluacion_tareas').insert({ evaluacion_id: ev.id, evaluador_colaborador_id: persona.id, tipo_evaluador: 'cliente_interno' });
  if (error) return { ok: false as const, error: error.message };

  await registrarAuditoria(perfil, {
    modulo: 'valoraciones',
    accion: 'valoracion.invitar_cliente',
    resumen: `Invitó a ${persona.nombre_completo} a valorar a ${evaluado.nombre_completo} como cliente interno`,
    objetoTipo: 'evaluacion',
    objetoId: ev.id,
    detalle: { evaluacion_id: ev.id, evaluador_id: persona.id },
  });
  revalidatePath(`/espiral-crecimiento/evaluaciones/${ev.id}/valoraciones`);
  return { ok: true as const };
}

/** Quita la invitación de un cliente interno que todavía no ha respondido nada. */
export async function quitarClienteInterno(input: { evaluacionId: string; tareaId: string }) {
  const ids = z.object({ evaluacionId: z.string().uuid(), tareaId: z.string().uuid() }).safeParse(input);
  if (!ids.success) return { ok: false as const, error: 'Datos inválidos' };
  const perfil = await getPerfilActual();
  if (!perfil || perfil.rol !== 'admin_th') return { ok: false as const, error: 'No autorizado' };

  const supabase = createClient();
  const { data: tarea } = await supabase
    .from('evaluacion_tareas')
    .select('id, completada, tipo_evaluador, evaluador:evaluador_colaborador_id(nombre_completo, empresa_id)')
    .eq('id', ids.data.tareaId)
    .eq('evaluacion_id', ids.data.evaluacionId)
    .maybeSingle();
  const evaluador = primero(tarea?.evaluador as any) as any;
  if (!tarea || evaluador?.empresa_id !== perfil.empresa_id) return { ok: false as const, error: 'No encontrada' };
  if (tarea.tipo_evaluador !== 'cliente_interno') return { ok: false as const, error: 'Solo se pueden quitar invitaciones de clientes internos' };
  if (tarea.completada) return { ok: false as const, error: 'Ya envió su valoración: no se puede quitar (puedes reabrirla)' };

  const { count } = await supabase.from('respuestas_evaluacion').select('id', { count: 'exact', head: true }).eq('evaluacion_tarea_id', tarea.id);
  if ((count ?? 0) > 0) return { ok: false as const, error: 'Ya empezó a responder: no se puede quitar' };

  const { error } = await supabase.from('evaluacion_tareas').delete().eq('id', tarea.id);
  if (error) return { ok: false as const, error: error.message };

  await registrarAuditoria(perfil, {
    modulo: 'valoraciones',
    accion: 'valoracion.quitar_cliente',
    resumen: `Quitó la invitación a ${evaluador?.nombre_completo ?? 'un cliente interno'}`,
    objetoTipo: 'evaluacion',
    objetoId: ids.data.evaluacionId,
    detalle: { evaluacion_id: ids.data.evaluacionId },
  });
  revalidatePath(`/espiral-crecimiento/evaluaciones/${ids.data.evaluacionId}/valoraciones`);
  return { ok: true as const };
}
