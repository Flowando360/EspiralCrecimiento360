import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { asignarFormacionPorAlerta } from '@/lib/nexa/asignar-formacion-por-alerta';
import { enviarEmail } from '@/lib/email/resend';

/**
 * Job programado (Vercel Cron o llamado manualmente) que:
 *  1. Marca como "vencida" cualquier alerta cuya fecha_objetivo ya pasó y
 *     sigue en estado pendiente/notificada sin resolver.
 *  2. Encola notificaciones (email) para las alertas dentro de su ventana
 *     de dias_anticipacion que aún no se han notificado.
 *
 * Configurar en vercel.json:
 *   { "crons": [{ "path": "/api/alertas/check", "schedule": "0 8 * * *" }] }
 *
 * Protegido con CRON_SECRET para que no cualquiera pueda invocarlo.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const supabase = createAdminClient();
  const hoy = new Date().toISOString().slice(0, 10);

  // 1. Vencer alertas pasadas
  const { data: vencidas } = await supabase
    .from('alertas')
    .update({ estado: 'vencida' })
    .lt('fecha_objetivo', hoy)
    .in('estado', ['pendiente', 'notificada'])
    .select('id');

  // 2. Detectar alertas dentro de su ventana de anticipación, aún no notificadas
  const { data: proximas } = await supabase
    .from('v_alertas_proximas')
    .select('id, colaborador_id, titulo, tipo, fecha_objetivo')
    .eq('estado', 'pendiente');

  let notificacionesCreadas = 0;
  let correosEnviados = 0;
  let cursosAsignados = 0;
  for (const alerta of proximas ?? []) {
    if (!alerta.id || !alerta.colaborador_id) continue;

    const { data: colaborador } = await supabase
      .from('colaboradores')
      .select('usuario_id, usuario:usuario_id(email)')
      .eq('id', alerta.colaborador_id)
      .maybeSingle();

    if (colaborador?.usuario_id) {
      const asunto = `Recordatorio: ${alerta.titulo}`;
      const cuerpo = `Tienes una fecha próxima (${alerta.fecha_objetivo}): ${alerta.titulo}.`;
      const emailDestino = (colaborador.usuario as any)?.email as string | undefined;

      const envio = emailDestino
        ? await enviarEmail({
            to: emailDestino,
            subject: asunto,
            html: `<p>${cuerpo}</p><p style="color:#6b7280;font-size:12px">Espiral de Crecimiento — Flow, Nexus y Visión</p>`,
          })
        : { ok: false as const, motivo: 'sin correo registrado' };

      await supabase.from('notificaciones').insert({
        destinatario_usuario_id: colaborador.usuario_id,
        alerta_id: alerta.id,
        canal: 'email',
        asunto,
        cuerpo,
        enviado: envio.ok,
        enviado_en: envio.ok ? new Date().toISOString() : null,
      });
      notificacionesCreadas++;
      if (envio.ok) correosEnviados++;
    }

    await supabase.from('alertas').update({ estado: 'notificada' }).eq('id', alerta.id);

    // Puente automático Círculo → Nexa: si la alerta es de un tipo que
    // dispara formación (SST, vencimientos), asigna de una vez los cursos
    // de esa categoría que tenga configurados el cargo de la persona.
    const resultado = await asignarFormacionPorAlerta(alerta.id);
    if (resultado.ok && resultado.accion === 'curso_asignado') {
      cursosAsignados += resultado.cursosAsignados ?? 0;
    }
  }

  return NextResponse.json({
    ok: true,
    alertas_vencidas: vencidas?.length ?? 0,
    notificaciones_creadas: notificacionesCreadas,
    correos_enviados: correosEnviados,
    cursos_asignados_automaticamente: cursosAsignados,
  });
}
