'use server';

import { createAdminClient } from '@/lib/supabase/server';
import { getProveedorActual, requerirPropietario, registrarBitacora } from '@/lib/proveedor/auth';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

/**
 * Panel del proveedor (Modelo de Negocio Espiral Evolutiva secc. 5): empresas
 * cliente de la alianza Flowando/Nexus/V&E. Autoriza con la tabla `proveedores`
 * y lee/escribe con el cliente de servicio, porque el proveedor no pertenece a
 * ninguna empresa. Cada acción queda en bitacora_proveedor.
 */
async function requerirSuperadmin() {
  return getProveedorActual();
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
  await registrarBitacora(perfil.id, 'membresia', parsed.data.empresaId, { plan: parsed.data.planMembresia, facturacion: parsed.data.estadoFacturacion });
  revalidatePath('/proveedor');
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

  await registrarBitacora(perfil.id, 'crear_empresa', empresa.id, { slug: datos.slug, admin: datos.adminUsuario });
  revalidatePath('/proveedor');
  return { ok: true as const, empresaId: empresa.id as string };
}

const DatosEmpresaSchema = z.object({
  empresaId: z.string().uuid(),
  nombre: z.string().trim().min(2, 'El nombre de la empresa es requerido'),
  colorMarca: ColorSchema,
  colorSecundario: ColorSchema,
  colorAcento: ColorSchema,
  logoUrl: z.string().trim().nullable(),
});

/** Edita los datos y la marca de cualquier empresa (solo superadmin). */
export async function actualizarDatosEmpresa(input: z.infer<typeof DatosEmpresaSchema>) {
  const perfil = await requerirSuperadmin();
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const parsed = DatosEmpresaSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  const datos = parsed.data;

  const admin = createAdminClient();
  const { error } = await admin
    .from('empresas')
    .update({
      nombre: datos.nombre,
      color_marca: datos.colorMarca,
      color_secundario: datos.colorSecundario,
      color_acento: datos.colorAcento,
      logo_url: datos.logoUrl || null,
    })
    .eq('id', datos.empresaId);

  if (error) return { ok: false as const, error: error.message };
  await registrarBitacora(perfil.id, 'datos_empresa', datos.empresaId, { nombre: datos.nombre });
  revalidatePath('/proveedor');
  revalidatePath(`/proveedor/empresas/${datos.empresaId}`);
  return { ok: true as const };
}

/** Activa o desactiva una empresa. Si está inactiva, ninguno de sus usuarios puede entrar. */
export async function cambiarEstadoEmpresa(empresaId: string, activo: boolean) {
  const perfil = await requerirSuperadmin();
  if (!perfil) return { ok: false as const, error: 'No autorizado' };
  if (!z.string().uuid().safeParse(empresaId).success) return { ok: false as const, error: 'Empresa inválida' };

  const admin = createAdminClient();
  const { error } = await admin.from('empresas').update({ activo }).eq('id', empresaId);
  if (error) return { ok: false as const, error: error.message };

  await registrarBitacora(perfil.id, activo ? 'activar_empresa' : 'desactivar_empresa', empresaId);
  revalidatePath('/proveedor');
  revalidatePath(`/proveedor/empresas/${empresaId}`);
  return { ok: true as const };
}

const NuevoProveedorSchema = z.object({
  nombre: z.string().trim().min(2, 'El nombre es requerido'),
  email: z.string().trim().email('Correo inválido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  rol: z.enum(['propietario', 'operador']),
});

/** Crea una cuenta del equipo proveedor. Solo propietarios. */
export async function crearProveedor(input: z.infer<typeof NuevoProveedorSchema>) {
  const propietario = await requerirPropietario();
  if (!propietario) return { ok: false as const, error: 'Solo un propietario puede gestionar el equipo proveedor' };

  const parsed = NuevoProveedorSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  const datos = parsed.data;

  const admin = createAdminClient();
  const { data: auth, error: errorAuth } = await admin.auth.admin.createUser({
    email: datos.email,
    password: datos.password,
    email_confirm: true,
    user_metadata: { nombre_completo: datos.nombre, proveedor: true },
  });
  if (errorAuth || !auth.user) return { ok: false as const, error: errorAuth?.message ?? 'No se pudo crear la cuenta' };

  const { error: errorFila } = await admin.from('proveedores').insert({
    id: auth.user.id,
    nombre: datos.nombre,
    email: datos.email,
    rol: datos.rol,
  });
  if (errorFila) {
    await admin.auth.admin.deleteUser(auth.user.id);
    return { ok: false as const, error: errorFila.message };
  }

  await registrarBitacora(propietario.id, 'crear_proveedor', null, { email: datos.email, rol: datos.rol });
  revalidatePath('/proveedor/equipo');
  return { ok: true as const };
}

/** Activa o desactiva una cuenta del equipo proveedor. Solo propietarios; nadie se desactiva a sí mismo. */
export async function cambiarEstadoProveedor(proveedorId: string, activo: boolean) {
  const propietario = await requerirPropietario();
  if (!propietario) return { ok: false as const, error: 'Solo un propietario puede gestionar el equipo proveedor' };
  if (!z.string().uuid().safeParse(proveedorId).success) return { ok: false as const, error: 'Proveedor inválido' };
  if (proveedorId === propietario.id && !activo) return { ok: false as const, error: 'No puedes desactivar tu propia cuenta' };

  const admin = createAdminClient();
  const { error } = await admin.from('proveedores').update({ activo }).eq('id', proveedorId);
  if (error) return { ok: false as const, error: error.message };

  await registrarBitacora(propietario.id, activo ? 'activar_proveedor' : 'desactivar_proveedor', null, { proveedorId });
  revalidatePath('/proveedor/equipo');
  return { ok: true as const };
}
