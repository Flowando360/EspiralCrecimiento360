'use server';

import { createClient } from '@/lib/supabase/server';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const RUTA = '/procesos-gestion/comunicaciones';

async function requerirAdminTh() {
  const perfil = await getPerfilActual();
  if (!perfil || perfil.rol !== 'admin_th') return null;
  return perfil;
}

const ComunicacionSchema = z.object({
  queComunicar: z.string().trim().min(1, 'Qué se comunica es requerido'),
  aQuien: z.string().trim().min(1, 'A quién va dirigido es requerido'),
  como: z.string().trim().min(1, 'El canal es requerido'),
  frecuencia: z.string().trim().optional(),
  procesoId: z.string().uuid().optional(),
  responsableId: z.string().uuid().optional(),
});

export async function crearComunicacion(input: z.input<typeof ComunicacionSchema>) {
  const perfil = await requerirAdminTh();
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const parsed = ComunicacionSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  const d = parsed.data;

  const supabase = createClient();
  const { data, error } = await supabase
    .from('matriz_comunicaciones')
    .insert({
      empresa_id: perfil.empresa_id,
      que_comunicar: d.queComunicar,
      a_quien: d.aQuien,
      como: d.como,
      frecuencia: d.frecuencia || null,
      proceso_id: d.procesoId || null,
      responsable_id: d.responsableId || null,
    })
    .select('id')
    .single();
  if (error) return { ok: false as const, error: error.message };

  revalidatePath(RUTA);
  return { ok: true as const, id: data.id as string };
}

export async function eliminarComunicacion(id: string) {
  const perfil = await requerirAdminTh();
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const supabase = createClient();
  const { error } = await supabase.from('matriz_comunicaciones').delete().eq('id', id).eq('empresa_id', perfil.empresa_id);
  if (error) return { ok: false as const, error: error.message };

  revalidatePath(RUTA);
  return { ok: true as const };
}
