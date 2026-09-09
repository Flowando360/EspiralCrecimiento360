'use server';

import { createAdminClient } from '@/lib/supabase/server';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

// Siempre minúsculas, números y puntos — es lo que la persona escribe en el
// login (ver login/actions.ts), así que no puede llevar tildes ni espacios.
const UsuarioSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, 'El usuario es requerido')
  .regex(/^[a-z0-9]+(\.[a-z0-9]+)*$/, 'El usuario solo puede tener minúsculas, números y puntos (ej. juan.perez)');

const CrearCuentaSchema = z.object({
  nombreCompleto: z.string().trim().min(1, 'El nombre es requerido'),
  usuario: UsuarioSchema,
  email: z.string().trim().email('Correo inválido'),
  rol: z.enum(['admin_th', 'lider', 'colaborador', 'gerencia', 'auditor_externo']),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  colaboradorId: z.string().uuid().optional(),
});

const EditarUsuarioSchema = z.object({
  usuarioId: z.string().uuid(),
  nombreCompleto: z.string().trim().min(1, 'El nombre es requerido'),
  nombrePreferido: z.string().trim().optional(),
  usuario: UsuarioSchema,
  email: z.string().trim().email('Correo inválido'),
  rol: z.enum(['admin_th', 'lider', 'colaborador', 'gerencia', 'auditor_externo']),
});

/** Traduce la violación de la restricción UNIQUE de `usuario` a un mensaje entendible. */
function mensajeErrorUsuarioDuplicado(error: { code?: string; message: string }): string {
  if (error.code === '23505' && error.message.includes('usuario')) {
    return 'Ese usuario ya lo tiene otra cuenta — prueba con otro (ej. agregando un número al final).';
  }
  return error.message;
}

/**
 * Crea una cuenta real (admin_th únicamente): usuario de Supabase Auth con
 * contraseña temporal asignada por admin_th (sin depender de correo de
 * invitación, que hoy no está configurado) + su fila en perfiles_usuario +,
 * si se vincula a un colaborador existente, colaboradores.usuario_id.
 */
export async function crearCuentaUsuario(input: z.infer<typeof CrearCuentaSchema>) {
  const perfil = await getPerfilActual();
  if (!perfil || perfil.rol !== 'admin_th') return { ok: false as const, error: 'No autorizado' };

  const parsed = CrearCuentaSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  }

  const admin = createAdminClient();

  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email: parsed.data.email,
    password: parsed.data.password,
    email_confirm: true,
    user_metadata: { nombre_completo: parsed.data.nombreCompleto },
  });

  if (authError || !authData.user) {
    return { ok: false as const, error: authError?.message ?? 'No se pudo crear la cuenta' };
  }

  const { error: perfilError } = await admin.from('perfiles_usuario').insert({
    id: authData.user.id,
    empresa_id: perfil.empresa_id,
    rol: parsed.data.rol,
    nombre_completo: parsed.data.nombreCompleto,
    usuario: parsed.data.usuario,
    email: parsed.data.email,
  });

  if (perfilError) {
    // No dejar una cuenta de Auth huérfana sin su perfil.
    await admin.auth.admin.deleteUser(authData.user.id);
    return { ok: false as const, error: mensajeErrorUsuarioDuplicado(perfilError) };
  }

  if (parsed.data.colaboradorId) {
    const { error: colabError } = await admin
      .from('colaboradores')
      .update({ usuario_id: authData.user.id })
      .eq('id', parsed.data.colaboradorId)
      .eq('empresa_id', perfil.empresa_id);

    if (colabError) {
      return {
        ok: false as const,
        error: `La cuenta se creó, pero no se pudo vincular al colaborador: ${colabError.message}`,
      };
    }
  }

  revalidatePath('/administracion/usuarios');
  return { ok: true as const };
}

/**
 * Edita nombre, correo y rol de una cuenta existente (admin_th únicamente).
 * Actualiza tanto perfiles_usuario como el correo en Supabase Auth, para
 * que el usuario pueda seguir iniciando sesión con el correo nuevo.
 */
export async function actualizarUsuario(input: z.infer<typeof EditarUsuarioSchema>) {
  const perfil = await getPerfilActual();
  if (!perfil || perfil.rol !== 'admin_th') return { ok: false as const, error: 'No autorizado' };

  const parsed = EditarUsuarioSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  }

  const admin = createAdminClient();

  const { data: usuario } = await admin
    .from('perfiles_usuario')
    .select('id, email')
    .eq('id', parsed.data.usuarioId)
    .eq('empresa_id', perfil.empresa_id)
    .maybeSingle();

  if (!usuario) return { ok: false as const, error: 'Usuario no encontrado' };

  if (usuario.email !== parsed.data.email) {
    const { error: authError } = await admin.auth.admin.updateUserById(parsed.data.usuarioId, {
      email: parsed.data.email,
      user_metadata: { nombre_completo: parsed.data.nombreCompleto },
    });
    if (authError) return { ok: false as const, error: authError.message };
  }

  const { error: perfilError } = await admin
    .from('perfiles_usuario')
    .update({
      nombre_completo: parsed.data.nombreCompleto,
      nombre_preferido: parsed.data.nombrePreferido || null,
      usuario: parsed.data.usuario,
      email: parsed.data.email,
      rol: parsed.data.rol,
    })
    .eq('id', parsed.data.usuarioId)
    .eq('empresa_id', perfil.empresa_id);

  if (perfilError) return { ok: false as const, error: mensajeErrorUsuarioDuplicado(perfilError) };

  revalidatePath('/administracion/usuarios');
  return { ok: true as const };
}

/**
 * Retira o reactiva una cuenta (admin_th únicamente). Además de marcar
 * perfiles_usuario.activo, banea/desbanea al usuario en Supabase Auth para
 * que el bloqueo sea real y no solo un dato visual — un usuario retirado
 * no puede iniciar sesión ni mantener una sesión ya abierta (ver chequeo
 * de `activo` en getPerfilActual).
 */
export async function cambiarEstadoUsuario(usuarioId: string, activo: boolean) {
  const perfil = await getPerfilActual();
  if (!perfil || perfil.rol !== 'admin_th') return { ok: false as const, error: 'No autorizado' };

  if (usuarioId === perfil.usuario_id) {
    return { ok: false as const, error: 'No puedes retirar tu propia cuenta' };
  }

  const admin = createAdminClient();

  const { data: usuario } = await admin
    .from('perfiles_usuario')
    .select('id')
    .eq('id', usuarioId)
    .eq('empresa_id', perfil.empresa_id)
    .maybeSingle();

  if (!usuario) return { ok: false as const, error: 'Usuario no encontrado' };

  const { error: authError } = await admin.auth.admin.updateUserById(usuarioId, {
    ban_duration: activo ? 'none' : '876000h',
  });
  if (authError) return { ok: false as const, error: authError.message };

  const { error: perfilError } = await admin
    .from('perfiles_usuario')
    .update({ activo })
    .eq('id', usuarioId)
    .eq('empresa_id', perfil.empresa_id);

  if (perfilError) return { ok: false as const, error: perfilError.message };

  revalidatePath('/administracion/usuarios');
  return { ok: true as const };
}

const RestablecerPasswordSchema = z.object({
  usuarioId: z.string().uuid(),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
});

/**
 * Asigna una nueva contraseña temporal a una cuenta existente (admin_th
 * únicamente) — mismo mecanismo que la contraseña temporal al crear la
 * cuenta: no depende de correo de invitación (no está configurado), así
 * que admin_th la comparte con la persona por un canal seguro. No cambia
 * nada en perfiles_usuario, solo la credencial en Supabase Auth.
 */
export async function restablecerPassword(input: z.infer<typeof RestablecerPasswordSchema>) {
  const perfil = await getPerfilActual();
  if (!perfil || perfil.rol !== 'admin_th') return { ok: false as const, error: 'No autorizado' };

  const parsed = RestablecerPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  }

  const admin = createAdminClient();

  const { data: usuario } = await admin
    .from('perfiles_usuario')
    .select('id')
    .eq('id', parsed.data.usuarioId)
    .eq('empresa_id', perfil.empresa_id)
    .maybeSingle();

  if (!usuario) return { ok: false as const, error: 'Usuario no encontrado' };

  const { error } = await admin.auth.admin.updateUserById(parsed.data.usuarioId, {
    password: parsed.data.password,
  });

  if (error) return { ok: false as const, error: error.message };
  return { ok: true as const };
}

/**
 * Elimina definitivamente la cuenta (Auth + perfiles_usuario) — a diferencia
 * de cambiarEstadoUsuario, esto NO se puede deshacer. perfiles_usuario.id
 * referencia a auth.users con "on delete cascade", así que basta con borrar
 * el usuario de Auth.
 *
 * Puede fallar si esta persona quedó referenciada (sin on delete
 * cascade/set null) desde tablas de auditoría/historial — ej. certificó un
 * SABER, resolvió una alerta, publicó en el feed, etc. En ese caso Postgres
 * rechaza el borrado completo (nada queda a medias) y se le sugiere al
 * admin_th usar "retirar" (inactivo) en su lugar.
 */
export async function eliminarUsuarioDefinitivamente(usuarioId: string) {
  const perfil = await getPerfilActual();
  if (!perfil || perfil.rol !== 'admin_th') return { ok: false as const, error: 'No autorizado' };

  if (usuarioId === perfil.usuario_id) {
    return { ok: false as const, error: 'No puedes eliminar tu propia cuenta' };
  }

  const admin = createAdminClient();

  const { data: usuario } = await admin
    .from('perfiles_usuario')
    .select('id')
    .eq('id', usuarioId)
    .eq('empresa_id', perfil.empresa_id)
    .maybeSingle();

  if (!usuario) return { ok: false as const, error: 'Usuario no encontrado' };

  const { error: authError } = await admin.auth.admin.deleteUser(usuarioId);
  if (authError) {
    const esConflictoDeReferencias = /foreign key|constraint|violates/i.test(authError.message);
    return {
      ok: false as const,
      error: esConflictoDeReferencias
        ? 'No se pudo eliminar: esta persona tiene actividad registrada en el sistema (ej. verificaciones, historial, publicaciones). Usa "Retirar" para dejarla inactiva en su lugar.'
        : authError.message,
    };
  }

  revalidatePath('/administracion/usuarios');
  return { ok: true as const };
}
