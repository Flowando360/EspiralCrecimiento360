'use server';

import { createClient } from '@/lib/supabase/server';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { revalidatePath } from 'next/cache';
import { analizarExcelMatriz, claveRequisito, type FilaRequisito } from '@/lib/legal/importacion-matriz';

const MAX_BYTES = 1024 * 1024; // límite de las acciones del servidor

async function leerContexto(empresaId: string) {
  const supabase = createClient();
  const [{ data: procesos }, { data: requisitos }] = await Promise.all([
    supabase.from('procesos_gestion').select('id, nombre, codigo').eq('empresa_id', empresaId),
    supabase.from('requisitos_legales').select('norma, articulo').eq('empresa_id', empresaId),
  ]);
  return {
    supabase,
    procesos: (procesos ?? []) as { id: string; nombre: string; codigo: string | null }[],
    existentes: new Set(((requisitos ?? []) as { norma: string; articulo: string | null }[]).map((r) => claveRequisito(r.norma, r.articulo))),
  };
}

async function archivoDe(formData: FormData): Promise<{ buffer: ArrayBuffer } | { error: string }> {
  const archivo = formData.get('archivo');
  if (!(archivo instanceof File) || archivo.size === 0) return { error: 'Elige el archivo Excel' };
  if (!archivo.name.toLowerCase().endsWith('.xlsx')) return { error: 'El archivo debe ser .xlsx (usa la plantilla)' };
  if (archivo.size > MAX_BYTES) return { error: 'El archivo es muy pesado (máx. 1 MB)' };
  return { buffer: await archivo.arrayBuffer() };
}

/** Paso 1: lee el Excel y devuelve la revisión fila por fila, sin guardar nada. */
export async function revisarImportacionMatriz(formData: FormData) {
  const perfil = await getPerfilActual();
  if (!perfil || perfil.rol !== 'admin_th') return { ok: false as const, error: 'No autorizado' };
  const f = await archivoDe(formData);
  if ('error' in f) return { ok: false as const, error: f.error };

  const { procesos, existentes } = await leerContexto(perfil.empresa_id);
  const { filas, errorGeneral } = await analizarExcelMatriz(f.buffer, { procesos, existentes });
  if (errorGeneral && filas.length === 0) return { ok: false as const, error: errorGeneral };
  return { ok: true as const, filas: filas.map(sinDatos), aviso: errorGeneral ?? null };
}

function sinDatos(f: FilaRequisito) {
  const { datos: _datos, ...resto } = f;
  return resto;
}

/** Paso 2: vuelve a validar en el servidor y guarda las filas correctas (las demás quedan por fuera). */
export async function confirmarImportacionMatriz(formData: FormData) {
  const perfil = await getPerfilActual();
  if (!perfil || perfil.rol !== 'admin_th') return { ok: false as const, error: 'No autorizado' };
  const f = await archivoDe(formData);
  if ('error' in f) return { ok: false as const, error: f.error };

  const { supabase, procesos, existentes } = await leerContexto(perfil.empresa_id);
  const { filas } = await analizarExcelMatriz(f.buffer, { procesos, existentes });
  const listas = filas.filter((x) => x.estado === 'ok' && x.datos);
  if (listas.length === 0) return { ok: false as const, error: 'No hay filas válidas para importar' };

  const hoy = new Date().toISOString().slice(0, 10);
  const filasInsert = listas.map((x) => {
    const d = x.datos!;
    return {
      empresa_id: perfil.empresa_id,
      proceso_id: d.procesoId,
      norma: d.norma,
      anio: d.anio,
      entidad_emisora: d.entidad,
      asunto: d.asunto,
      articulo: d.articulo,
      nombre_articulo: d.nombreArticulo,
      descripcion_articulo: d.descripcion,
      cumple: d.cumple,
      soporte_cumplimiento: d.soporte,
      acciones_a_seguir: d.acciones,
      observaciones: d.observaciones,
      fecha_ultima_revision: d.revision ?? hoy,
    };
  });

  // En bloques de 100 para no exceder el tamaño de una petición.
  let creados = 0;
  const errores: string[] = [];
  for (let i = 0; i < filasInsert.length; i += 100) {
    const lote = filasInsert.slice(i, i + 100);
    const { error } = await supabase.from('requisitos_legales').insert(lote);
    if (error) errores.push(`Filas ${listas[i]!.fila} a ${listas[Math.min(i + 100, listas.length) - 1]!.fila}: ${error.message}`);
    else creados += lote.length;
  }

  revalidatePath('/procesos-gestion/legal');
  return {
    ok: true as const,
    creados,
    omitidas: filas.filter((x) => x.estado === 'omitida').length,
    conError: filas.filter((x) => x.estado === 'error').length,
    errores,
  };
}
