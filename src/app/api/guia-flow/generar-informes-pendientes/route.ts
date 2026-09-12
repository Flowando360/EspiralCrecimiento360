import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { generarInformesParaGuia } from '@/lib/guia-flow/generar-informes';

/**
 * Job programado (Vercel Cron) que es la RED DE SEGURIDAD de la generación
 * automática de informes de Ser: busca aplicaciones de la Guía del Flow que
 * ya tienen al menos un puntaje cargado (sincronizado automáticamente desde
 * guiadelflow, o cargado a mano) pero todavía no tienen `informe_lider`
 * generado, y los genera.
 *
 * La vía rápida es /api/guia-flow/generar-informes, que guiadelflow dispara
 * apenas termina de sincronizar — pero si esa llamada nunca llega (falla de
 * red, guiadelflow no la dispara todavía, o la persona se cargó a mano sin
 * invitación, como pasó con las 11 guías de la carga inicial), este cron
 * termina generando el informe de todas formas, sin que nadie tenga que
 * acordarse de dar clic en "Generar informes con IA".
 *
 * Configurado en vercel.json, una vez al día (el plan Hobby de Vercel no
 * permite crons más frecuentes que eso — si se pasa a Pro, vale la pena
 * subir la frecuencia para que el retraso máximo no sea de casi 24h).
 * Protegido con CRON_SECRET (mismo patrón que api/alertas/check) para que
 * no cualquiera pueda invocarlo.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const admin = createAdminClient();

  // Solo la aplicación más reciente de cada colaborador (mismo criterio que
  // v_ser_promedio): si alguien respondió más de una vez, no vale la pena
  // gastar la llamada a Claude en una aplicación vieja que ya quedó tapada.
  const { data: masRecientePorColaborador } = await admin
    .from('guia_del_flow')
    .select('id, colaborador_id, fecha_aplicacion, created_at')
    .order('colaborador_id')
    .order('fecha_aplicacion', { ascending: false })
    .order('created_at', { ascending: false });

  const idsMasRecientes = new Set<string>();
  const vistos = new Set<string>();
  for (const fila of masRecientePorColaborador ?? []) {
    if (vistos.has(fila.colaborador_id)) continue;
    vistos.add(fila.colaborador_id);
    idsMasRecientes.add(fila.id);
  }

  // De esas, las que ya tienen puntajes cargados pero no informe_lider.
  const { data: pendientesRaw } = await admin
    .from('guia_del_flow')
    .select('id, informe_lider, ser_puntajes(id)')
    .is('informe_lider', null)
    .in('id', Array.from(idsMasRecientes));

  const pendientes = (pendientesRaw ?? []).filter((g) => (g.ser_puntajes as unknown as { id: string }[])?.length > 0);

  // Tope por corrida para no pegarse con el límite de duración de la
  // función ni con los rate limits de la API de Anthropic — el resto queda
  // para la próxima corrida del cron.
  const LOTE_MAXIMO = 15;
  const porProcesar = pendientes.slice(0, LOTE_MAXIMO);

  const resultados: { guiaDelFlowId: string; ok: boolean; error?: string }[] = [];
  for (const guia of porProcesar) {
    const resultado = await generarInformesParaGuia(admin, guia.id);
    resultados.push(resultado.ok ? { guiaDelFlowId: guia.id, ok: true } : { guiaDelFlowId: guia.id, ok: false, error: resultado.error });
  }

  return NextResponse.json({
    ok: true,
    encontrados: pendientes.length,
    procesados: resultados.length,
    pendientesParaLaProximaCorrida: Math.max(0, pendientes.length - resultados.length),
    resultados,
  });
}
