'use server';

import { createClient } from '@/lib/supabase/server';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const RUTA = '/procesos-gestion/contexto';

async function requerirAdminTh() {
  const perfil = await getPerfilActual();
  if (!perfil || perfil.rol !== 'admin_th') return null;
  return perfil;
}

export async function crearAnalisisContexto(input: { notas?: string; responsableId?: string }) {
  const perfil = await requerirAdminTh();
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const supabase = createClient();
  const { data, error } = await supabase
    .from('analisis_contexto')
    .insert({
      empresa_id: perfil.empresa_id,
      notas: input.notas?.trim() || null,
      responsable_id: input.responsableId || null,
    })
    .select('id')
    .single();

  if (error) return { ok: false as const, error: error.message };
  revalidatePath(RUTA);
  return { ok: true as const, id: data.id as string };
}

export async function eliminarAnalisisContexto(id: string) {
  const perfil = await requerirAdminTh();
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const supabase = createClient();
  const { error } = await supabase.from('analisis_contexto').delete().eq('id', id).eq('empresa_id', perfil.empresa_id);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath(RUTA);
  return { ok: true as const };
}

const ItemContextoSchema = z.object({
  analisisId: z.string().uuid(),
  tipo: z.enum(['debilidad', 'oportunidad', 'fortaleza', 'amenaza']),
  descripcion: z.string().trim().min(1, 'La descripción es requerida'),
});

export async function crearItemContexto(input: z.infer<typeof ItemContextoSchema>) {
  const perfil = await requerirAdminTh();
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const parsed = ItemContextoSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };

  const supabase = createClient();
  // Verifica que el análisis sea de esta empresa antes de insertar (RLS ya lo exige, esto da un mensaje claro).
  const { data: analisis } = await supabase.from('analisis_contexto').select('id').eq('id', parsed.data.analisisId).eq('empresa_id', perfil.empresa_id).maybeSingle();
  if (!analisis) return { ok: false as const, error: 'Ese análisis no existe.' };

  const { data, error } = await supabase
    .from('contexto_items')
    .insert({ analisis_id: parsed.data.analisisId, tipo: parsed.data.tipo, descripcion: parsed.data.descripcion })
    .select('id')
    .single();

  if (error) return { ok: false as const, error: error.message };
  revalidatePath(RUTA);
  return { ok: true as const, id: data.id as string };
}

const EditarItemContextoSchema = z.object({ id: z.string().uuid(), descripcion: z.string().trim().min(1, 'La descripción es requerida') });

export async function actualizarItemContexto(input: z.infer<typeof EditarItemContextoSchema>) {
  const perfil = await requerirAdminTh();
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const parsed = EditarItemContextoSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };

  const supabase = createClient();
  const { error } = await supabase.from('contexto_items').update({ descripcion: parsed.data.descripcion }).eq('id', parsed.data.id);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath(RUTA);
  return { ok: true as const };
}

export async function eliminarItemContexto(id: string) {
  const perfil = await requerirAdminTh();
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const supabase = createClient();
  const { error } = await supabase.from('contexto_items').delete().eq('id', id);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath(RUTA);
  return { ok: true as const };
}
