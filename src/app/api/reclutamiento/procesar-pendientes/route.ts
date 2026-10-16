import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { procesarPendientes } from '@/lib/reclutamiento/procesar-hoja-vida';

/**
 * Red de seguridad de la extracción de hojas de vida: procesa un lote de trabajos
 * pendientes (los que nadie disparó desde la ficha ni desde el panel) y reintenta
 * los que fallaron mientras les queden intentos.
 *
 * Protegido con CRON_SECRET, mismo patrón que api/guia-flow/generar-informes-pendientes.
 * La respuesta solo trae identificadores y estados, nunca texto de las hojas de vida.
 */
export const maxDuration = 300;

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const resultados = await procesarPendientes(createAdminClient(), 5);
  return NextResponse.json({
    procesados: resultados.length,
    resultados: resultados.map(({ jobId, estado }) => ({ jobId, estado })),
  });
}
