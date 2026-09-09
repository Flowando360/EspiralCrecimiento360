'use server';

import { createClient } from '@/lib/supabase/server';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

/** admin_th de la empresa, o el líder directo de este colaborador. */
async function puedeAdministrarFechasDe(colaboradorId: string) {
  const perfil = await getPerfilActual();
  if (!perfil || (perfil.rol !== 'admin_th' && perfil.rol !== 'lider')) return null;

  const supabase = createClient();
  const { data: colaborador } = await supabase
    .from('colaboradores')
    .select('id, empresa_id, lider_id')
    .eq('id', colaboradorId)
    .maybeSingle();

  if (!colaborador || colaborador.empresa_id !== perfil.empresa_id) return null;
  if (perfil.rol === 'lider' && colaborador.lider_id !== perfil.colaborador_id) return null;
  return perfil;
}

function revalidar(colaboradorId: string) {
  revalidatePath(`/espiral-crecimiento/colaboradores/${colaboradorId}/fechas-especiales`);
}

const FechaEspecialSchema = z.object({
  colaboradorId: z.string().uuid(),
  descripcion: z.string().trim().min(1, 'Cuéntanos qué se celebra').max(120, 'Máximo 120 caracteres'),
  fecha: z.string().min(1, 'La fecha es requerida'),
});

/** Talento Humano o el líder directo registran una fecha especial de un colaborador. */
export async function agregarFechaEspecial(input: z.infer<typeof FechaEspecialSchema>) {
  const parsed = FechaEspecialSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };

  const perfil = await puedeAdministrarFechasDe(parsed.data.colaboradorId);
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const supabase = createClient();
  const { data, error } = await supabase
    .from('fechas_especiales_colaborador')
    .insert({
      colaborador_id: parsed.data.colaboradorId,
      descripcion: parsed.data.descripcion,
      fecha: parsed.data.fecha,
      creado_por: perfil.usuario_id,
    })
    .select('id, descripcion, fecha')
    .single();

  if (error) return { ok: false as const, error: error.message };
  revalidar(parsed.data.colaboradorId);
  return { ok: true as const, fechaEspecial: data };
}

const EliminarSchema = z.object({
  colaboradorId: z.string().uuid(),
  id: z.string().uuid(),
});

export async function eliminarFechaEspecial(input: z.infer<typeof EliminarSchema>) {
  const parsed = EliminarSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: 'Datos inválidos' };

  const perfil = await puedeAdministrarFechasDe(parsed.data.colaboradorId);
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const supabase = createClient();
  const { error } = await supabase
    .from('fechas_especiales_colaborador')
    .delete()
    .eq('id', parsed.data.id)
    .eq('colaborador_id', parsed.data.colaboradorId);

  if (error) return { ok: false as const, error: error.message };
  revalidar(parsed.data.colaboradorId);
  return { ok: true as const };
}
