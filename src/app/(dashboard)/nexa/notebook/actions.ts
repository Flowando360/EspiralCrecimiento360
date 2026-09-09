'use server';

import { createClient } from '@/lib/supabase/server';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const NotaSchema = z.object({
  titulo: z.string().trim().min(1, 'El título es requerido'),
  contenido: z.string().trim().optional(),
});

export async function crearNota(input: z.infer<typeof NotaSchema>) {
  const perfil = await getPerfilActual();
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const parsed = NotaSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };

  const supabase = createClient();
  const { data, error } = await supabase
    .from('notebook_notas')
    .insert({ usuario_id: perfil.usuario_id, titulo: parsed.data.titulo, contenido: parsed.data.contenido || null })
    .select('id')
    .single();

  if (error) return { ok: false as const, error: error.message };
  revalidatePath('/nexa/notebook');
  return { ok: true as const, id: data.id as string };
}

const ActualizarSchema = z.object({
  id: z.string().uuid(),
  titulo: z.string().trim().min(1, 'El título es requerido'),
  contenido: z.string().trim().optional(),
});

export async function actualizarNota(input: z.infer<typeof ActualizarSchema>) {
  const perfil = await getPerfilActual();
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const parsed = ActualizarSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };

  const supabase = createClient();
  const { error } = await supabase
    .from('notebook_notas')
    .update({ titulo: parsed.data.titulo, contenido: parsed.data.contenido || null, updated_at: new Date().toISOString() })
    .eq('id', parsed.data.id)
    .eq('usuario_id', perfil.usuario_id);

  if (error) return { ok: false as const, error: error.message };
  revalidatePath('/nexa/notebook');
  return { ok: true as const };
}

export async function eliminarNota(id: string) {
  const perfil = await getPerfilActual();
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const supabase = createClient();
  const { error } = await supabase.from('notebook_notas').delete().eq('id', id).eq('usuario_id', perfil.usuario_id);

  if (error) return { ok: false as const, error: error.message };
  revalidatePath('/nexa/notebook');
  return { ok: true as const };
}
