'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { criteriosDesdePerfil } from '@/lib/reclutamiento/criterios-desde-perfil';
import { calcularMatchPostulaciones } from '@/lib/reclutamiento/evaluar-postulaciones';

const RUTA = '/reclutamiento';

async function requerirAdminTh() {
  const perfil = await getPerfilActual();
  if (!perfil || perfil.rol !== 'admin_th') return null;
  return perfil;
}

/**
 * Copia los requisitos del perfil de cargo a los criterios de la vacante (origen = perfil).
 * Los criterios que la empresa agregó a mano (origen = vacante) se conservan.
 */
export async function generarCriteriosDesdePerfil(vacanteId: string) {
  const perfil = await requerirAdminTh();
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const supabase = createClient();
  const { data: vacante } = await supabase.from('vacantes').select('id, cargo_id, empresa_id').eq('id', vacanteId).maybeSingle();
  if (!vacante || vacante.empresa_id !== perfil.empresa_id) return { ok: false as const, error: 'Vacante no encontrada' };

  const { data: cargo } = await supabase
    .from('cargos')
    .select('id, nombre, formacion_nivel, formacion_titulo_especifico, experiencia_minima_meses, competencias_cardinales, updated_at')
    .eq('id', vacante.cargo_id)
    .single();
  if (!cargo) return { ok: false as const, error: 'El perfil de cargo no existe.' };

  const { data: habilidades } = await supabase
    .from('cargo_habilidades')
    .select('id, tipo, nombre, nivel_esperado')
    .eq('cargo_id', cargo.id)
    .order('orden', { ascending: true });

  const version = new Date(cargo.updated_at).toISOString();
  const nuevos = criteriosDesdePerfil(
    { ...cargo, version },
    (habilidades ?? []).map((h) => ({ ...h, tipo: h.tipo as 'funcional' | 'tecnica', nivel_esperado: h.nivel_esperado as 'bajo' | 'medio' | 'alto' }))
  );

  const { error: errorBorrado } = await supabase.from('criterios_evaluacion').delete().eq('vacante_id', vacanteId).eq('origen', 'perfil');
  if (errorBorrado) return { ok: false as const, error: errorBorrado.message };

  const { error } = await supabase.from('criterios_evaluacion').insert(
    nuevos.map((c) => ({ ...c, empresa_id: perfil.empresa_id, vacante_id: vacanteId }))
  );
  if (error) return { ok: false as const, error: error.message };

  await supabase.from('vacantes').update({ perfil_version: version }).eq('id', vacanteId);
  revalidatePath(`${RUTA}/vacantes/${vacanteId}`);
  return { ok: true as const, cantidad: nuevos.length };
}

const CriterioSchema = z.object({
  vacanteId: z.string().uuid(),
  categoria: z.enum(['formacion', 'experiencia', 'competencia_tecnica', 'competencia_conductual', 'certificacion_idioma', 'requisito_adicional']),
  tipo: z.enum(['obligatorio', 'deseable', 'informativo']),
  descripcion: z.string().trim().min(3, 'Describe el criterio').max(300),
  valorRequerido: z.string().trim().max(300).optional(),
  nivelRequerido: z.enum(['basico', 'intermedio', 'avanzado', 'nativo']).optional().or(z.literal('')),
  mesesRequeridos: z.number().int().min(0).max(600).optional(),
  peso: z.number().min(0).max(100),
});

/** Agrega un criterio propio de la vacante (requisito específico). No modifica el perfil maestro. */
export async function agregarCriterioVacante(input: z.infer<typeof CriterioSchema>) {
  const perfil = await requerirAdminTh();
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const parsed = CriterioSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  const d = parsed.data;

  const supabase = createClient();
  const { error } = await supabase.from('criterios_evaluacion').insert({
    empresa_id: perfil.empresa_id,
    vacante_id: d.vacanteId,
    origen: 'vacante',
    categoria: d.categoria,
    tipo: d.tipo,
    descripcion: d.descripcion,
    valor_requerido: d.valorRequerido || null,
    nivel_requerido: d.nivelRequerido || null,
    meses_requeridos: d.mesesRequeridos ?? null,
    peso: d.peso,
  });
  if (error) return { ok: false as const, error: error.message };

  revalidatePath(`${RUTA}/vacantes/${d.vacanteId}`);
  return { ok: true as const };
}

/** Ajusta tipo, peso o si el criterio cuenta. Los criterios de perfil también pueden desactivarse para esta vacante. */
export async function actualizarCriterio(id: string, vacanteId: string, cambios: { tipo?: 'obligatorio' | 'deseable' | 'informativo'; peso?: number; activo?: boolean }) {
  const perfil = await requerirAdminTh();
  if (!perfil) return { ok: false as const, error: 'No autorizado' };
  if (cambios.peso !== undefined && (cambios.peso < 0 || cambios.peso > 100)) return { ok: false as const, error: 'El peso debe estar entre 0 y 100' };

  const { error } = await createClient()
    .from('criterios_evaluacion')
    .update(cambios)
    .eq('id', id)
    .eq('vacante_id', vacanteId)
    .eq('empresa_id', perfil.empresa_id);
  if (error) return { ok: false as const, error: error.message };

  revalidatePath(`${RUTA}/vacantes/${vacanteId}`);
  return { ok: true as const };
}

export async function eliminarCriterioVacante(id: string, vacanteId: string) {
  const perfil = await requerirAdminTh();
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const { error } = await createClient()
    .from('criterios_evaluacion')
    .delete()
    .eq('id', id)
    .eq('vacante_id', vacanteId)
    .eq('origen', 'vacante');
  if (error) return { ok: false as const, error: error.message };

  revalidatePath(`${RUTA}/vacantes/${vacanteId}`);
  return { ok: true as const };
}

/** Calcula (o recalcula) la correspondencia de todos los candidatos de la vacante. */
export async function calcularCorrespondenciaVacante(vacanteId: string) {
  const perfil = await requerirAdminTh();
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const supabase = createClient();
  const { data: vacante } = await supabase.from('vacantes').select('id').eq('id', vacanteId).eq('empresa_id', perfil.empresa_id).maybeSingle();
  if (!vacante) return { ok: false as const, error: 'Vacante no encontrada' };

  try {
    const cantidad = await calcularMatchPostulaciones(supabase, vacanteId, { usuarioId: perfil.usuario_id });
    revalidatePath(`${RUTA}/vacantes/${vacanteId}`);
    return { ok: true as const, cantidad };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : 'No se pudo calcular la correspondencia.' };
  }
}
