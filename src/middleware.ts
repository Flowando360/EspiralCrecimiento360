import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * ⚠️ BYPASS TEMPORAL — quitar cuando se resuelva el login.
 * Con BYPASS_AUTH=true en las variables de entorno, el middleware deja
 * pasar directo al dashboard sin exigir sesión de Supabase Auth.
 * Para reactivar el login normal: borra o pon en "false" esta variable
 * en Vercel (Settings → Environment Variables) y vuelve a desplegar.
 */
const BYPASS_AUTH = process.env.BYPASS_AUTH === 'true';

/**
 * Refresca la sesión de Supabase en cada request y protege las rutas del
 * dashboard: sin sesión válida, redirige a /login.
 */
export async function middleware(request: NextRequest) {
  if (BYPASS_AUTH) {
    // Si alguien cae en /login con el bypass activo, lo mandamos directo
    // al dashboard; todo lo demás pasa sin verificar sesión.
    if (request.nextUrl.pathname.startsWith('/login')) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/inicio';
      return NextResponse.redirect(redirectUrl);
    }
    return NextResponse.next();
  }

  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request: { headers: request.headers } });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAuthRoute = request.nextUrl.pathname.startsWith('/login');
  const isPublicAsset = request.nextUrl.pathname.startsWith('/_next') ||
    request.nextUrl.pathname.startsWith('/api') ||
    // Formulario público de postulación (Reclutamiento y Selección): lo abre
    // un candidato externo que nunca ha iniciado sesión, así que no puede
    // exigir usuario autenticado como el resto del dashboard.
    request.nextUrl.pathname.startsWith('/postular');

  if (!user && !isAuthRoute && !isPublicAsset) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/login';
    return NextResponse.redirect(redirectUrl);
  }

  if (user && isAuthRoute) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/inicio';
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
