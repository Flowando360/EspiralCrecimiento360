'use server';

import { createClient } from '@/lib/supabase/server';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const TIPOS = ['enfermedad_general', 'accidente_laboral', 'enfermedad_laboral', 'licencia_maternidad', 'licencia_paternidad', 'otra'] as const;

async function esAdminThDeEsteColaborador(colaboradorId: string) {
  const perfil = await getPerfilActual();
  if (!perfil || perfil.rol !== 'admin_th') return null;

  const supabase = createClient();
  const { data: colaborador } = await supabase
    .from('colaboradores')
    .select('id, empresa_id')
    .eq('id', colaboradorId)
    .maybeSingle();

  if (!colaborador || colaborador.empresa_id !== perfil.empresa_id) return null;
  return perfil;
}

function revalidar(colaboradorId: string) {
  revalidatePath(`/espiral-crecimiento/colaboradores/${colaboradorId}/incapacidades`);
  revalidatePath(`/espiral-crecimiento/colaboradores/${colaboradorId}`);
  revalidatePath('/mi-perfil');
}

function extensionDe(nombreArchivo: string): string {
  const partes = nombreArchivo.split('.');
  return partes.length > 1 ? partes[partes.length - 1]!.toLowerCase() : 'pdf';
}

const IncapacidadSchema = z.object({
  colaboradorId: z.string().uuid(),
  tipo: z.enum(TIPOS),
  fechaInicio: z.string().min(1, 'La fecha de inicio es requerida'),
  fechaFin: z.string().min(1, 'La fecha de fin es requerida'),
  entidadEmisora: z.string().trim().optional(),
});

/** Registra una incapacidad o licencia de un colaborador (admin_th). */
export async function agregarIncapacidad(formData: FormData) {
  const colaboradorId = formData.get('colaboradorId') as string;
  const parsed = IncapacidadSchema.safeParse({
    colaboradorId,
    tipo: formData.get('tipo'),
    fechaInicio: formData.get('fechaInicio'),
    fechaFin: formData.get('fechaFin'),
    entidadEmisora: (formData.get('entidadEmisora') as string) || undefined,
  });
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };

  if (parsed.data.fechaFin < parsed.data.fechaInicio) {
    return { ok: false as const, error: 'La fecha de fin no puede ser anterior a la de inicio' };
  }

  const perfil = await esAdminThDeEsteColaborador(colaboradorId);
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const supabase = createClient();

  let soporteUrl: string | null = null;
  const archivo = formData.get('archivo') as File | null;
  if (archivo && archivo.size > 0) {
    const path = `${perfil.empresa_id}/${colaboradorId}/incapacidad/soporte-${Date.now()}.${extensionDe(archivo.name)}`;
    const { error: uploadError } = await supabase.storage
      .from('documentos-colaborador')
      .upload(path, archivo, { contentType: archivo.type || 'application/pdf', upsert: true });
    if (uploadError) return { ok: false as const, error: `Error subiendo el soporte: ${uploadError.message}` };
    soporteUrl = path;
  }

  const { data, error } = await supabase
    .from('incapacidades_colaborador')
    .insert({
      colaborador_id: colaboradorId,
      tipo: parsed.data.tipo,
      fecha_inicio: parsed.data.fechaInicio,
      fecha_fin: parsed.data.fechaFin,
      entidad_emisora: parsed.data.entidadEmisora || null,
      soporte_url: soporteUrl,
      registrada_por: perfil.usuario_id,
    })
    .select('id, tipo, fecha_inicio, fecha_fin, dias, entidad_emisora, soporte_url')
    .single();

  if (error) return { ok: false as const, error: error.message };

  revalidar(colaboradorId);
  return { ok: true as const, incapacidad: data };
}

export async function eliminarIncapacidad(id: string, colaboradorId: string) {
  const perfil = await esAdminThDeEsteColaborador(colaboradorId);
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const supabase = createClient();
  const { error } = await supabase.from('incapacidades_colaborador').delete().eq('id', id).eq('colaborador_id', colaboradorId);
  if (error) return { ok: false as const, error: error.message };

  revalidar(colaboradorId);
  return { ok: true as const };
}
