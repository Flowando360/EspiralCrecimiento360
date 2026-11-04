'use server';

import { createClient as createClienteSimple } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const Schema = z.object({
  actual: z.string().min(1, 'Escribe tu contraseña actual'),
  nueva: z.string().min(8, 'La contraseña nueva debe tener al menos 8 caracteres'),
});

/**
 * Cambia la contraseña de la persona que tiene la sesión abierta.
 * Primero comprueba la contraseña actual con un cliente aparte (que no toca
 * las cookies de la sesión) y solo entonces guarda la nueva.
 */
export async function cambiarContrasena(input: z.infer<typeof Schema>) {
  const parsed = Schema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  if (parsed.data.actual === parsed.data.nueva) {
    return { ok: false as const, error: 'La contraseña nueva debe ser distinta de la actual' };
  }

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return { ok: false as const, error: 'Tu sesión caducó. Vuelve a iniciar sesión.' };

  const verificador = createClienteSimple(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
  const { error: errActual } = await verificador.auth.signInWithPassword({
    email: user.email,
    password: parsed.data.actual,
  });
  if (errActual) return { ok: false as const, error: 'La contraseña actual no es correcta' };

  const { error } = await supabase.auth.updateUser({ password: parsed.data.nueva });
  if (error) return { ok: false as const, error: error.message };
  return { ok: true as const };
}
