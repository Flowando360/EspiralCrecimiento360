'use server';

import { createClient } from '@/lib/supabase/server';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { revalidatePath } from 'next/cache';

async function puedeEditarInduccion(colaboradorId: string) {
  const perfil = await getPerfilActual();
  if (!perfil) return null;

  const supabase = createClient();
  const { data: colaborador } = await supabase
    .from('colaboradores')
    .select('id, empresa_id, lider_id')
    .eq('id', colaboradorId)
    .maybeSingle();

  if (!colaborador || colaborador.empresa_id !== perfil.empresa_id) return null;

  const autorizado =
    perfil.rol === 'admin_th' || (perfil.rol === 'lider' && colaborador.lider_id === perfil.colaborador_id);
  if (!autorizado) return null;

  return perfil;
}

/** Marca (o desmarca) un punto de inducción como cumplido — admin_th o líder directo. */
export async function marcarItemInduccion(colaboradorId: string, itemAsignadoId: string, completado: boolean) {
  const perfil = await puedeEditarInduccion(colaboradorId);
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const supabase = createClient();
  const { error } = await supabase
    .from('colaborador_induccion_items')
    .update({
      completado,
      completado_en: completado ? new Date().toISOString() : null,
      completado_por: completado ? perfil.usuario_id : null,
    })
    .eq('id', itemAsignadoId);

  if (error) return { ok: false as const, error: error.message };
  revalidatePath(`/espiral-crecimiento/colaboradores/${colaboradorId}/induccion`);
  revalidatePath(`/espiral-crecimiento/colaboradores/${colaboradorId}`);
  return { ok: true as const };
}
