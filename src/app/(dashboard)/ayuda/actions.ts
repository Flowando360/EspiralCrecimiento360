'use server';

import { z } from 'zod';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { createAdminClient } from '@/lib/supabase/server';
import { enviarEmail } from '@/lib/email/resend';

/** Correo que recibe todos los requerimientos del Centro de Ayuda. */
const CORREO_REQUERIMIENTOS = process.env.REQUERIMIENTOS_EMAIL || 'innovacion@flowando.com';

/** Límites de adjuntos. El total va por debajo de 4 MB porque Vercel limita el cuerpo de cada petición. */
const MAX_ADJUNTOS = 5;
const MAX_TAMANO_ARCHIVO = 4 * 1024 * 1024;
const MAX_TAMANO_TOTAL = 4 * 1024 * 1024;

/** Tipos permitidos: imágenes, PDF, Word, texto, hojas de cálculo y presentaciones. */
const TIPOS_PERMITIDOS: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'application/pdf': 'pdf',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'text/plain': 'txt',
  'text/csv': 'csv',
  'application/vnd.ms-excel': 'xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'application/vnd.ms-powerpoint': 'ppt',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
};

const RequerimientoSchema = z.object({
  quePasa: z.string().trim().min(10, 'Cuéntanos qué pasa (mínimo 10 caracteres)').max(2000),
  quePesperaba: z.string().trim().min(10, 'Cuéntanos qué esperabas que pasara (mínimo 10 caracteres)').max(2000),
  solucion: z.string().trim().min(10, 'Cuéntanos cómo imaginas la solución (mínimo 10 caracteres)').max(2000),
  pagina: z.string().trim().max(300).optional(),
  tipo: z.enum(['mejora', 'nueva_funcion', 'falla']),
  consulta: z.string().trim().max(300).optional(),
  respuestaMostrada: z.string().trim().max(300).optional(),
});

const ETIQUETA_TIPO: Record<'mejora' | 'nueva_funcion' | 'falla', string> = {
  mejora: 'Mejora',
  nueva_funcion: 'Requerimiento',
  falla: 'Falla',
};

function escapar(texto: string): string {
  return texto.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br/>');
}

/** Nombre seguro para guardar en el bucket: sin espacios ni caracteres raros. */
function nombreSeguro(nombre: string): string {
  return nombre.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9._-]+/g, '_').slice(0, 120) || 'archivo';
}

/**
 * Valida los archivos adjuntos: cantidad, tamaño total y tipo. Devuelve un error
 * legible para el usuario, o null si todo está bien.
 */
function validarAdjuntos(archivos: File[]): string | null {
  if (archivos.length > MAX_ADJUNTOS) return `Puedes adjuntar hasta ${MAX_ADJUNTOS} archivos.`;
  let total = 0;
  for (const f of archivos) {
    if (f.size > MAX_TAMANO_ARCHIVO) return `“${f.name}” supera 4 MB. Adjunta un archivo más pequeño.`;
    if (!TIPOS_PERMITIDOS[f.type]) return `El tipo de “${f.name}” no está permitido (usa imagen, PDF, Word, texto u hoja de cálculo).`;
    total += f.size;
  }
  if (total > MAX_TAMANO_TOTAL) return 'Los adjuntos juntos no pueden superar 4 MB.';
  return null;
}

/**
 * Guarda el requerimiento, sube sus archivos al bucket privado y envía el correo
 * con los archivos adjuntos. El requerimiento se guarda aunque el correo falle.
 */
export async function enviarRequerimiento(formData: FormData) {
  const perfil = await getPerfilActual();
  if (!perfil) return { ok: false as const, error: 'Tu sesión venció. Vuelve a entrar.' };

  const archivos = formData.getAll('archivos').filter((x): x is File => x instanceof File && x.size > 0);
  const errorAdjuntos = validarAdjuntos(archivos);
  if (errorAdjuntos) return { ok: false as const, error: errorAdjuntos };

  const parsed = RequerimientoSchema.safeParse({
    quePasa: formData.get('quePasa'),
    quePesperaba: formData.get('quePesperaba'),
    solucion: formData.get('solucion'),
    pagina: formData.get('pagina') || undefined,
    tipo: formData.get('tipo'),
    consulta: formData.get('consulta') || undefined,
    respuestaMostrada: formData.get('respuestaMostrada') || undefined,
  });
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
      tipo: datos.tipo,
      consulta: datos.consulta || null,
      respuesta_mostrada: datos.respuestaMostrada || null,
      que_pasa: datos.quePasa,
      que_esperaba: datos.quePesperaba,
      solucion_imaginada: datos.solucion,
    })
    .select('id')
    .single();

  if (error || !fila) return { ok: false as const, error: 'No se pudo guardar el requerimiento. Intenta de nuevo.' };

  // Subir adjuntos al bucket privado. Si uno falla, se informa, pero el requerimiento ya quedó guardado.
  const adjuntosGuardados: { nombre: string; ruta: string; tipo: string; tamano: number }[] = [];
  const contenidosParaCorreo: { nombre: string; contenido: Buffer }[] = [];
  const fallidos: string[] = [];

  for (const [i, archivo] of archivos.entries()) {
    const ruta = `${perfil.empresa_id}/${fila.id}/${i + 1}-${nombreSeguro(archivo.name)}`;
    const bytes = Buffer.from(await archivo.arrayBuffer());
    const { error: errorSubida } = await admin.storage.from('requerimientos').upload(ruta, bytes, {
      contentType: archivo.type,
      upsert: false,
    });
    if (errorSubida) {
      fallidos.push(archivo.name);
      continue;
    }
    adjuntosGuardados.push({ nombre: archivo.name, ruta, tipo: archivo.type, tamano: archivo.size });
    contenidosParaCorreo.push({ nombre: archivo.name, contenido: bytes });
  }

  if (adjuntosGuardados.length > 0) {
    await admin.from('requerimientos').update({ adjuntos: adjuntosGuardados }).eq('id', fila.id);
  }

  const listaAdjuntos = adjuntosGuardados.length
    ? adjuntosGuardados.map((a) => `<li>${escapar(a.nombre)}</li>`).join('')
    : '<li>Ninguno</li>';

  const html = `
    <h2>Nuevo requerimiento de Espiral de Crecimiento 360°</h2>
    <p><strong>Tipo:</strong> ${escapar(ETIQUETA_TIPO[datos.tipo])}<br/>
    <strong>Empresa:</strong> ${escapar(nombreEmpresa)}<br/>
    <strong>Quién escribe:</strong> ${escapar(perfil.nombre_completo)} (${escapar(perfil.email)})<br/>
    <strong>Pantalla:</strong> ${escapar(datos.pagina || 'No indicada')}<br/>
    <strong>Lo que buscó:</strong> ${escapar(datos.consulta || 'No escribió búsqueda')}<br/>
    <strong>Respuesta que vio:</strong> ${escapar(datos.respuestaMostrada || 'Ninguna')}</p>
    <h3>¿Qué pasa?</h3><p>${escapar(datos.quePasa)}</p>
    <h3>¿Qué esperabas que pasara?</h3><p>${escapar(datos.quePesperaba)}</p>
    <h3>¿Cómo imaginas la solución?</h3><p>${escapar(datos.solucion)}</p>
    <h3>Archivos adjuntos</h3><ul>${listaAdjuntos}</ul>
    ${fallidos.length ? `<p style="color:#b45309">No se pudieron guardar: ${escapar(fallidos.join(', '))}</p>` : ''}
    <p style="color:#666;font-size:12px">Id del requerimiento: ${fila.id}</p>`;

  const envio = await enviarEmail({
    to: CORREO_REQUERIMIENTOS,
    subject: `${ETIQUETA_TIPO[datos.tipo]} · ${nombreEmpresa} · ${perfil.nombre_completo}`,
    html,
    adjuntos: contenidosParaCorreo,
  });

  if (envio.ok) await admin.from('requerimientos').update({ correo_enviado: true }).eq('id', fila.id);

  return { ok: true as const, correoEnviado: envio.ok, adjuntosNoGuardados: fallidos };
}
