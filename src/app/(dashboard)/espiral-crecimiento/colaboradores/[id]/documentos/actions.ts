'use server';

import { createClient } from '@/lib/supabase/server';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { revalidatePath } from 'next/cache';
import type { Database } from '@/types/database.types';

type ColaboradorUpdate = Database['public']['Tables']['colaboradores']['Update'];

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
  revalidatePath(`/espiral-crecimiento/colaboradores/${colaboradorId}/documentos`);
  revalidatePath(`/espiral-crecimiento/colaboradores/${colaboradorId}`);
}

function extensionDe(nombreArchivo: string): string {
  const partes = nombreArchivo.split('.');
  return partes.length > 1 ? partes[partes.length - 1]!.toLowerCase() : 'pdf';
}

/** Sube (o reemplaza) la hoja de vida de un colaborador — admin_th. */
export async function subirHojaVida(formData: FormData) {
  const colaboradorId = formData.get('colaboradorId') as string;
  const perfil = await esAdminThDeEsteColaborador(colaboradorId);
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const file = formData.get('archivo') as File;
  if (!file || file.size === 0) return { ok: false as const, error: 'Selecciona un archivo' };

  const supabase = createClient();
  const path = `${perfil.empresa_id}/${colaboradorId}/hoja-vida/hoja-vida-${Date.now()}.${extensionDe(file.name)}`;

  const { error: uploadError } = await supabase.storage
    .from('documentos-colaborador')
    .upload(path, file, { contentType: file.type || 'application/pdf', upsert: true });
  if (uploadError) return { ok: false as const, error: `Error subiendo el archivo: ${uploadError.message}` };

  const { error: dbError } = await supabase.from('colaboradores').update({ hoja_vida_url: path }).eq('id', colaboradorId);
  if (dbError) return { ok: false as const, error: dbError.message };

  revalidar(colaboradorId);
  return { ok: true as const };
}

/**
 * Guarda (o reemplaza) el contrato de un colaborador: el archivo es
 * opcional al editar (si no se sube uno nuevo, se conserva el actual), el
 * salario se actualiza siempre que se envíe. El salario del contrato es la
 * fuente que usa el certificado laboral.
 */
export async function guardarContrato(formData: FormData) {
  const colaboradorId = formData.get('colaboradorId') as string;
  const perfil = await esAdminThDeEsteColaborador(colaboradorId);
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const salarioRaw = formData.get('salario') as string;
  const salario = salarioRaw ? Number(salarioRaw) : null;
  if (salarioRaw && (!Number.isFinite(salario) || (salario as number) < 0)) {
    return { ok: false as const, error: 'El salario debe ser un número válido' };
  }

  const supabase = createClient();
  const camposActualizar: ColaboradorUpdate = { salario };

  const file = formData.get('archivo') as File | null;
  if (file && file.size > 0) {
    const path = `${perfil.empresa_id}/${colaboradorId}/contrato/contrato-${Date.now()}.${extensionDe(file.name)}`;
    const { error: uploadError } = await supabase.storage
      .from('documentos-colaborador')
      .upload(path, file, { contentType: file.type || 'application/pdf', upsert: true });
    if (uploadError) return { ok: false as const, error: `Error subiendo el archivo: ${uploadError.message}` };
    camposActualizar.contrato_url = path;
  }

  const { error: dbError } = await supabase.from('colaboradores').update(camposActualizar).eq('id', colaboradorId);
  if (dbError) return { ok: false as const, error: dbError.message };

  revalidar(colaboradorId);
  return { ok: true as const };
}

/** Guarda las afiliaciones a EPS/ARL/AFP/caja de compensación (admin_th). */
export async function guardarAfiliaciones(input: {
  colaboradorId: string;
  eps?: string;
  arl?: string;
  afp?: string;
  cajaCompensacion?: string;
}) {
  const perfil = await esAdminThDeEsteColaborador(input.colaboradorId);
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const supabase = createClient();
  const { error } = await supabase
    .from('colaboradores')
    .update({
      eps: input.eps?.trim() || null,
      arl: input.arl?.trim() || null,
      afp: input.afp?.trim() || null,
      caja_compensacion: input.cajaCompensacion?.trim() || null,
    })
    .eq('id', input.colaboradorId);

  if (error) return { ok: false as const, error: error.message };

  revalidar(input.colaboradorId);
  return { ok: true as const };
}
