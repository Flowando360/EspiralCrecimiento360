'use server';

import { createClient } from '@/lib/supabase/server';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { revalidatePath } from 'next/cache';
import { analizarExcelIncapacidades, type FilaIncapacidad } from '@/lib/incapacidades/importacion';

const MAX_BYTES = 1024 * 1024; // límite de las acciones del servidor

async function leerContexto(empresaId: string) {
  const supabase = createClient();
  const [{ data: colaboradores }, { data: existentes }] = await Promise.all([
    supabase.from('colaboradores').select('id, nombre_completo, numero_documento').eq('empresa_id', empresaId).eq('es_externo', false),
    supabase.from('incapacidades_colaborador').select('colaborador_id, tipo, fecha_inicio, fecha_fin, colaborador:colaborador_id!inner(empresa_id)').eq('colaborador.empresa_id', empresaId),
  ]);
  return {
    supabase,
    colaboradores: (colaboradores ?? []) as { id: string; nombre_completo: string; numero_documento: string | null }[],
    existentes: ((existentes ?? []) as any[]).map((e) => ({ colaborador_id: e.colaborador_id as string, tipo: e.tipo as string, fecha_inicio: e.fecha_inicio as string, fecha_fin: e.fecha_fin as string })),
  };
}

async function archivoDe(formData: FormData): Promise<{ buffer: ArrayBuffer } | { error: string }> {
  const archivo = formData.get('archivo');
  if (!(archivo instanceof File) || archivo.size === 0) return { error: 'Elige el archivo Excel' };
  if (!archivo.name.toLowerCase().endsWith('.xlsx')) return { error: 'El archivo debe ser .xlsx (usa la plantilla)' };
  if (archivo.size > MAX_BYTES) return { error: 'El archivo es muy pesado (máx. 1 MB)' };
  return { buffer: await archivo.arrayBuffer() };
}

function sinDatos(f: FilaIncapacidad) {
  const { datos, ...resto } = f;
  return { ...resto, dias: datos?.dias ?? null };
}

/** Paso 1: lee el Excel y devuelve la revisión fila por fila, sin guardar nada. */
export async function revisarImportacionIncapacidades(formData: FormData) {
  const perfil = await getPerfilActual();
  if (!perfil || perfil.rol !== 'admin_th') return { ok: false as const, error: 'No autorizado' };
  const f = await archivoDe(formData);
  if ('error' in f) return { ok: false as const, error: f.error };

  const { colaboradores, existentes } = await leerContexto(perfil.empresa_id);
  const { filas, errorGeneral } = await analizarExcelIncapacidades(f.buffer, { colaboradores, existentes });
  if (errorGeneral && filas.length === 0) return { ok: false as const, error: errorGeneral };
  return { ok: true as const, filas: filas.map(sinDatos), aviso: errorGeneral ?? null };
}

/** Paso 2: vuelve a validar en el servidor y guarda las filas correctas. */
export async function confirmarImportacionIncapacidades(formData: FormData) {
  const perfil = await getPerfilActual();
  if (!perfil || perfil.rol !== 'admin_th') return { ok: false as const, error: 'No autorizado' };
  const f = await archivoDe(formData);
  if ('error' in f) return { ok: false as const, error: f.error };

  const { supabase, colaboradores, existentes } = await leerContexto(perfil.empresa_id);
  const { filas } = await analizarExcelIncapacidades(f.buffer, { colaboradores, existentes });
  const listas = filas.filter((x) => x.estado === 'ok' && x.datos);
  if (listas.length === 0) return { ok: false as const, error: 'No hay filas válidas para importar' };

  const registros = listas.map((x) => {
    const d = x.datos!;
    return {
      colaborador_id: d.colaboradorId,
      tipo: d.tipo,
      fecha_inicio: d.inicio,
      fecha_fin: d.fin,
      entidad_emisora: d.entidad,
      registrada_por: perfil.usuario_id,
    };
  });

  let creadas = 0;
  const errores: string[] = [];
  for (let i = 0; i < registros.length; i += 100) {
    const lote = registros.slice(i, i + 100);
    const { error } = await supabase.from('incapacidades_colaborador').insert(lote);
    if (error) errores.push(`Filas ${listas[i]!.fila} a ${listas[Math.min(i + 100, listas.length) - 1]!.fila}: ${error.message}`);
    else creadas += lote.length;
  }

  revalidatePath('/mi-perfil');
  revalidatePath('/espiral-crecimiento/colaboradores');
  return {
    ok: true as const,
    creadas,
    omitidas: filas.filter((x) => x.estado === 'omitida').length,
    conError: filas.filter((x) => x.estado === 'error').length,
    errores,
  };
}
