'use server';

import { createClient } from '@/lib/supabase/server';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

/** Talento Humano registra el seguimiento de cualquier persona de su empresa; un líder, solo el de su equipo directo. */
async function puedeRegistrar(colaboradorId: string) {
  const perfil = await getPerfilActual();
  if (!perfil || (perfil.rol !== 'admin_th' && perfil.rol !== 'lider')) return null;
  const supabase = createClient();
  const { data: colaborador } = await supabase.from('colaboradores').select('id, empresa_id, lider_id').eq('id', colaboradorId).maybeSingle();
  if (!colaborador || colaborador.empresa_id !== perfil.empresa_id) return null;
  if (perfil.rol === 'lider' && colaborador.lider_id !== perfil.colaborador_id) return null;
  return perfil;
}

const texto = z.string().trim().max(2000).optional();
const SeguimientoSchema = z.object({
  colaboradorId: z.string().uuid(),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida'),
  fortalezasEnPractica: texto,
  motivadores: texto,
  acuerdos: texto,
  proximaRevision: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal('')),
});

export async function registrarSeguimientoSer(input: z.infer<typeof SeguimientoSchema>) {
  const parsed = SeguimientoSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  const d = parsed.data;
  if (!d.fortalezasEnPractica && !d.motivadores && !d.acuerdos) {
    return { ok: false as const, error: 'Escribe al menos las fortalezas puestas en práctica, los motivadores o un acuerdo' };
  }
  const perfil = await puedeRegistrar(d.colaboradorId);
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const supabase = createClient();
  const { error } = await supabase.from('ser_seguimientos').insert({
    empresa_id: perfil.empresa_id,
    colaborador_id: d.colaboradorId,
    fecha: d.fecha,
    fortalezas_en_practica: d.fortalezasEnPractica || null,
    motivadores: d.motivadores || null,
    acuerdos: d.acuerdos || null,
    proxima_revision: d.proximaRevision || null,
    registrado_por: perfil.usuario_id,
    registrado_por_nombre: perfil.nombre_completo,
  });
  if (error) return { ok: false as const, error: error.message };

  revalidatePath(`/espiral-crecimiento/colaboradores/${d.colaboradorId}/guia-flow`);
  return { ok: true as const };
}

export async function eliminarSeguimientoSer(input: { id: string; colaboradorId: string }) {
  const ids = z.object({ id: z.string().uuid(), colaboradorId: z.string().uuid() }).safeParse(input);
  if (!ids.success) return { ok: false as const, error: 'Datos inválidos' };
  const perfil = await puedeRegistrar(ids.data.colaboradorId);
  if (!perfil) return { ok: false as const, error: 'No autorizado' };
  const supabase = createClient();
  const { error } = await supabase.from('ser_seguimientos').delete().eq('id', ids.data.id).eq('colaborador_id', ids.data.colaboradorId);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath(`/espiral-crecimiento/colaboradores/${ids.data.colaboradorId}/guia-flow`);
  return { ok: true as const };
}
