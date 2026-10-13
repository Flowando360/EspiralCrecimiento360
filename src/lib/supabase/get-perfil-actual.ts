import { createClient } from '@/lib/supabase/server';
import type { RolUsuario } from '@/types/colaborador';

/** ⚠️ Ver nota de bypass en src/middleware.ts */
const BYPASS_AUTH = process.env.BYPASS_AUTH === 'true';
const EMPRESA_PILOTO_ID = '00000000-0000-0000-0000-000000000001';

/** Módulos que el administrador de la empresa puede dar a cada rol (migración 0102). */
export const MODULOS = [
  'inicio',
  'mi_perfil',
  'espiral_360',
  'reclutamiento',
  'nexa',
  'procesos',
  'informes',
  'dotaciones',
  'administracion',
] as const;
export type Modulo = (typeof MODULOS)[number];

export interface Permiso {
  leer: boolean;
  escribir: boolean;
  borrar: boolean;
}

/** Matriz de un rol personalizado. Un módulo ausente equivale a sin permiso. */
export type PermisosModulo = Partial<Record<Modulo, Permiso>>;

export interface PerfilActual {
  usuario_id: string;
  empresa_id: string;
  rol: RolUsuario;
  nombre_completo: string;
  nombre_preferido: string | null;
  email: string;
  colaborador_id: string | null;
  /** Rol personalizado asignado, o null si aplica solo el rol de sistema. */
  rol_personalizado_id: string | null;
  /** Matriz del rol personalizado; null cuando no tiene rol personalizado. */
  permisos: PermisosModulo | null;
}

/** Lee la matriz de permisos de un rol personalizado. */
async function obtenerPermisos(supabase: ReturnType<typeof createClient>, rolId: string): Promise<PermisosModulo> {
  const { data } = await supabase.from('permisos_rol').select('modulo, leer, escribir, borrar').eq('rol_id', rolId);
  const permisos: PermisosModulo = {};
  for (const fila of data ?? []) {
    permisos[fila.modulo as Modulo] = { leer: fila.leer, escribir: fila.escribir, borrar: fila.borrar };
  }
  return permisos;
}

/** Arma el perfil completo a partir de la fila de perfiles_usuario y la ficha de colaborador. */
async function armarPerfil(
  supabase: ReturnType<typeof createClient>,
  perfil: {
    id: string;
    empresa_id: string;
    rol: string;
    nombre_completo: string;
    nombre_preferido: string | null;
    email: string;
    rol_personalizado_id: string | null;
  },
  usuarioId: string
): Promise<PerfilActual> {
  const { data: colaborador } = await supabase
    .from('colaboradores')
    .select('id')
    .eq('usuario_id', usuarioId)
    .maybeSingle();

  const rolPersonalizadoId = perfil.rol_personalizado_id ?? null;

  return {
    usuario_id: perfil.id,
    empresa_id: perfil.empresa_id,
    rol: perfil.rol as RolUsuario,
    nombre_completo: perfil.nombre_completo,
    nombre_preferido: perfil.nombre_preferido ?? null,
    email: perfil.email,
    colaborador_id: (colaborador?.id as string) ?? null,
    rol_personalizado_id: rolPersonalizadoId,
    permisos: rolPersonalizadoId ? await obtenerPermisos(supabase, rolPersonalizadoId) : null,
  };
}

/**
 * Trae el perfil (rol + empresa + ficha de colaborador vinculada + permisos
 * del rol personalizado) del usuario autenticado actual. Se usa en Server
 * Components para decidir qué mostrar en el menú y filtrar consultas por rol.
 *
 * Con BYPASS_AUTH=true, en vez de exigir sesión, se toma directamente el
 * primer usuario admin_th que exista en perfiles_usuario para la empresa
 * piloto — así el dashboard es navegable mientras se resuelve el login.
 */
export async function getPerfilActual(): Promise<PerfilActual | null> {
  const perfil = await leerPerfil();
  if (!perfil) return null;
  // Una empresa desactivada por el proveedor deja sin acceso a todos sus usuarios.
  const supabase = createClient();
  const { data: empresa } = await supabase.from('empresas').select('activo').eq('id', perfil.empresa_id).maybeSingle();
  if (!empresa || empresa.activo === false) return null;
  return perfil;
}

async function leerPerfil(): Promise<PerfilActual | null> {
  const supabase = createClient();
  const columnas = 'id, empresa_id, rol, nombre_completo, nombre_preferido, email, activo, rol_personalizado_id';

  if (BYPASS_AUTH) {
    const { data: perfil } = await supabase
      .from('perfiles_usuario')
      .select(columnas)
      .eq('empresa_id', EMPRESA_PILOTO_ID)
      .eq('rol', 'admin_th')
      .limit(1)
      .maybeSingle();

    if (!perfil || perfil.activo === false) return null;
    return armarPerfil(supabase, perfil as any, perfil.id as string);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: perfil } = await supabase.from('perfiles_usuario').select(columnas).eq('id', user.id).single();

  if (!perfil || perfil.activo === false) return null;
  return armarPerfil(supabase, perfil as any, user.id);
}
