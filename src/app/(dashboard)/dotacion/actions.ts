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

// La validación normativa (elegibilidad, periodo, vencimiento, bono) vive en la base de datos
// (trigger trg_dotacion_validar_entrega). Aquí solo se sanea la entrada y se devuelve el mensaje.
const EntregaSchema = z.object({
  colaboradorId: z.string().uuid('Selecciona un colaborador'),
  categoria: z.enum(['elemento_personal', 'equipo_trabajo']),
  nombreElemento: z.string().trim().min(1, 'El elemento es requerido'),
  talla: z.string().trim().optional(),
  cantidad: z.coerce.number().int().min(1).default(1),
  fechaEntrega: z.string().min(1, 'La fecha de entrega es requerida'),
  // Solo para equipos de trabajo: en dotación el vencimiento es el próximo corte obligatorio.
  fechaVencimiento: z.string().optional(),
  observaciones: z.string().trim().optional(),
  excepcionMotivo: z.string().trim().optional(),
});

export async function crearEntrega(input: z.infer<typeof EntregaSchema>) {
  const perfil = await requerirAdminTh();
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const parsed = EntregaSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };

  const esEquipo = parsed.data.categoria === 'equipo_trabajo';
  const supabase = createClient();
  const { error } = await supabase.from('dotacion_entregas').insert({
    empresa_id: perfil.empresa_id,
    colaborador_id: parsed.data.colaboradorId,
    categoria: parsed.data.categoria,
    nombre_elemento: parsed.data.nombreElemento,
    talla: parsed.data.talla || null,
    cantidad: parsed.data.cantidad,
    fecha_entrega: parsed.data.fechaEntrega,
    fecha_vencimiento: esEquipo ? parsed.data.fechaVencimiento || null : null,
    observaciones: parsed.data.observaciones || null,
    excepcion_motivo: parsed.data.excepcionMotivo || null,
    entregado_por: perfil.usuario_id,
  });

  if (error) return { ok: false as const, error: error.message };
  revalidatePath(RUTA);
  return { ok: true as const };
}

/** Evalúa si un colaborador es elegible para dotación en una fecha (salario ≤ 2 SMLMV y > 3 meses de antigüedad). */
export async function consultarElegibilidadDotacion(colaboradorId: string, fechaEntrega: string) {
  const perfil = await requerirAdminTh();
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const supabase = createClient();
  const { data, error } = await supabase.rpc('fn_evaluar_elegibilidad_dotacion', { p_colaborador_id: colaboradorId, p_fecha: fechaEntrega });
  if (error) return { ok: false as const, error: error.message };

  const r = data as { elegible: boolean; exento_por_no_uso: boolean; motivos: string[]; antiguedad_meses: number };
  return { ok: true as const, elegible: r.elegible, exentoPorNoUso: r.exento_por_no_uso, motivos: r.motivos, antiguedadMeses: r.antiguedad_meses };
}

/** Admin_th verifica si el trabajador usó la dotación. "No usó" exime al empleador de entregarla en el periodo siguiente. */
export async function registrarUsoDotacion(id: string, usoVerificado: boolean | null, observacion?: string) {
  const perfil = await requerirAdminTh();
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const supabase = createClient();
  const { error } = await supabase
    .from('dotacion_entregas')
    .update({
      uso_verificado: usoVerificado,
      uso_verificado_en: usoVerificado === null ? null : new Date().toISOString(),
      uso_observacion: observacion?.trim() || null,
    })
    .eq('id', id)
    .eq('empresa_id', perfil.empresa_id);

  if (error) return { ok: false as const, error: error.message };
  revalidatePath(RUTA);
  return { ok: true as const };
}

/** El propio colaborador confirma que recibió el elemento — casilla + fecha, mismo mecanismo del Acuerdo de Crecimiento. */
export async function confirmarFirmaDotacion(id: string, buenasCondiciones: boolean) {
  const perfil = await getPerfilActual();
  if (!perfil || perfil.rol !== 'colaborador') return { ok: false as const, error: 'No autorizado' };
  if (!buenasCondiciones) return { ok: false as const, error: 'Confirma que recibiste el elemento en buenas condiciones' };

  const supabase = createClient();
  const { error } = await supabase
    .from('dotacion_entregas')
    .update({ firma_confirmada: true, firmado_en: new Date().toISOString(), buenas_condiciones: true })
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
  if (formData.get('buenasCondiciones') !== 'true') return { ok: false as const, error: 'Confirma que el elemento se recibió en buenas condiciones' };
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

  const { error } = await supabase.from('dotacion_entregas').update({ acta_firmada_url: ruta, buenas_condiciones: true }).eq('id', entregaId);
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
  esVestuarioCalzado: z.boolean().default(false),
  referencia: z.string().trim().optional(),
});

export async function crearArticuloCatalogo(input: z.input<typeof ArticuloSchema>) {
  const perfil = await requerirAdminTh();
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const parsed = ArticuloSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };

  const supabase = createClient();
  const { data, error } = await supabase
    .from('dotacion_catalogo_articulos')
    .insert({
      empresa_id: perfil.empresa_id,
      categoria: parsed.data.categoria,
      nombre: parsed.data.nombre,
      requiere_talla: parsed.data.requiereTalla,
      es_vestuario_calzado: parsed.data.esVestuarioCalzado,
      referencia: parsed.data.referencia || null,
    })
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
  tipo: z.enum(['especie', 'bono_vestuario']).default('especie'),
  excepcionMotivo: z.string().trim().optional(),
});

/** Entrega desde el catálogo: descuenta stock y crea la entrega en una sola operación atómica (fn_entregar_desde_catalogo). */
export async function crearEntregaDesdeCatalogo(input: z.input<typeof EntregaDesdeCatalogoSchema>) {
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
    p_tipo: parsed.data.tipo,
    p_excepcion_motivo: parsed.data.excepcionMotivo || undefined,
  });
  if (error) return { ok: false as const, error: error.message };

  revalidatePath(RUTA);
  revalidatePath(RUTA_CATALOGO);
  return { ok: true as const };
}

/** Marca o desmarca un artículo como vestuario/calzado. Solo ese tipo admite bono de vestuario. */
export async function actualizarVestuarioArticuloCatalogo(articuloId: string, esVestuarioCalzado: boolean) {
  const perfil = await requerirAdminTh();
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const supabase = createClient();
  const { error } = await supabase
    .from('dotacion_catalogo_articulos')
    .update({ es_vestuario_calzado: esVestuarioCalzado })
    .eq('id', articuloId)
    .eq('empresa_id', perfil.empresa_id);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath(RUTA_CATALOGO);
  return { ok: true as const };
}

// ── Kit por cargo ──────────────────────────────────────────────────────────
const KitSchema = z.object({
  cargoId: z.string().uuid('Selecciona un cargo'),
  articuloId: z.string().uuid('Selecciona un artículo'),
  cantidad: z.coerce.number().int().min(1, 'La cantidad debe ser mayor a 0').default(1),
});

/** Define qué artículos del catálogo le corresponden a un cargo. El área define el kit; las fechas siguen siendo las de ley. */
export async function agregarKitCargo(input: z.input<typeof KitSchema>) {
  const perfil = await requerirAdminTh();
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const parsed = KitSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };

  const supabase = createClient();
  const { data, error } = await supabase
    .from('dotacion_kit_cargo')
    .insert({ empresa_id: perfil.empresa_id, cargo_id: parsed.data.cargoId, articulo_id: parsed.data.articuloId, cantidad: parsed.data.cantidad })
    .select('id')
    .single();
  if (error) {
    return { ok: false as const, error: error.code === '23505' ? 'Ese artículo ya está en el kit de este cargo' : error.message };
  }
  revalidatePath(RUTA_CATALOGO);
  revalidatePath(RUTA);
  return { ok: true as const, id: data.id as string };
}

export async function eliminarKitCargo(kitId: string) {
  const perfil = await requerirAdminTh();
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const supabase = createClient();
  const { error } = await supabase.from('dotacion_kit_cargo').delete().eq('id', kitId).eq('empresa_id', perfil.empresa_id);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath(RUTA_CATALOGO);
  revalidatePath(RUTA);
  return { ok: true as const };
}
