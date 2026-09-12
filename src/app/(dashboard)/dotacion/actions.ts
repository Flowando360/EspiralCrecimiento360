'use server';

import { createClient } from '@/lib/supabase/server';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const RUTA = '/dotacion';

async function requerirAdminTh() {
  const perfil = await getPerfilActual();
  if (!perfil || perfil.rol !== 'admin_th') return null;
  return perfil;
}

const EntregaSchema = z.object({
  colaboradorId: z.string().uuid('Selecciona un colaborador'),
  categoria: z.enum(['elemento_personal', 'equipo_trabajo']),
  nombreElemento: z.string().trim().min(1, 'El elemento es requerido'),
  talla: z.string().trim().optional(),
  cantidad: z.coerce.number().int().min(1).default(1),
  fechaEntrega: z.string().min(1, 'La fecha de entrega es requerida'),
  fechaVencimiento: z.string().optional(),
  observaciones: z.string().trim().optional(),
});

export async function crearEntrega(input: z.infer<typeof EntregaSchema>) {
  const perfil = await requerirAdminTh();
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const parsed = EntregaSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };

  const supabase = createClient();
  const { error } = await supabase.from('dotacion_entregas').insert({
    empresa_id: perfil.empresa_id,
    colaborador_id: parsed.data.colaboradorId,
    categoria: parsed.data.categoria,
    nombre_elemento: parsed.data.nombreElemento,
    talla: parsed.data.talla || null,
    cantidad: parsed.data.cantidad,
    fecha_entrega: parsed.data.fechaEntrega,
    fecha_vencimiento: parsed.data.fechaVencimiento || null,
    observaciones: parsed.data.observaciones || null,
    entregado_por: perfil.usuario_id,
  });

  if (error) return { ok: false as const, error: error.message };
  revalidatePath(RUTA);
  return { ok: true as const };
}

/** El propio colaborador confirma que recibió el elemento — casilla + fecha, mismo mecanismo del Acuerdo de Crecimiento. */
export async function confirmarFirmaDotacion(id: string) {
  const perfil = await getPerfilActual();
  if (!perfil || perfil.rol !== 'colaborador') return { ok: false as const, error: 'No autorizado' };

  const supabase = createClient();
  const { error } = await supabase
    .from('dotacion_entregas')
    .update({ firma_confirmada: true, firmado_en: new Date().toISOString() })
    .eq('id', id)
    .eq('colaborador_id', perfil.colaborador_id ?? '');

  if (error) return { ok: false as const, error: error.message };
  revalidatePath(RUTA);
  return { ok: true as const };
}

/** Checklist de devolución al momento de la desvinculación (o pérdida/daño en cualquier momento). */
export async function actualizarEstadoDotacion(id: string, estado: 'entregado' | 'devuelto' | 'perdido' | 'danado') {
  const perfil = await requerirAdminTh();
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const supabase = createClient();
  const { error } = await supabase
    .from('dotacion_entregas')
    .update({ estado, fecha_devolucion: estado === 'devuelto' ? new Date().toISOString().slice(0, 10) : null })
    .eq('id', id)
    .eq('empresa_id', perfil.empresa_id);

  if (error) return { ok: false as const, error: error.message };
  revalidatePath(RUTA);
  return { ok: true as const };
}

/** Adjunta (o reemplaza) la foto/escaneo del acta de entrega firmada en papel — alternativa a la firma digital, admin_th o el propio colaborador de esa entrega. */
export async function subirActaFirmada(formData: FormData) {
  const perfil = await getPerfilActual();
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const entregaId = formData.get('entregaId') as string;
  const archivo = formData.get('archivo') as File | null;
  if (!archivo || archivo.size === 0) return { ok: false as const, error: 'Selecciona un archivo' };
  if (archivo.size > 8 * 1024 * 1024) return { ok: false as const, error: 'El archivo no puede pesar más de 8 MB.' };

  const supabase = createClient();
  const { data: entrega } = await supabase.from('dotacion_entregas').select('empresa_id, colaborador_id').eq('id', entregaId).maybeSingle();
  if (!entrega || entrega.empresa_id !== perfil.empresa_id) return { ok: false as const, error: 'Entrega no encontrada' };
  if (perfil.rol !== 'admin_th' && entrega.colaborador_id !== perfil.colaborador_id) return { ok: false as const, error: 'No autorizado' };

  const extension = archivo.name.split('.').pop() || 'jpg';
  const ruta = `${perfil.empresa_id}/${entrega.colaborador_id}/${entregaId}-${Date.now()}.${extension}`;
  const { error: errorSubida } = await supabase.storage.from('actas-dotacion').upload(ruta, archivo, { contentType: archivo.type || undefined, upsert: true });
  if (errorSubida) return { ok: false as const, error: 'No se pudo subir el archivo: ' + errorSubida.message };

  const { error } = await supabase.from('dotacion_entregas').update({ acta_firmada_url: ruta }).eq('id', entregaId);
  if (error) return { ok: false as const, error: error.message };

  revalidatePath(RUTA);
  return { ok: true as const };
}

// ── Catálogo de dotación (inventario de bodega) ─────────────────────────────
const RUTA_CATALOGO = '/dotacion/catalogo';

const ArticuloSchema = z.object({
  categoria: z.string().trim().min(1, 'La categoría es requerida'),
  nombre: z.string().trim().min(1, 'El nombre es requerido'),
  requiereTalla: z.boolean(),
});

export async function crearArticuloCatalogo(input: z.infer<typeof ArticuloSchema>) {
  const perfil = await requerirAdminTh();
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const parsed = ArticuloSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };

  const supabase = createClient();
  const { data, error } = await supabase
    .from('dotacion_catalogo_articulos')
    .insert({ empresa_id: perfil.empresa_id, categoria: parsed.data.categoria, nombre: parsed.data.nombre, requiere_talla: parsed.data.requiereTalla })
    .select('id')
    .single();

  if (error) return { ok: false as const, error: error.message };
  revalidatePath(RUTA_CATALOGO);
  return { ok: true as const, id: data.id as string };
}

export async function eliminarArticuloCatalogo(articuloId: string) {
  const perfil = await requerirAdminTh();
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const supabase = createClient();
  const { error } = await supabase.from('dotacion_catalogo_articulos').delete().eq('id', articuloId).eq('empresa_id', perfil.empresa_id);
  if (error) {
    const esConflicto = /foreign key|constraint|violates/i.test(error.message);
    return {
      ok: false as const,
      error: esConflicto ? 'No se puede eliminar: ya tiene entregas registradas desde el catálogo. Márcalo inactivo en su lugar.' : error.message,
    };
  }
  revalidatePath(RUTA_CATALOGO);
  return { ok: true as const };
}

export async function actualizarActivoArticuloCatalogo(articuloId: string, activo: boolean) {
  const perfil = await requerirAdminTh();
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const supabase = createClient();
  const { error } = await supabase.from('dotacion_catalogo_articulos').update({ activo }).eq('id', articuloId).eq('empresa_id', perfil.empresa_id);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath(RUTA_CATALOGO);
  return { ok: true as const };
}

const TallaSchema = z.object({
  articuloId: z.string().uuid(),
  talla: z.string().trim().min(1, 'La talla es requerida'),
  stockInicial: z.coerce.number().int().min(0).default(0),
  stockMinimo: z.coerce.number().int().min(0).default(0),
});

export async function agregarTallaCatalogo(input: z.infer<typeof TallaSchema>) {
  const perfil = await requerirAdminTh();
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const parsed = TallaSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };

  const supabase = createClient();
  const { data: articulo } = await supabase.from('dotacion_catalogo_articulos').select('empresa_id').eq('id', parsed.data.articuloId).maybeSingle();
  if (!articulo || articulo.empresa_id !== perfil.empresa_id) return { ok: false as const, error: 'Artículo no encontrado' };

  const { error } = await supabase.from('dotacion_catalogo_tallas').insert({
    articulo_id: parsed.data.articuloId,
    talla: parsed.data.talla,
    stock_disponible: parsed.data.stockInicial,
    stock_minimo: parsed.data.stockMinimo,
  });
  if (error) {
    return { ok: false as const, error: error.code === '23505' ? 'Esa talla ya existe para este artículo' : error.message };
  }
  revalidatePath(RUTA_CATALOGO);
  return { ok: true as const };
}

export async function actualizarStockMinimo(tallaId: string, stockMinimo: number) {
  const perfil = await requerirAdminTh();
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const supabase = createClient();
  const { error } = await supabase.from('dotacion_catalogo_tallas').update({ stock_minimo: stockMinimo }).eq('id', tallaId);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath(RUTA_CATALOGO);
  return { ok: true as const };
}

export async function eliminarTallaCatalogo(tallaId: string) {
  const perfil = await requerirAdminTh();
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const supabase = createClient();
  const { error } = await supabase.from('dotacion_catalogo_tallas').delete().eq('id', tallaId);
  if (error) {
    const esConflicto = /foreign key|constraint|violates/i.test(error.message);
    return { ok: false as const, error: esConflicto ? 'No se puede eliminar: ya tiene entregas registradas.' : error.message };
  }
  revalidatePath(RUTA_CATALOGO);
  return { ok: true as const };
}

/** Registra entrada de bodega (compra a proveedor) — suma al stock disponible. */
export async function recibirEnBodega(tallaId: string, cantidad: number) {
  const perfil = await requerirAdminTh();
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const supabase = createClient();
  const { error } = await supabase.rpc('fn_recibir_en_catalogo', { p_articulo_talla_id: tallaId, p_cantidad: cantidad });
  if (error) return { ok: false as const, error: error.message };
  revalidatePath(RUTA_CATALOGO);
  return { ok: true as const };
}

const EntregaDesdeCatalogoSchema = z.object({
  articuloTallaId: z.string().uuid(),
  colaboradorId: z.string().uuid('Selecciona un colaborador'),
  categoria: z.enum(['elemento_personal', 'equipo_trabajo']),
  cantidad: z.coerce.number().int().min(1).default(1),
  fechaEntrega: z.string().min(1, 'La fecha de entrega es requerida'),
  fechaVencimiento: z.string().optional(),
});

/** Entrega desde el catálogo: descuenta stock y crea la entrega en una sola operación atómica (fn_entregar_desde_catalogo). */
export async function crearEntregaDesdeCatalogo(input: z.infer<typeof EntregaDesdeCatalogoSchema>) {
  const perfil = await requerirAdminTh();
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const parsed = EntregaDesdeCatalogoSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };

  const supabase = createClient();
  const { error } = await supabase.rpc('fn_entregar_desde_catalogo', {
    p_articulo_talla_id: parsed.data.articuloTallaId,
    p_colaborador_id: parsed.data.colaboradorId,
    p_categoria: parsed.data.categoria,
    p_cantidad: parsed.data.cantidad,
    p_fecha_entrega: parsed.data.fechaEntrega,
    p_fecha_vencimiento: parsed.data.fechaVencimiento || undefined,
  });
  if (error) return { ok: false as const, error: error.message };

  revalidatePath(RUTA);
  revalidatePath(RUTA_CATALOGO);
  return { ok: true as const };
}
