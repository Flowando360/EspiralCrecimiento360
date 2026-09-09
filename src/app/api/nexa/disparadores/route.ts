import { NextRequest, NextResponse } from 'next/server';
import { asignarFormacionPorAlerta } from '@/lib/nexa/asignar-formacion-por-alerta';

/**
 * Invocación manual/externa del disparador (ver asignarFormacionPorAlerta
 * para la lógica real). El flujo automático de verdad corre dentro de
 * /api/alertas/check en cada ejecución del cron diario — este endpoint
 * queda para pruebas puntuales o una futura integración por trigger/webhook.
 */
export async function POST(req: NextRequest) {
  const { alertaId } = await req.json();
  if (!alertaId) {
    return NextResponse.json({ error: 'alertaId requerido' }, { status: 400 });
  }

  const resultado = await asignarFormacionPorAlerta(alertaId);
  return NextResponse.json(resultado, { status: resultado.ok ? 200 : 500 });
}
