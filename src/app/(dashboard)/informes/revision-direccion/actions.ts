'use server';

import { createClient } from '@/lib/supabase/server';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const GuardarSchema = z.object({
  periodoInicio: z.string(),
  periodoFin: z.string(),
  cambiosContexto: z.string().trim().optional(),
  decisiones: z.string().trim().optional(),
});

export async function guardarSeccionesManualesRevision(input: z.infer<typeof GuardarSchema>) {
  const perfil = await getPerfilActual();
  if (!perfil || perfil.rol !== 'admin_th') return { ok: false as const, error: 'No autorizado' };

  const parsed = GuardarSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  const d = parsed.data;

  const supabase = createClient();
  const { error } = await supabase.from('informes_revision_direccion').upsert(
    {
      empresa_id: perfil.empresa_id,
      periodo_inicio: d.periodoInicio,
      periodo_fin: d.periodoFin,
      cambios_contexto: d.cambiosContexto || null,
      decisiones: d.decisiones || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'empresa_id,periodo_inicio,periodo_fin' }
  );

  if (error) return { ok: false as const, error: error.message };
  revalidatePath('/informes/revision-direccion');
  return { ok: true as const };
}
