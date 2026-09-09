'use server';

import { createClient } from '@/lib/supabase/server';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const EnviarSchema = z.object({
  destinatarioId: z.string().uuid(),
  contenido: z.string().trim().min(1, 'Escribe algo antes de enviar'),
});

export async function enviarMensaje(input: z.infer<typeof EnviarSchema>) {
  const perfil = await getPerfilActual();
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const parsed = EnviarSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };

  const supabase = createClient();
  const { error } = await supabase.from('mensajes_directos').insert({
    empresa_id: perfil.empresa_id,
    remitente_id: perfil.usuario_id,
    destinatario_id: parsed.data.destinatarioId,
    contenido: parsed.data.contenido,
  });

  if (error) return { ok: false as const, error: error.message };

  revalidatePath(`/mensajes/${parsed.data.destinatarioId}`);
  revalidatePath('/mensajes');
  return { ok: true as const };
}

export async function marcarConversacionLeida(otroUsuarioId: string) {
  const perfil = await getPerfilActual();
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const supabase = createClient();
  const { error } = await supabase
    .from('mensajes_directos')
    .update({ leido: true, leido_en: new Date().toISOString() })
    .eq('destinatario_id', perfil.usuario_id)
    .eq('remitente_id', otroUsuarioId)
    .eq('leido', false);

  if (error) return { ok: false as const, error: error.message };
  revalidatePath('/mensajes');
  return { ok: true as const };
}
