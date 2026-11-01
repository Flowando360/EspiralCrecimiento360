'use server';

import { createClient } from '@/lib/supabase/server';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { revalidatePath } from 'next/cache';

const RUTA = '/espiral-crecimiento/pdi';
const ESTADOS_PDI = ['pendiente', 'en_curso', 'cumplido', 'vencido'] as const;
type EstadoPdi = (typeof ESTADOS_PDI)[number];

export async function actualizarEstadoPdi(id: string, estado: EstadoPdi) {
  const perfil = await getPerfilActual();
  if (!perfil) return { ok: false as const, error: 'No autorizado' };
  if (!ESTADOS_PDI.includes(estado)) return { ok: false as const, error: 'Estado inválido' };

  const supabase = createClient();
  const { error } = await supabase
    .from('planes_desarrollo')
    .update({
      estado,
      fecha_cumplimiento: estado === 'cumplido' ? new Date().toISOString().slice(0, 10) : null,
    })
    .eq('id', id);

  if (error) return { ok: false as const, error: error.message };
  revalidatePath(RUTA);
  return { ok: true as const };
}

const ORIGENES = ['hacer', 'deber', 'saber', 'ser', 'mixto'] as const;

/**
 * Crea a mano una acción del Plan de Desarrollo Individual. TH la crea para
 * cualquier colaborador de su empresa; un líder, solo para su equipo directo.
 * Complementa el motor automático, que solo actúa con semáforo "bajo".
 */
export async function crearAccionPdi(input: {
  colaboradorId: string;
  cicloId?: string | null;
  origen: (typeof ORIGENES)[number];
  brechaDetectada: string;
  accion: string;
  fechaCompromiso?: string;
}) {
  const perfil = await getPerfilActual();
  if (!perfil) return { ok: false as const, error: 'No autorizado' };
  if (!ORIGENES.includes(input.origen)) return { ok: false as const, error: 'Origen inválido' };
  const brecha = input.brechaDetectada?.trim();
  const accion = input.accion?.trim();
  if (!brecha) return { ok: false as const, error: 'Describe la brecha que originó la acción' };
  if (!accion) return { ok: false as const, error: 'Describe la acción a realizar' };

  const supabase = createClient();
  const { data: col } = await supabase
    .from('colaboradores')
    .select('id, empresa_id, lider_id')
    .eq('id', input.colaboradorId)
    .maybeSingle();
  if (!col || col.empresa_id !== perfil.empresa_id) return { ok: false as const, error: 'Colaborador no encontrado' };

  const autorizado =
    perfil.rol === 'admin_th' || (perfil.rol === 'lider' && col.lider_id === perfil.colaborador_id);
  if (!autorizado) return { ok: false as const, error: 'No autorizado' };

  const { error } = await supabase.from('planes_desarrollo').insert({
    colaborador_id: input.colaboradorId,
    ciclo_origen_id: input.cicloId || null,
    origen: input.origen,
    brecha_detectada: brecha,
    accion,
    fecha_compromiso: input.fechaCompromiso || null,
    estado: 'pendiente',
    generado_automaticamente: false,
    responsable_id: perfil.colaborador_id ?? null,
  });
  if (error) return { ok: false as const, error: error.message };

  revalidatePath(RUTA);
  revalidatePath('/espiral-crecimiento/ciclos');
  revalidatePath(`/espiral-crecimiento/colaboradores/${input.colaboradorId}`);
  return { ok: true as const };
}
