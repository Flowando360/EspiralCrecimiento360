'use server';

import { redirect } from 'next/navigation';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const MENSAJE_ERROR = 'Correo o contraseña incorrectos, o la cuenta no tiene acceso al panel de proveedor.';

const LoginProveedorSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

/**
 * Inicia sesión en el panel del proveedor. La contraseña se valida con Supabase
 * Auth, pero la sesión solo se acepta si la cuenta existe y está activa en
 * `proveedores`. Si no, se cierra la sesión de inmediato.
 */
export async function iniciarSesionProveedor(input: { email: string; password: string }) {
  const parsed = LoginProveedorSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: MENSAJE_ERROR };

  const supabase = createClient();
  const { data: sesion, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });
  if (error || !sesion.user) return { ok: false as const, error: MENSAJE_ERROR };

  const admin = createAdminClient();
  const { data: proveedor } = await admin
    .from('proveedores')
    .select('id, activo')
    .eq('id', sesion.user.id)
    .maybeSingle();

  if (!proveedor || !proveedor.activo) {
    await supabase.auth.signOut();
    return { ok: false as const, error: MENSAJE_ERROR };
  }

  await admin.from('proveedores').update({ ultimo_acceso_en: new Date().toISOString() }).eq('id', proveedor.id);
  redirect('/proveedor');
}

export async function cerrarSesionProveedor() {
  await createClient().auth.signOut();
  redirect('/proveedor/login');
}
