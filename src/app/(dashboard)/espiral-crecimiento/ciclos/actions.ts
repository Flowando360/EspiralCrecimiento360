'use server';

import { createClient } from '@/lib/supabase/server';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const CrearCicloSchema = z.object({
  nombre: z.string().trim().min(1, 'El nombre es requerido'),
  fechaApertura: z.string().min(1, 'La fecha de apertura es requerida'),
  fechaCierreRespuestas: z.string().min(1, 'La fecha de cierre es requerida'),
});

/**
 * Crea un nuevo ciclo de evaluación en estado 'planeado' (admin_th). Abrirlo
 * de verdad (generar evaluaciones) sigue siendo un paso aparte, desde el
 * panel "Generar evaluaciones" en el detalle del ciclo.
 */
export async function crearCiclo(input: z.infer<typeof CrearCicloSchema>) {
  const perfil = await getPerfilActual();
  if (!perfil || perfil.rol !== 'admin_th') return { ok: false as const, error: 'No autorizado' };

  const parsed = CrearCicloSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  }

  if (parsed.data.fechaCierreRespuestas <= parsed.data.fechaApertura) {
    return { ok: false as const, error: 'La fecha de cierre debe ser posterior a la de apertura' };
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from('ciclos_evaluacion')
    .insert({
      empresa_id: perfil.empresa_id,
      nombre: parsed.data.nombre,
      fecha_apertura: parsed.data.fechaApertura,
      fecha_cierre_respuestas: parsed.data.fechaCierreRespuestas,
    })
    .select('id')
    .single();

  if (error) return { ok: false as const, error: error.message };

  revalidatePath('/espiral-crecimiento/ciclos');
  return { ok: true as const, cicloId: data.id as string };
}
