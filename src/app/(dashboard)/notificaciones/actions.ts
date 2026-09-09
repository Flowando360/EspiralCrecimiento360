'use server';

import { createClient } from '@/lib/supabase/server';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { revalidatePath } from 'next/cache';

export async function marcarNotificacionLeida(id: string) {
  const perfil = await getPerfilActual();
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const supabase = createClient();
  const { error } = await supabase
    .from('notificaciones')
    .update({ leido: true, leido_en: new Date().toISOString() })
    .eq('id', id)
    .eq('destinatario_usuario_id', perfil.usuario_id);

  if (error) return { ok: false as const, error: error.message };
  revalidatePath('/notificaciones');
  return { ok: true as const };
}

export async function marcarTodasLeidas() {
  const perfil = await getPerfilActual();
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const supabase = createClient();
  const { error } = await supabase
    .from('notificaciones')
    .update({ leido: true, leido_en: new Date().toISOString() })
    .eq('destinatario_usuario_id', perfil.usuario_id)
    .eq('leido', false);

  if (error) return { ok: false as const, error: error.message };
  revalidatePath('/notificaciones');
  return { ok: true as const };
}
