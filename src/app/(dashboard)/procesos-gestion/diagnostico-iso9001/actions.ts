'use server';

import { createClient } from '@/lib/supabase/server';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { revalidatePath } from 'next/cache';
import type { NivelDiagnostico } from '@/lib/calculos/diagnostico-iso9001';

const RUTA = '/procesos-gestion/diagnostico-iso9001';

async function requerirAdminTh() {
  const perfil = await getPerfilActual();
  if (!perfil || perfil.rol !== 'admin_th') return null;
  return perfil;
}

export async function crearDiagnostico() {
  const perfil = await requerirAdminTh();
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const supabase = createClient();
  const { data, error } = await supabase
    .from('diagnosticos_iso9001')
    .insert({ empresa_id: perfil.empresa_id, realizado_por: perfil.colaborador_id })
    .select('id')
    .single();

  if (error) return { ok: false as const, error: error.message };
  revalidatePath(RUTA);
  return { ok: true as const, id: data.id };
}

export async function eliminarDiagnostico(id: string) {
  const perfil = await requerirAdminTh();
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const supabase = createClient();
  const { error } = await supabase.from('diagnosticos_iso9001').delete().eq('id', id).eq('empresa_id', perfil.empresa_id);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath(RUTA);
  return { ok: true as const };
}

export async function marcarDiagnosticoCompletado(id: string, completado: boolean) {
  const perfil = await requerirAdminTh();
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const supabase = createClient();
  const { error } = await supabase
    .from('diagnosticos_iso9001')
    .update({ estado: completado ? 'completado' : 'en_progreso' })
    .eq('id', id)
    .eq('empresa_id', perfil.empresa_id);

  if (error) return { ok: false as const, error: error.message };
  revalidatePath(`${RUTA}/${id}`);
  return { ok: true as const };
}

export async function guardarRespuestaDiagnostico(input: { diagnosticoId: string; itemId: string; nivel: NivelDiagnostico | null; observacion: string }) {
  const perfil = await requerirAdminTh();
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const supabase = createClient();
  // Confirma que el diagnóstico es de la empresa del usuario antes de tocar
  // sus respuestas — evita que alguien adivine un diagnosticoId ajeno.
  const { data: diagnostico } = await supabase.from('diagnosticos_iso9001').select('empresa_id').eq('id', input.diagnosticoId).maybeSingle();
  if (!diagnostico || diagnostico.empresa_id !== perfil.empresa_id) return { ok: false as const, error: 'No autorizado' };

  const { error } = await supabase
    .from('diagnostico_iso9001_respuestas')
    .upsert(
      {
        diagnostico_id: input.diagnosticoId,
        item_id: input.itemId,
        nivel: input.nivel,
        observacion: input.observacion.trim() || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'diagnostico_id,item_id' }
    );

  if (error) return { ok: false as const, error: error.message };
  revalidatePath(`${RUTA}/${input.diagnosticoId}`);
  return { ok: true as const };
}
