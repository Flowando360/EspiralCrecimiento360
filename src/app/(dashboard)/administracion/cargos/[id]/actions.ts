'use server';

import { createClient } from '@/lib/supabase/server';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const CATEGORIAS = [
  'proposito_organizacional',
  'funciones',
  'riesgos_sst',
  'epp',
  'examenes_medicos',
  'formacion',
  'otro',
] as const;

const ItemSchema = z.object({
  cargoId: z.string().uuid(),
  categoria: z.enum(CATEGORIAS),
  titulo: z.string().trim().min(1, 'El título es requerido'),
  descripcion: z.string().trim().optional(),
});

/** Agrega un punto al plan de inducción específico de un cargo (admin_th). */
export async function agregarItemInduccion(input: z.infer<typeof ItemSchema>) {
  const parsed = ItemSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };

  const perfil = await getPerfilActual();
  if (!perfil || perfil.rol !== 'admin_th') return { ok: false as const, error: 'No autorizado' };

  const supabase = createClient();

  const { data: cargo } = await supabase.from('cargos').select('empresa_id').eq('id', parsed.data.cargoId).maybeSingle();
  if (!cargo || cargo.empresa_id !== perfil.empresa_id) return { ok: false as const, error: 'Cargo no encontrado' };

  const { count } = await supabase
    .from('induccion_items')
    .select('id', { count: 'exact', head: true })
    .eq('cargo_id', parsed.data.cargoId);

  const { error } = await supabase.from('induccion_items').insert({
    empresa_id: perfil.empresa_id,
    cargo_id: parsed.data.cargoId,
    categoria: parsed.data.categoria,
    titulo: parsed.data.titulo,
    descripcion: parsed.data.descripcion || null,
    orden: (count ?? 0) + 1,
  });

  if (error) return { ok: false as const, error: error.message };
  revalidatePath(`/administracion/cargos/${parsed.data.cargoId}`);
  return { ok: true as const };
}

/** Quita un punto del plan de inducción de un cargo (admin_th). */
export async function eliminarItemInduccion(itemId: string, cargoId: string) {
  const perfil = await getPerfilActual();
  if (!perfil || perfil.rol !== 'admin_th') return { ok: false as const, error: 'No autorizado' };

  const supabase = createClient();
  const { error } = await supabase.from('induccion_items').delete().eq('id', itemId);
  if (error) return { ok: false as const, error: error.message };

  revalidatePath(`/administracion/cargos/${cargoId}`);
  return { ok: true as const };
}
