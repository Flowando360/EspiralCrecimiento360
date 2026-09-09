'use server';

import { createClient } from '@/lib/supabase/server';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const AbrirRondaSchema = z.object({
  nombre: z.string().trim().min(1, 'El nombre es requerido'),
});

/** Abre una nueva ronda de clima (admin_th, misma regla que RLS). Solo puede haber una abierta a la vez. */
export async function abrirRondaClima(input: z.infer<typeof AbrirRondaSchema>) {
  const perfil = await getPerfilActual();
  if (!perfil || perfil.rol !== 'admin_th') return { ok: false as const, error: 'No autorizado' };

  const parsed = AbrirRondaSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };

  const supabase = createClient();
  const { error } = await supabase.from('clima_rondas').insert({
    empresa_id: perfil.empresa_id,
    nombre: parsed.data.nombre,
    creada_por: perfil.usuario_id,
  });

  if (error) {
    if (error.code === '23505') return { ok: false as const, error: 'Ya hay una ronda abierta. Ciérrala antes de abrir otra.' };
    return { ok: false as const, error: error.message };
  }
  revalidatePath('/nexa/clima');
  return { ok: true as const };
}

/** Cierra la ronda abierta (admin_th). Los resultados agregados quedan fijos desde ese momento. */
export async function cerrarRondaClima(rondaId: string) {
  const perfil = await getPerfilActual();
  if (!perfil || perfil.rol !== 'admin_th') return { ok: false as const, error: 'No autorizado' };

  const supabase = createClient();
  const { error } = await supabase
    .from('clima_rondas')
    .update({ estado: 'cerrada', fecha_cierre: new Date().toISOString().slice(0, 10) })
    .eq('id', rondaId)
    .eq('empresa_id', perfil.empresa_id);

  if (error) return { ok: false as const, error: error.message };
  revalidatePath('/nexa/clima');
  return { ok: true as const };
}

const RespuestaSchema = z.object({
  rondaId: z.string().uuid(),
  enps: z.number().int().min(0).max(10),
  reconocimiento: z.number().int().min(1).max(5),
  liderazgo: z.number().int().min(1).max(5),
  desarrollo: z.number().int().min(1).max(5),
  comunicacion: z.number().int().min(1).max(5),
  condiciones: z.number().int().min(1).max(5),
  pertenencia: z.number().int().min(1).max(5),
  comentario: z.string().trim().max(2000).optional(),
});

/**
 * Registra la respuesta anónima de un colaborador a la ronda abierta.
 * Inserta primero en clima_participaciones (identifica quién respondió, con
 * restricción única por ronda) y solo si eso tiene éxito inserta en
 * clima_respuestas (anónima, sin colaborador_id) — así una doble entrega no
 * puede dejar una respuesta anónima huérfana sin su participación asociada.
 */
export async function responderClima(input: z.infer<typeof RespuestaSchema>) {
  const perfil = await getPerfilActual();
  if (!perfil?.colaborador_id) return { ok: false as const, error: 'No autorizado' };

  const parsed = RespuestaSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };

  const supabase = createClient();

  const { error: errorParticipacion } = await supabase.from('clima_participaciones').insert({
    ronda_id: parsed.data.rondaId,
    colaborador_id: perfil.colaborador_id,
  });

  if (errorParticipacion) {
    if (errorParticipacion.code === '23505') return { ok: false as const, error: 'Ya respondiste esta ronda.' };
    return { ok: false as const, error: errorParticipacion.message };
  }

  const { data: colaborador } = await supabase
    .from('colaboradores')
    .select('lider_id')
    .eq('id', perfil.colaborador_id)
    .maybeSingle();

  const { error: errorRespuesta } = await supabase.from('clima_respuestas').insert({
    ronda_id: parsed.data.rondaId,
    equipo_lider_id: (colaborador?.lider_id as string | null) ?? null,
    enps: parsed.data.enps,
    reconocimiento: parsed.data.reconocimiento,
    liderazgo: parsed.data.liderazgo,
    desarrollo: parsed.data.desarrollo,
    comunicacion: parsed.data.comunicacion,
    condiciones: parsed.data.condiciones,
    pertenencia: parsed.data.pertenencia,
    comentario: parsed.data.comentario || null,
  });

  if (errorRespuesta) return { ok: false as const, error: errorRespuesta.message };
  revalidatePath('/nexa/clima');
  return { ok: true as const };
}
