import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { generarInformesParaGuia } from '@/lib/guia-flow/generar-informes';

/**
 * Endpoint para que guiadelflow (otra app de Vercel, mismo proyecto de
 * Supabase) dispare la generación de los informes de Ser apenas termina de
 * sincronizar los puntajes de una Guía del Flow recién diligenciada —
 * contraparte, en sentido inverso, de /api/panel/regenerar-externo que
 * guiadelflow ya expone para Espiral de Crecimiento (ver
 * administracion/guias-flow/seguimiento/actions.ts). Protegido con el mismo
 * secreto compartido (GUIA_FLOW_PANEL_SECRET, configurado en las dos apps)
 * porque quien llama no tiene ninguna cuenta de Espiral de Crecimiento.
 *
 * Si esta llamada nunca llega (guiadelflow no la dispara, falla la red, la
 * persona se cargó a mano sin invitación, etc.), el cron de respaldo
 * (/api/guia-flow/generar-informes-pendientes) termina generando el informe
 * de todas formas, con un retraso de hasta su intervalo — este endpoint es
 * la vía rápida, no la única.
 */
export async function POST(req: NextRequest) {
  const secretoEsperado = process.env.GUIA_FLOW_PANEL_SECRET;
  if (!secretoEsperado) {
    return NextResponse.json({ ok: false, error: 'Falta configurar GUIA_FLOW_PANEL_SECRET en esta app.' }, { status: 500 });
  }

  const secretoRecibido = req.headers.get('x-panel-secret');
  if (secretoRecibido !== secretoEsperado) {
    return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const guiaDelFlowId = body?.guiaDelFlowId;
  if (!guiaDelFlowId || typeof guiaDelFlowId !== 'string') {
    return NextResponse.json({ ok: false, error: 'Falta guiaDelFlowId' }, { status: 400 });
  }

  const admin = createAdminClient();
  const resultado = await generarInformesParaGuia(admin, guiaDelFlowId);

  if (!resultado.ok) {
    return NextResponse.json({ ok: false, error: resultado.error }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
