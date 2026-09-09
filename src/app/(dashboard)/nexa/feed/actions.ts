'use server';

import { createClient } from '@/lib/supabase/server';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const TIPOS = ['anuncio', 'politica_sst', 'reconocimiento', 'logro', 'general'] as const;

const PublicacionSchema = z.object({
  tipo: z.enum(TIPOS),
  titulo: z.string().trim().min(1, 'El título es requerido'),
  contenido: z.string().trim().optional(),
  fijado: z.boolean().optional(),
  tipoAdjunto: z.enum(['ninguno', 'documento', 'link', 'video_imagen']).default('ninguno'),
  // documento / video_imagen: el archivo ya se subió directo desde el navegador
  // a Storage (evita el límite de tamaño de las Server Actions); acá solo
  // llega la ruta ya subida.
  archivoUrl: z.string().optional(),
  archivoNombre: z.string().optional(),
  archivoTamanoBytes: z.number().int().positive().optional(),
  // link: la vista previa (Open Graph) ya se obtuvo en el formulario antes de publicar.
  linkUrl: z.string().url().optional(),
  linkPreviewTitulo: z.string().optional(),
  linkPreviewImagen: z.string().optional(),
  linkPreviewDescripcion: z.string().optional(),
});

/**
 * Alterna el "me gusta" del usuario actual sobre una publicación: si ya
 * había reaccionado, lo quita; si no, lo agrega. Cualquier persona de la
 * empresa puede reaccionar (misma regla que RLS: usuario_id = auth.uid()).
 */
export async function alternarReaccion(publicacionId: string) {
  const perfil = await getPerfilActual();
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const supabase = createClient();

  const { data: existente } = await supabase
    .from('nexa_feed_reacciones')
    .select('id')
    .eq('publicacion_id', publicacionId)
    .eq('usuario_id', perfil.usuario_id)
    .maybeSingle();

  if (existente) {
    const { error } = await supabase.from('nexa_feed_reacciones').delete().eq('id', existente.id);
    if (error) return { ok: false as const, error: error.message };
    revalidatePath('/nexa/feed');
    return { ok: true as const, reacciono: false };
  }

  const { error } = await supabase
    .from('nexa_feed_reacciones')
    .insert({ publicacion_id: publicacionId, usuario_id: perfil.usuario_id, tipo: 'like' });
  if (error) return { ok: false as const, error: error.message };

  revalidatePath('/nexa/feed');
  return { ok: true as const, reacciono: true };
}

/** Publica en el feed corporativo (admin_th o líder, misma regla que RLS). */
export async function publicarEnFeed(input: z.infer<typeof PublicacionSchema>) {
  const perfil = await getPerfilActual();
  if (!perfil || !['admin_th', 'lider'].includes(perfil.rol)) return { ok: false as const, error: 'No autorizado' };

  const parsed = PublicacionSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  const d = parsed.data;

  if (d.tipoAdjunto === 'documento' || d.tipoAdjunto === 'video_imagen') {
    if (!d.archivoUrl) return { ok: false as const, error: 'Falta subir el archivo' };
  }
  if (d.tipoAdjunto === 'link' && !d.linkUrl) {
    return { ok: false as const, error: 'Falta el link' };
  }

  const supabase = createClient();
  const { error } = await supabase.from('nexa_feed_publicaciones').insert({
    empresa_id: perfil.empresa_id,
    autor_id: perfil.usuario_id,
    tipo: d.tipo,
    titulo: d.titulo,
    contenido: d.contenido || null,
    // Fijar publicaciones queda reservado a admin_th.
    fijado: perfil.rol === 'admin_th' ? (d.fijado ?? false) : false,
    tipo_adjunto: d.tipoAdjunto,
    archivo_url: d.tipoAdjunto === 'ninguno' || d.tipoAdjunto === 'link' ? null : d.archivoUrl,
    archivo_nombre: d.tipoAdjunto === 'ninguno' || d.tipoAdjunto === 'link' ? null : d.archivoNombre || null,
    archivo_tamano_bytes:
      d.tipoAdjunto === 'ninguno' || d.tipoAdjunto === 'link' ? null : d.archivoTamanoBytes ?? null,
    link_url: d.tipoAdjunto === 'link' ? d.linkUrl : null,
    link_preview_titulo: d.tipoAdjunto === 'link' ? d.linkPreviewTitulo || null : null,
    link_preview_imagen: d.tipoAdjunto === 'link' ? d.linkPreviewImagen || null : null,
    link_preview_descripcion: d.tipoAdjunto === 'link' ? d.linkPreviewDescripcion || null : null,
  });

  if (error) return { ok: false as const, error: error.message };
  revalidatePath('/nexa/feed');
  return { ok: true as const };
}
