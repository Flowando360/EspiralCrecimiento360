'use server';

import { createAdminClient } from '@/lib/supabase/server';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

/**
 * Panel meta-admin (Modelo de Negocio Espiral Evolutiva secc. 5): cuentas y
 * membresías de TODAS las empresas cliente de la alianza Flowando/Nexus/V&E.
 * Se autoriza en la capa de aplicación (perfiles_usuario.es_superadmin) y se
 * consulta con el cliente admin (service role) porque un superadmin no
 * pertenece a una sola empresa — las policies existentes de "empresas" y
 * "perfiles_usuario" siguen intactas para todos los demás roles.
 */
async function requerirSuperadmin() {
  const perfil = await getPerfilActual();
  if (!perfil || !perfil.es_superadmin) return null;
  return perfil;
}

const MembresiaSchema = z.object({
  empresaId: z.string().uuid(),
  planMembresia: z.enum(['piloto', 'estandar', 'premium']),
  precioMembresiaMensual: z.number().min(0).nullable(),
  estadoFacturacion: z.enum(['al_dia', 'pendiente', 'vencido']),
  fechaProximoPago: z.string().nullable(),
});

export async function actualizarMembresia(input: z.infer<typeof MembresiaSchema>) {
  const perfil = await requerirSuperadmin();
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const parsed = MembresiaSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };

  const admin = createAdminClient();
  const { error } = await admin
    .from('empresas')
    .update({
      plan_membresia: parsed.data.planMembresia,
      precio_membresia_mensual: parsed.data.precioMembresiaMensual,
      estado_facturacion: parsed.data.estadoFacturacion,
      fecha_proximo_pago: parsed.data.fechaProximoPago || null,
    })
    .eq('id', parsed.data.empresaId);

  if (error) return { ok: false as const, error: error.message };
  revalidatePath('/meta-admin');
  return { ok: true as const };
}

const UsuarioLoginSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, 'El usuario es requerido')
  .regex(/^[a-z0-9]+(\.[a-z0-9]+)*$/, 'El usuario solo puede tener minúsculas, números y puntos (ej. juan.perez)');

const ColorSchema = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Color inválido (formato #RRGGBB)');

const NuevaEmpresaSchema = z.object({
  nombre: z.string().trim().min(2, 'El nombre de la empresa es requerido'),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(2, 'El identificador es requerido')
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'El identificador solo puede tener minúsculas, números y guiones'),
  planMembresia: z.enum(['piloto', 'estandar', 'premium']),
  colorMarca: ColorSchema,
  colorSecundario: ColorSchema,
  colorAcento: ColorSchema,
  logoUrl: z.string().trim().nullable(),
  adminNombre: z.string().trim().min(1, 'El nombre del administrador es requerido'),
  adminUsuario: UsuarioLoginSchema,
  adminEmail: z.string().trim().email('Correo del administrador inválido'),
  adminPassword: z.string().min(8, 'La contraseña del administrador debe tener al menos 8 caracteres'),
});

/**
 * Crea una empresa cliente con su primer administrador (admin_th). Si un paso
 * falla, revierte los anteriores para no dejar una empresa sin administrador
 * ni una cuenta de Auth sin perfil.
 */
export async function crearEmpresaConAdministrador(input: z.infer<typeof NuevaEmpresaSchema>) {
  const perfil = await requerirSuperadmin();
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const parsed = NuevaEmpresaSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  const datos = parsed.data;

  const admin = createAdminClient();

  const { data: empresa, error: errorEmpresa } = await admin
    .from('empresas')
    .insert({
      nombre: datos.nombre,
      slug: datos.slug,
      plan_membresia: datos.planMembresia,
      color_marca: datos.colorMarca,
      color_secundario: datos.colorSecundario,
      color_acento: datos.colorAcento,
      logo_url: datos.logoUrl || null,
    })
    .select('id')
    .single();

  if (errorEmpresa || !empresa) {
    const duplicada = errorEmpresa?.code === '23505';
    return {
      ok: false as const,
      error: duplicada ? 'Ya existe una empresa con ese identificador.' : errorEmpresa?.message ?? 'No se pudo crear la empresa',
    };
  }

  const revertirEmpresa = () => admin.from('empresas').delete().eq('id', empresa.id);

  const { data: authData, error: errorAuth } = await admin.auth.admin.createUser({
    email: datos.adminEmail,
    password: datos.adminPassword,
    email_confirm: true,
    user_metadata: { nombre_completo: datos.adminNombre },
  });
  if (errorAuth || !authData.user) {
    await revertirEmpresa();
    return { ok: false as const, error: errorAuth?.message ?? 'No se pudo crear la cuenta del administrador' };
  }

  const { error: errorPerfil } = await admin.from('perfiles_usuario').insert({
    id: authData.user.id,
    empresa_id: empresa.id,
    rol: 'admin_th',
    nombre_completo: datos.adminNombre,
    usuario: datos.adminUsuario,
    email: datos.adminEmail,
  });
  if (errorPerfil) {
    await admin.auth.admin.deleteUser(authData.user.id);
    await revertirEmpresa();
    const usuarioDuplicado = errorPerfil.code === '23505' && errorPerfil.message.includes('usuario');
    return {
      ok: false as const,
      error: usuarioDuplicado
        ? 'Ese usuario ya lo tiene otra cuenta — prueba con otro (ej. agregando un número).'
        : errorPerfil.message,
    };
  }

  revalidatePath('/meta-admin');
  return { ok: true as const, empresaId: empresa.id as string };
}

/** Concede superusuario a una cuenta existente, identificada por su usuario de login. */
export async function concederSuperusuario(usuarioLogin: string) {
  const perfil = await requerirSuperadmin();
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const parsed = UsuarioLoginSchema.safeParse(usuarioLogin);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'Usuario inválido' };

  const admin = createAdminClient();
  const { data: cuenta } = await admin
    .from('perfiles_usuario')
    .select('id, es_superadmin')
    .eq('usuario', parsed.data)
    .maybeSingle();
  if (!cuenta) return { ok: false as const, error: 'No existe una cuenta con ese usuario' };
  if (cuenta.es_superadmin) return { ok: false as const, error: 'Esa cuenta ya es superusuario' };

  const { error } = await admin.from('perfiles_usuario').update({ es_superadmin: true }).eq('id', cuenta.id);
  if (error) return { ok: false as const, error: error.message };

  revalidatePath('/meta-admin');
  return { ok: true as const };
}

/** Quita superusuario. Nadie se quita a sí mismo y siempre debe quedar al menos uno. */
export async function quitarSuperusuario(usuarioId: string) {
  const perfil = await requerirSuperadmin();
  if (!perfil) return { ok: false as const, error: 'No autorizado' };
  if (!z.string().uuid().safeParse(usuarioId).success) return { ok: false as const, error: 'Usuario inválido' };
  if (usuarioId === perfil.usuario_id) return { ok: false as const, error: 'No puedes quitarte tu propio superusuario' };

  const admin = createAdminClient();
  const { count } = await admin
    .from('perfiles_usuario')
    .select('id', { count: 'exact', head: true })
    .eq('es_superadmin', true);
  if ((count ?? 0) <= 1) return { ok: false as const, error: 'Debe quedar al menos un superusuario' };

  const { error } = await admin.from('perfiles_usuario').update({ es_superadmin: false }).eq('id', usuarioId);
  if (error) return { ok: false as const, error: error.message };

  revalidatePath('/meta-admin');
  return { ok: true as const };
}
