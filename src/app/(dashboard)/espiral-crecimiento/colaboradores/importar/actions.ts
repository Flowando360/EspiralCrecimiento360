'use server';

import { createClient } from '@/lib/supabase/server';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { revalidatePath } from 'next/cache';
import { asignarItemsInduccion } from '@/lib/induccion/asignar';
import { analizarExcelColaboradores, claveDocumento, norm, type FilaImportacion } from '@/lib/colaboradores/importacion';

const MAX_BYTES = 1024 * 1024; // límite de las acciones del servidor (1 MB): sobra para 200 filas

async function leerContexto(empresaId: string) {
  const supabase = createClient();
  const [{ data: cargos }, { data: existentes }] = await Promise.all([
    supabase.from('cargos').select('id, nombre').eq('empresa_id', empresaId).eq('activo', true),
    supabase.from('colaboradores').select('id, nombre_completo, numero_documento').eq('empresa_id', empresaId),
  ]);
  return {
    supabase,
    cargos: (cargos ?? []) as { id: string; nombre: string }[],
    existentes: (existentes ?? []) as { id: string; nombre_completo: string; numero_documento: string | null }[],
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
export async function revisarImportacionColaboradores(formData: FormData) {
  const perfil = await getPerfilActual();
  if (!perfil || perfil.rol !== 'admin_th') return { ok: false as const, error: 'No autorizado' };
  const f = await archivoDe(formData);
  if ('error' in f) return { ok: false as const, error: f.error };

  const { cargos, existentes } = await leerContexto(perfil.empresa_id);
  const documentosExistentes = new Set(existentes.map((e) => claveDocumento(e.numero_documento)).filter(Boolean));
  const { filas, errorGeneral } = await analizarExcelColaboradores(f.buffer, { cargos, documentosExistentes });
  if (errorGeneral && filas.length === 0) return { ok: false as const, error: errorGeneral };
  return { ok: true as const, filas: filas.map(quitarDatos), aviso: errorGeneral ?? null };
}

/** El navegador solo necesita ver el resultado, no los ids internos. */
function quitarDatos(f: FilaImportacion): Omit<FilaImportacion, 'datos'> & { cargo: string | null } {
  const { datos, ...resto } = f;
  return { ...resto, cargo: datos?.cargoNombre ?? null };
}

/**
 * Paso 2: vuelve a leer y validar el archivo en el servidor (no se confía en lo que
 * mostró el navegador) y guarda las filas correctas. Las filas con error se dejan por fuera.
 */
export async function confirmarImportacionColaboradores(formData: FormData) {
  const perfil = await getPerfilActual();
  if (!perfil || perfil.rol !== 'admin_th') return { ok: false as const, error: 'No autorizado' };
  const f = await archivoDe(formData);
  if ('error' in f) return { ok: false as const, error: f.error };

  const { supabase, cargos, existentes } = await leerContexto(perfil.empresa_id);
  const documentosExistentes = new Set(existentes.map((e) => claveDocumento(e.numero_documento)).filter(Boolean));
  const { filas } = await analizarExcelColaboradores(f.buffer, { cargos, documentosExistentes });
  const listas = filas.filter((x) => x.estado === 'ok' && x.datos);
  if (listas.length === 0) return { ok: false as const, error: 'No hay filas válidas para importar' };

  const creados: { fila: number; id: string; datos: NonNullable<FilaImportacion['datos']> }[] = [];
  const fallidas: { fila: number; nombre: string; error: string }[] = [];

  for (const x of listas) {
    const d = x.datos!;
    const { data, error } = await supabase
      .from('colaboradores')
      .insert({
        empresa_id: perfil.empresa_id,
        nombre_completo: d.nombre,
        numero_documento: d.documento,
        email: d.correo,
        telefono: d.telefono,
        cargo_id: d.cargoId,
        fecha_ingreso: d.ingreso,
        tipo_contrato: d.contrato,
        estado: d.estado,
        salario: d.salario,
        eps: d.eps,
        arl: d.arl,
        afp: d.afp,
        caja_compensacion: d.caja,
      })
      .select('id')
      .single();
    if (error || !data) {
      fallidas.push({ fila: x.fila, nombre: d.nombre, error: error?.message ?? 'No se pudo crear' });
      continue;
    }
    creados.push({ fila: x.fila, id: data.id as string, datos: d });
    await supabase.from('historial_movimientos').insert({
      colaborador_id: data.id,
      tipo: 'ingreso',
      cargo_nuevo_id: d.cargoId,
      descripcion: `Ingreso como ${d.cargoNombre} (carga masiva)`,
      fecha: d.ingreso,
      registrado_por: perfil.usuario_id,
    });
    try {
      await asignarItemsInduccion(supabase, data.id as string, perfil.empresa_id, d.cargoId, true);
    } catch {
      /* el colaborador ya quedó creado; la inducción se completa luego */
    }
  }

  // Líderes: se resuelven al final, cuando ya existen todas las personas del archivo.
  const porDocumento = new Map<string, string>();
  const porNombre = new Map<string, string[]>();
  const todos = [...existentes.map((e) => ({ id: e.id, nombre: e.nombre_completo, doc: e.numero_documento })), ...creados.map((c) => ({ id: c.id, nombre: c.datos.nombre, doc: c.datos.documento }))];
  for (const p of todos) {
    const kd = claveDocumento(p.doc);
    if (kd) porDocumento.set(kd, p.id);
    porNombre.set(norm(p.nombre), [...(porNombre.get(norm(p.nombre)) ?? []), p.id]);
  }
  const avisosLider: string[] = [];
  for (const c of creados) {
    const t = c.datos.liderTexto;
    if (!t) continue;
    const porDoc = porDocumento.get(claveDocumento(t));
    const nombres = porNombre.get(norm(t)) ?? [];
    const liderId = porDoc ?? (nombres.length === 1 ? nombres[0] : undefined);
    if (!liderId) {
      avisosLider.push(`Fila ${c.fila} (${c.datos.nombre}): no se encontró un líder único para «${t}»; quedó sin líder`);
      continue;
    }
    if (liderId === c.id) {
      avisosLider.push(`Fila ${c.fila} (${c.datos.nombre}): una persona no puede ser su propio líder`);
      continue;
    }
    await supabase.from('colaboradores').update({ lider_id: liderId }).eq('id', c.id).eq('empresa_id', perfil.empresa_id);
  }

  revalidatePath('/espiral-crecimiento/colaboradores');
  return {
    ok: true as const,
    creados: creados.length,
    omitidas: filas.filter((x) => x.estado === 'omitida').length,
    conError: filas.filter((x) => x.estado === 'error').length,
    fallidas,
    avisosLider,
  };
}
