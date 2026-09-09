'use server';

import { createClient } from '@/lib/supabase/server';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const ActualizarSchema = z.object({
  id: z.string().uuid(),
  estado: z.enum(['resuelta', 'descartada']),
});

/**
 * Marca una alerta como resuelta o descartada (admin_th únicamente — es la
 * misma regla que ya aplica RLS: "alertas: admin_th todo" es la única
 * policy de escritura; líder y colaborador solo tienen lectura).
 */
export async function actualizarEstadoAlerta(input: z.infer<typeof ActualizarSchema>) {
  const perfil = await getPerfilActual();
  if (!perfil || perfil.rol !== 'admin_th') return { ok: false as const, error: 'No autorizado' };

  const parsed = ActualizarSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: 'Datos inválidos' };

  const supabase = createClient();
  const { error } = await supabase
    .from('alertas')
    .update({
      estado: parsed.data.estado,
      resuelta_por: perfil.usuario_id,
      resuelta_en: new Date().toISOString(),
    })
    .eq('id', parsed.data.id)
    .eq('empresa_id', perfil.empresa_id);

  if (error) return { ok: false as const, error: error.message };

  revalidatePath('/alertas');
  return { ok: true as const };
}
