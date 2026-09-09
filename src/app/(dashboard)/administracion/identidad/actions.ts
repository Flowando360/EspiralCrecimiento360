'use server';

import { createClient } from '@/lib/supabase/server';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { revalidatePath } from 'next/cache';

export async function guardarIdentidad(formData: FormData) {
  const perfil = await getPerfilActual();
  if (!perfil || perfil.rol !== 'admin_th') return { ok: false, error: 'No autorizado' };

  const supabase = createClient();
  const { error } = await supabase.from('empresa_identidad').upsert({
    empresa_id: perfil.empresa_id,
    proposito_superior: formData.get('proposito_superior') as string,
    declaracion_creencias: formData.get('declaracion_creencias') as string,
    vision: formData.get('vision') as string,
    updated_by: perfil.usuario_id,
    updated_at: new Date().toISOString(),
  });

  if (error) return { ok: false, error: error.message };
  revalidatePath('/administracion/identidad');
  return { ok: true };
}

/** Wrapper de guardarIdentidad para usar directo como `<form action>` (necesita devolver void). */
export async function guardarIdentidadForm(formData: FormData) {
  await guardarIdentidad(formData);
}

export async function agregarElementoIdentidad(tipo: 'principio' | 'valor', nombre: string, descripcion: string) {
  const perfil = await getPerfilActual();
  if (!perfil || perfil.rol !== 'admin_th') return { ok: false, error: 'No autorizado' };
  if (!nombre.trim()) return { ok: false, error: 'El nombre es requerido' };

  const supabase = createClient();
  const { error } = await supabase.from('empresa_identidad_elementos').insert({
    empresa_id: perfil.empresa_id,
    tipo,
    nombre,
    descripcion,
  });

  if (error) return { ok: false, error: error.message };
  revalidatePath('/administracion/identidad');
  return { ok: true };
}

export async function eliminarElementoIdentidad(id: string) {
  const perfil = await getPerfilActual();
  if (!perfil || perfil.rol !== 'admin_th') return { ok: false, error: 'No autorizado' };

  const supabase = createClient();
  const { error } = await supabase.from('empresa_identidad_elementos').delete().eq('id', id);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/administracion/identidad');
  return { ok: true };
}
