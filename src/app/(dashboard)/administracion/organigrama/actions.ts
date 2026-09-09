'use server';

import { createClient } from '@/lib/supabase/server';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { revalidatePath } from 'next/cache';

/**
 * Cambia el líder directo de un colaborador. Los ciclos ya abiertos no se
 * ven afectados: evaluacion_tareas se genera como una foto fija al abrir el
 * ciclo (ver POST /api/evaluaciones), así que este cambio solo se refleja
 * en el próximo ciclo que se abra.
 */
export async function actualizarLiderDirecto(colaboradorId: string, liderId: string | null) {
  const perfil = await getPerfilActual();
  if (!perfil || perfil.rol !== 'admin_th') return { ok: false as const, error: 'No autorizado' };

  if (liderId === colaboradorId) {
    return { ok: false as const, error: 'Una persona no puede ser su propio líder' };
  }

  const supabase = createClient();

  if (liderId) {
    // Evitar ciclos: el nuevo líder no puede ser alguien que, directa o
    // indirectamente, ya reporta a este colaborador (si no, ambos
    // desaparecerían del árbol del organigrama).
    const { data: colaboradores } = await supabase
      .from('colaboradores')
      .select('id, lider_id')
      .eq('empresa_id', perfil.empresa_id);

    const liderDe = new Map((colaboradores ?? []).map((c: any) => [c.id as string, c.lider_id as string | null]));
    let actual: string | null = liderId;
    while (actual) {
      if (actual === colaboradorId) {
        return {
          ok: false as const,
          error: 'Ese cambio crearía un ciclo en el organigrama: la persona elegida ya reporta, directa o indirectamente, al colaborador que estás editando.',
        };
      }
      actual = liderDe.get(actual) ?? null;
    }
  }

  const { error } = await supabase
    .from('colaboradores')
    .update({ lider_id: liderId })
    .eq('id', colaboradorId)
    .eq('empresa_id', perfil.empresa_id);

  if (error) return { ok: false as const, error: error.message };

  revalidatePath('/administracion/organigrama');
  return { ok: true as const };
}
