'use server';

import { redirect } from 'next/navigation';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { z } from 'zod';

const ContrasenaSchema = z.string().min(8, 'La contraseña debe tener al menos 8 caracteres');

/** Guarda la contraseña nueva de la sesión de recuperación y envía a la persona a su espacio. */
export async function guardarContrasenaNueva(input: { password: string }) {
  const parsed = ContrasenaSchema.safeParse(input.password);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'Contraseña inválida' };

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: 'El enlace caducó. Pide uno nuevo.' };

  const { error } = await supabase.auth.updateUser({ password: parsed.data });
  if (error) return { ok: false as const, error: error.message };

  const { data: proveedor } = await createAdminClient().from('proveedores').select('activo').eq('id', user.id).maybeSingle();
  redirect(proveedor?.activo ? '/proveedor' : '/inicio');
}
