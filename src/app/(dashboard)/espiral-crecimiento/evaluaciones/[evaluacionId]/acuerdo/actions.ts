'use server';

import { createClient } from '@/lib/supabase/server';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

/**
 * Replica en el servidor la misma regla que ya aplica RLS ("acuerdos: partes
 * involucradas"): admin_th, el líder directo del colaborador evaluado, o el
 * propio colaborador. A diferencia del brief, el colaborador SÍ es parte de
 * este acuerdo (lo firma él mismo).
 */
async function partesDelAcuerdo(evaluacionId: string) {
  const perfil = await getPerfilActual();
  if (!perfil) return null;

  const supabase = createClient();
  const { data: evaluacion } = await supabase
    .from('evaluaciones')
    .select('id, colaborador:colaborador_evaluado_id(id, empresa_id, lider_id)')
    .eq('id', evaluacionId)
    .maybeSingle();

  const colaborador = (evaluacion as any)?.colaborador;
  if (!evaluacion || !colaborador || colaborador.empresa_id !== perfil.empresa_id) return null;

  return {
    perfil,
    esAdminTh: perfil.rol === 'admin_th',
    esLiderDirecto: perfil.rol === 'lider' && colaborador.lider_id === perfil.colaborador_id,
    esElColaborador: perfil.colaborador_id === colaborador.id,
  };
}

/** Busca el acuerdo de la evaluación, o crea la fila vacía si todavía no existe. */
async function obtenerOCrearAcuerdo(evaluacionId: string) {
  const supabase = createClient();
  const { data: existente } = await supabase
    .from('acuerdos_crecimiento')
    .select('id')
    .eq('evaluacion_id', evaluacionId)
    .maybeSingle();

  if (existente) return existente.id as string;

  const { data: creado, error } = await supabase
    .from('acuerdos_crecimiento')
    .insert({ evaluacion_id: evaluacionId })
    .select('id')
    .single();

  if (error || !creado) return null;
  return creado.id as string;
}

function revalidar(evaluacionId: string) {
  revalidatePath(`/espiral-crecimiento/evaluaciones/${evaluacionId}/acuerdo`);
}

const CompromisosSchema = z.object({
  evaluacionId: z.string().uuid(),
  compromisosColaborador: z.string().trim().optional(),
  compromisosEmpresa: z.string().trim().optional(),
});

export async function guardarCompromisos(formData: FormData) {
  const parsed = CompromisosSchema.safeParse({
    evaluacionId: formData.get('evaluacionId'),
    compromisosColaborador: formData.get('compromisos_colaborador'),
    compromisosEmpresa: formData.get('compromisos_empresa'),
  });
  if (!parsed.success) return { ok: false as const, error: 'Datos inválidos' };

  const partes = await partesDelAcuerdo(parsed.data.evaluacionId);
  if (!partes || !(partes.esAdminTh || partes.esLiderDirecto)) {
    return { ok: false as const, error: 'No autorizado' };
  }

  const id = await obtenerOCrearAcuerdo(parsed.data.evaluacionId);
  if (!id) return { ok: false as const, error: 'No se pudo crear el acuerdo' };

  const supabase = createClient();
  const { error } = await supabase
    .from('acuerdos_crecimiento')
    .update({
      compromisos_colaborador: parsed.data.compromisosColaborador || null,
      compromisos_empresa: parsed.data.compromisosEmpresa || null,
    })
    .eq('id', id);

  if (error) return { ok: false as const, error: error.message };

  revalidar(parsed.data.evaluacionId);
  return { ok: true as const };
}

/** Wrapper de guardarCompromisos para usar directo como `<form action>` (necesita devolver void). */
export async function guardarCompromisosForm(formData: FormData) {
  await guardarCompromisos(formData);
}

const FirmarSchema = z.object({
  evaluacionId: z.string().uuid(),
  parte: z.enum(['colaborador', 'lider']),
  firmado: z.boolean(),
});

export async function firmarAcuerdo(input: z.infer<typeof FirmarSchema>) {
  const parsed = FirmarSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: 'Datos inválidos' };

  const partes = await partesDelAcuerdo(parsed.data.evaluacionId);
  if (!partes) return { ok: false as const, error: 'No autorizado' };

  const autorizado =
    parsed.data.parte === 'colaborador'
      ? partes.esAdminTh || partes.esElColaborador
      : partes.esAdminTh || partes.esLiderDirecto;

  if (!autorizado) return { ok: false as const, error: 'No autorizado' };

  const id = await obtenerOCrearAcuerdo(parsed.data.evaluacionId);
  if (!id) return { ok: false as const, error: 'No se pudo crear el acuerdo' };

  const supabase = createClient();
  const ahora = parsed.data.firmado ? new Date().toISOString() : null;
  const campos =
    parsed.data.parte === 'colaborador'
      ? { firmado_colaborador: parsed.data.firmado, fecha_firma_colaborador: ahora }
      : { firmado_lider: parsed.data.firmado, fecha_firma_lider: ahora };

  const { error } = await supabase.from('acuerdos_crecimiento').update(campos).eq('id', id);
  if (error) return { ok: false as const, error: error.message };

  revalidar(parsed.data.evaluacionId);
  return { ok: true as const };
}
