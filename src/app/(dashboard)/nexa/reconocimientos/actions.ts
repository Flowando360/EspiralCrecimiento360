'use server';

import { createClient } from '@/lib/supabase/server';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const ReconocimientoSchema = z.object({
  colaboradorId: z.string().uuid(),
  categoriaId: z.string().uuid('Elige una categoría'),
  /** Detalle opcional: qué hizo la persona en concreto. */
  detalle: z.string().trim().max(300).optional(),
});

/**
 * Otorga un reconocimiento (admin_th o líder). El líder elige la categoría y el
 * puntaje lo fija el sistema según el catálogo — así no hay puntos "a criterio".
 */
export async function otorgarReconocimiento(input: z.infer<typeof ReconocimientoSchema>) {
  const perfil = await getPerfilActual();
  if (!perfil || !['admin_th', 'lider'].includes(perfil.rol)) return { ok: false as const, error: 'No autorizado' };

  const parsed = ReconocimientoSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };

  const supabase = createClient();
  const { data: categoria } = await supabase
    .from('nexa_reconocimiento_categorias')
    .select('id, nombre, puntos, activa')
    .eq('id', parsed.data.categoriaId)
    .eq('empresa_id', perfil.empresa_id)
    .maybeSingle();
  if (!categoria || !categoria.activa) return { ok: false as const, error: 'Esa categoría no está disponible' };

  const { error } = await supabase.from('nexa_reconocimientos').insert({
    colaborador_id: parsed.data.colaboradorId,
    categoria_id: categoria.id,
    motivo: parsed.data.detalle ? `${categoria.nombre}: ${parsed.data.detalle}` : categoria.nombre,
    puntos: categoria.puntos,
    otorgado_por: perfil.usuario_id,
  });

  if (error) return { ok: false as const, error: error.message };
  revalidatePath('/nexa/reconocimientos');
  return { ok: true as const };
}

const CategoriaSchema = z.object({
  nombre: z.string().trim().min(1, 'El nombre es requerido').max(80),
  descripcion: z.string().trim().max(200).optional(),
  puntos: z.number().int().min(0, 'Los puntos no pueden ser negativos').max(1000),
});

export async function crearCategoriaReconocimiento(input: z.infer<typeof CategoriaSchema>) {
  const perfil = await getPerfilActual();
  if (!perfil || perfil.rol !== 'admin_th') return { ok: false as const, error: 'No autorizado' };
  const parsed = CategoriaSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };

  const supabase = createClient();
  const { error } = await supabase.from('nexa_reconocimiento_categorias').insert({
    empresa_id: perfil.empresa_id,
    nombre: parsed.data.nombre,
    descripcion: parsed.data.descripcion || null,
    puntos: parsed.data.puntos,
    orden: 100,
  });
  if (error) {
    return { ok: false as const, error: error.code === '23505' ? 'Ya existe una categoría con ese nombre' : error.message };
  }
  revalidatePath('/nexa/reconocimientos');
  return { ok: true as const };
}

const ActualizarSchema = z.object({
  id: z.string().uuid(),
  puntos: z.number().int().min(0).max(1000).optional(),
  activa: z.boolean().optional(),
});

/** Cambia los puntos de una categoría o la activa/desactiva. Los reconocimientos ya otorgados no cambian. */
export async function actualizarCategoriaReconocimiento(input: z.infer<typeof ActualizarSchema>) {
  const perfil = await getPerfilActual();
  if (!perfil || perfil.rol !== 'admin_th') return { ok: false as const, error: 'No autorizado' };
  const parsed = ActualizarSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };

  const cambios: { puntos?: number; activa?: boolean } = {};
  if (parsed.data.puntos !== undefined) cambios.puntos = parsed.data.puntos;
  if (parsed.data.activa !== undefined) cambios.activa = parsed.data.activa;
  if (Object.keys(cambios).length === 0) return { ok: true as const };

  const supabase = createClient();
  const { error } = await supabase
    .from('nexa_reconocimiento_categorias')
    .update(cambios)
    .eq('id', parsed.data.id)
    .eq('empresa_id', perfil.empresa_id);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath('/nexa/reconocimientos');
  return { ok: true as const };
}
