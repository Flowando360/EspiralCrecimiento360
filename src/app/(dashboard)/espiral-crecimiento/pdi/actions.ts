'use server';

import { createClient } from '@/lib/supabase/server';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { revalidatePath } from 'next/cache';

const RUTA = '/espiral-crecimiento/pdi';
const ESTADOS_PDI = ['pendiente', 'en_curso', 'cumplido', 'vencido'] as const;
type EstadoPdi = (typeof ESTADOS_PDI)[number];

export async function actualizarEstadoPdi(id: string, estado: EstadoPdi) {
  const perfil = await getPerfilActual();
  if (!perfil) return { ok: false as const, error: 'No autorizado' };
  if (!ESTADOS_PDI.includes(estado)) return { ok: false as const, error: 'Estado inválido' };

  const supabase = createClient();
  const { error } = await supabase
    .from('planes_desarrollo')
    .update({
      estado,
      fecha_cumplimiento: estado === 'cumplido' ? new Date().toISOString().slice(0, 10) : null,
    })
    .eq('id', id);

  if (error) return { ok: false as const, error: error.message };
  revalidatePath(RUTA);
  return { ok: true as const };
}
