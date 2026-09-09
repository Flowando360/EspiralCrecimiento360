'use server';

import { createClient } from '@/lib/supabase/server';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const RUTA = '/dotacion';

async function requerirAdminTh() {
  const perfil = await getPerfilActual();
  if (!perfil || perfil.rol !== 'admin_th') return null;
  return perfil;
}

const EntregaSchema = z.object({
  colaboradorId: z.string().uuid('Selecciona un colaborador'),
  categoria: z.enum(['elemento_personal', 'equipo_trabajo']),
  nombreElemento: z.string().trim().min(1, 'El elemento es requerido'),
  talla: z.string().trim().optional(),
  cantidad: z.coerce.number().int().min(1).default(1),
  fechaEntrega: z.string().min(1, 'La fecha de entrega es requerida'),
  fechaVencimiento: z.string().optional(),
  observaciones: z.string().trim().optional(),
});

export async function crearEntrega(input: z.infer<typeof EntregaSchema>) {
  const perfil = await requerirAdminTh();
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const parsed = EntregaSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };

  const supabase = createClient();
  const { error } = await supabase.from('dotacion_entregas').insert({
    empresa_id: perfil.empresa_id,
    colaborador_id: parsed.data.colaboradorId,
    categoria: parsed.data.categoria,
    nombre_elemento: parsed.data.nombreElemento,
    talla: parsed.data.talla || null,
    cantidad: parsed.data.cantidad,
    fecha_entrega: parsed.data.fechaEntrega,
    fecha_vencimiento: parsed.data.fechaVencimiento || null,
    observaciones: parsed.data.observaciones || null,
    entregado_por: perfil.usuario_id,
  });

  if (error) return { ok: false as const, error: error.message };
  revalidatePath(RUTA);
  return { ok: true as const };
}

/** El propio colaborador confirma que recibió el elemento — casilla + fecha, mismo mecanismo del Acuerdo de Crecimiento. */
export async function confirmarFirmaDotacion(id: string) {
  const perfil = await getPerfilActual();
  if (!perfil || perfil.rol !== 'colaborador') return { ok: false as const, error: 'No autorizado' };

  const supabase = createClient();
  const { error } = await supabase
    .from('dotacion_entregas')
    .update({ firma_confirmada: true, firmado_en: new Date().toISOString() })
    .eq('id', id)
    .eq('colaborador_id', perfil.colaborador_id ?? '');

  if (error) return { ok: false as const, error: error.message };
  revalidatePath(RUTA);
  return { ok: true as const };
}

/** Checklist de devolución al momento de la desvinculación (o pérdida/daño en cualquier momento). */
export async function actualizarEstadoDotacion(id: string, estado: 'entregado' | 'devuelto' | 'perdido' | 'danado') {
  const perfil = await requerirAdminTh();
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const supabase = createClient();
  const { error } = await supabase
    .from('dotacion_entregas')
    .update({ estado, fecha_devolucion: estado === 'devuelto' ? new Date().toISOString().slice(0, 10) : null })
    .eq('id', id)
    .eq('empresa_id', perfil.empresa_id);

  if (error) return { ok: false as const, error: error.message };
  revalidatePath(RUTA);
  return { ok: true as const };
}
