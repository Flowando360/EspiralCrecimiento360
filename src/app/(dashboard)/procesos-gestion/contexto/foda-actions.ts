'use server';

import { createClient } from '@/lib/supabase/server';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { puedeAdministrar } from '@/lib/permisos/administracion';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { crearRiesgo } from '@/app/(dashboard)/procesos-gestion/actions';
import { generarEstrategiasIA, priorizarFactoresIA, type FactorEntrada } from '@/lib/contexto/ia-foda';

const RUTA = '/procesos-gestion/contexto';

async function requerirAdmin() {
  const perfil = await getPerfilActual();
  return perfil && puedeAdministrar(perfil) ? perfil : null;
}

/** Trae los factores del análisis (solo si es de la empresa del usuario) en un orden estable. */
async function cargarFactores(supabase: ReturnType<typeof createClient>, analisisId: string, empresaId: string) {
  const { data: analisis } = await supabase.from('analisis_contexto').select('id, fecha').eq('id', analisisId).eq('empresa_id', empresaId).maybeSingle();
  if (!analisis) return null;
  const { data: items } = await supabase.from('contexto_items').select('id, tipo, descripcion').eq('analisis_id', analisisId).order('created_at');
  const { data: empresa } = await supabase.from('empresas').select('nombre').eq('id', empresaId).maybeSingle();
  return { analisis, items: (items ?? []) as { id: string; tipo: FactorEntrada['tipo']; descripcion: string }[], empresa: empresa?.nombre ?? 'la empresa' };
}

// ── Priorización ─────────────────────────────────────────────────────────────

const PriorizacionSchema = z.object({
  id: z.string().uuid(),
  impacto: z.number().int().min(1).max(3).nullable(),
  probabilidad: z.number().int().min(1).max(3).nullable(),
});

export async function guardarPriorizacionItem(input: z.infer<typeof PriorizacionSchema>) {
  const perfil = await requerirAdmin();
  if (!perfil) return { ok: false as const, error: 'No autorizado' };
  const parsed = PriorizacionSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: 'Datos inválidos' };

  const supabase = createClient();
  // RLS ya acota por empresa; se valida además que el ítem pertenezca a un análisis propio.
  const { data: item } = await supabase.from('contexto_items').select('id, analisis:analisis_id(empresa_id)').eq('id', parsed.data.id).maybeSingle();
  if (!item || (item as any).analisis?.empresa_id !== perfil.empresa_id) return { ok: false as const, error: 'Ítem no encontrado' };

  const { error } = await supabase.from('contexto_items').update({ impacto: parsed.data.impacto, probabilidad: parsed.data.probabilidad }).eq('id', parsed.data.id);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath(RUTA);
  return { ok: true as const };
}

/** La IA propone impacto, probabilidad y qué hacer con cada factor; se guarda como propuesta editable. */
export async function priorizarConIA(analisisId: string) {
  const perfil = await requerirAdmin();
  if (!perfil) return { ok: false as const, error: 'No autorizado' };
  const supabase = createClient();
  const datos = await cargarFactores(supabase, analisisId, perfil.empresa_id);
  if (!datos) return { ok: false as const, error: 'Análisis no encontrado' };
  if (datos.items.length < 2) return { ok: false as const, error: 'Agrega al menos dos factores al análisis para poder priorizarlos.' };

  const res = await priorizarFactoresIA(datos.empresa, datos.items);
  if (!res.ok) return res;

  for (const p of res.items) {
    const item = datos.items[p.indice - 1]!;
    await supabase.from('contexto_items').update({ impacto: p.impacto, probabilidad: p.probabilidad, sugerencia_ia: p.sugerencia || null }).eq('id', item.id);
  }
  revalidatePath(RUTA);
  return { ok: true as const, priorizados: res.items.length };
}

// ── Estrategias ──────────────────────────────────────────────────────────────

/** La IA propone estrategias cruzadas. Se guardan en estado «propuesta»: nada se aplica solo. */
export async function generarEstrategiasConIA(analisisId: string) {
  const perfil = await requerirAdmin();
  if (!perfil) return { ok: false as const, error: 'No autorizado' };
  const supabase = createClient();
  const datos = await cargarFactores(supabase, analisisId, perfil.empresa_id);
  if (!datos) return { ok: false as const, error: 'Análisis no encontrado' };

  const tiene = (t: string) => datos.items.some((i) => i.tipo === t);
  if (!tiene('fortaleza') && !tiene('debilidad')) return { ok: false as const, error: 'Registra al menos una fortaleza o una debilidad.' };
  if (!tiene('oportunidad') && !tiene('amenaza')) return { ok: false as const, error: 'Registra al menos una oportunidad o una amenaza.' };

  const res = await generarEstrategiasIA(datos.empresa, datos.items);
  if (!res.ok) return res;

  const filas = res.estrategias.map((e) => ({
    analisis_id: analisisId,
    tipo: e.tipo,
    descripcion: e.descripcion,
    item_ids: e.indices.map((i) => datos.items[i - 1]!.id),
    origen: 'ia',
    estado: 'propuesta',
  }));
  const { error } = await supabase.from('contexto_estrategias').insert(filas);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath(RUTA);
  return { ok: true as const, creadas: filas.length };
}

const EstrategiaSchema = z.object({
  analisisId: z.string().uuid(),
  tipo: z.enum(['fo', 'fa', 'do', 'da']),
  descripcion: z.string().trim().min(1, 'Describe la estrategia').max(600),
  itemIds: z.array(z.string().uuid()).max(30),
});

export async function crearEstrategiaManual(input: z.infer<typeof EstrategiaSchema>) {
  const perfil = await requerirAdmin();
  if (!perfil) return { ok: false as const, error: 'No autorizado' };
  const parsed = EstrategiaSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };

  const supabase = createClient();
  const datos = await cargarFactores(supabase, parsed.data.analisisId, perfil.empresa_id);
  if (!datos) return { ok: false as const, error: 'Análisis no encontrado' };
  const validos = new Set(datos.items.map((i) => i.id));
  const itemIds = parsed.data.itemIds.filter((id) => validos.has(id));

  const { error } = await supabase.from('contexto_estrategias').insert({
    analisis_id: parsed.data.analisisId,
    tipo: parsed.data.tipo,
    descripcion: parsed.data.descripcion,
    item_ids: itemIds,
    origen: 'manual',
    estado: 'aprobada',
  });
  if (error) return { ok: false as const, error: error.message };
  revalidatePath(RUTA);
  return { ok: true as const };
}

export async function actualizarEstadoEstrategia(id: string, estado: 'propuesta' | 'aprobada' | 'descartada') {
  const perfil = await requerirAdmin();
  if (!perfil) return { ok: false as const, error: 'No autorizado' };
  if (!z.string().uuid().safeParse(id).success || !['propuesta', 'aprobada', 'descartada'].includes(estado)) return { ok: false as const, error: 'Datos inválidos' };
  const supabase = createClient();
  const { error } = await supabase.from('contexto_estrategias').update({ estado }).eq('id', id);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath(RUTA);
  return { ok: true as const };
}

export async function eliminarEstrategia(id: string) {
  const perfil = await requerirAdmin();
  if (!perfil) return { ok: false as const, error: 'No autorizado' };
  const supabase = createClient();
  const { error } = await supabase.from('contexto_estrategias').delete().eq('id', id);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath(RUTA);
  return { ok: true as const };
}

// ── Conexión con otros módulos ───────────────────────────────────────────────

/** Convierte una debilidad, amenaza u oportunidad en un riesgo/oportunidad formal de la matriz de Riesgos y oportunidades. */
export async function convertirItemEnRiesgo(itemId: string) {
  const perfil = await requerirAdmin();
  if (!perfil) return { ok: false as const, error: 'No autorizado' };
  const supabase = createClient();

  const { data: item } = await supabase
    .from('contexto_items')
    .select('id, tipo, descripcion, impacto, probabilidad, riesgo_id, analisis:analisis_id(empresa_id)')
    .eq('id', itemId)
    .maybeSingle();
  if (!item || (item as any).analisis?.empresa_id !== perfil.empresa_id) return { ok: false as const, error: 'Ítem no encontrado' };
  if (item.riesgo_id) return { ok: false as const, error: 'Este factor ya se convirtió en un riesgo' };
  if (item.tipo === 'fortaleza') return { ok: false as const, error: 'Una fortaleza no se convierte en riesgo' };

  const res = await crearRiesgo({
    marcoNormativo: 'interno',
    tipo: item.tipo === 'oportunidad' ? 'oportunidad' : 'riesgo',
    riesgo: item.descripcion,
    consecuencia: `Surge del análisis FODA (${item.tipo}).`,
    categoria: 'estrategico',
    gradoImpacto: item.impacto ?? 2,
    gradoProbabilidad: item.probabilidad ?? 2,
  });
  if (!res.ok) return { ok: false as const, error: res.error };

  const { error } = await supabase.from('contexto_items').update({ riesgo_id: res.id }).eq('id', itemId);
  if (error) return { ok: false as const, error: `El riesgo se creó pero no se pudo vincular: ${error.message}` };
  revalidatePath(RUTA);
  return { ok: true as const };
}

/** Lleva una estrategia al plan de trabajo anual como una actividad programada. */
export async function crearActividadDesdeEstrategia(estrategiaId: string, fechaProgramada: string) {
  const perfil = await requerirAdmin();
  if (!perfil) return { ok: false as const, error: 'No autorizado' };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fechaProgramada)) return { ok: false as const, error: 'Elige la fecha en que se programará' };

  const supabase = createClient();
  const { data: est } = await supabase
    .from('contexto_estrategias')
    .select('id, tipo, descripcion, actividad_id, analisis:analisis_id(empresa_id, fecha)')
    .eq('id', estrategiaId)
    .maybeSingle();
  if (!est || (est as any).analisis?.empresa_id !== perfil.empresa_id) return { ok: false as const, error: 'Estrategia no encontrada' };
  if (est.actividad_id) return { ok: false as const, error: 'Esta estrategia ya está en el plan de trabajo' };

  const etiqueta = est.tipo.toUpperCase();
  const { data: act, error } = await supabase
    .from('plan_trabajo_actividades')
    .insert({
      empresa_id: perfil.empresa_id,
      nombre: `Estrategia ${etiqueta}: ${est.descripcion}`.slice(0, 200),
      tipo: 'otra',
      sistema: 'otro',
      fecha_programada: fechaProgramada,
      estado: 'programada',
      notas: `Estrategia ${etiqueta} del análisis FODA del ${(est as any).analisis?.fecha}: ${est.descripcion}`,
      creado_por: perfil.usuario_id,
    })
    .select('id')
    .single();
  if (error || !act) return { ok: false as const, error: error?.message ?? 'No se pudo crear la actividad' };

  await supabase.from('contexto_estrategias').update({ actividad_id: act.id, estado: 'aprobada' }).eq('id', estrategiaId);
  revalidatePath(RUTA);
  revalidatePath('/procesos-gestion/plan-trabajo');
  return { ok: true as const };
}
