'use server';

import { z } from 'zod';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { createAdminClient } from '@/lib/supabase/server';
import { enviarEmail } from '@/lib/email/resend';

/** Correo que recibe todos los requerimientos del Centro de Ayuda. */
const CORREO_REQUERIMIENTOS = process.env.REQUERIMIENTOS_EMAIL || 'innovacion@flowando.com';

const RequerimientoSchema = z.object({
  quePasa: z.string().trim().min(10, 'Cuéntanos qué pasa (mínimo 10 caracteres)').max(2000),
  quePesperaba: z.string().trim().min(10, 'Cuéntanos qué esperabas que pasara (mínimo 10 caracteres)').max(2000),
  solucion: z.string().trim().min(10, 'Cuéntanos cómo imaginas la solución (mínimo 10 caracteres)').max(2000),
  pagina: z.string().trim().max(300).optional(),
});

function escapar(texto: string): string {
  return texto.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br/>');
}

/**
 * Guarda el requerimiento y, si el correo está configurado, lo envía a
 * CORREO_REQUERIMIENTOS. El requerimiento se guarda aunque el correo falle.
 */
export async function enviarRequerimiento(input: {
  quePasa: string;
  quePesperaba: string;
  solucion: string;
  pagina?: string;
}) {
  const perfil = await getPerfilActual();
  if (!perfil) return { ok: false as const, error: 'Tu sesión venció. Vuelve a entrar.' };

  const parsed = RequerimientoSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  const datos = parsed.data;

  const admin = createAdminClient();
  const { data: empresa } = await admin.from('empresas').select('nombre').eq('id', perfil.empresa_id).maybeSingle();
  const nombreEmpresa = empresa?.nombre ?? 'Empresa desconocida';

  const { data: fila, error } = await admin
    .from('requerimientos')
    .insert({
      empresa_id: perfil.empresa_id,
      usuario_id: perfil.usuario_id,
      nombre_usuario: perfil.nombre_completo,
      correo_usuario: perfil.email,
      pagina: datos.pagina || null,
      que_pasa: datos.quePasa,
      que_esperaba: datos.quePesperaba,
      solucion_imaginada: datos.solucion,
    })
    .select('id')
    .single();

  if (error || !fila) return { ok: false as const, error: 'No se pudo guardar el requerimiento. Intenta de nuevo.' };

  const html = `
    <h2>Nuevo requerimiento de Espiral de Crecimiento 360°</h2>
    <p><strong>Empresa:</strong> ${escapar(nombreEmpresa)}<br/>
    <strong>Quién escribe:</strong> ${escapar(perfil.nombre_completo)} (${escapar(perfil.email)})<br/>
    <strong>Pantalla:</strong> ${escapar(datos.pagina || 'No indicada')}</p>
    <h3>¿Qué pasa?</h3><p>${escapar(datos.quePasa)}</p>
    <h3>¿Qué esperabas que pasara?</h3><p>${escapar(datos.quePesperaba)}</p>
    <h3>¿Cómo imaginas la solución?</h3><p>${escapar(datos.solucion)}</p>
    <p style="color:#666;font-size:12px">Id del requerimiento: ${fila.id}</p>`;

  const envio = await enviarEmail({
    to: CORREO_REQUERIMIENTOS,
    subject: `Requerimiento · ${nombreEmpresa} · ${perfil.nombre_completo}`,
    html,
  });

  if (envio.ok) await admin.from('requerimientos').update({ correo_enviado: true }).eq('id', fila.id);

  return { ok: true as const, correoEnviado: envio.ok };
}
