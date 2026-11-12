import { createClient } from '@/lib/supabase/server';
import type { PerfilActual } from '@/lib/supabase/get-perfil-actual';

/**
 * Registro de auditoría de cambios de configuración (informe de pruebas, 7.4).
 * Se inserta con el cliente del propio usuario: la política de la base solo deja registrar
 * cambios a nombre de quien está logueado. Nunca interrumpe la operación principal.
 */
export interface EventoAuditoria {
  /** Módulo afectado: 'usuarios', 'roles', 'empresa', 'ponderaciones', 'parametros_legales', 'competencias', 'cargos'… */
  modulo: string;
  /** Acción corta, p. ej. 'usuario.crear', 'rol.permisos'. */
  accion: string;
  /** Frase legible: «Cambió el rol de Ana Pérez de Colaborador a Líder». */
  resumen: string;
  objetoTipo?: string;
  objetoId?: string;
  /** Antes y después, u otros datos. No guardar contraseñas ni secretos. */
  detalle?: Record<string, unknown>;
}

export async function registrarAuditoria(perfil: Pick<PerfilActual, 'usuario_id' | 'empresa_id' | 'nombre_completo' | 'rol'>, e: EventoAuditoria): Promise<void> {
  try {
    const supabase = createClient();
    const { error } = await supabase.from('auditoria_cambios').insert({
      empresa_id: perfil.empresa_id,
      usuario_id: perfil.usuario_id,
      usuario_nombre: perfil.nombre_completo,
      usuario_rol: perfil.rol,
      modulo: e.modulo,
      accion: e.accion,
      resumen: e.resumen,
      objeto_tipo: e.objetoTipo ?? null,
      objeto_id: e.objetoId ?? null,
      detalle: (e.detalle ?? null) as any,
    });
    if (error) console.error('No se pudo registrar la auditoría:', error.message);
  } catch (err) {
    console.error('No se pudo registrar la auditoría:', err);
  }
}

/** Compara dos objetos y devuelve solo los campos que cambiaron ({ campo: { antes, despues } }). */
export function diferencias(antes: Record<string, unknown>, despues: Record<string, unknown>): Record<string, { antes: unknown; despues: unknown }> {
  const salida: Record<string, { antes: unknown; despues: unknown }> = {};
  for (const k of Object.keys(despues)) {
    if (JSON.stringify(antes[k] ?? null) !== JSON.stringify(despues[k] ?? null)) salida[k] = { antes: antes[k] ?? null, despues: despues[k] ?? null };
  }
  return salida;
}
