'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';

const Schema = z.object({
  colaboradorId: z.string().uuid(),
  tipo: z.enum(['preingreso', 'periodico', 'egreso']),
  fechaRealizado: z.string().min(1, 'La fecha del examen es requerida'),
  proximaFecha: z.string().optional(),
  concepto: z.enum(['apto', 'apto_con_restricciones', 'no_apto', 'pendiente']),
  entidad: z.string().trim().max(120).optional(),
});

async function adminDeEstaPersona(colaboradorId: string) {
  const perfil = await getPerfilActual();
  if (!perfil || perfil.rol !== 'admin_th') return null;
  const supabase = createClient();
  const { data } = await supabase.from('colaboradores').select('id, empresa_id').eq('id', colaboradorId).maybeSingle();
  return data && data.empresa_id === perfil.empresa_id ? perfil : null;
}

function revalidar(colaboradorId: string) {
  revalidatePath(`/espiral-crecimiento/colaboradores/${colaboradorId}/examenes`);
  revalidatePath(`/espiral-crecimiento/colaboradores/${colaboradorId}`);
  revalidatePath('/alertas');
}

/** Registra un examen médico ocupacional (admin_th). Solo el concepto general, nunca el diagnóstico. */
export async function registrarExamenMedico(input: z.infer<typeof Schema>) {
  const p = Schema.safeParse(input);
  if (!p.success) return { ok: false as const, error: p.error.issues[0]?.message ?? 'Datos inválidos' };
  const d = p.data;
  if (d.proximaFecha && d.proximaFecha < d.fechaRealizado) return { ok: false as const, error: 'El vencimiento no puede ser anterior a la fecha del examen' };
  if (d.tipo !== 'periodico' && d.proximaFecha) return { ok: false as const, error: 'Solo los exámenes periódicos llevan fecha de vencimiento' };
  const perfil = await adminDeEstaPersona(d.colaboradorId);
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const supabase = createClient() as any;
  const { error } = await supabase.from('examenes_medicos_colaborador').insert({
    colaborador_id: d.colaboradorId,
    tipo: d.tipo,
    fecha_realizado: d.fechaRealizado,
    proxima_fecha: d.proximaFecha || null,
    concepto: d.concepto,
    entidad: d.entidad || null,
    registrado_por: perfil.usuario_id,
  });
  if (error) return { ok: false as const, error: error.message };
  revalidar(d.colaboradorId);
  return { ok: true as const };
}

export async function eliminarExamenMedico(colaboradorId: string, examenId: string) {
  const perfil = await adminDeEstaPersona(colaboradorId);
  if (!perfil) return { ok: false as const, error: 'No autorizado' };
  const supabase = createClient() as any;
  const { error } = await supabase.from('examenes_medicos_colaborador').delete().eq('id', examenId).eq('colaborador_id', colaboradorId);
  if (error) return { ok: false as const, error: error.message };
  revalidar(colaboradorId);
  return { ok: true as const };
}
