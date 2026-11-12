'use server';

import { createClient } from '@/lib/supabase/server';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { cargarDatosPerfilIntegral } from '@/lib/perfil-integral/cargar';
import { mejorarPerfilConIA } from '@/lib/perfil-integral/ia';
import type { CamposPerfilIntegral } from '@/lib/perfil-integral/borrador';

const campo = z.string().trim().max(4000);
const GuardarSchema = z.object({
  evaluacionId: z.string().uuid(),
  hipotesis_ser: campo,
  lectura_saber: campo,
  lectura_hacer: campo,
  lectura_deber: campo,
  interpretacion: campo,
  acciones: campo,
  fuente: z.enum(['automatico', 'ia', 'manual']),
});

/** Guarda el perfil integral que Talento Humano o el líder directo revisaron y validaron. */
export async function guardarPerfilIntegral(input: z.infer<typeof GuardarSchema>) {
  const p = GuardarSchema.safeParse(input);
  if (!p.success) return { ok: false as const, error: 'Datos inválidos' };
  const perfil = await getPerfilActual();
  if (!perfil) return { ok: false as const, error: 'No autorizado' };
  const datos = await cargarDatosPerfilIntegral(perfil, p.data.evaluacionId);
  if (!datos) return { ok: false as const, error: 'No autorizado' };

  const supabase = createClient();
  const { evaluacionId, ...campos } = p.data;
  const { error } = await supabase.from('perfiles_integrales').upsert(
    {
      empresa_id: perfil.empresa_id,
      evaluacion_id: evaluacionId,
      colaborador_id: datos.colaboradorId,
      ...campos,
      actualizado_por_nombre: perfil.nombre_completo,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'evaluacion_id' }
  );
  if (error) return { ok: false as const, error: error.message };
  revalidatePath(`/espiral-crecimiento/evaluaciones/${evaluacionId}/perfil-integral`);
  return { ok: true as const };
}

/** Propone un borrador nuevo (automático o mejorado con IA). No guarda: quien revisa decide. */
export async function proponerPerfilIntegral(input: { evaluacionId: string; modo: 'automatico' | 'ia' }) {
  const id = z.string().uuid().safeParse(input.evaluacionId);
  if (!id.success) return { ok: false as const, error: 'Datos inválidos' };
  const perfil = await getPerfilActual();
  if (!perfil) return { ok: false as const, error: 'No autorizado' };
  const datos = await cargarDatosPerfilIntegral(perfil, id.data);
  if (!datos) return { ok: false as const, error: 'No autorizado' };

  if (input.modo === 'ia') {
    const mejorado = await mejorarPerfilConIA(datos.ctx, datos.borrador);
    if (mejorado) return { ok: true as const, campos: mejorado as CamposPerfilIntegral, fuente: 'ia' as const };
    return { ok: true as const, campos: datos.borrador, fuente: 'automatico' as const, aviso: 'No se pudo usar la IA en este momento; se dejó el borrador automático.' };
  }
  return { ok: true as const, campos: datos.borrador, fuente: 'automatico' as const };
}
