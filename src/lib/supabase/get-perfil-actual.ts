import { createClient } from '@/lib/supabase/server';
import type { RolUsuario } from '@/types/colaborador';

/** ⚠️ Ver nota de bypass en src/middleware.ts */
const BYPASS_AUTH = process.env.BYPASS_AUTH === 'true';
const EMPRESA_PILOTO_ID = '00000000-0000-0000-0000-000000000001';

export interface PerfilActual {
  usuario_id: string;
  empresa_id: string;
  rol: RolUsuario;
  nombre_completo: string;
  nombre_preferido: string | null;
  email: string;
  colaborador_id: string | null;
  es_superadmin: boolean;
}

/**
 * Consulta es_superadmin en una llamada aparte, tolerante a que la
 * migración 0029_meta_admin_membresias.sql todavía no se haya aplicado en
 * la base de datos (esa columna no existe aún) — así el login y el resto
 * de la app nunca dependen de que esta migración puntual ya haya corrido.
 * Devuelve false ante cualquier error, nunca lanza.
 */
async function obtenerEsSuperadmin(supabase: ReturnType<typeof createClient>, usuarioId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('perfiles_usuario')
    .select('es_superadmin')
    .eq('id', usuarioId)
    .maybeSingle();
  if (error || !data) return false;
  return Boolean((data as any).es_superadmin);
}

/**
 * Trae el perfil (rol + empresa + ficha de colaborador vinculada) del
 * usuario autenticado actual. Se usa en Server Components para decidir
 * qué mostrar en el sidebar y filtrar consultas por rol.
 *
 * Con BYPASS_AUTH=true, en vez de exigir sesión, se toma directamente el
 * primer usuario admin_th que exista en perfiles_usuario para la empresa
 * piloto — así el dashboard es navegable mientras se resuelve el login.
 */
export async function getPerfilActual(): Promise<PerfilActual | null> {
  const supabase = createClient();

  if (BYPASS_AUTH) {
    const { data: perfil } = await supabase
      .from('perfiles_usuario')
      .select('id, empresa_id, rol, nombre_completo, nombre_preferido, email, activo')
      .eq('empresa_id', EMPRESA_PILOTO_ID)
      .eq('rol', 'admin_th')
      .limit(1)
      .maybeSingle();

    if (!perfil || perfil.activo === false) return null;

    const { data: colaborador } = await supabase
      .from('colaboradores')
      .select('id')
      .eq('usuario_id', perfil.id as string)
      .maybeSingle();

    return {
      usuario_id: perfil.id as string,
      empresa_id: perfil.empresa_id as string,
      rol: perfil.rol as RolUsuario,
      nombre_completo: perfil.nombre_completo as string,
      nombre_preferido: (perfil.nombre_preferido as string | null) ?? null,
      email: perfil.email as string,
      colaborador_id: (colaborador?.id as string) ?? null,
      es_superadmin: await obtenerEsSuperadmin(supabase, perfil.id as string),
    };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: perfil } = await supabase
    .from('perfiles_usuario')
    .select('id, empresa_id, rol, nombre_completo, nombre_preferido, email, activo')
    .eq('id', user.id)
    .single();

  if (!perfil || perfil.activo === false) return null;

  const { data: colaborador } = await supabase
    .from('colaboradores')
    .select('id')
    .eq('usuario_id', user.id)
    .maybeSingle();

  return {
    usuario_id: perfil.id as string,
    empresa_id: perfil.empresa_id as string,
    rol: perfil.rol as RolUsuario,
    nombre_completo: perfil.nombre_completo as string,
    nombre_preferido: (perfil.nombre_preferido as string | null) ?? null,
    email: perfil.email as string,
    colaborador_id: (colaborador?.id as string) ?? null,
    es_superadmin: await obtenerEsSuperadmin(supabase, user.id),
  };
}
