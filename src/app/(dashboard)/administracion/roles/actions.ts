'use server';

import { createClient } from '@/lib/supabase/server';
import { getPerfilActual, MODULOS } from '@/lib/supabase/get-perfil-actual';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

/**
 * Roles personalizados de la empresa (admin_th únicamente). Se usa el cliente
 * del propio usuario: las policies de roles_empresa y permisos_rol (0102)
 * ya limitan la escritura a admin_th de la misma empresa.
 */

const NombreRolSchema = z.string().trim().min(2, 'El nombre del rol debe tener al menos 2 caracteres').max(60);

const CrearRolSchema = z.object({
  nombre: NombreRolSchema,
  descripcion: z.string().trim().max(300).optional(),
});

const ActualizarRolSchema = CrearRolSchema.extend({ rolId: z.string().uuid() });

const PermisosSchema = z.object({
  rolId: z.string().uuid(),
  permisos: z.array(
    z.object({
      modulo: z.enum(MODULOS),
      leer: z.boolean(),
      escribir: z.boolean(),
      borrar: z.boolean(),
    })
  ),
});

async function requerirAdmin() {
  const perfil = await getPerfilActual();
  if (!perfil || perfil.rol !== 'admin_th') return null;
  return perfil;
}

function mensajeErrorRol(error: { code?: string; message: string }): string {
  if (error.code === '23505') return 'Ya existe un rol con ese nombre en tu empresa.';
  return error.message;
}

export async function crearRol(input: z.infer<typeof CrearRolSchema>) {
  const perfil = await requerirAdmin();
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const parsed = CrearRolSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };

  const supabase = createClient();
  const { data, error } = await supabase
    .from('roles_empresa')
    .insert({
      empresa_id: perfil.empresa_id,
      nombre: parsed.data.nombre,
      descripcion: parsed.data.descripcion || null,
    })
    .select('id')
    .single();

  if (error || !data) return { ok: false as const, error: error ? mensajeErrorRol(error) : 'No se pudo crear el rol' };

  // Nace con todos los módulos en "sin acceso", salvo Inicio y Mi perfil, para que
  // quien tenga el rol siempre tenga por dónde entrar. El administrador marca el resto.
  const filasPermisos = MODULOS.map((modulo) => {
    const lectura = modulo === 'inicio' || modulo === 'mi_perfil';
    return { rol_id: data.id, modulo, leer: lectura, escribir: false, borrar: false };
  });
  const { error: errorPermisos } = await supabase.from('permisos_rol').insert(filasPermisos);
  if (errorPermisos) return { ok: false as const, error: errorPermisos.message };

  revalidatePath('/administracion/roles');
  return { ok: true as const, id: data.id as string };
}

export async function actualizarRol(input: z.infer<typeof ActualizarRolSchema>) {
  const perfil = await requerirAdmin();
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const parsed = ActualizarRolSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };

  const supabase = createClient();
  const { error } = await supabase
    .from('roles_empresa')
    .update({ nombre: parsed.data.nombre, descripcion: parsed.data.descripcion || null })
    .eq('id', parsed.data.rolId)
    .eq('empresa_id', perfil.empresa_id);

  if (error) return { ok: false as const, error: mensajeErrorRol(error) };
  revalidatePath('/administracion/roles');
  return { ok: true as const };
}

/**
 * Guarda la matriz completa del rol. Se aplican las mismas reglas que la base
 * de datos: escribir implica leer, y borrar implica escribir.
 */
export async function guardarPermisosRol(input: z.infer<typeof PermisosSchema>) {
  const perfil = await requerirAdmin();
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const parsed = PermisosSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };

  const supabase = createClient();
  const { data: rol } = await supabase
    .from('roles_empresa')
    .select('id')
    .eq('id', parsed.data.rolId)
    .eq('empresa_id', perfil.empresa_id)
    .maybeSingle();
  if (!rol) return { ok: false as const, error: 'El rol no existe en tu empresa' };

  const porModulo = new Map(parsed.data.permisos.map((p) => [p.modulo, p]));
  const filas = MODULOS.map((modulo) => {
    const p = porModulo.get(modulo);
    const borrar = Boolean(p?.borrar);
    const escribir = Boolean(p?.escribir) || borrar;
    const leer = Boolean(p?.leer) || escribir;
    return { rol_id: parsed.data.rolId, modulo, leer, escribir, borrar };
  });

  const { error } = await supabase.from('permisos_rol').upsert(filas, { onConflict: 'rol_id,modulo' });
  if (error) return { ok: false as const, error: error.message };

  revalidatePath('/administracion/roles');
  return { ok: true as const };
}

/** Elimina el rol. Los usuarios que lo tenían vuelven a regirse solo por su rol de sistema (ON DELETE SET NULL). */
export async function eliminarRol(rolId: string) {
  const perfil = await requerirAdmin();
  if (!perfil) return { ok: false as const, error: 'No autorizado' };
  if (!z.string().uuid().safeParse(rolId).success) return { ok: false as const, error: 'Rol inválido' };

  const supabase = createClient();
  const { error } = await supabase.from('roles_empresa').delete().eq('id', rolId).eq('empresa_id', perfil.empresa_id);
  if (error) return { ok: false as const, error: error.message };

  revalidatePath('/administracion/roles');
  revalidatePath('/administracion/usuarios');
  return { ok: true as const };
}
