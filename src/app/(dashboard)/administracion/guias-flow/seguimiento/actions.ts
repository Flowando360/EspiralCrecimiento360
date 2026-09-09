'use server';

import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/server';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';

export interface EstadoReintentoGuiaFlow {
  ok: boolean;
  error?: string;
}

/**
 * "Reintentar" desde la pantalla de Seguimiento — para cuando alguien
 * respondió su Guía del Flow pero sus documentos nunca se generaron (o
 * quedaron en error): toda la generación depende de que la persona deje su
 * pestaña abierta un par de minutos después de responder, sin reintento
 * automático (ver guiadelflow, Fase 29/30 del historial). Antes solo se
 * podía reintentar desde /panel de guiadelflow — esto le da al líder de
 * Talento Humano de cada empresa la misma opción sin salir de acá.
 *
 * `usuarioFlowId` es el id en flow_perfiles (tabla de guiadelflow), no el
 * id del colaborador acá -- lo trae la fila de Seguimiento que ya se armó
 * en el server component de la página. Igual se revalida server-side que
 * ese usuario sea de un colaborador de la empresa activa de quien pide el
 * reintento, para que un admin_th no pueda disparar el reintento de otra
 * empresa solo adivinando o copiando un id.
 *
 * La generación real (Claude + Puppeteer + Storage) vive en el repo de
 * guiadelflow, mismo proyecto de Supabase pero otra app de Vercel -- se
 * dispara con una llamada HTTP a su endpoint interno
 * /api/panel/regenerar-externo, protegido con un secreto compartido
 * (GUIA_FLOW_PANEL_SECRET, configurado en las dos apps) en vez de sesión,
 * porque quien llama no tiene ninguna cuenta de guiadelflow.
 */
export async function reintentarDocumentosGuiaFlow(usuarioFlowId: string): Promise<EstadoReintentoGuiaFlow> {
  const perfil = await getPerfilActual();
  if (!perfil || perfil.rol !== 'admin_th') {
    return { ok: false, error: 'No autorizado.' };
  }
  if (!usuarioFlowId) {
    return { ok: false, error: 'Falta identificar a la persona.' };
  }

  const admin = createAdminClient();

  const { data: perfilFlow } = await admin
    .from('flow_perfiles')
    .select('id, colaborador_circulo_id')
    .eq('id', usuarioFlowId)
    .maybeSingle();

  if (!perfilFlow?.colaborador_circulo_id) {
    return { ok: false, error: 'No se encontró esa cuenta de Guía del Flow.' };
  }

  const { data: colaborador } = await admin
    .from('colaboradores')
    .select('id, empresa_id')
    .eq('id', perfilFlow.colaborador_circulo_id)
    .maybeSingle();

  if (!colaborador || colaborador.empresa_id !== perfil.empresa_id) {
    return { ok: false, error: 'Esa persona no pertenece a tu empresa.' };
  }

  const secreto = process.env.GUIA_FLOW_PANEL_SECRET;
  if (!secreto) {
    return { ok: false, error: 'Falta configurar GUIA_FLOW_PANEL_SECRET en esta app.' };
  }

  const baseUrl = process.env.GUIADELFLOW_URL ?? 'https://guia-del-flow.vercel.app';

  try {
    const respuesta = await fetch(`${baseUrl}/api/panel/regenerar-externo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-panel-secret': secreto },
      body: JSON.stringify({ usuarioId: usuarioFlowId }),
      cache: 'no-store',
    });
    const resultado = (await respuesta.json().catch(() => null)) as EstadoReintentoGuiaFlow | null;

    if (!respuesta.ok || !resultado?.ok) {
      return { ok: false, error: resultado?.error ?? `Guía del Flow respondió ${respuesta.status}.` };
    }

    revalidatePath('/administracion/guias-flow/seguimiento');
    return { ok: true };
  } catch {
    return { ok: false, error: 'No se pudo contactar a Guía del Flow.' };
  }
}
