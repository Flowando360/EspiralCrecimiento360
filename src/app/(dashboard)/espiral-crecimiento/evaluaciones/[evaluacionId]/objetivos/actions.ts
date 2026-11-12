'use server';

import { createClient } from '@/lib/supabase/server';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

/** Contexto de una evaluación y qué puede hacer quien consulta: gestionar (TH o líder directo) o responder (la propia persona). */
async function contexto(evaluacionId: string) {
  const perfil = await getPerfilActual();
  if (!perfil) return null;
  const supabase = createClient();
  const { data: ev } = await supabase
    .from('evaluaciones')
    .select('id, colaborador:colaborador_evaluado_id(id, empresa_id, lider_id)')
    .eq('id', evaluacionId)
    .maybeSingle();
  const col = (Array.isArray(ev?.colaborador) ? ev?.colaborador[0] : ev?.colaborador) as any;
  if (!ev || !col || col.empresa_id !== perfil.empresa_id) return null;
  const gestiona = perfil.rol === 'admin_th' || (perfil.rol === 'lider' && col.lider_id === perfil.colaborador_id);
  const esLaPersona = perfil.colaborador_id === col.id;
  return { perfil, supabase, colaboradorId: col.id as string, gestiona, esLaPersona };
}

const texto = z.string().trim();
const ObjetivoSchema = z.object({
  evaluacionId: z.string().uuid(),
  titulo: texto.min(3, 'Escribe el objetivo').max(300),
  descripcion: texto.max(2000).optional(),
  criterioExito: texto.min(3, 'Indica con qué criterio se sabrá que se cumplió').max(1000),
  fechaMeta: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal('')),
});

export async function crearObjetivo(input: z.infer<typeof ObjetivoSchema>) {
  const p = ObjetivoSchema.safeParse(input);
  if (!p.success) return { ok: false as const, error: p.error.issues[0]?.message ?? 'Datos inválidos' };
  const ctx = await contexto(p.data.evaluacionId);
  if (!ctx?.gestiona) return { ok: false as const, error: 'No autorizado' };
  const { error } = await ctx.supabase.from('objetivos_ciclo').insert({
    empresa_id: ctx.perfil.empresa_id,
    evaluacion_id: p.data.evaluacionId,
    colaborador_id: ctx.colaboradorId,
    titulo: p.data.titulo,
    descripcion: p.data.descripcion || null,
    criterio_exito: p.data.criterioExito,
    fecha_meta: p.data.fechaMeta || null,
    creado_por_nombre: ctx.perfil.nombre_completo,
  });
  if (error) return { ok: false as const, error: error.message };
  revalidatePath(`/espiral-crecimiento/evaluaciones/${p.data.evaluacionId}/objetivos`);
  return { ok: true as const };
}

export async function eliminarObjetivo(input: { evaluacionId: string; id: string }) {
  const ctx = await contexto(input.evaluacionId);
  if (!ctx?.gestiona) return { ok: false as const, error: 'No autorizado' };
  const { error } = await ctx.supabase.from('objetivos_ciclo').delete().eq('id', input.id).eq('evaluacion_id', input.evaluacionId);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath(`/espiral-crecimiento/evaluaciones/${input.evaluacionId}/objetivos`);
  return { ok: true as const };
}

/** La propia persona acepta el objetivo (o lo deja con un comentario para conversarlo). */
export async function responderObjetivo(input: { evaluacionId: string; id: string; acepta: boolean; comentario?: string }) {
  const ctx = await contexto(input.evaluacionId);
  if (!ctx?.esLaPersona) return { ok: false as const, error: 'Solo la persona evaluada puede aceptar sus objetivos' };
  const comentario = (input.comentario ?? '').trim().slice(0, 1000);
  if (!input.acepta && comentario.length < 3) return { ok: false as const, error: 'Cuéntale a tu líder qué quieres conversar de este objetivo' };
  const { error } = await ctx.supabase
    .from('objetivos_ciclo')
    .update({ aceptado_en: input.acepta ? new Date().toISOString() : null, comentario_colaborador: comentario || null })
    .eq('id', input.id)
    .eq('evaluacion_id', input.evaluacionId)
    .eq('colaborador_id', ctx.colaboradorId);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath(`/espiral-crecimiento/evaluaciones/${input.evaluacionId}/objetivos`);
  return { ok: true as const };
}

/** Al cierre del ciclo, el líder (o Talento Humano) registra si el objetivo se cumplió. */
export async function cerrarObjetivo(input: { evaluacionId: string; id: string; resultado: 'cumplido' | 'parcial' | 'no_cumplido'; comentario?: string }) {
  const ctx = await contexto(input.evaluacionId);
  if (!ctx?.gestiona) return { ok: false as const, error: 'No autorizado' };
  if (!['cumplido', 'parcial', 'no_cumplido'].includes(input.resultado)) return { ok: false as const, error: 'Resultado inválido' };
  const { error } = await ctx.supabase
    .from('objetivos_ciclo')
    .update({
      resultado: input.resultado,
      cierre_comentario: (input.comentario ?? '').trim().slice(0, 1000) || null,
      cerrado_por_nombre: ctx.perfil.nombre_completo,
      cerrado_en: new Date().toISOString(),
    })
    .eq('id', input.id)
    .eq('evaluacion_id', input.evaluacionId);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath(`/espiral-crecimiento/evaluaciones/${input.evaluacionId}/objetivos`);
  revalidatePath(`/espiral-crecimiento/evaluaciones/${input.evaluacionId}/resultado`);
  return { ok: true as const };
}

export async function reabrirObjetivo(input: { evaluacionId: string; id: string }) {
  const ctx = await contexto(input.evaluacionId);
  if (!ctx?.gestiona) return { ok: false as const, error: 'No autorizado' };
  const { error } = await ctx.supabase
    .from('objetivos_ciclo')
    .update({ resultado: null, cierre_comentario: null, cerrado_por_nombre: null, cerrado_en: null })
    .eq('id', input.id)
    .eq('evaluacion_id', input.evaluacionId);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath(`/espiral-crecimiento/evaluaciones/${input.evaluacionId}/objetivos`);
  return { ok: true as const };
}
