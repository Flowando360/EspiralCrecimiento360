import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Recibe el enlace del correo de recuperación, valida el código y abre la sesión
 * temporal que permite cambiar la contraseña.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const codigo = url.searchParams.get('code');
  const siguiente = url.searchParams.get('next') ?? '/restablecer-contrasena';
  const destino = siguiente.startsWith('/') ? siguiente : '/restablecer-contrasena';

  if (!codigo) return NextResponse.redirect(new URL('/recuperar-contrasena?error=enlace', url.origin));

  const { error } = await createClient().auth.exchangeCodeForSession(codigo);
  if (error) return NextResponse.redirect(new URL('/recuperar-contrasena?error=enlace', url.origin));

  return NextResponse.redirect(new URL(destino, url.origin));
}
