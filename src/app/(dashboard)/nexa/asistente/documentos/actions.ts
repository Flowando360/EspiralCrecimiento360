'use server';

import { createClient } from '@/lib/supabase/server';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const RUTA = '/nexa/asistente/documentos';

const MetaSchema = z.object({
  titulo: z.string().trim().min(1, 'El título es requerido'),
  categoria: z.enum(['sst', 'politicas', 'procedimientos', 'otro']),
  contenidoManual: z.string().trim().optional(),
});

/**
 * Carga un documento a la base documental del asistente. Si viene un
 * archivo PDF, se extrae su texto con pdf-parse y el PDF original queda
 * también en el bucket privado (solo como referencia/descarga); si no,
 * se usa el texto pegado directamente en `contenidoManual`.
 */
export async function subirDocumentoPolitica(formData: FormData) {
  const perfil = await getPerfilActual();
  if (!perfil || perfil.rol !== 'admin_th') return { ok: false as const, error: 'No autorizado' };

  const parsed = MetaSchema.safeParse({
    titulo: formData.get('titulo'),
    categoria: formData.get('categoria'),
    contenidoManual: formData.get('contenidoManual') || undefined,
  });
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };

  const archivo = formData.get('archivo');
  const supabase = createClient();

  let contenido = parsed.data.contenidoManual?.trim() ?? '';
  let archivoUrl: string | null = null;

  if (archivo instanceof File && archivo.size > 0) {
    if (archivo.type !== 'application/pdf') {
      return { ok: false as const, error: 'Solo se aceptan archivos PDF' };
    }

    const buffer = Buffer.from(await archivo.arrayBuffer());

    try {
      const { PDFParse } = await import('pdf-parse');
      const parser = new PDFParse({ data: buffer });
      const resultado = await parser.getText();
      await parser.destroy();
      contenido = resultado.text.trim();
    } catch (e) {
      return { ok: false as const, error: 'No se pudo leer el texto del PDF. Intenta pegarlo manualmente.' };
    }

    const ruta = `${perfil.empresa_id}/${Date.now()}-${archivo.name}`;
    const { error: uploadError } = await supabase.storage.from('documentos-politica').upload(ruta, buffer, {
      contentType: 'application/pdf',
    });
    if (uploadError) return { ok: false as const, error: `Error subiendo el PDF: ${uploadError.message}` };
    archivoUrl = ruta;
  }

  if (!contenido) {
    return { ok: false as const, error: 'Sube un PDF con texto o pega el contenido manualmente' };
  }

  const { error } = await supabase.from('nexa_documentos_politica').insert({
    empresa_id: perfil.empresa_id,
    titulo: parsed.data.titulo,
    categoria: parsed.data.categoria,
    contenido,
    archivo_url: archivoUrl,
    subido_por: perfil.usuario_id,
  });

  if (error) return { ok: false as const, error: error.message };
  revalidatePath(RUTA);
  return { ok: true as const };
}

export async function actualizarEstadoDocumento(id: string, activo: boolean) {
  const perfil = await getPerfilActual();
  if (!perfil || perfil.rol !== 'admin_th') return { ok: false as const, error: 'No autorizado' };

  const supabase = createClient();
  const { error } = await supabase
    .from('nexa_documentos_politica')
    .update({ activo })
    .eq('id', id)
    .eq('empresa_id', perfil.empresa_id);

  if (error) return { ok: false as const, error: error.message };
  revalidatePath(RUTA);
  return { ok: true as const };
}

export async function eliminarDocumentoPolitica(id: string) {
  const perfil = await getPerfilActual();
  if (!perfil || perfil.rol !== 'admin_th') return { ok: false as const, error: 'No autorizado' };

  const supabase = createClient();
  const { error } = await supabase.from('nexa_documentos_politica').delete().eq('id', id).eq('empresa_id', perfil.empresa_id);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath(RUTA);
  return { ok: true as const };
}
