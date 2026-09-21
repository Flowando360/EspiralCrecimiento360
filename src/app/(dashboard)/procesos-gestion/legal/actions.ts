'use server';

import { createClient } from '@/lib/supabase/server';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const RUTA = '/procesos-gestion/legal';

async function requerirAdminTh() {
  const perfil = await getPerfilActual();
  if (!perfil || perfil.rol !== 'admin_th') return null;
  return perfil;
}

const RequisitoLegalSchema = z.object({
  norma: z.string().trim().min(1, 'La norma/ley/reglamento es requerida'),
  anio: z.number().int().optional(),
  entidadEmisora: z.string().trim().optional(),
  asunto: z.string().trim().optional(),
  articulo: z.string().trim().optional(),
  nombreArticulo: z.string().trim().optional(),
  descripcionArticulo: z.string().trim().optional(),
  cumple: z.boolean().optional(),
  soporteCumplimiento: z.string().trim().optional(),
  accionesASeguir: z.string().trim().optional(),
  observaciones: z.string().trim().optional(),
  procesoId: z.string().uuid().optional(),
  responsableId: z.string().uuid().optional(),
});

export async function crearRequisitoLegal(input: z.infer<typeof RequisitoLegalSchema>) {
  const perfil = await requerirAdminTh();
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const parsed = RequisitoLegalSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };

  const supabase = createClient();
  // TODO: quitar el as any cuando se corra supabase db push + npm run db:types para la migracion 0092.
  const { data, error } = await (supabase as any)
    .from('requisitos_legales')
    .insert({
      empresa_id: perfil.empresa_id,
      norma: parsed.data.norma,
      anio: parsed.data.anio ?? null,
      entidad_emisora: parsed.data.entidadEmisora || null,
      asunto: parsed.data.asunto || null,
      articulo: parsed.data.articulo || null,
      nombre_articulo: parsed.data.nombreArticulo || null,
      descripcion_articulo: parsed.data.descripcionArticulo || null,
      cumple: parsed.data.cumple ?? null,
      soporte_cumplimiento: parsed.data.soporteCumplimiento || null,
      acciones_a_seguir: parsed.data.accionesASeguir || null,
      observaciones: parsed.data.observaciones || null,
      proceso_id: parsed.data.procesoId || null,
      responsable_id: parsed.data.responsableId || null,
      fecha_ultima_revision: new Date().toISOString().slice(0, 10),
    })
    .select('id')
    .single();

  if (error) return { ok: false as const, error: error.message };
  revalidatePath(RUTA);
  return { ok: true as const, id: data.id as string };
}

const EditarRequisitoLegalSchema = RequisitoLegalSchema.extend({ id: z.string().uuid() });

export async function actualizarRequisitoLegal(input: z.infer<typeof EditarRequisitoLegalSchema>) {
  const perfil = await requerirAdminTh();
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const parsed = EditarRequisitoLegalSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };

  const supabase = createClient();
  // TODO: quitar el as any cuando se corra supabase db push + npm run db:types para la migracion 0092.
  const { error } = await (supabase as any)
    .from('requisitos_legales')
    .update({
      norma: parsed.data.norma,
      anio: parsed.data.anio ?? null,
      entidad_emisora: parsed.data.entidadEmisora || null,
      asunto: parsed.data.asunto || null,
      articulo: parsed.data.articulo || null,
      nombre_articulo: parsed.data.nombreArticulo || null,
      descripcion_articulo: parsed.data.descripcionArticulo || null,
      cumple: parsed.data.cumple ?? null,
      soporte_cumplimiento: parsed.data.soporteCumplimiento || null,
      acciones_a_seguir: parsed.data.accionesASeguir || null,
      observaciones: parsed.data.observaciones || null,
      proceso_id: parsed.data.procesoId || null,
      responsable_id: parsed.data.responsableId || null,
    })
    .eq('id', parsed.data.id)
    .eq('empresa_id', perfil.empresa_id);

  if (error) return { ok: false as const, error: error.message };
  revalidatePath(RUTA);
  return { ok: true as const };
}

/** Confirma que el requisito se revisó hoy, sin cambiar su calificación de cumplimiento. */
export async function marcarRequisitoLegalRevisado(id: string) {
  const perfil = await requerirAdminTh();
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const supabase = createClient();
  // TODO: quitar el as any cuando se corra supabase db push + npm run db:types para la migracion 0092.
  const { error } = await (supabase as any).from('requisitos_legales').update({ fecha_ultima_revision: new Date().toISOString().slice(0, 10) }).eq('id', id).eq('empresa_id', perfil.empresa_id);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath(RUTA);
  return { ok: true as const };
}

export async function eliminarRequisitoLegal(id: string) {
  const perfil = await requerirAdminTh();
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const supabase = createClient();
  // TODO: quitar el as any cuando se corra supabase db push + npm run db:types para la migracion 0092.
  const { error } = await (supabase as any).from('requisitos_legales').delete().eq('id', id).eq('empresa_id', perfil.empresa_id);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath(RUTA);
  return { ok: true as const };
}
