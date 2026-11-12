'use server';

import { puedeAdministrar } from '@/lib/permisos/administracion';
import { registrarAuditoria, diferencias } from '@/lib/auditoria/registrar';

import { createClient } from '@/lib/supabase/server';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const Schema = z.object({
  competenciaId: z.string().uuid(),
  nivelMinimo: z.enum(['operativo', 'tecnico_administrativo', 'supervision', 'directivo']),
});

/**
 * Cambia el nivel mínimo de cargo al que aplica una competencia. Solo afecta a las
 * evaluaciones que se generen de ahora en adelante; las ya generadas no se tocan.
 */
export async function actualizarNivelCompetencia(input: z.infer<typeof Schema>) {
  const perfil = await getPerfilActual();
  if (!perfil || !puedeAdministrar(perfil)) return { ok: false as const, error: 'No autorizado' };
  const parsed = Schema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: 'Datos inválidos' };

  const supabase = createClient();
  const { data: antes } = await supabase.from('competencias').select('nombre, nivel_minimo').eq('id', parsed.data.competenciaId).eq('empresa_id', perfil.empresa_id).maybeSingle();
  const { error } = await supabase
    .from('competencias')
    .update({ nivel_minimo: parsed.data.nivelMinimo })
    .eq('id', parsed.data.competenciaId)
    .eq('empresa_id', perfil.empresa_id);
  if (error) return { ok: false as const, error: error.message };
  if (antes && antes.nivel_minimo !== parsed.data.nivelMinimo) {
    await registrarAuditoria(perfil, {
      modulo: 'competencias',
      accion: 'competencia.nivel',
      resumen: `Cambió el nivel mínimo de la competencia «${antes.nombre}»: ${antes.nivel_minimo} → ${parsed.data.nivelMinimo}`,
      objetoTipo: 'competencia',
      objetoId: parsed.data.competenciaId,
      detalle: { antes: antes.nivel_minimo, despues: parsed.data.nivelMinimo },
    });
  }
  revalidatePath('/administracion/competencias');
  return { ok: true as const };
}

const UmbralSchema = z.object({
  competenciaId: z.string().uuid(),
  umbral: z.number().int().min(1).max(4).nullable(),
  justificacion: z.string().trim().max(400).optional(),
});

/**
 * Define o quita el mínimo crítico de una competencia. El modelo exige que los umbrales estén definidos de antemano y
 * justificados, por eso la justificación es obligatoria cuando hay umbral. Solo afecta cómo se muestran los resultados.
 */
export async function actualizarUmbralCompetencia(input: z.infer<typeof UmbralSchema>) {
  const perfil = await getPerfilActual();
  if (!perfil || !puedeAdministrar(perfil)) return { ok: false as const, error: 'No autorizado' };
  const parsed = UmbralSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: 'Datos inválidos' };
  const { competenciaId, umbral } = parsed.data;
  const justificacion = (parsed.data.justificacion ?? '').trim();
  if (umbral != null && justificacion.length < 10) return { ok: false as const, error: 'Explica por qué es crítico y por qué ese mínimo (al menos 10 caracteres).' };

  const supabase = createClient();
  const { data: antes } = await supabase.from('competencias').select('nombre, umbral_critico').eq('id', competenciaId).eq('empresa_id', perfil.empresa_id).maybeSingle();
  if (!antes) return { ok: false as const, error: 'Competencia no encontrada' };
  const { error } = await supabase
    .from('competencias')
    .update({ umbral_critico: umbral, umbral_justificacion: umbral != null ? justificacion : null })
    .eq('id', competenciaId)
    .eq('empresa_id', perfil.empresa_id);
  if (error) return { ok: false as const, error: error.message };

  await registrarAuditoria(perfil, {
    modulo: 'competencias',
    accion: 'competencia.umbral',
    resumen: umbral != null ? `Definió un mínimo crítico (${umbral}) para la competencia «${antes.nombre}»` : `Quitó el mínimo crítico de la competencia «${antes.nombre}»`,
    objetoTipo: 'competencia',
    objetoId: competenciaId,
    detalle: { antes: antes.umbral_critico, despues: umbral, justificacion: umbral != null ? justificacion : null },
  });
  revalidatePath('/administracion/competencias');
  return { ok: true as const };
}
