'use server';

import { createClient } from '@/lib/supabase/server';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const SimulacroSchema = z.object({
  titulo: z.string().trim().min(1, 'El título es requerido'),
  descripcion: z.string().trim().optional(),
  fecha: z.string().optional(),
  participantesEsperados: z.number().int().min(0).optional(),
});

/** Crea un simulacro/dinámica en vivo (admin_th, misma regla que RLS). */
export async function crearSimulacro(input: z.infer<typeof SimulacroSchema>) {
  const perfil = await getPerfilActual();
  if (!perfil || perfil.rol !== 'admin_th') return { ok: false as const, error: 'No autorizado' };

  const parsed = SimulacroSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };

  const supabase = createClient();
  const { error } = await supabase.from('nexa_simulacros').insert({
    empresa_id: perfil.empresa_id,
    titulo: parsed.data.titulo,
    descripcion: parsed.data.descripcion || null,
    fecha: parsed.data.fecha || null,
    participantes_esperados: parsed.data.participantesEsperados ?? null,
  });

  if (error) return { ok: false as const, error: error.message };
  revalidatePath('/nexa/simulacros');
  return { ok: true as const };
}

const EditarSimulacroSchema = z.object({
  simulacroId: z.string().uuid(),
  titulo: z.string().trim().min(1, 'El título es requerido'),
  descripcion: z.string().trim().optional(),
  fecha: z.string().optional(),
  participantesEsperados: z.number().int().min(0).optional(),
});

/** Edita título, descripción, fecha y participantes esperados de un simulacro ya creado (admin_th). */
export async function actualizarSimulacro(input: z.infer<typeof EditarSimulacroSchema>) {
  const perfil = await getPerfilActual();
  if (!perfil || perfil.rol !== 'admin_th') return { ok: false as const, error: 'No autorizado' };

  const parsed = EditarSimulacroSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };

  const supabase = createClient();
  const { error } = await supabase
    .from('nexa_simulacros')
    .update({
      titulo: parsed.data.titulo,
      descripcion: parsed.data.descripcion || null,
      fecha: parsed.data.fecha || null,
      participantes_esperados: parsed.data.participantesEsperados ?? null,
    })
    .eq('id', parsed.data.simulacroId)
    .eq('empresa_id', perfil.empresa_id);

  if (error) return { ok: false as const, error: error.message };
  revalidatePath('/nexa/simulacros');
  revalidatePath(`/nexa/simulacros/${parsed.data.simulacroId}`);
  return { ok: true as const };
}

/** Elimina un simulacro (admin_th) — se borran en cascada sus participantes registrados. */
export async function eliminarSimulacro(simulacroId: string) {
  const perfil = await getPerfilActual();
  if (!perfil || perfil.rol !== 'admin_th') return { ok: false as const, error: 'No autorizado' };

  const supabase = createClient();
  const { error } = await supabase.from('nexa_simulacros').delete().eq('id', simulacroId).eq('empresa_id', perfil.empresa_id);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath('/nexa/simulacros');
  return { ok: true as const };
}

const ParticipanteSchema = z.object({
  simulacroId: z.string().uuid(),
  colaboradorId: z.string().uuid(),
  asistio: z.boolean(),
  calificacionDesempeno: z.number().int().min(1).max(5).optional(),
});

/** Registra o actualiza la asistencia/calificación de un colaborador en un simulacro. */
export async function registrarParticipante(input: z.infer<typeof ParticipanteSchema>) {
  const perfil = await getPerfilActual();
  if (!perfil || perfil.rol !== 'admin_th') return { ok: false as const, error: 'No autorizado' };

  const parsed = ParticipanteSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: 'Datos inválidos' };

  const supabase = createClient();
  const { error } = await supabase.from('nexa_simulacro_participantes').upsert(
    {
      simulacro_id: parsed.data.simulacroId,
      colaborador_id: parsed.data.colaboradorId,
      asistio: parsed.data.asistio,
      calificacion_desempeno: parsed.data.calificacionDesempeno ?? null,
    },
    { onConflict: 'simulacro_id,colaborador_id' }
  );

  if (error) return { ok: false as const, error: error.message };
  revalidatePath(`/nexa/simulacros/${parsed.data.simulacroId}`);
  return { ok: true as const };
}
