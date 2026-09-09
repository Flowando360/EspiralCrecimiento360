'use server';

import { createClient } from '@/lib/supabase/server';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import type { HojaVidaFormacion } from '@/types/colaborador';

const TIPOS = ['academica', 'certificacion', 'curso', 'experiencia_laboral'] as const;

/**
 * Solo admin_th puede escribir en hoja_vida_formacion (misma regla que ya
 * aplica RLS: "hoja_vida: admin_th todo" es la única policy de insert/
 * update/delete; líder y colaborador solo tienen select).
 */
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
  revalidatePath(`/espiral-crecimiento/colaboradores/${colaboradorId}/hoja-vida`);
  revalidatePath(`/espiral-crecimiento/colaboradores/${colaboradorId}`);
  revalidatePath('/informes/sst');
}

const CamposSchema = z.object({
  colaboradorId: z.string().uuid(),
  tipo: z.enum(TIPOS),
  titulo: z.string().trim().min(1, 'El título es requerido'),
  institucion: z.string().trim().optional(),
  fechaInicio: z.string().optional(),
  fechaFin: z.string().optional(),
  fechaVencimiento: z.string().optional(),
  documentoUrl: z.string().trim().optional(),
});

export async function agregarEntradaHojaVida(input: z.infer<typeof CamposSchema>) {
  const parsed = CamposSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };

  const perfil = await esAdminThDeEsteColaborador(parsed.data.colaboradorId);
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const supabase = createClient();
  const { data, error } = await supabase
    .from('hoja_vida_formacion')
    .insert({
      colaborador_id: parsed.data.colaboradorId,
      tipo: parsed.data.tipo,
      titulo: parsed.data.titulo,
      institucion: parsed.data.institucion || null,
      fecha_inicio: parsed.data.fechaInicio || null,
      fecha_fin: parsed.data.fechaFin || null,
      fecha_vencimiento: parsed.data.fechaVencimiento || null,
      documento_url: parsed.data.documentoUrl || null,
    })
    .select('*')
    .single();

  if (error) return { ok: false as const, error: error.message };

  revalidar(parsed.data.colaboradorId);
  return { ok: true as const, item: data as unknown as HojaVidaFormacion };
}

const VerificarSchema = z.object({
  id: z.string().uuid(),
  colaboradorId: z.string().uuid(),
  verificado: z.boolean(),
});

export async function marcarVerificadoHojaVida(input: z.infer<typeof VerificarSchema>) {
  const parsed = VerificarSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: 'Datos inválidos' };

  const perfil = await esAdminThDeEsteColaborador(parsed.data.colaboradorId);
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const supabase = createClient();
  const { error } = await supabase
    .from('hoja_vida_formacion')
    .update({
      verificado: parsed.data.verificado,
      verificado_por: parsed.data.verificado ? perfil.usuario_id : null,
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

export async function eliminarEntradaHojaVida(input: z.infer<typeof EliminarSchema>) {
  const parsed = EliminarSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: 'Datos inválidos' };

  const perfil = await esAdminThDeEsteColaborador(parsed.data.colaboradorId);
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const supabase = createClient();
  const { error } = await supabase
    .from('hoja_vida_formacion')
    .delete()
    .eq('id', parsed.data.id)
    .eq('colaborador_id', parsed.data.colaboradorId);

  if (error) return { ok: false as const, error: error.message };

  revalidar(parsed.data.colaboradorId);
  return { ok: true as const };
}
