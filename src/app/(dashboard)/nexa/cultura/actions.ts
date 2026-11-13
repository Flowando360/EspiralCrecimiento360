'use server';

import { randomUUID } from 'crypto';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';

const NO_AUTORIZADO = { ok: false as const, error: 'No autorizado' };

async function comoAdminTh() {
  const perfil = await getPerfilActual();
  return perfil && perfil.rol === 'admin_th' ? perfil : null;
}

export async function agregarComportamiento(input: { dimension: string; enunciado: string }) {
  const perfil = await comoAdminTh();
  if (!perfil) return NO_AUTORIZADO;
  const p = z.object({ dimension: z.string().trim().min(1, 'Escribe la dimensión cultural').max(80), enunciado: z.string().trim().min(3, 'Escribe el comportamiento').max(300) }).safeParse(input);
  if (!p.success) return { ok: false as const, error: p.error.issues[0]?.message ?? 'Datos inválidos' };
  const supabase = createClient() as any;
  const { error } = await supabase.from('cultura_comportamientos').insert({ empresa_id: perfil.empresa_id, ...p.data });
  if (error) return { ok: false as const, error: error.message };
  revalidatePath('/nexa/cultura');
  return { ok: true as const };
}

export async function cambiarComportamiento(id: string, accion: 'desactivar' | 'activar' | 'eliminar') {
  const perfil = await comoAdminTh();
  if (!perfil) return NO_AUTORIZADO;
  const supabase = createClient() as any;
  const q = supabase.from('cultura_comportamientos') as any;
  const { error } =
    accion === 'eliminar'
      ? await q.delete().eq('id', id).eq('empresa_id', perfil.empresa_id)
      : await q.update({ activo: accion === 'activar' }).eq('id', id).eq('empresa_id', perfil.empresa_id);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath('/nexa/cultura');
  return { ok: true as const };
}

export async function abrirRondaCultura(nombre: string) {
  const perfil = await comoAdminTh();
  if (!perfil) return NO_AUTORIZADO;
  const n = nombre.trim();
  if (!n) return { ok: false as const, error: 'El nombre es requerido' };
  const supabase = createClient() as any;
  const { count } = await supabase.from('cultura_comportamientos')
    .select('id', { count: 'exact', head: true })
    .eq('empresa_id', perfil.empresa_id)
    .eq('activo', true);
  if (!count) return { ok: false as const, error: 'Agrega al menos un comportamiento antes de abrir la encuesta.' };
  const { error } = await supabase.from('cultura_rondas').insert({ empresa_id: perfil.empresa_id, nombre: n });
  if (error) {
    if (error.code === '23505') return { ok: false as const, error: 'Ya hay una encuesta abierta. Ciérrala antes de abrir otra.' };
    return { ok: false as const, error: error.message };
  }
  revalidatePath('/nexa/cultura');
  return { ok: true as const };
}

export async function cerrarRondaCultura(id: string) {
  const perfil = await comoAdminTh();
  if (!perfil) return NO_AUTORIZADO;
  const supabase = createClient() as any;
  const { error } = await supabase.from('cultura_rondas')
    .update({ estado: 'cerrada', fecha_cierre: new Date().toISOString().slice(0, 10) })
    .eq('id', id)
    .eq('empresa_id', perfil.empresa_id);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath('/nexa/cultura');
  return { ok: true as const };
}

const RespuestaSchema = z.object({
  rondaId: z.string().uuid(),
  respuestas: z.array(z.object({ comportamientoId: z.string().uuid(), actual: z.number().int().min(1).max(5), deseada: z.number().int().min(1).max(5) })).min(1),
});

/** Primero la participación (una vez por persona y ronda) y luego las respuestas anónimas, sin colaborador_id. */
export async function responderCultura(input: z.infer<typeof RespuestaSchema>) {
  const perfil = await getPerfilActual();
  if (!perfil?.colaborador_id) return NO_AUTORIZADO;
  const p = RespuestaSchema.safeParse(input);
  if (!p.success) return { ok: false as const, error: 'Datos inválidos' };
  const supabase = createClient() as any;

  const { data: activos } = await supabase.from('cultura_comportamientos')
    .select('id')
    .eq('empresa_id', perfil.empresa_id)
    .eq('activo', true);
  const ids = new Set(((activos ?? []) as { id: string }[]).map((x) => x.id));
  if (!p.data.respuestas.every((r) => ids.has(r.comportamientoId)) || p.data.respuestas.length !== ids.size) {
    return { ok: false as const, error: 'Responde todos los comportamientos.' };
  }

  const { error: e1 } = await supabase.from('cultura_participaciones').insert({
    ronda_id: p.data.rondaId,
    colaborador_id: perfil.colaborador_id,
  });
  if (e1) return { ok: false as const, error: e1.code === '23505' ? 'Ya respondiste esta encuesta.' : e1.message };

  const { data: co } = await supabase
    .from('colaboradores')
    .select('lider_id, sede_id, cargo:cargo_id(proceso_area)')
    .eq('id', perfil.colaborador_id)
    .maybeSingle();
  const cargo = (co as any)?.cargo;
  const area = (Array.isArray(cargo) ? cargo[0]?.proceso_area : cargo?.proceso_area) ?? null;
  const envio = randomUUID();
  const { error: e2 } = await supabase.from('cultura_respuestas').insert(
    p.data.respuestas.map((r) => ({
      ronda_id: p.data.rondaId,
      envio_id: envio,
      comportamiento_id: r.comportamientoId,
      actual: r.actual,
      deseada: r.deseada,
      area,
      sede_id: (co as any)?.sede_id ?? null,
      equipo_lider_id: (co as any)?.lider_id ?? null,
    }))
  );
  if (e2) return { ok: false as const, error: e2.message };
  revalidatePath('/nexa/cultura');
  return { ok: true as const };
}
