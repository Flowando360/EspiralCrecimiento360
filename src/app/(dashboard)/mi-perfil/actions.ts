'use server';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const RUTA = '/mi-perfil';

const NombrePreferidoSchema = z.object({
  nombrePreferido: z.string().trim().max(60, 'Máximo 60 caracteres').optional(),
});

/**
 * Cada persona fija su propio apodo/diminutivo (cómo le gusta que le
 * llamen en el aplicativo). Usa el cliente admin porque no hay policy de
 * RLS que permita a un usuario editar su propia fila de perfiles_usuario
 * (a propósito, para que nadie pueda cambiarse el rol/empresa por su
 * cuenta) — aquí se restringe el UPDATE al propio usuario_id de la sesión,
 * nunca a un id que venga del cliente.
 */
export async function actualizarNombrePreferido(input: z.infer<typeof NombrePreferidoSchema>) {
  const perfil = await getPerfilActual();
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const parsed = NombrePreferidoSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };

  const admin = createAdminClient();
  const { error } = await admin
    .from('perfiles_usuario')
    .update({ nombre_preferido: parsed.data.nombrePreferido || null })
    .eq('id', perfil.usuario_id);

  if (error) return { ok: false as const, error: error.message };
  revalidatePath(RUTA);
  return { ok: true as const };
}

const FechasPersonalesSchema = z.object({
  fechaMatrimonio: z.string().trim().optional(),
  fechaBabyShower: z.string().trim().optional(),
  enEmbarazo: z.boolean(),
  fechaProbableParto: z.string().trim().optional(),
});

export async function actualizarFechasPersonales(input: z.infer<typeof FechasPersonalesSchema>) {
  const perfil = await getPerfilActual();
  if (!perfil || !perfil.colaborador_id) return { ok: false as const, error: 'No autorizado' };

  const parsed = FechasPersonalesSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };

  const supabase = createClient();
  const { error } = await supabase.from('fechas_personales_colaborador').upsert(
    {
      colaborador_id: perfil.colaborador_id,
      fecha_matrimonio: parsed.data.fechaMatrimonio || null,
      fecha_baby_shower: parsed.data.fechaBabyShower || null,
      en_embarazo: parsed.data.enEmbarazo,
      fecha_probable_parto: parsed.data.fechaProbableParto || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'colaborador_id' }
  );

  if (error) return { ok: false as const, error: error.message };
  revalidatePath(RUTA);
  return { ok: true as const };
}

const FechaEspecialSchema = z.object({
  descripcion: z.string().trim().min(1, 'Cuéntanos qué se celebra').max(120, 'Máximo 120 caracteres'),
  fecha: z.string().min(1, 'La fecha es requerida'),
});

/** Cada persona agrega sus propias fechas especiales (día de la profesión, etc.). */
export async function agregarFechaEspecialPropia(input: z.infer<typeof FechaEspecialSchema>) {
  const perfil = await getPerfilActual();
  if (!perfil || !perfil.colaborador_id) return { ok: false as const, error: 'No autorizado' };

  const parsed = FechaEspecialSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };

  const supabase = createClient();
  const { data, error } = await supabase
    .from('fechas_especiales_colaborador')
    .insert({
      colaborador_id: perfil.colaborador_id,
      descripcion: parsed.data.descripcion,
      fecha: parsed.data.fecha,
      creado_por: perfil.usuario_id,
    })
    .select('id, descripcion, fecha')
    .single();

  if (error) return { ok: false as const, error: error.message };
  revalidatePath(RUTA);
  return { ok: true as const, fechaEspecial: data };
}

export async function eliminarFechaEspecialPropia(id: string) {
  const perfil = await getPerfilActual();
  if (!perfil || !perfil.colaborador_id) return { ok: false as const, error: 'No autorizado' };

  const supabase = createClient();
  const { error } = await supabase
    .from('fechas_especiales_colaborador')
    .delete()
    .eq('id', id)
    .eq('colaborador_id', perfil.colaborador_id);

  if (error) return { ok: false as const, error: error.message };
  revalidatePath(RUTA);
  return { ok: true as const };
}
