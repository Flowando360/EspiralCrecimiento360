'use server';

import { createClient } from '@/lib/supabase/server';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const RUTA = '/procesos-gestion/cambios';

async function requerirSolicitante() {
  const perfil = await getPerfilActual();
  if (!perfil || !['admin_th', 'lider'].includes(perfil.rol)) return null;
  return perfil;
}

async function requerirAdminTh() {
  const perfil = await getPerfilActual();
  if (!perfil || perfil.rol !== 'admin_th') return null;
  return perfil;
}

async function generarCodigoCambio(supabase: ReturnType<typeof createClient>, procesoId: string, procesoCodigo: string | null) {
  const { count } = await supabase.from('solicitudes_cambio').select('id', { count: 'exact', head: true }).eq('proceso_id', procesoId);
  return `CAM-${procesoCodigo ?? 'DOC'}-${String((count ?? 0) + 1).padStart(3, '0')}`;
}

const SolicitudCambioSchema = z.object({
  procesoId: z.string().uuid(),
  titulo: z.string().trim().min(1, 'El título es requerido'),
  descripcion: z.string().trim().min(1, 'La descripción es requerida'),
  tipoCambio: z.enum(['proceso', 'documento', 'sistema', 'estructura', 'otro']),
  motivo: z.string().trim().optional(),
  impacto: z.enum(['bajo', 'medio', 'alto']).optional(),
});

export async function crearSolicitudCambio(input: z.infer<typeof SolicitudCambioSchema>) {
  const perfil = await requerirSolicitante();
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const parsed = SolicitudCambioSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  const d = parsed.data;

  const supabase = createClient();
  const { data: proceso } = await supabase.from('procesos_gestion').select('codigo').eq('id', d.procesoId).maybeSingle();
  const codigo = await generarCodigoCambio(supabase, d.procesoId, (proceso?.codigo as string) ?? null);

  const { data, error } = await supabase
    .from('solicitudes_cambio')
    .insert({
      proceso_id: d.procesoId,
      codigo,
      titulo: d.titulo,
      descripcion: d.descripcion,
      tipo_cambio: d.tipoCambio,
      motivo: d.motivo || null,
      impacto: d.impacto || null,
      solicitante_id: perfil.colaborador_id,
    })
    .select('id')
    .single();

  if (error) return { ok: false as const, error: error.message };
  revalidatePath(RUTA);
  return { ok: true as const, id: data.id as string, codigo };
}

export async function evaluarSolicitudCambio(id: string, evaluacion: string, impacto: 'bajo' | 'medio' | 'alto') {
  const perfil = await requerirAdminTh();
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const supabase = createClient();
  const { error } = await supabase.from('solicitudes_cambio').update({ evaluacion, impacto, estado: 'en_evaluacion' }).eq('id', id);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath(RUTA);
  return { ok: true as const };
}

export async function resolverSolicitudCambio(id: string, aprobar: boolean, evaluacion?: string) {
  const perfil = await requerirAdminTh();
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const supabase = createClient();
  const { error } = await supabase
    .from('solicitudes_cambio')
    .update({
      estado: aprobar ? 'aprobado' : 'rechazado',
      evaluacion: evaluacion || undefined,
      aprobador_id: perfil.colaborador_id,
      fecha_resolucion: new Date().toISOString(),
    })
    .eq('id', id);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath(RUTA);
  return { ok: true as const };
}

export async function marcarCambioImplementado(id: string) {
  const perfil = await requerirAdminTh();
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const supabase = createClient();
  const { error } = await supabase
    .from('solicitudes_cambio')
    .update({ estado: 'implementado', fecha_implementacion: new Date().toISOString().slice(0, 10) })
    .eq('id', id)
    .eq('estado', 'aprobado');
  if (error) return { ok: false as const, error: error.message };
  revalidatePath(RUTA);
  return { ok: true as const };
}

export async function eliminarSolicitudCambio(id: string) {
  const perfil = await requerirAdminTh();
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const supabase = createClient();
  const { error } = await supabase.from('solicitudes_cambio').delete().eq('id', id);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath(RUTA);
  return { ok: true as const };
}
