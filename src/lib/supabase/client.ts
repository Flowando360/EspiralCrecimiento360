import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database.types';

/**
 * Cliente de Supabase para uso en Client Components ("use client").
 * Respeta RLS: solo trae lo que la policy del usuario autenticado permite.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
