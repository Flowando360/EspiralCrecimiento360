'use server';

import { createAdminClient, createClient } from '@/lib/supabase/server';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { revalidatePath } from 'next/cache';
import { asignarItemsInduccion } from '@/lib/induccion/asignar';

async function puedeEditarInduccion(colaboradorId: string) {
  const perfil = await getPerfilActual();
  if (!perfil) return null;

  const supabase = createClient();
  const { data: colaborador } = await supabase
    .from('colaboradores')
    .select('id, empresa_id, lider_id')
    .eq('id', colaboradorId)
    .maybeSingle();

  if (!colaborador || colaborador.empresa_id !== perfil.empresa_id) return null;

  const autorizado =
    perfil.rol === 'admin_th' || (perfil.rol === 'lider' && colaborador.lider_id === perfil.colaborador_id);
  if (!autorizado) return null;

  return perfil;
}

/**
 * Asigna a una persona ya existente los puntos de inducción que le aplican (los comunes de la empresa y los de su cargo),
 * sin duplicar los que ya tenga. Sirve para quien se importó o se migró y nunca recibió su plan. Solo Talento Humano.
 */
export async function asignarInduccionDelCargo(colaboradorId: string) {
  const perfil = await getPerfilActual();
  if (!perfil || perfil.rol !== 'admin_th') return { ok: false as const, error: 'Solo Talento Humano puede asignar la inducción' };

  const supabase = createClient();
  const { data: colaborador } = await supabase.from('colaboradores').select('id, empresa_id, cargo_id').eq('id', colaboradorId).maybeSingle();
  if (!colaborador || colaborador.empresa_id !== perfil.empresa_id) return { ok: false as const, error: 'No se encontró a la persona' };
  if (!colaborador.cargo_id) return { ok: false as const, error: 'La persona no tiene cargo asignado: asígnalo en Editar' };

  try {
    const nuevos = await asignarItemsInduccion(supabase, colaboradorId, perfil.empresa_id, colaborador.cargo_id, true);
    revalidatePath(`/espiral-crecimiento/colaboradores/${colaboradorId}/induccion`);
    revalidatePath(`/espiral-crecimiento/colaboradores/${colaboradorId}`);
    return { ok: true as const, nuevos };
  } catch (e) {
    return { ok: false as const, error: (e as Error).message };
  }
}

/** Marca (o desmarca) un punto de inducción como cumplido — admin_th o líder directo. */
export async function marcarItemInduccion(colaboradorId: string, itemAsignadoId: string, completado: boolean) {
  const perfil = await puedeEditarInduccion(colaboradorId);
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const supabase = createClient();
  const { error } = await supabase
    .from('colaborador_induccion_items')
    .update({
      completado,
      completado_en: completado ? new Date().toISOString() : null,
      completado_por: completado ? perfil.usuario_id : null,
    })
    .eq('id', itemAsignadoId);

  if (error) return { ok: false as const, error: error.message };
  revalidatePath(`/espiral-crecimiento/colaboradores/${colaboradorId}/induccion`);
  revalidatePath(`/espiral-crecimiento/colaboradores/${colaboradorId}`);
  return { ok: true as const };
}

/** Categorías que confirma la propia persona (TH y el líder supervisan y aprueban). */
const CATEGORIAS_AUTODILIGENCIADAS = ['proposito_organizacional', 'funciones', 'riesgos_sst'];

/**
 * La propia persona confirma que conoce un punto (propósito, funciones o riesgos SST). Si el punto tiene pregunta de
 * comprensión, solo se confirma al acertar; la respuesta correcta se compara en el servidor y nunca se le envía.
 */
export async function confirmarItemInduccion(colaboradorId: string, itemAsignadoId: string, respuesta?: number) {
  const perfil = await getPerfilActual();
  if (!perfil || perfil.colaborador_id !== colaboradorId) return { ok: false as const, error: 'Solo la propia persona puede confirmar este punto' };

  const admin = createAdminClient();
  const { data: fila } = await admin
    .from('colaborador_induccion_items')
    .select('id, colaborador_id, confirmado_colaborador_en, intentos_quiz, item:item_id(id, empresa_id, categoria, pregunta, opciones, curso_id)')
    .eq('id', itemAsignadoId)
    .maybeSingle();
  const item = (fila as any)?.item;
  if (!fila || fila.colaborador_id !== colaboradorId || !item || item.empresa_id !== perfil.empresa_id) return { ok: false as const, error: 'Punto no encontrado' };
  if (!CATEGORIAS_AUTODILIGENCIADAS.includes(item.categoria)) return { ok: false as const, error: 'Este punto lo registra Talento Humano' };
  if (fila.confirmado_colaborador_en) return { ok: true as const };
  if (item.curso_id) return { ok: false as const, error: 'Este punto se confirma al completar su curso en Formación.' };

  if (item.pregunta) {
    if (typeof respuesta !== 'number') return { ok: false as const, error: 'Elige una respuesta' };
    const { data: clave } = await (admin as any).from('induccion_item_clave').select('correcta').eq('item_id', item.id).maybeSingle();
    if (clave && clave.correcta !== respuesta) {
      await admin
        .from('colaborador_induccion_items')
        .update({ intentos_quiz: ((fila as any).intentos_quiz ?? 0) + 1 })
        .eq('id', itemAsignadoId);
      return { ok: false as const, error: 'Esa no es la respuesta. Relee el punto e inténtalo de nuevo.' };
    }
  }

  const { error } = await admin
    .from('colaborador_induccion_items')
    .update({ confirmado_colaborador_en: new Date().toISOString() })
    .eq('id', itemAsignadoId);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath(`/espiral-crecimiento/colaboradores/${colaboradorId}/induccion`);
  return { ok: true as const };
}
