'use server';

import { createClient } from '@/lib/supabase/server';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const ReconocimientoSchema = z.object({
  colaboradorId: z.string().uuid(),
  motivo: z.string().trim().min(1, 'El motivo es requerido'),
  puntos: z.number().int().min(0),
  insigniaId: z.string().uuid().optional(),
});

/** Otorga un reconocimiento (admin_th o líder, misma regla que RLS: sin restricción de equipo). */
export async function otorgarReconocimiento(input: z.infer<typeof ReconocimientoSchema>) {
  const perfil = await getPerfilActual();
  if (!perfil || !['admin_th', 'lider'].includes(perfil.rol)) return { ok: false as const, error: 'No autorizado' };

  const parsed = ReconocimientoSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };

  const supabase = createClient();
  const { error } = await supabase.from('nexa_reconocimientos').insert({
    colaborador_id: parsed.data.colaboradorId,
    motivo: parsed.data.motivo,
    puntos: parsed.data.puntos,
    insignia_id: parsed.data.insigniaId || null,
    otorgado_por: perfil.usuario_id,
  });

  if (error) return { ok: false as const, error: error.message };
  revalidatePath('/nexa/reconocimientos');
  return { ok: true as const };
}
