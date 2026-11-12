'use server';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { z } from 'zod';

const BUCKET = 'evidencias-valoracion';
const MAX_BYTES = 4 * 1024 * 1024; // límite de las funciones de Vercel (4,5 MB)
const MAX_POR_ITEM = 5;
const TIPOS_OK = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

export interface EvidenciaVista {
  nombre: string;
  ruta: string;
  tipo: string;
  tamano: number;
  url: string | null;
}

/** Enlaces temporales de lectura. Se firman con el servicio porque ya se verificó en el servidor quién puede verlos. */
export async function firmarEvidencias(adjuntos: { nombre: string; ruta: string; tipo: string; tamano: number }[]): Promise<EvidenciaVista[]> {
  if (adjuntos.length === 0) return [];
  const admin = createAdminClient();
  return Promise.all(
    adjuntos.map(async (a) => {
      const { data } = await admin.storage.from(BUCKET).createSignedUrl(a.ruta, 3600);
      return { ...a, url: data?.signedUrl ?? null };
    })
  );
}

/** Verifica que la persona sea quien valora, que la valoración siga en borrador y que el ítem sea de esa evaluación. */
async function validarEvaluador(tareaId: string, itemId: string) {
  const perfil = await getPerfilActual();
  if (!perfil?.colaborador_id) return { error: 'No autorizado' as const };
  const supabase = createClient();
  const { data: tarea } = await supabase.from('evaluacion_tareas').select('id, evaluacion_id, evaluador_colaborador_id, completada').eq('id', tareaId).maybeSingle();
  if (!tarea || tarea.evaluador_colaborador_id !== perfil.colaborador_id) return { error: 'No encontramos esta valoración entre tus tareas' as const };
  if (tarea.completada) return { error: 'Esta valoración ya fue enviada: las evidencias no se pueden cambiar' as const };
  const { data: item } = await supabase.from('evaluacion_items').select('id').eq('id', itemId).eq('evaluacion_id', tarea.evaluacion_id).maybeSingle();
  if (!item) return { error: 'Ítem no encontrado' as const };
  return { perfil, supabase };
}

async function leerRespuesta(supabase: ReturnType<typeof createClient>, tareaId: string, itemId: string) {
  const { data } = await supabase.from('respuestas_evaluacion').select('id, adjuntos').eq('evaluacion_tarea_id', tareaId).eq('evaluacion_item_id', itemId).maybeSingle();
  return data;
}

/** Adjunta una evidencia a la respuesta de un ítem (la nota debe estar ya elegida). */
export async function subirEvidenciaItem(formData: FormData) {
  const tareaId = String(formData.get('tareaId') ?? '');
  const itemId = String(formData.get('itemId') ?? '');
  const archivo = formData.get('archivo');
  if (!z.string().uuid().safeParse(tareaId).success || !z.string().uuid().safeParse(itemId).success) return { ok: false as const, error: 'Datos inválidos' };
  if (!(archivo instanceof File) || archivo.size === 0) return { ok: false as const, error: 'Elige un archivo' };
  if (!TIPOS_OK.includes(archivo.type)) return { ok: false as const, error: 'Solo se aceptan imágenes (JPG, PNG, WebP), PDF, Word o Excel' };
  if (archivo.size > MAX_BYTES) return { ok: false as const, error: 'El archivo pesa más de 4 MB. Comprímelo o sube uno más liviano.' };

  const v = await validarEvaluador(tareaId, itemId);
  if ('error' in v) return { ok: false as const, error: v.error };

  const respuesta = await leerRespuesta(v.supabase, tareaId, itemId);
  if (!respuesta) return { ok: false as const, error: 'Primero elige la nota (o «No aplica») de este ítem y luego adjunta la evidencia.' };
  const actuales = Array.isArray(respuesta.adjuntos) ? (respuesta.adjuntos as any[]) : [];
  if (actuales.length >= MAX_POR_ITEM) return { ok: false as const, error: `Máximo ${MAX_POR_ITEM} archivos por ítem` };

  const limpio = archivo.name.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9._-]+/g, '_');
  const ruta = `${v.perfil.empresa_id}/${tareaId}/${itemId}/${Date.now()}-${limpio}`;
  const { error: errSubida } = await v.supabase.storage.from(BUCKET).upload(ruta, archivo, { contentType: archivo.type });
  if (errSubida) return { ok: false as const, error: `Error subiendo el archivo: ${errSubida.message}` };

  const nuevos = [...actuales, { nombre: archivo.name, ruta, tipo: archivo.type, tamano: archivo.size }];
  const { error } = await v.supabase.from('respuestas_evaluacion').update({ adjuntos: nuevos }).eq('id', respuesta.id);
  if (error) {
    await v.supabase.storage.from(BUCKET).remove([ruta]);
    return { ok: false as const, error: error.message };
  }
  return { ok: true as const, adjuntos: await firmarEvidencias(nuevos) };
}

export async function eliminarEvidenciaItem(tareaId: string, itemId: string, ruta: string) {
  if (!z.string().uuid().safeParse(tareaId).success || !z.string().uuid().safeParse(itemId).success) return { ok: false as const, error: 'Datos inválidos' };
  const v = await validarEvaluador(tareaId, itemId);
  if ('error' in v) return { ok: false as const, error: v.error };

  const respuesta = await leerRespuesta(v.supabase, tareaId, itemId);
  const actuales = Array.isArray(respuesta?.adjuntos) ? (respuesta!.adjuntos as any[]) : [];
  if (!respuesta || !actuales.some((a) => a.ruta === ruta)) return { ok: false as const, error: 'Archivo no encontrado' };

  await v.supabase.storage.from(BUCKET).remove([ruta]);
  const nuevos = actuales.filter((a) => a.ruta !== ruta);
  const { error } = await v.supabase.from('respuestas_evaluacion').update({ adjuntos: nuevos }).eq('id', respuesta.id);
  if (error) return { ok: false as const, error: error.message };
  return { ok: true as const, adjuntos: await firmarEvidencias(nuevos) };
}
