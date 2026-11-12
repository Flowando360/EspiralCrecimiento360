import type { createAdminClient } from '@/lib/supabase/server';
import type { PerfilActual } from '@/lib/supabase/get-perfil-actual';

/**
 * Segregación de funciones (informe de pruebas, 7.3/7.4): el rol operativo de Talento Humano
 * se separa del rol técnico de Administrador. Se logra con un rol personalizado sin el módulo
 * «Administración» asignado a un usuario admin_th.
 */

/** ¿Puede administrar la empresa (usuarios, roles, configuración)? admin_th, y si tiene rol personalizado, con escritura en Administración. */
export function puedeAdministrar(perfil: Pick<PerfilActual, 'rol' | 'permisos'> | null | undefined): boolean {
  if (!perfil || perfil.rol !== 'admin_th') return false;
  if (!perfil.permisos) return true;
  return Boolean(perfil.permisos.administracion?.escribir);
}

type Admin = ReturnType<typeof createAdminClient>;

/**
 * ¿Quedaría al menos un administrador activo con acceso completo a Administración si se
 * excluye a este usuario (o a quienes tienen este rol personalizado)? Evita dejar la empresa sin administrador.
 */
export async function quedaOtroAdministrador(
  admin: Admin,
  empresaId: string,
  excluir: { usuarioId?: string; rolId?: string }
): Promise<boolean> {
  const { data: candidatos } = await admin
    .from('perfiles_usuario')
    .select('id, rol_personalizado_id')
    .eq('empresa_id', empresaId)
    .eq('rol', 'admin_th')
    .eq('activo', true);

  const validos = (candidatos ?? []).filter((c: any) => c.id !== excluir.usuarioId && !(excluir.rolId && c.rol_personalizado_id === excluir.rolId));
  if (validos.length === 0) return false;

  const idsRol = Array.from(new Set(validos.map((c: any) => c.rol_personalizado_id).filter(Boolean))) as string[];
  const rolesSinAdministracion = new Set<string>();
  if (idsRol.length > 0) {
    const { data: permisos } = await admin.from('permisos_rol').select('rol_id, escribir').eq('modulo', 'administracion').in('rol_id', idsRol);
    const conAdministracion = new Set((permisos ?? []).filter((p: any) => p.escribir).map((p: any) => p.rol_id as string));
    for (const id of idsRol) if (!conAdministracion.has(id)) rolesSinAdministracion.add(id);
  }
  return validos.some((c: any) => !c.rol_personalizado_id || !rolesSinAdministracion.has(c.rol_personalizado_id));
}

/** ¿El rol personalizado da escritura en Administración? */
export async function rolTieneAdministracion(admin: Admin, rolId: string): Promise<boolean> {
  const { data } = await admin.from('permisos_rol').select('escribir').eq('rol_id', rolId).eq('modulo', 'administracion').maybeSingle();
  return Boolean(data?.escribir);
}
