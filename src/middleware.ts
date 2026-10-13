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

  const isAuthRoute = request.nextUrl.pathname.startsWith('/login') || request.nextUrl.pathname.startsWith('/proveedor/login');
  // El panel del proveedor usa su propio inicio de sesión, separado del de empresas.
  const isProveedor = request.nextUrl.pathname.startsWith('/proveedor');
  const isPublicAsset = request.nextUrl.pathname.startsWith('/_next') ||
    request.nextUrl.pathname.startsWith('/api') ||
    // Formulario público de postulación (Reclutamiento y Selección): lo abre
    // un candidato externo que nunca ha iniciado sesión, así que no puede
    // exigir usuario autenticado como el resto del dashboard.
    request.nextUrl.pathname.startsWith('/postular') ||
    // Política de tratamiento de datos y canal de derechos del titular: también los
    // consulta el candidato sin sesión, desde el formulario de postulación.
    request.nextUrl.pathname.startsWith('/politica-tratamiento-datos') ||
    request.nextUrl.pathname.startsWith('/ejercer-derechos');

  if (!user && !isAuthRoute && !isPublicAsset) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = isProveedor ? '/proveedor/login' : '/login';
    return NextResponse.redirect(redirectUrl);
  }

  // Un usuario de empresa con sesión que abre /login va a su inicio. El proveedor
  // con sesión que abre su login va al panel. Ninguno de los dos se confunde con el otro.
  // El login del proveedor no redirige aunque haya otra sesión abierta: si no, una
  // cuenta de empresa que entra a /proveedor/login cae en un bucle con el panel.
  // Así puede iniciar sesión con la cuenta del proveedor, que reemplaza la sesión.
  if (user && isAuthRoute && !request.nextUrl.pathname.startsWith('/proveedor')) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/inicio';
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
