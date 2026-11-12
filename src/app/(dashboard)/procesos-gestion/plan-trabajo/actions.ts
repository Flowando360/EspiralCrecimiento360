'use server';

import { createClient } from '@/lib/supabase/server';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { crearAcpm } from '@/app/(dashboard)/procesos-gestion/acpm/actions';
import { TIPOS_ACTIVIDAD, SISTEMAS, ESTADOS_ACTIVIDAD, POBLACIONES } from '@/lib/plan-trabajo/catalogos';

const RUTA = '/procesos-gestion/plan-trabajo';

const valores = <T extends readonly { value: string }[]>(l: T) => l.map((x) => x.value) as [string, ...string[]];

const opcionalNum = (max: number) => z.number().min(0).max(max).nullable().optional();

const ActividadSchema = z.object({
  nombre: z.string().trim().min(1, 'El nombre de la actividad es requerido').max(200),
  tipo: z.enum(valores(TIPOS_ACTIVIDAD)),
  sistema: z.enum(valores(SISTEMAS)),
  fechaProgramada: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha programada es requerida'),
  fechaEjecutada: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional().or(z.literal('')),
  responsableId: z.string().uuid().nullable().optional().or(z.literal('')),
  poblacionTipo: z.enum(valores(POBLACIONES)),
  poblacionDetalle: z.string().trim().max(200).optional(),
  personasObjetivo: opcionalNum(1_000_000),
  personasAlcanzadas: opcionalNum(1_000_000),
  horas: opcionalNum(100_000),
  presupuestoEstimado: opcionalNum(1e12),
  presupuestoEjecutado: opcionalNum(1e12),
  aliadoId: z.string().uuid().nullable().optional().or(z.literal('')),
  estado: z.enum(valores(ESTADOS_ACTIVIDAD)),
  calificacion: opcionalNum(10),
  notas: z.string().trim().max(2000).optional(),
});

type EntradaActividad = z.infer<typeof ActividadSchema>;

function aFila(d: EntradaActividad) {
  return {
    nombre: d.nombre,
    tipo: d.tipo,
    sistema: d.sistema,
    fecha_programada: d.fechaProgramada,
    // Si se marca ejecutada y no se puso fecha, se toma la de hoy.
    fecha_ejecutada: d.fechaEjecutada || (d.estado === 'ejecutada' ? new Date().toISOString().slice(0, 10) : null),
    responsable_id: d.responsableId || null,
    poblacion_tipo: d.poblacionTipo,
    poblacion_detalle: d.poblacionTipo === 'todos' ? null : d.poblacionDetalle || null,
    personas_objetivo: d.personasObjetivo ?? null,
    personas_alcanzadas: d.personasAlcanzadas ?? null,
    horas: d.horas ?? null,
    presupuesto_estimado: d.presupuestoEstimado ?? null,
    presupuesto_ejecutado: d.presupuestoEjecutado ?? null,
    aliado_id: d.aliadoId || null,
    estado: d.estado,
    calificacion: d.calificacion ?? null,
    notas: d.notas || null,
  };
}

async function requerirAdminTh() {
  const perfil = await getPerfilActual();
  return perfil && perfil.rol === 'admin_th' ? perfil : null;
}

export async function crearActividadPlan(input: EntradaActividad) {
  const perfil = await requerirAdminTh();
  if (!perfil) return { ok: false as const, error: 'No autorizado' };
  const parsed = ActividadSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };

  const supabase = createClient();
  const { error } = await supabase.from('plan_trabajo_actividades').insert({
    empresa_id: perfil.empresa_id,
    creado_por: perfil.usuario_id,
    ...aFila(parsed.data),
  });
  if (error) return { ok: false as const, error: error.message };
  revalidatePath(RUTA);
  return { ok: true as const };
}

export async function actualizarActividadPlan(id: string, input: EntradaActividad) {
  const perfil = await requerirAdminTh();
  if (!perfil) return { ok: false as const, error: 'No autorizado' };
  const parsed = ActividadSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };

  const supabase = createClient();
  const { error } = await supabase.from('plan_trabajo_actividades').update(aFila(parsed.data)).eq('id', id).eq('empresa_id', perfil.empresa_id);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath(RUTA);
  return { ok: true as const };
}

export async function eliminarActividadPlan(id: string) {
  const perfil = await requerirAdminTh();
  if (!perfil) return { ok: false as const, error: 'No autorizado' };
  const supabase = createClient();
  const { data: act } = await supabase.from('plan_trabajo_actividades').select('adjuntos').eq('id', id).eq('empresa_id', perfil.empresa_id).maybeSingle();
  if (!act) return { ok: false as const, error: 'Actividad no encontrada' };
  const rutas = (Array.isArray(act.adjuntos) ? (act.adjuntos as any[]) : []).map((a) => a.ruta as string);
  if (rutas.length > 0) await supabase.storage.from('plan-trabajo').remove(rutas);
  const { error } = await supabase.from('plan_trabajo_actividades').delete().eq('id', id).eq('empresa_id', perfil.empresa_id);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath(RUTA);
  return { ok: true as const };
}

/**
 * Cierra el ciclo PHVA: una actividad que reveló un hallazgo (una capacitación que mostró una brecha crítica,
 * una inspección que encontró una condición insegura) genera una acción ACPM vinculada.
 */
export async function crearAcpmDesdeActividad(id: string, hallazgo: string, tipoAccion: 'correctiva' | 'preventiva' | 'mejora', prioridad: 'baja' | 'media' | 'alta' | 'critica') {
  const perfil = await requerirAdminTh();
  if (!perfil) return { ok: false as const, error: 'No autorizado' };
  const texto = hallazgo.trim();
  if (!texto) return { ok: false as const, error: 'Describe el hallazgo' };

  const supabase = createClient();
  const { data: act } = await supabase
    .from('plan_trabajo_actividades')
    .select('id, nombre, fecha_ejecutada, fecha_programada, acpm_id')
    .eq('id', id)
    .eq('empresa_id', perfil.empresa_id)
    .maybeSingle();
  if (!act) return { ok: false as const, error: 'Actividad no encontrada' };
  if (act.acpm_id) return { ok: false as const, error: 'Esta actividad ya tiene una acción ACPM' };

  const res = await crearAcpm({
    origenTipo: 'plan_trabajo',
    origenDetalle: `Actividad del plan de trabajo «${act.nombre}» (${act.fecha_ejecutada ?? act.fecha_programada})`,
    tipoAccion,
    descripcion: texto,
    prioridad,
  });
  if (!res.ok) return { ok: false as const, error: res.error };

  const { error } = await supabase.from('plan_trabajo_actividades').update({ acpm_id: res.id }).eq('id', id);
  if (error) return { ok: false as const, error: `La ACPM se creó (${res.codigo}) pero no se pudo vincular: ${error.message}` };
  revalidatePath(RUTA);
  return { ok: true as const, codigo: res.codigo };
}

// ── Evidencias ───────────────────────────────────────────────────────────────

const MAX_ADJUNTO_BYTES = 4 * 1024 * 1024; // límite de las funciones de Vercel
const TIPOS_ADJUNTO_OK = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

export async function subirAdjuntoActividad(formData: FormData) {
  const perfil = await requerirAdminTh();
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const id = String(formData.get('id') ?? '');
  const tipo = String(formData.get('tipo') ?? 'otro');
  const archivo = formData.get('archivo');
  if (!z.string().uuid().safeParse(id).success) return { ok: false as const, error: 'Actividad inválida' };
  if (!(archivo instanceof File) || archivo.size === 0) return { ok: false as const, error: 'Elige un archivo' };
  if (!TIPOS_ADJUNTO_OK.includes(archivo.type)) return { ok: false as const, error: 'Solo se aceptan imágenes (JPG, PNG, WebP) o PDF' };
  if (archivo.size > MAX_ADJUNTO_BYTES) return { ok: false as const, error: 'El archivo pesa más de 4 MB. Comprímelo o súbelo en partes.' };

  const supabase = createClient();
  const { data: act } = await supabase.from('plan_trabajo_actividades').select('id, adjuntos').eq('id', id).eq('empresa_id', perfil.empresa_id).maybeSingle();
  if (!act) return { ok: false as const, error: 'Actividad no encontrada' };

  const limpio = archivo.name.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9._-]+/g, '_');
  const ruta = `${perfil.empresa_id}/${id}/${Date.now()}-${limpio}`;
  const { error: errSubida } = await supabase.storage.from('plan-trabajo').upload(ruta, archivo, { contentType: archivo.type });
  if (errSubida) return { ok: false as const, error: `Error subiendo el archivo: ${errSubida.message}` };

  const actuales = Array.isArray(act.adjuntos) ? (act.adjuntos as any[]) : [];
  const { error } = await supabase
    .from('plan_trabajo_actividades')
    .update({ adjuntos: [...actuales, { nombre: archivo.name, ruta, tipo, tamano: archivo.size }] })
    .eq('id', id);
  if (error) {
    await supabase.storage.from('plan-trabajo').remove([ruta]);
    return { ok: false as const, error: error.message };
  }
  revalidatePath(RUTA);
  return { ok: true as const };
}

export async function eliminarAdjuntoActividad(id: string, ruta: string) {
  const perfil = await requerirAdminTh();
  if (!perfil) return { ok: false as const, error: 'No autorizado' };
  const supabase = createClient();
  const { data: act } = await supabase.from('plan_trabajo_actividades').select('adjuntos').eq('id', id).eq('empresa_id', perfil.empresa_id).maybeSingle();
  if (!act) return { ok: false as const, error: 'Actividad no encontrada' };
  const actuales = Array.isArray(act.adjuntos) ? (act.adjuntos as any[]) : [];
  if (!actuales.some((a) => a.ruta === ruta)) return { ok: false as const, error: 'Archivo no encontrado' };
  await supabase.storage.from('plan-trabajo').remove([ruta]);
  const { error } = await supabase
    .from('plan_trabajo_actividades')
    .update({ adjuntos: actuales.filter((a) => a.ruta !== ruta) })
    .eq('id', id);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath(RUTA);
  return { ok: true as const };
}
