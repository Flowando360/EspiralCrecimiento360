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

const MAX_SOPORTE_BYTES = 4 * 1024 * 1024;

function extensionDe(nombre: string): string {
  const partes = nombre.split('.');
  return partes.length > 1 ? partes[partes.length - 1]!.toLowerCase().replace(/[^a-z0-9]/g, '') || 'pdf' : 'pdf';
}

/** Registra un examen médico ocupacional (admin_th). Solo el concepto general, nunca el diagnóstico; el soporte es opcional (PDF o imagen, hasta 4 MB). */
export async function registrarExamenMedico(formData: FormData) {
  const proxima = (formData.get('proximaFecha') as string) || undefined;
  const p = Schema.safeParse({
    colaboradorId: formData.get('colaboradorId'),
    tipo: formData.get('tipo'),
    fechaRealizado: formData.get('fechaRealizado'),
    proximaFecha: proxima,
    concepto: formData.get('concepto'),
    entidad: (formData.get('entidad') as string) || undefined,
  });
  if (!p.success) return { ok: false as const, error: p.error.issues[0]?.message ?? 'Datos inválidos' };
  const d = p.data;
  if (d.proximaFecha && d.proximaFecha < d.fechaRealizado) return { ok: false as const, error: 'El vencimiento no puede ser anterior a la fecha del examen' };
  if (d.tipo !== 'periodico' && d.proximaFecha) return { ok: false as const, error: 'Solo los exámenes periódicos llevan fecha de vencimiento' };
  const perfil = await adminDeEstaPersona(d.colaboradorId);
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const supabase = createClient() as any;

  let soporteUrl: string | null = null;
  const archivo = formData.get('archivo') as File | null;
  if (archivo && archivo.size > 0) {
    if (archivo.size > MAX_SOPORTE_BYTES) return { ok: false as const, error: 'El soporte supera 4 MB' };
    const ruta = `${perfil.empresa_id}/${d.colaboradorId}/examen/soporte-${Date.now()}.${extensionDe(archivo.name)}`;
    const { error: errSubida } = await supabase.storage
      .from('documentos-colaborador')
      .upload(ruta, archivo, { contentType: archivo.type || 'application/pdf', upsert: true });
    if (errSubida) return { ok: false as const, error: `Error subiendo el soporte: ${errSubida.message}` };
    soporteUrl = ruta;
  }

  const { error } = await supabase.from('examenes_medicos_colaborador').insert({
    soporte_url: soporteUrl,
    colaborador_id: d.colaboradorId,
    tipo: d.tipo,
    fecha_realizado: d.fechaRealizado,
    proxima_fecha: d.proximaFecha || null,
    concepto: d.concepto,
    entidad: d.entidad || null,
    registrado_por: perfil.usuario_id,
  });
  if (error) {
    if (soporteUrl) await supabase.storage.from('documentos-colaborador').remove([soporteUrl]);
    return { ok: false as const, error: error.message };
  }
  revalidar(d.colaboradorId);
  return { ok: true as const };
}

export async function eliminarExamenMedico(colaboradorId: string, examenId: string) {
  const perfil = await adminDeEstaPersona(colaboradorId);
  if (!perfil) return { ok: false as const, error: 'No autorizado' };
  const supabase = createClient() as any;
  const { data: previo } = await supabase.from('examenes_medicos_colaborador').select('soporte_url').eq('id', examenId).eq('colaborador_id', colaboradorId).maybeSingle();
  const { error } = await supabase.from('examenes_medicos_colaborador').delete().eq('id', examenId).eq('colaborador_id', colaboradorId);
  if (!error && previo?.soporte_url) await supabase.storage.from('documentos-colaborador').remove([previo.soporte_url]);
  if (error) return { ok: false as const, error: error.message };
  revalidar(colaboradorId);
  return { ok: true as const };
}
