import { createAdminClient, createClient } from '@/lib/supabase/server';
import type { Json } from '@/types/database.types';

/**
 * Autenticación del equipo proveedor. Es independiente de perfiles_usuario:
 * una sesión de Supabase Auth solo cuenta como proveedor si existe una fila
 * activa en `proveedores` con ese mismo id.
 */
export interface ProveedorActual {
  id: string;
  nombre: string;
  email: string;
  rol: 'propietario' | 'operador';
}

/** Devuelve el proveedor de la sesión actual, o null si no hay sesión o no es proveedor activo. */
export async function getProveedorActual(): Promise<ProveedorActual | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const admin = createAdminClient();
  const { data } = await admin
    .from('proveedores')
    .select('id, nombre, email, rol, activo')
    .eq('id', user.id)
    .maybeSingle();

  if (!data || !data.activo) return null;
  return { id: data.id, nombre: data.nombre, email: data.email, rol: data.rol as ProveedorActual['rol'] };
}

/** Para acciones que solo puede hacer el propietario (p. ej. gestionar otros proveedores). */
export async function requerirPropietario(): Promise<ProveedorActual | null> {
  const proveedor = await getProveedorActual();
  return proveedor?.rol === 'propietario' ? proveedor : null;
}

/** Registra una acción del proveedor en la bitácora. Nunca lanza: una falla de bitácora no debe tumbar la acción. */
export async function registrarBitacora(
  proveedorId: string,
  accion: string,
  empresaId: string | null,
  detalle: Record<string, unknown> = {}
) {
  try {
    const admin = createAdminClient();
    await admin.from('bitacora_proveedor').insert({
      proveedor_id: proveedorId,
      accion,
      empresa_id: empresaId,
      detalle: detalle as Json,
    });
  } catch {
    // Se ignora a propósito: la acción principal ya se completó.
  }
}
