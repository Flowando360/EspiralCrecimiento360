'use server';

import { createClient } from '@/lib/supabase/server';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const COLORES = ['flow', 'saber', 'hacer', 'deber', 'alto', 'medio', 'bajo', 'marmol'] as const;

async function requerirAdminThDelProceso(procesoId: string) {
  const perfil = await getPerfilActual();
  if (!perfil || perfil.rol !== 'admin_th') return null;

  const supabase = createClient();
  const { data: proceso } = await supabase
    .from('procesos_gestion')
    .select('id')
    .eq('id', procesoId)
    .eq('empresa_id', perfil.empresa_id)
    .maybeSingle();
  if (!proceso) return null;

  return perfil;
}

function ruta(procesoId: string) {
  return `/procesos-gestion/${procesoId}/tablero`;
}

// ── Etapas (columnas) ───────────────────────────────────────────────────────

const EtapaSchema = z.object({
  nombre: z.string().trim().min(1, 'El nombre de la etapa es requerido'),
  color: z.enum(COLORES),
});

export async function crearEtapa(procesoId: string, orden: number, input: z.infer<typeof EtapaSchema>) {
  const perfil = await requerirAdminThDelProceso(procesoId);
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const parsed = EtapaSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };

  const supabase = createClient();
  const { data, error } = await supabase
    .from('etapas_proceso')
    .insert({ proceso_id: procesoId, nombre: parsed.data.nombre, color: parsed.data.color, orden })
    .select('id')
    .single();

  if (error) return { ok: false as const, error: error.message };
  revalidatePath(ruta(procesoId));
  return { ok: true as const, id: data.id as string };
}

export async function crearEtapasPorDefecto(procesoId: string) {
  const perfil = await requerirAdminThDelProceso(procesoId);
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const supabase = createClient();
  const { error } = await supabase.from('etapas_proceso').insert([
    { proceso_id: procesoId, nombre: 'Por hacer', color: 'marmol', orden: 0 },
    { proceso_id: procesoId, nombre: 'En curso', color: 'hacer', orden: 1 },
    { proceso_id: procesoId, nombre: 'Hecho', color: 'alto', orden: 2 },
  ]);

  if (error) return { ok: false as const, error: error.message };
  revalidatePath(ruta(procesoId));
  return { ok: true as const };
}

export async function actualizarEtapa(procesoId: string, etapaId: string, input: z.infer<typeof EtapaSchema>) {
  const perfil = await requerirAdminThDelProceso(procesoId);
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const parsed = EtapaSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };

  const supabase = createClient();
  const { error } = await supabase
    .from('etapas_proceso')
    .update({ nombre: parsed.data.nombre, color: parsed.data.color })
    .eq('id', etapaId)
    .eq('proceso_id', procesoId);

  if (error) return { ok: false as const, error: error.message };
  revalidatePath(ruta(procesoId));
  return { ok: true as const };
}

export async function reordenarEtapas(procesoId: string, ordenIds: string[]) {
  const perfil = await requerirAdminThDelProceso(procesoId);
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const supabase = createClient();
  const actualizaciones = ordenIds.map((id, orden) =>
    supabase.from('etapas_proceso').update({ orden }).eq('id', id).eq('proceso_id', procesoId)
  );
  const resultados = await Promise.all(actualizaciones);
  const error = resultados.find((r) => r.error)?.error;
  if (error) return { ok: false as const, error: error.message };

  revalidatePath(ruta(procesoId));
  return { ok: true as const };
}

export async function eliminarEtapa(procesoId: string, etapaId: string) {
  const perfil = await requerirAdminThDelProceso(procesoId);
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const supabase = createClient();
  const { count } = await supabase
    .from('casos_proceso')
    .select('id', { count: 'exact', head: true })
    .eq('etapa_id', etapaId);
  if (count && count > 0) {
    return { ok: false as const, error: 'No se puede eliminar una etapa con tarjetas. Mueve o elimina las tarjetas primero.' };
  }

  const { error } = await supabase.from('etapas_proceso').delete().eq('id', etapaId).eq('proceso_id', procesoId);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath(ruta(procesoId));
  return { ok: true as const };
}

// ── Casos (tarjetas) ─────────────────────────────────────────────────────────

const CasoSchema = z.object({
  etapaId: z.string().uuid(),
  titulo: z.string().trim().min(1, 'El título es requerido'),
  descripcion: z.string().trim().optional(),
  responsableId: z.string().uuid().optional().or(z.literal('')),
  prioridad: z.enum(['baja', 'media', 'alta']),
  fechaLimite: z.string().trim().optional().or(z.literal('')),
});

export async function crearCaso(procesoId: string, input: z.infer<typeof CasoSchema>) {
  const perfil = await requerirAdminThDelProceso(procesoId);
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const parsed = CasoSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };

  const supabase = createClient();
  const { data, error } = await supabase
    .from('casos_proceso')
    .insert({
      proceso_id: procesoId,
      etapa_id: parsed.data.etapaId,
      titulo: parsed.data.titulo,
      descripcion: parsed.data.descripcion || null,
      responsable_id: parsed.data.responsableId || null,
      prioridad: parsed.data.prioridad,
      fecha_limite: parsed.data.fechaLimite || null,
    })
    .select('id')
    .single();

  if (error) return { ok: false as const, error: error.message };
  revalidatePath(ruta(procesoId));
  return { ok: true as const, id: data.id as string };
}

export async function actualizarCaso(procesoId: string, casoId: string, input: z.infer<typeof CasoSchema>) {
  const perfil = await requerirAdminThDelProceso(procesoId);
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const parsed = CasoSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };

  const supabase = createClient();
  const { error } = await supabase
    .from('casos_proceso')
    .update({
      etapa_id: parsed.data.etapaId,
      titulo: parsed.data.titulo,
      descripcion: parsed.data.descripcion || null,
      responsable_id: parsed.data.responsableId || null,
      prioridad: parsed.data.prioridad,
      fecha_limite: parsed.data.fechaLimite || null,
    })
    .eq('id', casoId)
    .eq('proceso_id', procesoId);

  if (error) return { ok: false as const, error: error.message };
  revalidatePath(ruta(procesoId));
  return { ok: true as const };
}

/** Mueve una tarjeta (incluida en idsEnOrdenDestino) a etapaDestinoId y fija el
 *  orden de toda la columna destino según su posición en el arreglo — así una
 *  sola llamada cubre tanto "cambiar de columna" como "reordenar dentro de la
 *  misma columna" sin dejar huecos ni pisar el orden de otras tarjetas. */
export async function moverCaso(procesoId: string, etapaDestinoId: string, idsEnOrdenDestino: string[]) {
  const perfil = await requerirAdminThDelProceso(procesoId);
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const supabase = createClient();
  const actualizaciones = idsEnOrdenDestino.map((id, orden) =>
    supabase.from('casos_proceso').update({ etapa_id: etapaDestinoId, orden }).eq('id', id).eq('proceso_id', procesoId)
  );
  const resultados = await Promise.all(actualizaciones);
  const error = resultados.find((r) => r.error)?.error;
  if (error) return { ok: false as const, error: error.message };

  revalidatePath(ruta(procesoId));
  return { ok: true as const };
}

export async function eliminarCaso(procesoId: string, casoId: string) {
  const perfil = await requerirAdminThDelProceso(procesoId);
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const supabase = createClient();
  const { error } = await supabase.from('casos_proceso').delete().eq('id', casoId).eq('proceso_id', procesoId);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath(ruta(procesoId));
  return { ok: true as const };
}
