'use server';

import { createClient } from '@/lib/supabase/server';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import type { VerificacionSaber } from '@/types/colaborador';

const BLOQUES = [
  'formacion_academica',
  'habilidades_funcionales_tecnicas',
  'certificaciones',
  'experiencia',
] as const;

const ESTADOS = ['cumple', 'cumple_parcial', 'no_cumple_pendiente'] as const;

/**
 * Replica en el servidor la misma regla que ya aplica RLS (fn_es_mi_equipo):
 * admin_th certifica cualquier colaborador de su empresa; un líder solo el
 * de sus reportes directos. Se revalida aquí también porque las acciones
 * corren con la service_role key (BYPASS_AUTH), que salta RLS.
 */
async function puedeCertificar(colaboradorId: string) {
  const perfil = await getPerfilActual();
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const supabase = createClient();
  const { data: colaborador } = await supabase
    .from('colaboradores')
    .select('id, empresa_id, lider_id')
    .eq('id', colaboradorId)
    .maybeSingle();

  if (!colaborador || colaborador.empresa_id !== perfil.empresa_id) {
    return { ok: false as const, error: 'Colaborador no encontrado' };
  }

  const autorizado =
    perfil.rol === 'admin_th' || (perfil.rol === 'lider' && colaborador.lider_id === perfil.colaborador_id);

  if (!autorizado) return { ok: false as const, error: 'No autorizado' };
  return { ok: true as const, perfil };
}

function revalidar(colaboradorId: string) {
  revalidatePath(`/espiral-crecimiento/colaboradores/${colaboradorId}/saber`);
  revalidatePath(`/espiral-crecimiento/colaboradores/${colaboradorId}`);
}

const AgregarSchema = z.object({
  colaboradorId: z.string().uuid(),
  bloque: z.enum(BLOQUES),
  itemEvaluado: z.string().trim().min(1, 'Escribe qué se va a verificar'),
});

export async function agregarVerificacionSaber(input: z.infer<typeof AgregarSchema>) {
  const parsed = AgregarSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };

  const permiso = await puedeCertificar(parsed.data.colaboradorId);
  if (!permiso.ok) return { ok: false as const, error: permiso.error };

  const supabase = createClient();
  const { data, error } = await supabase
    .from('verificaciones_saber')
    .insert({
      colaborador_id: parsed.data.colaboradorId,
      bloque: parsed.data.bloque,
      item_evaluado: parsed.data.itemEvaluado,
    })
    .select('*')
    .single();

  if (error) return { ok: false as const, error: error.message };

  revalidar(parsed.data.colaboradorId);
  return { ok: true as const, item: data as unknown as VerificacionSaber };
}

const ActualizarSchema = z.object({
  id: z.string().uuid(),
  colaboradorId: z.string().uuid(),
  estado: z.enum(ESTADOS),
  evidenciaUrl: z.string().trim().optional(),
  observaciones: z.string().trim().optional(),
});

export async function actualizarVerificacionSaber(input: z.infer<typeof ActualizarSchema>) {
  const parsed = ActualizarSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };

  const permiso = await puedeCertificar(parsed.data.colaboradorId);
  if (!permiso.ok) return { ok: false as const, error: permiso.error };

  const supabase = createClient();
  const { error } = await supabase
    .from('verificaciones_saber')
    .update({
      estado: parsed.data.estado,
      evidencia_url: parsed.data.evidenciaUrl || null,
      observaciones: parsed.data.observaciones || null,
      certificado_por: permiso.perfil.usuario_id,
      fecha_verificacion: new Date().toISOString().slice(0, 10),
    })
    .eq('id', parsed.data.id)
    .eq('colaborador_id', parsed.data.colaboradorId);

  if (error) return { ok: false as const, error: error.message };

  revalidar(parsed.data.colaboradorId);
  return { ok: true as const };
}

const EliminarSchema = z.object({
  id: z.string().uuid(),
  colaboradorId: z.string().uuid(),
});

export async function eliminarVerificacionSaber(input: z.infer<typeof EliminarSchema>) {
  const parsed = EliminarSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };

  const permiso = await puedeCertificar(parsed.data.colaboradorId);
  if (!permiso.ok) return { ok: false as const, error: permiso.error };

  const supabase = createClient();
  const { error } = await supabase
    .from('verificaciones_saber')
    .delete()
    .eq('id', parsed.data.id)
    .eq('colaborador_id', parsed.data.colaboradorId);

  if (error) return { ok: false as const, error: error.message };

  revalidar(parsed.data.colaboradorId);
  return { ok: true as const };
}
