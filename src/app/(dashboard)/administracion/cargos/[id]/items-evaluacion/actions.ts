'use server';

import { createClient } from '@/lib/supabase/server';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

async function esAdminThDeEsteCargo(cargoId: string) {
  const perfil = await getPerfilActual();
  if (!perfil || perfil.rol !== 'admin_th') return null;

  const supabase = createClient();
  const { data: cargo } = await supabase.from('cargos').select('id, empresa_id').eq('id', cargoId).maybeSingle();
  if (!cargo || cargo.empresa_id !== perfil.empresa_id) return null;
  return perfil;
}

const ItemSchema = z.object({
  cargoId: z.string().uuid(),
  competenciaId: z.string().uuid().optional(),
  cargoFuncionId: z.string().uuid().optional(),
  incluido: z.boolean(),
});

/**
 * Marca o desmarca UN ítem (competencia o función principal) para este
 * cargo. "Incluido" es lo que ve la persona en pantalla; internamente se
 * guarda como exclusión (fila = no incluido), así que un cargo nuevo sin
 * ninguna fila incluye todo por defecto.
 */
export async function alternarItemEvaluacion(input: z.infer<typeof ItemSchema>) {
  const parsed = ItemSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: 'Datos inválidos' };

  const perfil = await esAdminThDeEsteCargo(parsed.data.cargoId);
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const { cargoId, competenciaId, cargoFuncionId, incluido } = parsed.data;
  const supabase = createClient();

  if (incluido) {
    let query = supabase.from('cargo_items_evaluacion_excluidos').delete().eq('cargo_id', cargoId);
    query = competenciaId ? query.eq('competencia_id', competenciaId) : query.eq('cargo_funcion_id', cargoFuncionId!);
    const { error } = await query;
    if (error) return { ok: false as const, error: error.message };
  } else {
    const { error } = await supabase.from('cargo_items_evaluacion_excluidos').insert({
      cargo_id: cargoId,
      competencia_id: competenciaId ?? null,
      cargo_funcion_id: cargoFuncionId ?? null,
    });
    if (error) return { ok: false as const, error: error.message };
  }

  revalidatePath(`/administracion/cargos/${cargoId}/items-evaluacion`);
  return { ok: true as const };
}

const BloqueSchema = z.object({
  cargoId: z.string().uuid(),
  items: z.array(z.object({ competenciaId: z.string().uuid().optional(), cargoFuncionId: z.string().uuid().optional() })),
  incluir: z.boolean(),
});

/** "Marcar todo" / "Quitar todo" para un bloque completo de una vez. */
export async function establecerBloqueEvaluacion(input: z.infer<typeof BloqueSchema>) {
  const parsed = BloqueSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: 'Datos inválidos' };

  const perfil = await esAdminThDeEsteCargo(parsed.data.cargoId);
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const { cargoId, items, incluir } = parsed.data;
  const supabase = createClient();

  const competenciaIds = items.map((i) => i.competenciaId).filter((x): x is string => Boolean(x));
  const cargoFuncionIds = items.map((i) => i.cargoFuncionId).filter((x): x is string => Boolean(x));

  // Siempre se borra primero (competencias y funciones tienen su propio
  // índice único parcial cada una — más simple y seguro borrar y volver a
  // insertar que intentar un upsert mixto contra dos índices distintos).
  if (competenciaIds.length > 0) {
    await supabase.from('cargo_items_evaluacion_excluidos').delete().eq('cargo_id', cargoId).in('competencia_id', competenciaIds);
  }
  if (cargoFuncionIds.length > 0) {
    await supabase.from('cargo_items_evaluacion_excluidos').delete().eq('cargo_id', cargoId).in('cargo_funcion_id', cargoFuncionIds);
  }

  if (!incluir) {
    const filas = [
      ...competenciaIds.map((id) => ({ cargo_id: cargoId, competencia_id: id, cargo_funcion_id: null })),
      ...cargoFuncionIds.map((id) => ({ cargo_id: cargoId, competencia_id: null, cargo_funcion_id: id })),
    ];
    if (filas.length > 0) {
      const { error } = await supabase.from('cargo_items_evaluacion_excluidos').insert(filas);
      if (error) return { ok: false as const, error: error.message };
    }
  }

  revalidatePath(`/administracion/cargos/${cargoId}/items-evaluacion`);
  return { ok: true as const };
}
