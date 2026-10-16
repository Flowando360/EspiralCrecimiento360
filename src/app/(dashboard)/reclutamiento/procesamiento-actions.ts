'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { procesarTrabajoIA, type ResultadoProcesamiento } from '@/lib/reclutamiento/procesar-hoja-vida';
import { recalcularFichaCandidato } from '@/lib/reclutamiento/evaluar-postulaciones';
import { CAMPOS_CORREGIBLES, TABLAS_FICHA, normalizarValorCorregido, type TablaFicha } from '@/lib/reclutamiento/correcciones';

const RUTA = '/reclutamiento';

async function requerirAdminTh() {
  const perfil = await getPerfilActual();
  if (!perfil || perfil.rol !== 'admin_th') return null;
  return perfil;
}

/** Comprueba con sesión (RLS) que el trabajo pertenece a la empresa del usuario. */
async function trabajoDeMiEmpresa(jobId: string, empresaId: string) {
  const { data } = await createClient()
    .from('ai_processing_jobs')
    .select('id, candidato_id')
    .eq('id', jobId)
    .eq('empresa_id', empresaId)
    .maybeSingle();
  return data;
}

/** Procesa ahora una hoja de vida pendiente (botón "Procesar con IA" en la ficha). */
export async function procesarHojaVidaAhora(jobId: string): Promise<{ ok: true; resultado: ResultadoProcesamiento } | { ok: false; error: string }> {
  const perfil = await requerirAdminTh();
  if (!perfil) return { ok: false, error: 'No autorizado' };

  const trabajo = await trabajoDeMiEmpresa(jobId, perfil.empresa_id);
  if (!trabajo) return { ok: false, error: 'Trabajo no encontrado' };

  const resultado = await procesarTrabajoIA(createAdminClient(), jobId);
  revalidatePath(`${RUTA}/candidatos/${trabajo.candidato_id}`);
  revalidatePath(RUTA);
  return { ok: true, resultado };
}

/** Devuelve a la cola un trabajo que terminó en error (reinicia sus intentos) y lo procesa. */
export async function reintentarProcesamiento(jobId: string): Promise<{ ok: true; resultado: ResultadoProcesamiento } | { ok: false; error: string }> {
  const perfil = await requerirAdminTh();
  if (!perfil) return { ok: false, error: 'No autorizado' };

  const trabajo = await trabajoDeMiEmpresa(jobId, perfil.empresa_id);
  if (!trabajo) return { ok: false, error: 'Trabajo no encontrado' };

  const { error } = await createAdminClient()
    .from('ai_processing_jobs')
    .update({ estado: 'pendiente', intentos: 0, ultimo_error: null })
    .eq('id', jobId)
    .eq('estado', 'error');
  if (error) return { ok: false, error: error.message };

  return procesarHojaVidaAhora(jobId);
}

/** Procesa un lote de hojas de vida pendientes (botón del panel de control). */
export async function procesarPendientesAhora(limite = 5): Promise<{ ok: true; procesados: number } | { ok: false; error: string }> {
  const perfil = await requerirAdminTh();
  if (!perfil) return { ok: false, error: 'No autorizado' };

  const pendientes = await createClient()
    .from('ai_processing_jobs')
    .select('id')
    .eq('empresa_id', perfil.empresa_id)
    .eq('estado', 'pendiente')
    .order('created_at', { ascending: true })
    .limit(Math.min(Math.max(limite, 1), 10));
  if (pendientes.error) return { ok: false, error: pendientes.error.message };

  const admin = createAdminClient();
  let procesados = 0;
  for (const j of pendientes.data ?? []) {
    await procesarTrabajoIA(admin, j.id);
    procesados++;
  }
  revalidatePath(RUTA);
  return { ok: true, procesados };
}

const RevisionSchema = z.object({
  candidatoId: z.string().uuid(),
  tabla: z.enum(TABLAS_FICHA as [TablaFicha, ...TablaFicha[]]),
  registroId: z.string().uuid(),
  accion: z.enum(['aceptar', 'no_verificable', 'corregir']),
  campo: z.string().optional(),
  valorNuevo: z.string().optional(),
});

/**
 * Revisión humana de un dato extraído (requerimiento §9.6): aceptarlo, marcarlo como no verificable
 * o corregirlo. Cada acción queda en candidato_validaciones con el valor anterior y el nuevo.
 */
export async function revisarDatoExtraido(input: z.infer<typeof RevisionSchema>) {
  const perfil = await requerirAdminTh();
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const parsed = RevisionSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  const { candidatoId, tabla, registroId, accion } = parsed.data;

  const supabase = createClient();
  const { data: candidato } = await supabase.from('candidatos').select('id').eq('id', candidatoId).eq('empresa_id', perfil.empresa_id).maybeSingle();
  if (!candidato) return { ok: false as const, error: 'Candidato no encontrado' };

  const { data: registro } = await supabase.from(tabla).select('*').eq('id', registroId).eq('candidato_id', candidatoId).maybeSingle();
  if (!registro) return { ok: false as const, error: 'Registro no encontrado' };

  const cambios: Record<string, unknown> = { requiere_revision: false };
  let campo = 'registro';
  let valorAnterior: unknown = null;
  let valorNuevo: unknown = null;

  if (accion === 'corregir') {
    const campoPedido = parsed.data.campo ?? '';
    const tipo = CAMPOS_CORREGIBLES[tabla][campoPedido];
    if (!tipo) return { ok: false as const, error: 'Ese campo no se puede corregir desde aquí.' };
    const normal = normalizarValorCorregido(tipo, parsed.data.valorNuevo ?? '');
    if (!normal.ok) return { ok: false as const, error: normal.error };

    campo = campoPedido;
    valorAnterior = (registro as Record<string, unknown>)[campoPedido] ?? null;
    valorNuevo = normal.valor;
    cambios[campoPedido] = normal.valor;
    cambios.procedencia = 'verificado';
  }

  const { error } = await supabase.from(tabla).update(cambios as never).eq('id', registroId).eq('candidato_id', candidatoId);
  if (error) return { ok: false as const, error: error.message };

  const { error: errorRegistro } = await supabase.from('candidato_validaciones').insert({
    empresa_id: perfil.empresa_id,
    candidato_id: candidatoId,
    tabla,
    registro_id: registroId,
    campo,
    valor_anterior: valorAnterior as never,
    valor_nuevo: valorNuevo as never,
    accion,
    usuario_id: perfil.usuario_id,
  });
  if (errorRegistro) return { ok: false as const, error: 'El cambio se guardó, pero no se pudo registrar en el historial: ' + errorRegistro.message };

  // Una corrección cambia la correspondencia: se recalculan años y se invalidan las evaluaciones.
  if (accion === 'corregir') await recalcularFichaCandidato(createAdminClient(), candidatoId);

  revalidatePath(`${RUTA}/candidatos/${candidatoId}`);
  revalidatePath(RUTA);
  return { ok: true as const };
}
