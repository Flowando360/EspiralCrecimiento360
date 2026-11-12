'use server';

import { puedeAdministrar } from '@/lib/permisos/administracion';
import { registrarAuditoria, diferencias } from '@/lib/auditoria/registrar';
import { quedaOtroAdministrador } from '@/lib/permisos/administracion';

import { createClient, createAdminClient } from '@/lib/supabase/server';
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
  if (!perfil || !puedeAdministrar(perfil)) return null;
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

  await registrarAuditoria(perfil, {
    modulo: 'roles',
    accion: 'rol.crear',
    resumen: `Creó el rol «${parsed.data.nombre}»`,
    objetoTipo: 'rol',
    objetoId: data.id as string,
  });
  revalidatePath('/administracion/roles');
  return { ok: true as const, id: data.id as string };
}

/**
 * Crea el rol «Talento Humano (operativo)»: acceso completo a todos los módulos de trabajo
 * menos Administración. Separa a quien opera el día a día de Talento Humano de quien administra
 * usuarios, roles y configuración (segregación de funciones). Se asigna a un usuario con rol de
 * sistema admin_th desde Usuarios y roles; otro administrador conserva el acceso completo.
 */
export async function crearRolTalentoHumanoOperativo() {
  const perfil = await requerirAdmin();
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const supabase = createClient();
  const nombre = 'Talento Humano (operativo)';
  const { data: existente } = await supabase.from('roles_empresa').select('id').eq('empresa_id', perfil.empresa_id).eq('nombre', nombre).maybeSingle();
  if (existente) return { ok: false as const, error: 'Ya existe el rol «Talento Humano (operativo)». Ábrelo en la lista para revisar sus permisos.' };

  const { data, error } = await supabase
    .from('roles_empresa')
    .insert({
      empresa_id: perfil.empresa_id,
      nombre,
      descripcion: 'Opera los módulos de Talento Humano día a día, sin acceso a Administración (usuarios, roles, configuración y respaldo).',
    })
    .select('id')
    .single();
  if (error || !data) return { ok: false as const, error: error ? mensajeErrorRol(error) : 'No se pudo crear el rol' };

  const filas = MODULOS.map((modulo) => {
    const trabajo = modulo !== 'administracion';
    return { rol_id: data.id, modulo, leer: trabajo, escribir: trabajo, borrar: trabajo };
  });
  const { error: errPermisos } = await supabase.from('permisos_rol').insert(filas);
  if (errPermisos) return { ok: false as const, error: errPermisos.message };

  await registrarAuditoria(perfil, {
    modulo: 'roles',
    accion: 'rol.crear',
    resumen: `Creó el rol «${nombre}» desde la plantilla de segregación de funciones (sin acceso a Administración)`,
    objetoTipo: 'rol',
    objetoId: data.id as string,
  });
  revalidatePath('/administracion/roles');
  return { ok: true as const, id: data.id as string };
}

export async function actualizarRol(input: z.infer<typeof ActualizarRolSchema>) {
  const perfil = await requerirAdmin();
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const parsed = ActualizarRolSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };

  const supabase = createClient();
  const { data: antes } = await supabase.from('roles_empresa').select('nombre, descripcion').eq('id', parsed.data.rolId).eq('empresa_id', perfil.empresa_id).maybeSingle();
  const { error } = await supabase
    .from('roles_empresa')
    .update({ nombre: parsed.data.nombre, descripcion: parsed.data.descripcion || null })
    .eq('id', parsed.data.rolId)
    .eq('empresa_id', perfil.empresa_id);

  if (error) return { ok: false as const, error: mensajeErrorRol(error) };
  await registrarAuditoria(perfil, {
    modulo: 'roles',
    accion: 'rol.editar',
    resumen: `Editó el rol «${parsed.data.nombre}»${antes && antes.nombre !== parsed.data.nombre ? ` (antes «${antes.nombre}»)` : ''}`,
    objetoTipo: 'rol',
    objetoId: parsed.data.rolId,
    detalle: antes ? diferencias({ nombre: antes.nombre, descripcion: antes.descripcion }, { nombre: parsed.data.nombre, descripcion: parsed.data.descripcion || null }) : undefined,
  });
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
    .select('id, nombre')
    .eq('id', parsed.data.rolId)
    .eq('empresa_id', perfil.empresa_id)
    .maybeSingle();
  if (!rol) return { ok: false as const, error: 'El rol no existe en tu empresa' };

  // Nadie puede cambiar los permisos del rol que él mismo tiene asignado (evita autoasignarse accesos).
  if (perfil.rol_personalizado_id === parsed.data.rolId) {
    return { ok: false as const, error: 'No puedes modificar los permisos del rol que tienes asignado. Pídeselo a otro administrador.' };
  }
  const { data: permisosAntes } = await supabase.from('permisos_rol').select('modulo, leer, escribir, borrar').eq('rol_id', parsed.data.rolId);

  const porModulo = new Map(parsed.data.permisos.map((p) => [p.modulo, p]));
  const filas = MODULOS.map((modulo) => {
    const p = porModulo.get(modulo);
    const borrar = Boolean(p?.borrar);
    const escribir = Boolean(p?.escribir) || borrar;
    const leer = Boolean(p?.leer) || escribir;
    return { rol_id: parsed.data.rolId, modulo, leer, escribir, borrar };
  });

  // No se puede quitar Administración a un rol si con eso la empresa se queda sin administrador completo.
  const adminNuevo = filas.find((f) => f.modulo === 'administracion');
  const adminAntes = (permisosAntes ?? []).find((p: any) => p.modulo === 'administracion');
  if (adminAntes?.escribir && adminNuevo && !adminNuevo.escribir) {
    if (!(await quedaOtroAdministrador(createAdminClient(), perfil.empresa_id, { rolId: parsed.data.rolId }))) {
      return { ok: false as const, error: 'Con este cambio la empresa se quedaría sin un administrador activo con acceso completo a Administración.' };
    }
  }

  const { error } = await supabase.from('permisos_rol').upsert(filas, { onConflict: 'rol_id,modulo' });
  if (error) return { ok: false as const, error: error.message };

  const antes = new Map((permisosAntes ?? []).map((p: any) => [p.modulo as string, `${p.leer ? 'L' : '-'}${p.escribir ? 'E' : '-'}${p.borrar ? 'B' : '-'}`]));
  const cambios: Record<string, { antes: unknown; despues: unknown }> = {};
  for (const f of filas) {
    const despues = `${f.leer ? 'L' : '-'}${f.escribir ? 'E' : '-'}${f.borrar ? 'B' : '-'}`;
    if ((antes.get(f.modulo) ?? '---') !== despues) cambios[f.modulo] = { antes: antes.get(f.modulo) ?? '---', despues };
  }
  if (Object.keys(cambios).length > 0) {
    await registrarAuditoria(perfil, {
      modulo: 'roles',
      accion: 'rol.permisos',
      resumen: `Cambió los permisos del rol «${rol.nombre}» en: ${Object.keys(cambios).join(', ')}`,
      objetoTipo: 'rol',
      objetoId: parsed.data.rolId,
      detalle: { convencion: 'L = leer, E = escribir, B = borrar', cambios },
    });
  }

  revalidatePath('/administracion/roles');
  return { ok: true as const };
}

/** Elimina el rol. Los usuarios que lo tenían vuelven a regirse solo por su rol de sistema (ON DELETE SET NULL). */
export async function eliminarRol(rolId: string) {
  const perfil = await requerirAdmin();
  if (!perfil) return { ok: false as const, error: 'No autorizado' };
  if (!z.string().uuid().safeParse(rolId).success) return { ok: false as const, error: 'Rol inválido' };

  if (perfil.rol_personalizado_id === rolId) return { ok: false as const, error: 'No puedes eliminar el rol que tienes asignado.' };

  const supabase = createClient();
  const { data: rol } = await supabase.from('roles_empresa').select('nombre').eq('id', rolId).eq('empresa_id', perfil.empresa_id).maybeSingle();
  if (!rol) return { ok: false as const, error: 'El rol no existe en tu empresa' };
  const { error } = await supabase.from('roles_empresa').delete().eq('id', rolId).eq('empresa_id', perfil.empresa_id);
  if (error) return { ok: false as const, error: error.message };

  await registrarAuditoria(perfil, { modulo: 'roles', accion: 'rol.eliminar', resumen: `Eliminó el rol «${rol.nombre}»`, objetoTipo: 'rol', objetoId: rolId });
  revalidatePath('/administracion/roles');
  revalidatePath('/administracion/usuarios');
  return { ok: true as const };
}
