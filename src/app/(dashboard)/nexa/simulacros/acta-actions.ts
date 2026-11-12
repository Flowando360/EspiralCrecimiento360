'use server';

import { createClient } from '@/lib/supabase/server';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { crearAcpm } from '@/app/(dashboard)/procesos-gestion/acpm/actions';

// ── Acta del simulacro (informe de pruebas, 9.1) ─────────────────────────────

const ActaSchema = z.object({
  simulacroId: z.string().uuid(),
  tipo: z.enum(['incendio', 'sismo', 'evacuacion', 'derrame', 'otro']).optional().or(z.literal('')),
  sede: z.string().trim().max(120).optional(),
  escenario: z.string().trim().max(500).optional(),
  duracionMinutos: z.number().min(0).max(10000).optional(),
  tiempoEvacuacionEsperadoMin: z.number().min(0).max(10000).optional(),
  tiempoEvacuacionRealMin: z.number().min(0).max(10000).optional(),
  brigadistasParticipantes: z.number().int().min(0).max(100000).optional(),
  observacionesBrigada: z.string().trim().max(2000).optional(),
});

/** Guarda los datos del acta: tipo, sede, escenario, tiempos de evacuación, brigadistas y observaciones. */
export async function guardarActaSimulacro(input: z.infer<typeof ActaSchema>) {
  const perfil = await getPerfilActual();
  if (!perfil || perfil.rol !== 'admin_th') return { ok: false as const, error: 'No autorizado' };
  const parsed = ActaSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  const d = parsed.data;

  const supabase = createClient();
  const { error } = await supabase
    .from('nexa_simulacros')
    .update({
      tipo: d.tipo || null,
      sede: d.sede || null,
      escenario: d.escenario || null,
      duracion_minutos: d.duracionMinutos ?? null,
      tiempo_evacuacion_esperado_min: d.tiempoEvacuacionEsperadoMin ?? null,
      tiempo_evacuacion_real_min: d.tiempoEvacuacionRealMin ?? null,
      brigadistas_participantes: d.brigadistasParticipantes ?? null,
      observaciones_brigada: d.observacionesBrigada || null,
    })
    .eq('id', d.simulacroId)
    .eq('empresa_id', perfil.empresa_id);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath(`/nexa/simulacros/${d.simulacroId}`);
  return { ok: true as const };
}

// ── Hallazgos ────────────────────────────────────────────────────────────────

const HallazgoSchema = z.object({
  simulacroId: z.string().uuid(),
  descripcion: z.string().trim().min(1, 'Describe el hallazgo').max(1000),
  categoria: z.enum(['no_conformidad', 'oportunidad_mejora', 'observacion']),
  severidad: z.enum(['baja', 'media', 'alta', 'critica']),
});

async function simulacroDeMiEmpresa(supabase: ReturnType<typeof createClient>, simulacroId: string, empresaId: string) {
  const { data } = await supabase
    .from('nexa_simulacros')
    .select('id, titulo, fecha, adjuntos')
    .eq('id', simulacroId)
    .eq('empresa_id', empresaId)
    .maybeSingle();
  return data;
}

export async function crearHallazgoSimulacro(input: z.infer<typeof HallazgoSchema>) {
  const perfil = await getPerfilActual();
  if (!perfil || perfil.rol !== 'admin_th') return { ok: false as const, error: 'No autorizado' };
  const parsed = HallazgoSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };

  const supabase = createClient();
  if (!(await simulacroDeMiEmpresa(supabase, parsed.data.simulacroId, perfil.empresa_id))) {
    return { ok: false as const, error: 'Simulacro no encontrado' };
  }

  const { error } = await supabase.from('nexa_simulacro_hallazgos').insert({
    simulacro_id: parsed.data.simulacroId,
    descripcion: parsed.data.descripcion,
    categoria: parsed.data.categoria,
    severidad: parsed.data.severidad,
  });
  if (error) return { ok: false as const, error: error.message };
  revalidatePath(`/nexa/simulacros/${parsed.data.simulacroId}`);
  return { ok: true as const };
}

export async function eliminarHallazgoSimulacro(hallazgoId: string, simulacroId: string) {
  const perfil = await getPerfilActual();
  if (!perfil || perfil.rol !== 'admin_th') return { ok: false as const, error: 'No autorizado' };
  const supabase = createClient();
  if (!(await simulacroDeMiEmpresa(supabase, simulacroId, perfil.empresa_id))) return { ok: false as const, error: 'Simulacro no encontrado' };
  const { error } = await supabase.from('nexa_simulacro_hallazgos').delete().eq('id', hallazgoId).eq('simulacro_id', simulacroId);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath(`/nexa/simulacros/${simulacroId}`);
  return { ok: true as const };
}

const TIPO_ACCION_POR_CATEGORIA = { no_conformidad: 'correctiva', oportunidad_mejora: 'mejora', observacion: 'preventiva' } as const;

/**
 * Convierte un hallazgo en una acción ACPM con los datos del simulacro ya llenos y deja el
 * vínculo hallazgo → ACPM para tener trazabilidad completa (hallazgo → acción → cierre).
 */
export async function crearAcpmDesdeHallazgo(hallazgoId: string, simulacroId: string) {
  const perfil = await getPerfilActual();
  if (!perfil || perfil.rol !== 'admin_th') return { ok: false as const, error: 'No autorizado' };

  const supabase = createClient();
  const simulacro = await simulacroDeMiEmpresa(supabase, simulacroId, perfil.empresa_id);
  if (!simulacro) return { ok: false as const, error: 'Simulacro no encontrado' };

  const { data: hallazgo } = await supabase
    .from('nexa_simulacro_hallazgos')
    .select('id, descripcion, categoria, severidad, acpm_id')
    .eq('id', hallazgoId)
    .eq('simulacro_id', simulacroId)
    .maybeSingle();
  if (!hallazgo) return { ok: false as const, error: 'Hallazgo no encontrado' };
  if (hallazgo.acpm_id) return { ok: false as const, error: 'Este hallazgo ya tiene una acción ACPM' };

  const res = await crearAcpm({
    origenTipo: 'simulacro',
    origenDetalle: `Simulacro «${simulacro.titulo}»${simulacro.fecha ? ` del ${simulacro.fecha}` : ''}`,
    tipoAccion: TIPO_ACCION_POR_CATEGORIA[hallazgo.categoria as keyof typeof TIPO_ACCION_POR_CATEGORIA] ?? 'correctiva',
    descripcion: hallazgo.descripcion,
    prioridad: hallazgo.severidad as 'baja' | 'media' | 'alta' | 'critica',
  });
  if (!res.ok) return { ok: false as const, error: res.error };

  const { error } = await supabase.from('nexa_simulacro_hallazgos').update({ acpm_id: res.id }).eq('id', hallazgoId);
  if (error) return { ok: false as const, error: `La ACPM se creó (${res.codigo}) pero no se pudo vincular: ${error.message}` };

  revalidatePath(`/nexa/simulacros/${simulacroId}`);
  return { ok: true as const, codigo: res.codigo };
}

// ── Adjuntos (fotos, acta firmada, listas de asistencia escaneadas) ──────────

const MAX_ADJUNTO_BYTES = 4 * 1024 * 1024; // límite de las funciones de Vercel (4,5 MB)
const TIPOS_ADJUNTO_OK = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

export async function subirAdjuntoSimulacro(formData: FormData) {
  const perfil = await getPerfilActual();
  if (!perfil || perfil.rol !== 'admin_th') return { ok: false as const, error: 'No autorizado' };

  const simulacroId = String(formData.get('simulacroId') ?? '');
  const tipo = String(formData.get('tipo') ?? 'otro');
  const archivo = formData.get('archivo');
  if (!z.string().uuid().safeParse(simulacroId).success) return { ok: false as const, error: 'Simulacro inválido' };
  if (!(archivo instanceof File) || archivo.size === 0) return { ok: false as const, error: 'Elige un archivo' };
  if (!TIPOS_ADJUNTO_OK.includes(archivo.type)) return { ok: false as const, error: 'Solo se aceptan imágenes (JPG, PNG, WebP) o PDF' };
  if (archivo.size > MAX_ADJUNTO_BYTES) return { ok: false as const, error: 'El archivo pesa más de 4 MB. Comprímelo o súbelo en partes.' };

  const supabase = createClient();
  const simulacro = await simulacroDeMiEmpresa(supabase, simulacroId, perfil.empresa_id);
  if (!simulacro) return { ok: false as const, error: 'Simulacro no encontrado' };

  const limpio = archivo.name.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9._-]+/g, '_');
  const ruta = `${perfil.empresa_id}/${simulacroId}/${Date.now()}-${limpio}`;
  const { error: errSubida } = await supabase.storage.from('simulacros').upload(ruta, archivo, { contentType: archivo.type });
  if (errSubida) return { ok: false as const, error: `Error subiendo el archivo: ${errSubida.message}` };

  const actuales = Array.isArray(simulacro.adjuntos) ? (simulacro.adjuntos as any[]) : [];
  const nuevos = [...actuales, { nombre: archivo.name, ruta, tipo, tamano: archivo.size }];
  const { error } = await supabase.from('nexa_simulacros').update({ adjuntos: nuevos }).eq('id', simulacroId);
  if (error) {
    await supabase.storage.from('simulacros').remove([ruta]);
    return { ok: false as const, error: error.message };
  }
  revalidatePath(`/nexa/simulacros/${simulacroId}`);
  return { ok: true as const };
}

export async function eliminarAdjuntoSimulacro(simulacroId: string, ruta: string) {
  const perfil = await getPerfilActual();
  if (!perfil || perfil.rol !== 'admin_th') return { ok: false as const, error: 'No autorizado' };
  const supabase = createClient();
  const simulacro = await simulacroDeMiEmpresa(supabase, simulacroId, perfil.empresa_id);
  if (!simulacro) return { ok: false as const, error: 'Simulacro no encontrado' };

  const actuales = Array.isArray(simulacro.adjuntos) ? (simulacro.adjuntos as any[]) : [];
  if (!actuales.some((a) => a.ruta === ruta)) return { ok: false as const, error: 'Archivo no encontrado' };
  await supabase.storage.from('simulacros').remove([ruta]);
  const { error } = await supabase
    .from('nexa_simulacros')
    .update({ adjuntos: actuales.filter((a) => a.ruta !== ruta) })
    .eq('id', simulacroId);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath(`/nexa/simulacros/${simulacroId}`);
  return { ok: true as const };
}
