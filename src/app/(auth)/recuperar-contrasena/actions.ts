'use server';

import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const CorreoSchema = z.string().trim().email('Escribe un correo válido');

/**
 * Envía el correo de recuperación. Responde siempre lo mismo, exista o no la
 * cuenta, para no revelar qué correos están registrados.
 */
export async function solicitarRecuperacion(input: { correo: string }) {
  const parsed = CorreoSchema.safeParse(input.correo);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'Correo inválido' };

  const h = headers();
  const origen = `${h.get('x-forwarded-proto') ?? 'https'}://${h.get('host')}`;

  await createClient().auth.resetPasswordForEmail(parsed.data, {
    redirectTo: `${origen}/auth/confirmar?next=/restablecer-contrasena`,
  });

  return { ok: true as const };
}
