'use server';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { z } from 'zod';

const MENSAJE_ERROR = 'Correo o contraseña incorrectos. Verifica con Talento Humano si no tienes acceso.';

const LoginSchema = z.object({
  identificador: z.string().trim().min(1, MENSAJE_ERROR),
  password: z.string().min(1, MENSAJE_ERROR),
});

/**
 * Si escriben el correo completo, se usa tal cual. Si escriben solo el
 * usuario (ej. "juan.perez", sin "@"), se busca su correo real en la
 * columna `usuario` (independiente del correo -- ver migración 0041/0042)
 * — necesita el cliente admin porque esto pasa ANTES de autenticar, sin
 * sesión con la que RLS pueda filtrar. Si el usuario no existe, no se
 * resuelve — nunca se revela el motivo exacto, para no delatar qué
 * cuentas existen.
 */
async function resolverCorreo(identificador: string): Promise<string | null> {
  const valor = identificador.trim();
  if (valor.includes('@')) return valor;

  const admin = createAdminClient();
  const { data } = await admin.from('perfiles_usuario').select('email').eq('usuario', valor.toLowerCase()).maybeSingle();
  return data?.email ?? null;
}

export async function iniciarSesion(input: { identificador: string; password: string }) {
  const parsed = LoginSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: MENSAJE_ERROR };

  const email = await resolverCorreo(parsed.data.identificador);
  if (!email) return { ok: false as const, error: MENSAJE_ERROR };

  const supabase = createClient();
  const { data: sesion, error } = await supabase.auth.signInWithPassword({ email, password: parsed.data.password });
  if (error) return { ok: false as const, error: MENSAJE_ERROR };

  // La contraseña es correcta, pero eso no basta: hace falta un perfil
  // activo en perfiles_usuario para entrar al dashboard (lo exige
  // getPerfilActual en cada página). Sin este chequeo, una cuenta de Auth
  // sin perfil (o con perfil desactivado) generaba un loop de redirecciones
  // infinito entre /login y /inicio -- el navegador lo mostraba como "la
  // página no funciona" / "demasiadas redirecciones", sin ningún mensaje.
  // Se corta acá, antes de redirigir, con un mensaje claro.
  const { data: perfil } = await supabase
    .from('perfiles_usuario')
    .select('activo')
    .eq('id', sesion.user.id)
    .maybeSingle();

  if (!perfil || perfil.activo === false) {
    await supabase.auth.signOut();
    return {
      ok: false as const,
      error: 'Tu cuenta no tiene un perfil activo en el sistema. Contacta a Talento Humano.',
    };
  }

  redirect('/inicio');
}
