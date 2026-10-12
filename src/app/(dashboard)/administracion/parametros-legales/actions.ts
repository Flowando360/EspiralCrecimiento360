'use server';

import { createClient } from '@/lib/supabase/server';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const ParametroSchema = z.object({
  anio: z.coerce.number().int().min(2000, 'Año inválido').max(2100, 'Año inválido'),
  smlmv: z.coerce.number().positive('El SMLMV debe ser mayor a 0'),
});

/** Registra o actualiza el SMLMV de un año. Lo usa la regla de elegibilidad de dotación (≤ 2 SMLMV). */
export async function guardarParametroLegal(input: z.input<typeof ParametroSchema>) {
  const perfil = await getPerfilActual();
  if (!perfil || perfil.rol !== 'admin_th') return { ok: false as const, error: 'No autorizado' };

  const parsed = ParametroSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };

  const supabase = createClient();
  const { error } = await supabase
    .from('parametros_legales')
    .upsert({ empresa_id: perfil.empresa_id, anio: parsed.data.anio, smlmv: parsed.data.smlmv }, { onConflict: 'empresa_id,anio' });
  if (error) return { ok: false as const, error: error.message };

  revalidatePath('/administracion/parametros-legales');
  revalidatePath('/dotacion');
  return { ok: true as const };
}
