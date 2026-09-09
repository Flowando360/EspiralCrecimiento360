'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';

const CrearMasivoSchema = z.object({
  colaboradorIds: z.array(z.string().uuid()).min(1, 'Selecciona al menos una persona.').max(300),
});

export interface LinkGenerado {
  colaboradorId: string;
  nombre: string;
  link: string;
}

export interface EstadoInvitacionesMasivas {
  ok: boolean;
  error?: string;
  links?: LinkGenerado[];
}

/**
 * Genera, de una sola vez, una invitación nueva a la Guía del Flow (misma
 * tabla que ya usa la invitación individual de la ficha de un colaborador,
 * ver guia-flow/actions.ts → crearInvitacionGuiaFlow) para cada colaborador
 * seleccionado de la empresa activa del admin. Cada invitación queda ligada
 * a un colaborador_id exacto, así que no depende de que la persona escriba
 * bien su correo al registrarse en guiadelflow.
 */
export async function crearInvitacionesMasivas(
  input: z.infer<typeof CrearMasivoSchema>
): Promise<EstadoInvitacionesMasivas> {
  const parsed = CrearMasivoSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' };
  }

  const perfil = await getPerfilActual();
  if (!perfil || perfil.rol !== 'admin_th') {
    return { ok: false, error: 'No autorizado.' };
  }

  const supabase = createClient();

  // No confiar en los ids que llegan del formulario: solo se generan
  // invitaciones para colaboradores que de verdad son de la empresa activa
  // de quien hace la petición (mismo criterio que la policy de insert de
  // guia_del_flow_invitaciones).
  const { data: colaboradores, error: errorColaboradores } = await supabase
    .from('colaboradores')
    .select('id, nombre_completo')
    .in('id', parsed.data.colaboradorIds)
    .eq('empresa_id', perfil.empresa_id);

  if (errorColaboradores) return { ok: false, error: errorColaboradores.message };
  if (!colaboradores || colaboradores.length === 0) {
    return { ok: false, error: 'No se encontró a ninguna de las personas seleccionadas en tu empresa.' };
  }

  const { data: invitaciones, error: errorInvitaciones } = await supabase
    .from('guia_del_flow_invitaciones')
    .insert(
      colaboradores.map((c) => ({ colaborador_id: c.id, creado_por: perfil.usuario_id }))
    )
    .select('token, colaborador_id');

  if (errorInvitaciones || !invitaciones) {
    return { ok: false, error: errorInvitaciones?.message ?? 'No se pudieron crear las invitaciones.' };
  }

  const nombrePorId = new Map(colaboradores.map((c) => [c.id, c.nombre_completo]));
  const baseUrl = process.env.GUIADELFLOW_URL ?? 'https://guia-del-flow.vercel.app';

  const links: LinkGenerado[] = invitaciones
    .map((inv) => ({
      colaboradorId: inv.colaborador_id as string,
      nombre: nombrePorId.get(inv.colaborador_id as string) ?? '—',
      link: `${baseUrl}/registro?invitacion=${inv.token}`,
    }))
    // Orden alfabético por nombre para que sea fácil de escanear al copiar.
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));

  revalidatePath('/administracion/guias-flow/invitaciones');
  revalidatePath('/administracion/guias-flow/seguimiento');

  return { ok: true, links };
}
