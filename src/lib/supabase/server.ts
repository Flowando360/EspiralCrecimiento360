import { createServerClient } from '@supabase/ssr';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import type { Database } from '@/types/database.types';

/** ⚠️ Ver nota de bypass en src/middleware.ts */
const BYPASS_AUTH = process.env.BYPASS_AUTH === 'true';

/**
 * Cliente de Supabase para Server Components, Server Actions y Route Handlers.
 * Lee/escribe la sesión desde las cookies de Next.js.
 *
 * Con BYPASS_AUTH=true, en vez de depender de una sesión de Auth (que hoy no
 * hay), se usa la service_role key: esta llave se salta Row Level Security
 * por completo, así que las páginas pueden leer datos aunque nadie haya
 * iniciado sesión. Es un atajo temporal — cuando el login vuelva a
 * funcionar, quita BYPASS_AUTH de Vercel y todo vuelve a filtrar por rol.
 */
export function createClient() {
  if (BYPASS_AUTH) {
    return createSupabaseClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
  }

  const cookieStore = cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Se puede ignorar si se llama desde un Server Component:
            // el middleware ya se encarga de refrescar la sesión.
          }
        },
      },
    }
  );
}

/**
 * Cliente con service_role — SOLO para funciones administrativas de servidor
 * (crear usuarios de auth al invitar colaboradores, tareas programadas de
 * alertas, etc). Nunca se importa desde un Client Component.
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
