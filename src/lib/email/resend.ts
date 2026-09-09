import { Resend } from 'resend';

/**
 * Envía un correo real vía Resend. Si RESEND_API_KEY no está configurada
 * (fase 1 sin cuenta creada todavía — ver Claves.txt), no falla: deja la
 * notificación como "no enviada" para que se reintente sola cuando se
 * configure la clave, en vez de romper el cron completo.
 */
export async function enviarEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.NOTIFICACIONES_EMAIL_FROM || 'Espiral de Crecimiento <notificaciones@flowando.com>';

  if (!apiKey) {
    return { ok: false as const, motivo: 'RESEND_API_KEY no configurada' };
  }

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({ from, to, subject, html });
    if (error) return { ok: false as const, motivo: error.message };
    return { ok: true as const };
  } catch (e: any) {
    return { ok: false as const, motivo: e?.message ?? 'Error desconocido enviando el correo' };
  }
}
