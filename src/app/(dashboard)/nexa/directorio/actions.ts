'use server';

import { createClient } from '@/lib/supabase/server';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const TIPOS = ['arl', 'asesor_sst', 'proveedor_formacion', 'otro'] as const;

const AliadoSchema = z.object({
  nombre: z.string().trim().min(1, 'El nombre es requerido'),
  tipo: z.enum(TIPOS),
  contacto: z.string().trim().optional(),
  notas: z.string().trim().optional(),
});

/** Agrega un aliado externo al directorio (admin_th, misma regla que RLS). */
export async function crearAliado(input: z.infer<typeof AliadoSchema>) {
  const perfil = await getPerfilActual();
  if (!perfil || perfil.rol !== 'admin_th') return { ok: false as const, error: 'No autorizado' };

  const parsed = AliadoSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };

  const supabase = createClient();
  const { error } = await supabase.from('nexa_directorio_aliados').insert({
    empresa_id: perfil.empresa_id,
    nombre: parsed.data.nombre,
    tipo: parsed.data.tipo,
    contacto: parsed.data.contacto || null,
    notas: parsed.data.notas || null,
  });

  if (error) return { ok: false as const, error: error.message };
  revalidatePath('/nexa/directorio');
  return { ok: true as const };
}

const EditarAliadoSchema = z.object({
  id: z.string().uuid(),
  nombre: z.string().trim().min(1, 'El nombre es requerido'),
  tipo: z.enum(TIPOS),
  contacto: z.string().trim().optional(),
  notas: z.string().trim().optional(),
});

/** Edita un aliado ya registrado en el directorio (admin_th, misma regla que RLS). */
export async function actualizarAliado(input: z.infer<typeof EditarAliadoSchema>) {
  const perfil = await getPerfilActual();
  if (!perfil || perfil.rol !== 'admin_th') return { ok: false as const, error: 'No autorizado' };

  const parsed = EditarAliadoSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };

  const supabase = createClient();
  const { error } = await supabase
    .from('nexa_directorio_aliados')
    .update({
      nombre: parsed.data.nombre,
      tipo: parsed.data.tipo,
      contacto: parsed.data.contacto || null,
      notas: parsed.data.notas || null,
    })
    .eq('id', parsed.data.id)
    .eq('empresa_id', perfil.empresa_id);

  if (error) return { ok: false as const, error: error.message };
  revalidatePath('/nexa/directorio');
  return { ok: true as const };
}

/** Elimina un aliado del directorio (admin_th, misma regla que RLS). */
export async function eliminarAliado(id: string) {
  const perfil = await getPerfilActual();
  if (!perfil || perfil.rol !== 'admin_th') return { ok: false as const, error: 'No autorizado' };

  const supabase = createClient();
  const { error } = await supabase.from('nexa_directorio_aliados').delete().eq('id', id);

  if (error) return { ok: false as const, error: error.message };
  revalidatePath('/nexa/directorio');
  return { ok: true as const };
}
