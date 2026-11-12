'use server';

import { createClient } from '@/lib/supabase/server';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const Schema = z.object({
  competenciaId: z.string().uuid(),
  nivelMinimo: z.enum(['operativo', 'tecnico_administrativo', 'supervision', 'directivo']),
});

/**
 * Cambia el nivel mínimo de cargo al que aplica una competencia. Solo afecta a las
 * evaluaciones que se generen de ahora en adelante; las ya generadas no se tocan.
 */
export async function actualizarNivelCompetencia(input: z.infer<typeof Schema>) {
  const perfil = await getPerfilActual();
  if (!perfil || perfil.rol !== 'admin_th') return { ok: false as const, error: 'No autorizado' };
  const parsed = Schema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: 'Datos inválidos' };

  const supabase = createClient();
  const { error } = await supabase
    .from('competencias')
    .update({ nivel_minimo: parsed.data.nivelMinimo })
    .eq('id', parsed.data.competenciaId)
    .eq('empresa_id', perfil.empresa_id);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath('/administracion/competencias');
  return { ok: true as const };
}
