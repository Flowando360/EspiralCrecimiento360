'use server';

import { createClient } from '@/lib/supabase/server';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { otorgarPuntos } from '@/lib/nexa/gamificacion';
import { crearAcpm } from '@/app/(dashboard)/procesos-gestion/acpm/actions';
import {
  ACCIONES_PROPUESTA,
  ESTADOS_RETO,
  MAX_CAZAS_CON_PUNTOS,
  PUNTOS_MAKIGAMI,
  TIPOS_DESPERDICIO,
  agruparHallazgos,
  calcularMetricas,
  calcularTiempoFuturo,
  formatearDuracion,
  type Clasificacion,
  type EstadoReto,
} from '@/lib/nexa/makigami';

const RUTA = '/nexa/makigami';

function db() {
  return createClient();
}

function rutaReto(retoId: string) {
  return `${RUTA}/${retoId}`;
}

/**
 * Devuelve el perfil y el reto si quien llama puede facilitarlo: admin_th
 * cualquiera, o el líder que lo creó (misma regla que fn_makigami_puedo_facilitar).
 */
async function requerirFacilitador(retoId: string) {
  const perfil = await getPerfilActual();
  if (!perfil) return null;
  const { data: reto } = await db()
    .from('nexa_makigami_retos')
    .select('id, empresa_id, proceso_id, titulo, estado, creado_por, puntos_caceria_otorgados, puntos_rediseno_otorgados')
    .eq('id', retoId)
    .eq('empresa_id', perfil.empresa_id)
    .maybeSingle();
  if (!reto) return null;
  const puede = perfil.rol === 'admin_th' || (perfil.rol === 'lider' && reto.creado_por === perfil.colaborador_id);
  return puede ? { perfil, reto } : null;
}

async function obtenerRetoDeMiEmpresa(retoId: string) {
  const perfil = await getPerfilActual();
  if (!perfil) return null;
  const { data: reto } = await db()
    .from('nexa_makigami_retos')
    .select('id, estado, creado_por')
    .eq('id', retoId)
    .eq('empresa_id', perfil.empresa_id)
    .maybeSingle();
  return reto ? { perfil, reto } : null;
}

// ----------------------------------------------------------------------------
// Retos
// ----------------------------------------------------------------------------

const RetoSchema = z.object({
  titulo: z.string().trim().min(1, 'El título es requerido'),
  descripcion: z.string().trim().optional(),
  procesoId: z.string().uuid().optional(),
  inicioProceso: z.string().trim().optional(),
  finProceso: z.string().trim().optional(),
  fechaLimite: z.string().trim().optional(),
});

/** Crea un reto en fase de mapeo (admin_th o líder). */
export async function crearReto(input: z.infer<typeof RetoSchema>) {
  const perfil = await getPerfilActual();
  if (!perfil || (perfil.rol !== 'admin_th' && perfil.rol !== 'lider')) return { ok: false as const, error: 'No autorizado' };

  const parsed = RetoSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  const d = parsed.data;

  const { data, error } = await db()
    .from('nexa_makigami_retos')
    .insert({
      empresa_id: perfil.empresa_id,
      proceso_id: d.procesoId || null,
      titulo: d.titulo,
      descripcion: d.descripcion || null,
      inicio_proceso: d.inicioProceso || null,
      fin_proceso: d.finProceso || null,
      fecha_limite: d.fechaLimite || null,
      creado_por: perfil.colaborador_id,
    })
    .select('id')
    .single();

  if (error) return { ok: false as const, error: error.message };
  revalidatePath(RUTA);
  return { ok: true as const, id: data.id as string };
}

/** Edita los datos generales de un reto (facilitador). */
export async function actualizarReto(retoId: string, input: z.infer<typeof RetoSchema>) {
  const ctx = await requerirFacilitador(retoId);
  if (!ctx) return { ok: false as const, error: 'No autorizado' };

  const parsed = RetoSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  const d = parsed.data;

  const { error } = await db()
    .from('nexa_makigami_retos')
    .update({
      proceso_id: d.procesoId || null,
      titulo: d.titulo,
      descripcion: d.descripcion || null,
      inicio_proceso: d.inicioProceso || null,
      fin_proceso: d.finProceso || null,
      fecha_limite: d.fechaLimite || null,
    })
    .eq('id', retoId);

  if (error) return { ok: false as const, error: error.message };
  revalidatePath(RUTA);
  revalidatePath(rutaReto(retoId));
  return { ok: true as const };
}

/** Elimina un reto con todo su mapa, cazas y propuestas (facilitador). Los puntos ya otorgados se conservan. */
export async function eliminarReto(retoId: string) {
  const ctx = await requerirFacilitador(retoId);
  if (!ctx) return { ok: false as const, error: 'No autorizado' };

  const { error } = await db().from('nexa_makigami_retos').delete().eq('id', retoId);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath(RUTA);
  return { ok: true as const };
}

/** Entrega en lote los puntos de la cacería (una sola vez por reto). */
async function pagarPuntosCaceria(retoId: string, titulo: string, otorgadoPor: string) {
  const { data: cazas } = await db()
    .from('nexa_makigami_cazas')
    .select('paso_id, colaborador_id, tipo_desperdicio, created_at')
    .eq('reto_id', retoId);

  const lista = (cazas ?? []) as { paso_id: string; colaborador_id: string; tipo_desperdicio: string; created_at: string }[];
  const porPersona = new Map<string, { cazas: number; validados: number }>();
  const obtener = (id: string) => {
    let v = porPersona.get(id);
    if (!v) porPersona.set(id, (v = { cazas: 0, validados: 0 }));
    return v;
  };
  for (const c of lista) obtener(c.colaborador_id).cazas++;
  for (const h of agruparHallazgos(lista)) if (h.validado) obtener(h.pioneroId).validados++;

  for (const [colaboradorId, v] of porPersona) {
    const puntos =
      Math.min(v.cazas, MAX_CAZAS_CON_PUNTOS) * PUNTOS_MAKIGAMI.cazarDesperdicio + v.validados * PUNTOS_MAKIGAMI.hallazgoValidado;
    if (puntos <= 0) continue;
    const detalle = v.validados > 0 ? ` (${v.validados} como pionero validado)` : '';
    await otorgarPuntos(colaboradorId, puntos, `Cacería Makigami «${titulo}»: ${v.cazas} desperdicios cazados${detalle}`, otorgadoPor);
  }
  await db().from('nexa_makigami_retos').update({ puntos_caceria_otorgados: true }).eq('id', retoId);
}

/** Entrega en lote los puntos por proponer mejoras (una sola vez por reto). */
async function pagarPuntosRediseno(retoId: string, titulo: string, otorgadoPor: string) {
  const { data: propuestas } = await db()
    .from('nexa_makigami_propuestas')
    .select('colaborador_id, estado')
    .eq('reto_id', retoId)
    .neq('estado', 'descartada');

  const porPersona = new Map<string, number>();
  for (const p of (propuestas ?? []) as { colaborador_id: string }[]) {
    porPersona.set(p.colaborador_id, (porPersona.get(p.colaborador_id) ?? 0) + 1);
  }
  for (const [colaboradorId, n] of porPersona) {
    await otorgarPuntos(
      colaboradorId,
      n * PUNTOS_MAKIGAMI.proponerMejora,
      `Cacería Makigami «${titulo}»: ${n} ${n === 1 ? 'propuesta' : 'propuestas'} de mejora`,
      otorgadoPor
    );
  }
  await db().from('nexa_makigami_retos').update({ puntos_rediseno_otorgados: true }).eq('id', retoId);
}

/**
 * Mueve el reto de fase. Al abrir la cacería publica un anuncio en el Feed;
 * al salir de ella paga los puntos de cazar; al cerrar paga los de proponer y
 * publica el logro con el antes/después del proceso.
 */
export async function cambiarEstadoReto(retoId: string, estado: EstadoReto) {
  if (!ESTADOS_RETO.includes(estado)) return { ok: false as const, error: 'Estado inválido' };
  const ctx = await requerirFacilitador(retoId);
  if (!ctx) return { ok: false as const, error: 'No autorizado' };
  const { perfil, reto } = ctx;
  if (reto.estado === estado) return { ok: true as const };

  const sb = db();
  const { data: pasos } = await sb
    .from('nexa_makigami_pasos')
    .select('id, tiempo_trabajo_min, tiempo_espera_min, clasificacion')
    .eq('reto_id', retoId);
  if (estado !== 'mapeo' && (!pasos || pasos.length < 2)) {
    return { ok: false as const, error: 'Dibuja al menos 2 pasos del proceso antes de abrir la cacería.' };
  }

  const { error } = await sb
    .from('nexa_makigami_retos')
    .update({ estado, cerrado_en: estado === 'cerrado' ? new Date().toISOString() : null })
    .eq('id', retoId);
  if (error) return { ok: false as const, error: error.message };

  const saleDeCaceria = estado === 'rediseno' || estado === 'cerrado';
  if (saleDeCaceria && !reto.puntos_caceria_otorgados && reto.estado !== 'mapeo') {
    await pagarPuntosCaceria(retoId, reto.titulo, perfil.usuario_id);
  }
  if (estado === 'cerrado' && !reto.puntos_rediseno_otorgados) {
    await pagarPuntosRediseno(retoId, reto.titulo, perfil.usuario_id);
  }

  if (estado === 'caceria' && reto.estado === 'mapeo') {
    await sb.from('nexa_feed_publicaciones').insert({
      empresa_id: perfil.empresa_id,
      autor_id: perfil.usuario_id,
      tipo: 'anuncio',
      titulo: `🎯 ¡Abrió la Cacería Makigami: ${reto.titulo}!`,
      contenido: `Mapeamos un proceso real y necesitamos tus ojos: entra, recorre los ${pasos!.length} pasos y caza los desperdicios que veas (esperas, reprocesos, doble digitación…). El primero en ver un desperdicio que el equipo confirme gana puntos extra.`,
      tipo_adjunto: 'link',
      link_url: rutaReto(retoId),
      link_preview_titulo: reto.titulo,
      link_preview_descripcion: 'Entrar a la cacería',
    });
    revalidatePath('/nexa/feed');
  }

  if (estado === 'cerrado') {
    const { data: aprobadas } = await sb
      .from('nexa_makigami_propuestas')
      .select('ahorro_estimado_min')
      .eq('reto_id', retoId)
      .eq('estado', 'aprobada');
    const metricas = calcularMetricas((pasos ?? []) as { id: string; tiempo_trabajo_min: number; tiempo_espera_min: number; clasificacion: Clasificacion | null }[]);
    const ahorro = ((aprobadas ?? []) as { ahorro_estimado_min: number }[]).reduce((s, p) => s + (Number(p.ahorro_estimado_min) || 0), 0);
    const futuro = calcularTiempoFuturo(metricas, ahorro);
    const nMejoras = aprobadas?.length ?? 0;
    if (nMejoras > 0 && metricas.tiempoTotal > futuro) {
      const pct = Math.round(((metricas.tiempoTotal - futuro) / metricas.tiempoTotal) * 100);
      await sb.from('nexa_feed_publicaciones').insert({
        empresa_id: perfil.empresa_id,
        autor_id: perfil.usuario_id,
        tipo: 'logro',
        titulo: `🎉 ${reto.titulo}: de ${formatearDuracion(metricas.tiempoTotal)} a ${formatearDuracion(futuro)}`,
        contenido: `Gracias a la Cacería Makigami, el equipo aprobó ${nMejoras} ${nMejoras === 1 ? 'mejora' : 'mejoras'} que reducen el proceso un ${pct}%. ¡Mira quiénes lo hicieron posible!`,
        tipo_adjunto: 'link',
        link_url: rutaReto(retoId),
        link_preview_titulo: reto.titulo,
        link_preview_descripcion: 'Ver resultados',
      });
      revalidatePath('/nexa/feed');
    }
  }

  revalidatePath(RUTA);
  revalidatePath(rutaReto(retoId));
  revalidatePath('/nexa/reconocimientos');
  return { ok: true as const };
}

// ----------------------------------------------------------------------------
// Mapa: carriles y pasos (facilitador, solo en fase de mapeo)
// ----------------------------------------------------------------------------

async function requerirMapeo(retoId: string) {
  const ctx = await requerirFacilitador(retoId);
  if (!ctx) return { error: 'No autorizado' as const };
  if (ctx.reto.estado !== 'mapeo') return { error: 'El mapa solo se edita en la fase de Mapeo. Regresa el reto a Mapeo para cambiarlo.' as const };
  return { ctx };
}

const CarrilSchema = z.object({
  retoId: z.string().uuid(),
  id: z.string().uuid().optional(),
  nombre: z.string().trim().min(1, 'El nombre del carril es requerido'),
});

export async function guardarCarril(input: z.infer<typeof CarrilSchema>) {
  const parsed = CarrilSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  const d = parsed.data;
  const r = await requerirMapeo(d.retoId);
  if ('error' in r) return { ok: false as const, error: r.error };

  const sb = db();
  if (d.id) {
    const { error } = await sb.from('nexa_makigami_carriles').update({ nombre: d.nombre }).eq('id', d.id).eq('reto_id', d.retoId);
    if (error) return { ok: false as const, error: error.message };
  } else {
    const { data: ultimo } = await sb
      .from('nexa_makigami_carriles')
      .select('orden')
      .eq('reto_id', d.retoId)
      .order('orden', { ascending: false })
      .limit(1)
      .maybeSingle();
    const { error } = await sb.from('nexa_makigami_carriles').insert({ reto_id: d.retoId, nombre: d.nombre, orden: (ultimo?.orden ?? 0) + 1 });
    if (error) return { ok: false as const, error: error.message };
  }
  revalidatePath(rutaReto(d.retoId));
  return { ok: true as const };
}

export async function eliminarCarril(retoId: string, carrilId: string) {
  const r = await requerirMapeo(retoId);
  if ('error' in r) return { ok: false as const, error: r.error };
  const { error } = await db().from('nexa_makigami_carriles').delete().eq('id', carrilId).eq('reto_id', retoId);
  if (error) return { ok: false as const, error: error.message };
  await renumerarPasos(retoId);
  revalidatePath(rutaReto(retoId));
  return { ok: true as const };
}

/** Intercambia el orden de un carril con su vecino de arriba (-1) o de abajo (+1). */
export async function moverCarril(retoId: string, carrilId: string, direccion: -1 | 1) {
  const r = await requerirMapeo(retoId);
  if ('error' in r) return { ok: false as const, error: r.error };
  const sb = db();
  const { data } = await sb.from('nexa_makigami_carriles').select('id, orden').eq('reto_id', retoId).order('orden');
  const lista = (data ?? []) as { id: string; orden: number }[];
  const i = lista.findIndex((c) => c.id === carrilId);
  const j = i + direccion;
  if (i < 0 || j < 0 || j >= lista.length) return { ok: true as const };
  [lista[i], lista[j]] = [lista[j]!, lista[i]!];
  await Promise.all(lista.map((c, idx) => sb.from('nexa_makigami_carriles').update({ orden: idx + 1 }).eq('id', c.id)));
  revalidatePath(rutaReto(retoId));
  return { ok: true as const };
}

/** Deja el orden de los pasos como 1..n sin huecos. */
async function renumerarPasos(retoId: string) {
  const sb = db();
  const { data } = await sb.from('nexa_makigami_pasos').select('id, orden').eq('reto_id', retoId).order('orden').order('created_at');
  const lista = (data ?? []) as { id: string; orden: number }[];
  await Promise.all(
    lista.map((p, idx) => (p.orden === idx + 1 ? null : sb.from('nexa_makigami_pasos').update({ orden: idx + 1 }).eq('id', p.id)))
  );
}

const PasoSchema = z.object({
  retoId: z.string().uuid(),
  id: z.string().uuid().optional(),
  carrilId: z.string().uuid({ message: 'Elige quién hace el paso' }),
  descripcion: z.string().trim().min(1, 'Describe el paso'),
  tiempoTrabajoMin: z.number().min(0),
  tiempoEsperaMin: z.number().min(0),
  documentoSistema: z.string().trim().optional(),
  clasificacion: z.enum(['agrega_valor', 'necesaria', 'desperdicio']).nullable().optional(),
  /** Posición donde insertarlo (1..n+1). Sin valor = al final. */
  posicion: z.number().int().min(1).optional(),
});

export async function guardarPaso(input: z.infer<typeof PasoSchema>) {
  const parsed = PasoSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  const d = parsed.data;
  const r = await requerirMapeo(d.retoId);
  if ('error' in r) return { ok: false as const, error: r.error };

  const sb = db();
  const valores = {
    carril_id: d.carrilId,
    descripcion: d.descripcion,
    tiempo_trabajo_min: d.tiempoTrabajoMin,
    tiempo_espera_min: d.tiempoEsperaMin,
    documento_sistema: d.documentoSistema || null,
    clasificacion: d.clasificacion ?? null,
  };

  if (d.id) {
    const { error } = await sb.from('nexa_makigami_pasos').update(valores).eq('id', d.id).eq('reto_id', d.retoId);
    if (error) return { ok: false as const, error: error.message };
  } else {
    const { data: existentes } = await sb.from('nexa_makigami_pasos').select('id, orden').eq('reto_id', d.retoId).order('orden');
    const lista = (existentes ?? []) as { id: string; orden: number }[];
    const posicion = Math.min(d.posicion ?? lista.length + 1, lista.length + 1);
    // Abre el hueco corriendo una posición los pasos que quedan después.
    await Promise.all(
      lista.filter((p) => p.orden >= posicion).map((p) => sb.from('nexa_makigami_pasos').update({ orden: p.orden + 1 }).eq('id', p.id))
    );
    const { error } = await sb.from('nexa_makigami_pasos').insert({ ...valores, reto_id: d.retoId, orden: posicion });
    if (error) return { ok: false as const, error: error.message };
  }
  revalidatePath(rutaReto(d.retoId));
  return { ok: true as const };
}

export async function eliminarPaso(retoId: string, pasoId: string) {
  const r = await requerirMapeo(retoId);
  if ('error' in r) return { ok: false as const, error: r.error };
  const { error } = await db().from('nexa_makigami_pasos').delete().eq('id', pasoId).eq('reto_id', retoId);
  if (error) return { ok: false as const, error: error.message };
  await renumerarPasos(retoId);
  revalidatePath(rutaReto(retoId));
  return { ok: true as const };
}

/** Mueve un paso una posición antes (-1) o después (+1) en la secuencia. */
export async function moverPaso(retoId: string, pasoId: string, direccion: -1 | 1) {
  const r = await requerirMapeo(retoId);
  if ('error' in r) return { ok: false as const, error: r.error };
  const sb = db();
  const { data } = await sb.from('nexa_makigami_pasos').select('id, orden').eq('reto_id', retoId).order('orden');
  const lista = (data ?? []) as { id: string; orden: number }[];
  const i = lista.findIndex((p) => p.id === pasoId);
  const j = i + direccion;
  if (i < 0 || j < 0 || j >= lista.length) return { ok: true as const };
  [lista[i], lista[j]] = [lista[j]!, lista[i]!];
  await Promise.all(lista.map((p, idx) => sb.from('nexa_makigami_pasos').update({ orden: idx + 1 }).eq('id', p.id)));
  revalidatePath(rutaReto(retoId));
  return { ok: true as const };
}

// ----------------------------------------------------------------------------
// Cacería (cualquier persona con ficha de colaborador, fase de cacería)
// ----------------------------------------------------------------------------

const CazaSchema = z.object({
  retoId: z.string().uuid(),
  pasoId: z.string().uuid(),
  tipo: z.enum(TIPOS_DESPERDICIO as [string, ...string[]]),
  comentario: z.string().trim().max(500).optional(),
});

/** Marca (o desmarca, si ya estaba) un desperdicio en un paso. */
export async function alternarCaza(input: z.infer<typeof CazaSchema>) {
  const parsed = CazaSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: 'Datos inválidos' };
  const d = parsed.data;

  const ctx = await obtenerRetoDeMiEmpresa(d.retoId);
  if (!ctx) return { ok: false as const, error: 'Reto no encontrado' };
  if (ctx.reto.estado !== 'caceria') return { ok: false as const, error: 'La cacería no está abierta.' };
  const colaboradorId = ctx.perfil.colaborador_id;
  if (!colaboradorId) return { ok: false as const, error: 'Tu usuario no tiene ficha de colaborador, así que no puede cazar.' };

  const sb = db();
  const { data: existente } = await sb
    .from('nexa_makigami_cazas')
    .select('id')
    .eq('paso_id', d.pasoId)
    .eq('colaborador_id', colaboradorId)
    .eq('tipo_desperdicio', d.tipo)
    .maybeSingle();

  if (existente) {
    const { error } = await sb.from('nexa_makigami_cazas').delete().eq('id', existente.id);
    if (error) return { ok: false as const, error: error.message };
  } else {
    const { error } = await sb.from('nexa_makigami_cazas').insert({
      reto_id: d.retoId,
      paso_id: d.pasoId,
      colaborador_id: colaboradorId,
      tipo_desperdicio: d.tipo,
      comentario: d.comentario || null,
    });
    if (error) return { ok: false as const, error: error.message };
  }
  revalidatePath(rutaReto(d.retoId));
  return { ok: true as const, marcado: !existente };
}

// ----------------------------------------------------------------------------
// Rediseño: propuestas y votos
// ----------------------------------------------------------------------------

const PropuestaSchema = z.object({
  retoId: z.string().uuid(),
  pasoId: z.string().uuid().optional(),
  accion: z.enum(Object.keys(ACCIONES_PROPUESTA) as [string, ...string[]]),
  descripcion: z.string().trim().min(1, 'Describe tu propuesta'),
  ahorroEstimadoMin: z.number().min(0),
});

export async function proponerMejora(input: z.infer<typeof PropuestaSchema>) {
  const parsed = PropuestaSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  const d = parsed.data;

  const ctx = await obtenerRetoDeMiEmpresa(d.retoId);
  if (!ctx) return { ok: false as const, error: 'Reto no encontrado' };
  if (ctx.reto.estado !== 'rediseno') return { ok: false as const, error: 'Las propuestas se reciben en la fase de Rediseño.' };
  if (!ctx.perfil.colaborador_id) return { ok: false as const, error: 'Tu usuario no tiene ficha de colaborador.' };

  const { error } = await db().from('nexa_makigami_propuestas').insert({
    reto_id: d.retoId,
    paso_id: d.pasoId || null,
    colaborador_id: ctx.perfil.colaborador_id,
    accion: d.accion,
    descripcion: d.descripcion,
    ahorro_estimado_min: d.ahorroEstimadoMin,
  });
  if (error) return { ok: false as const, error: error.message };
  revalidatePath(rutaReto(d.retoId));
  return { ok: true as const };
}

export async function eliminarPropuesta(retoId: string, propuestaId: string) {
  const ctx = await obtenerRetoDeMiEmpresa(retoId);
  if (!ctx) return { ok: false as const, error: 'Reto no encontrado' };
  // RLS decide: el autor mientras siga en "propuesta", o el facilitador.
  const { error } = await db().from('nexa_makigami_propuestas').delete().eq('id', propuestaId).eq('reto_id', retoId);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath(rutaReto(retoId));
  return { ok: true as const };
}

export async function alternarVoto(retoId: string, propuestaId: string) {
  const ctx = await obtenerRetoDeMiEmpresa(retoId);
  if (!ctx) return { ok: false as const, error: 'Reto no encontrado' };
  if (ctx.reto.estado !== 'rediseno') return { ok: false as const, error: 'La votación está cerrada.' };
  const colaboradorId = ctx.perfil.colaborador_id;
  if (!colaboradorId) return { ok: false as const, error: 'Tu usuario no tiene ficha de colaborador.' };

  const sb = db();
  const { data: propuesta } = await sb.from('nexa_makigami_propuestas').select('colaborador_id').eq('id', propuestaId).maybeSingle();
  if (!propuesta) return { ok: false as const, error: 'Propuesta no encontrada' };
  if (propuesta.colaborador_id === colaboradorId) return { ok: false as const, error: 'No puedes votar tu propia propuesta.' };

  const { data: voto } = await sb
    .from('nexa_makigami_votos')
    .select('propuesta_id')
    .eq('propuesta_id', propuestaId)
    .eq('colaborador_id', colaboradorId)
    .maybeSingle();
  const { error } = voto
    ? await sb.from('nexa_makigami_votos').delete().eq('propuesta_id', propuestaId).eq('colaborador_id', colaboradorId)
    : await sb.from('nexa_makigami_votos').insert({ propuesta_id: propuestaId, colaborador_id: colaboradorId });
  if (error) return { ok: false as const, error: error.message };
  revalidatePath(rutaReto(retoId));
  return { ok: true as const };
}

/** Aprueba, descarta o devuelve a "propuesta" una mejora (facilitador). Paga la aprobación una sola vez. */
export async function resolverPropuesta(retoId: string, propuestaId: string, estado: 'propuesta' | 'aprobada' | 'descartada') {
  const ctx = await requerirFacilitador(retoId);
  if (!ctx) return { ok: false as const, error: 'No autorizado' };
  if (ctx.reto.estado === 'mapeo') return { ok: false as const, error: 'El reto todavía está en Mapeo.' };

  const sb = db();
  const { data: propuesta } = await sb
    .from('nexa_makigami_propuestas')
    .select('id, colaborador_id, descripcion, acpm_id, puntos_aprobacion_otorgados')
    .eq('id', propuestaId)
    .eq('reto_id', retoId)
    .maybeSingle();
  if (!propuesta) return { ok: false as const, error: 'Propuesta no encontrada' };
  if (propuesta.acpm_id && estado !== 'aprobada') {
    return { ok: false as const, error: 'Esta propuesta ya tiene una ACPM; gestiónala desde Procesos → ACPM.' };
  }

  const pagar = estado === 'aprobada' && !propuesta.puntos_aprobacion_otorgados;
  const { error } = await sb
    .from('nexa_makigami_propuestas')
    .update({ estado, ...(pagar ? { puntos_aprobacion_otorgados: true } : {}) })
    .eq('id', propuestaId);
  if (error) return { ok: false as const, error: error.message };

  if (pagar) {
    await otorgarPuntos(
      propuesta.colaborador_id,
      PUNTOS_MAKIGAMI.propuestaAprobada,
      `Cacería Makigami «${ctx.reto.titulo}»: propuesta de mejora aprobada`,
      ctx.perfil.usuario_id
    );
    revalidatePath('/nexa/reconocimientos');
  }
  revalidatePath(rutaReto(retoId));
  return { ok: true as const };
}

/**
 * Convierte una propuesta aprobada en una ACPM de mejora en Procesos, con el
 * autor como responsable. Solo admin_th (crear ACPM sigue siendo exclusivo de ese rol).
 */
export async function crearAcpmDesdePropuesta(retoId: string, propuestaId: string) {
  const ctx = await requerirFacilitador(retoId);
  if (!ctx || ctx.perfil.rol !== 'admin_th') return { ok: false as const, error: 'Solo Talento Humano (admin_th) puede crear ACPM.' };

  const sb = db();
  const { data: propuesta } = await sb
    .from('nexa_makigami_propuestas')
    .select('id, colaborador_id, accion, descripcion, estado, acpm_id, paso:paso_id(descripcion)')
    .eq('id', propuestaId)
    .eq('reto_id', retoId)
    .maybeSingle();
  if (!propuesta) return { ok: false as const, error: 'Propuesta no encontrada' };
  if (propuesta.estado !== 'aprobada') return { ok: false as const, error: 'Primero aprueba la propuesta.' };
  if (propuesta.acpm_id) return { ok: false as const, error: 'Esta propuesta ya tiene una ACPM.' };

  const accion = ACCIONES_PROPUESTA[propuesta.accion as keyof typeof ACCIONES_PROPUESTA] ?? 'Mejora';
  const res = await crearAcpm({
    procesoId: ctx.reto.proceso_id || undefined,
    origenTipo: 'mejora_propia',
    origenDetalle: `Cacería Makigami «${ctx.reto.titulo}»${propuesta.paso?.descripcion ? ` — paso: ${propuesta.paso.descripcion}` : ''}`,
    tipoAccion: 'mejora',
    descripcion: `${accion}: ${propuesta.descripcion}`,
    responsableId: propuesta.colaborador_id,
  });
  if (!res.ok) return res;

  await sb.from('nexa_makigami_propuestas').update({ acpm_id: res.id }).eq('id', propuestaId);
  revalidatePath(rutaReto(retoId));
  return { ok: true as const, codigo: res.codigo };
}
