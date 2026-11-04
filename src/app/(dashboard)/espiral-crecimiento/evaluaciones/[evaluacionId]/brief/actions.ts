'use server';

import { createClient } from '@/lib/supabase/server';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { recopilarContextoBrief } from '@/lib/brief/contexto';
import { redactarBorrador, type CamposBrief } from '@/lib/brief/borrador';
import { mejorarBorradorConIA } from '@/lib/brief/ia';

/**
 * Replica en el servidor la misma regla que ya aplica RLS: admin_th prepara
 * el brief de cualquier evaluación de su empresa; un líder solo el de sus
 * reportes directos. El brief es material de preparación del líder — el
 * colaborador evaluado nunca tiene acceso (ni por RLS ni aquí).
 */
async function puedePrepararBrief(evaluacionId: string) {
  const perfil = await getPerfilActual();
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const supabase = createClient();
  const { data: evaluacion } = await supabase
    .from('evaluaciones')
    .select('id, colaborador:colaborador_evaluado_id(empresa_id, lider_id)')
    .eq('id', evaluacionId)
    .maybeSingle();

  const colaborador = (evaluacion as any)?.colaborador;
  if (!evaluacion || !colaborador || colaborador.empresa_id !== perfil.empresa_id) {
    return { ok: false as const, error: 'Encuentro de Crecimiento no encontrado' };
  }

  const autorizado =
    perfil.rol === 'admin_th' || (perfil.rol === 'lider' && colaborador.lider_id === perfil.colaborador_id);

  if (!autorizado) return { ok: false as const, error: 'No autorizado' };
  return { ok: true as const };
}

const BriefSchema = z.object({
  evaluacionId: z.string().uuid(),
  talentoCentral: z.string().trim().optional(),
  resumenHacer: z.string().trim().optional(),
  resumenDeber: z.string().trim().optional(),
  sugerenciasEnfoque: z.string().trim().optional(),
});

export async function guardarBrief(formData: FormData) {
  const parsed = BriefSchema.safeParse({
    evaluacionId: formData.get('evaluacionId'),
    talentoCentral: formData.get('talento_central'),
    resumenHacer: formData.get('resumen_hacer'),
    resumenDeber: formData.get('resumen_deber'),
    sugerenciasEnfoque: formData.get('sugerencias_enfoque'),
  });
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };

  const permiso = await puedePrepararBrief(parsed.data.evaluacionId);
  if (!permiso.ok) return permiso;

  const supabase = createClient();
  const { error } = await supabase.from('briefs_retroalimentacion').upsert(
    {
      evaluacion_id: parsed.data.evaluacionId,
      talento_central: parsed.data.talentoCentral || null,
      resumen_hacer: parsed.data.resumenHacer || null,
      resumen_deber: parsed.data.resumenDeber || null,
      sugerencias_enfoque: parsed.data.sugerenciasEnfoque || null,
      generado_en: new Date().toISOString(),
    },
    { onConflict: 'evaluacion_id' }
  );

  if (error) return { ok: false as const, error: error.message };

  revalidatePath(`/espiral-crecimiento/evaluaciones/${parsed.data.evaluacionId}/brief`);
  return { ok: true as const };
}

/** Wrapper de guardarBrief para usar directo como `<form action>` (necesita devolver void). */
export async function guardarBriefForm(formData: FormData) {
  await guardarBrief(formData);
}

/**
 * Arma el borrador del Brief cruzando Ser (Guía del Flow), Saber (hoja de vida,
 * verificaciones y cursos) y Hacer/Deber (valoración del ciclo). No guarda nada:
 * devuelve los textos para que el líder los revise, los edite y los guarde.
 * Con `conIA` mejora además la redacción con IA (si está configurada).
 */
export async function generarBorradorBrief(evaluacionId: string, conIA: boolean) {
  const permiso = await puedePrepararBrief(evaluacionId);
  if (!permiso.ok) return permiso;

  const supabase = createClient();
  const ctx = await recopilarContextoBrief(supabase, evaluacionId);
  if (!ctx) return { ok: false as const, error: 'No se encontró la evaluación' };

  const automatico = redactarBorrador(ctx);
  if (!conIA) return { ok: true as const, campos: automatico, fuente: 'automatico' as const };

  const mejorado = await mejorarBorradorConIA(ctx, automatico);
  if (!mejorado) {
    return {
      ok: true as const,
      campos: automatico,
      fuente: 'automatico' as const,
      aviso: 'No se pudo mejorar la redacción con IA en este momento; te dejé el borrador automático.',
    };
  }
  return { ok: true as const, campos: mejorado, fuente: 'ia' as const };
}

const CamposSchema = z.object({
  evaluacionId: z.string().uuid(),
  talento_central: z.string().trim().max(4000),
  resumen_ser: z.string().trim().max(4000),
  resumen_saber: z.string().trim().max(4000),
  resumen_hacer: z.string().trim().max(4000),
  resumen_deber: z.string().trim().max(4000),
  sugerencias_enfoque: z.string().trim().max(4000),
  fuente: z.enum(['manual', 'automatico', 'ia']),
});

/** Guarda el Brief completo (las seis secciones) y de dónde salió el borrador. */
export async function guardarBriefCampos(input: z.infer<typeof CamposSchema>) {
  const parsed = CamposSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  const d = parsed.data;

  const permiso = await puedePrepararBrief(d.evaluacionId);
  if (!permiso.ok) return permiso;

  const supabase = createClient();
  const { error } = await supabase.from('briefs_retroalimentacion').upsert(
    {
      evaluacion_id: d.evaluacionId,
      talento_central: d.talento_central || null,
      resumen_ser: d.resumen_ser || null,
      resumen_saber: d.resumen_saber || null,
      resumen_hacer: d.resumen_hacer || null,
      resumen_deber: d.resumen_deber || null,
      sugerencias_enfoque: d.sugerencias_enfoque || null,
      fuente_borrador: d.fuente,
      generado_en: new Date().toISOString(),
    },
    { onConflict: 'evaluacion_id' }
  );
  if (error) return { ok: false as const, error: error.message };

  revalidatePath(`/espiral-crecimiento/evaluaciones/${d.evaluacionId}/brief`);
  revalidatePath(`/espiral-crecimiento/evaluaciones/${d.evaluacionId}/resultado`);
  return { ok: true as const };
}

export type { CamposBrief };
