'use server';

import { createClient } from '@/lib/supabase/server';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { puedeAdministrar } from '@/lib/permisos/administracion';
import { registrarAuditoria } from '@/lib/auditoria/registrar';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const SedeSchema = z.object({
  id: z.string().uuid().optional(),
  nombre: z.string().trim().min(1, 'Escribe el nombre de la sede').max(120),
  ciudad: z.string().trim().max(120).optional(),
  direccion: z.string().trim().max(240).optional(),
});

export async function guardarSede(input: z.infer<typeof SedeSchema>) {
  const perfil = await getPerfilActual();
  if (!perfil || !puedeAdministrar(perfil)) return { ok: false as const, error: 'No autorizado' };
  const p = SedeSchema.safeParse(input);
  if (!p.success) return { ok: false as const, error: p.error.issues[0]?.message ?? 'Datos inválidos' };
  const d = p.data;
  const supabase = createClient();
  const valores = { nombre: d.nombre, ciudad: d.ciudad || null, direccion: d.direccion || null };

  if (d.id) {
    const { error } = await supabase.from('sedes').update(valores).eq('id', d.id).eq('empresa_id', perfil.empresa_id);
    if (error) return { ok: false as const, error: error.code === '23505' ? 'Ya existe una sede con ese nombre' : error.message };
  } else {
    const { error } = await supabase.from('sedes').insert({ ...valores, empresa_id: perfil.empresa_id });
    if (error) return { ok: false as const, error: error.code === '23505' ? 'Ya existe una sede con ese nombre' : error.message };
  }
  await registrarAuditoria(perfil, { modulo: 'empresa', accion: d.id ? 'sede.editar' : 'sede.crear', resumen: `${d.id ? 'Editó' : 'Creó'} la sede «${d.nombre}»`, objetoTipo: 'sede', objetoId: d.id, detalle: valores });
  revalidatePath('/administracion/sedes');
  return { ok: true as const };
}

export async function cambiarEstadoSede(input: { id: string; activa: boolean }) {
  const perfil = await getPerfilActual();
  if (!perfil || !puedeAdministrar(perfil)) return { ok: false as const, error: 'No autorizado' };
  const id = z.string().uuid().safeParse(input.id);
  if (!id.success) return { ok: false as const, error: 'Datos inválidos' };
  const supabase = createClient();
  const { data: sede } = await supabase.from('sedes').select('nombre').eq('id', id.data).eq('empresa_id', perfil.empresa_id).maybeSingle();
  if (!sede) return { ok: false as const, error: 'Sede no encontrada' };
  const { error } = await supabase.from('sedes').update({ activa: Boolean(input.activa) }).eq('id', id.data).eq('empresa_id', perfil.empresa_id);
  if (error) return { ok: false as const, error: error.message };
  await registrarAuditoria(perfil, { modulo: 'empresa', accion: 'sede.estado', resumen: `${input.activa ? 'Reactivó' : 'Desactivó'} la sede «${sede.nombre}»`, objetoTipo: 'sede', objetoId: id.data });
  revalidatePath('/administracion/sedes');
  return { ok: true as const };
}

/** Elimina una sede solo si nadie la tiene asignada (si no, se desactiva). */
export async function eliminarSede(id: string) {
  const perfil = await getPerfilActual();
  if (!perfil || !puedeAdministrar(perfil)) return { ok: false as const, error: 'No autorizado' };
  const sid = z.string().uuid().safeParse(id);
  if (!sid.success) return { ok: false as const, error: 'Datos inválidos' };
  const supabase = createClient();
  const { count } = await supabase.from('colaboradores').select('id', { count: 'exact', head: true }).eq('sede_id', sid.data);
  if ((count ?? 0) > 0) return { ok: false as const, error: `Tiene ${count} persona(s) asignada(s): desactívala en lugar de eliminarla, o reasígnalas primero` };
  const { data: sede } = await supabase.from('sedes').select('nombre').eq('id', sid.data).eq('empresa_id', perfil.empresa_id).maybeSingle();
  const { error } = await supabase.from('sedes').delete().eq('id', sid.data).eq('empresa_id', perfil.empresa_id);
  if (error) return { ok: false as const, error: error.message };
  await registrarAuditoria(perfil, { modulo: 'empresa', accion: 'sede.eliminar', resumen: `Eliminó la sede «${sede?.nombre ?? ''}»`, objetoTipo: 'sede', objetoId: sid.data });
  revalidatePath('/administracion/sedes');
  return { ok: true as const };
}
