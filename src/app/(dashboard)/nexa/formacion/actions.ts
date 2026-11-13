'use server';

import { createClient } from '@/lib/supabase/server';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const CATEGORIAS = [
  'induccion_sst',
  'alturas',
  'manejo_cargas',
  'epp',
  'protocolos_emergencia',
  'cultura',
  'tecnico',
  'liderazgo',
  'habilidades_blandas',
  'cumplimiento_normativo',
  'otro',
] as const;

const CursoSchema = z.object({
  titulo: z.string().trim().min(1, 'El título es requerido'),
  descripcion: z.string().trim().optional(),
  categoria: z.enum(CATEGORIAS),
  duracionMinutos: z.number().int().positive().optional(),
  puntosOtorgados: z.number().int().min(0),
});

/** Crea un curso en el catálogo de Nexa (admin_th, misma regla que RLS). */
export async function crearCurso(input: z.infer<typeof CursoSchema>) {
  const perfil = await getPerfilActual();
  if (!perfil || perfil.rol !== 'admin_th') return { ok: false as const, error: 'No autorizado' };

  const parsed = CursoSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };

  const supabase = createClient();
  const { error } = await supabase.from('nexa_cursos').insert({
    empresa_id: perfil.empresa_id,
    titulo: parsed.data.titulo,
    descripcion: parsed.data.descripcion || null,
    categoria: parsed.data.categoria,
    duracion_minutos: parsed.data.duracionMinutos ?? null,
    puntos_otorgados: parsed.data.puntosOtorgados,
  });

  if (error) return { ok: false as const, error: error.message };
  revalidatePath('/nexa/formacion');
  return { ok: true as const };
}

const EditarCursoSchema = z.object({
  cursoId: z.string().uuid(),
  titulo: z.string().trim().min(1, 'El título es requerido'),
  descripcion: z.string().trim().optional(),
  categoria: z.enum(CATEGORIAS),
  duracionMinutos: z.number().int().positive().optional(),
  puntosOtorgados: z.number().int().min(0),
  // Curso que hay que completar antes (ruta encadenada). null lo quita; undefined no lo toca.
  cursoPrevioId: z.string().uuid().nullable().optional(),
});

/** Edita título, descripción, categoría, duración y puntos de un curso ya creado (admin_th). */
export async function actualizarCurso(input: z.infer<typeof EditarCursoSchema>) {
  const perfil = await getPerfilActual();
  if (!perfil || perfil.rol !== 'admin_th') return { ok: false as const, error: 'No autorizado' };

  const parsed = EditarCursoSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };

  const supabase = createClient();

  // La ruta encadenada no puede ser circular (A exige B y B exige A) ni cruzar empresas.
  if (parsed.data.cursoPrevioId) {
    let actual: string | null = parsed.data.cursoPrevioId;
    for (let i = 0; i < 20 && actual; i++) {
      if (actual === parsed.data.cursoId) return { ok: false as const, error: 'Ese curso previo crearía un círculo: depende de este mismo curso.' };
      const { data: fila }: { data: { empresa_id: string; curso_previo_id: string | null } | null } = await supabase
        .from('nexa_cursos')
        .select('empresa_id, curso_previo_id')
        .eq('id', actual)
        .maybeSingle();
      if (!fila || fila.empresa_id !== perfil.empresa_id) return { ok: false as const, error: 'Curso previo no encontrado' };
      actual = fila.curso_previo_id;
    }
  }

  const { error } = await supabase
    .from('nexa_cursos')
    .update({
      ...(parsed.data.cursoPrevioId !== undefined ? { curso_previo_id: parsed.data.cursoPrevioId } : {}),
      titulo: parsed.data.titulo,
      descripcion: parsed.data.descripcion || null,
      categoria: parsed.data.categoria,
      duracion_minutos: parsed.data.duracionMinutos ?? null,
      puntos_otorgados: parsed.data.puntosOtorgados,
    })
    .eq('id', parsed.data.cursoId)
    .eq('empresa_id', perfil.empresa_id);

  if (error) return { ok: false as const, error: error.message };
  revalidatePath('/nexa/formacion');
  revalidatePath(`/nexa/formacion/${parsed.data.cursoId}/quiz`);
  return { ok: true as const };
}

const AsignarCargoSchema = z.object({
  cursoId: z.string().uuid(),
  cargoId: z.string().uuid(),
  nivelRiesgo: z.enum(['alto', 'medio', 'bajo']),
  obligatorio: z.boolean(),
});

/** Vincula un curso al perfil de un cargo (ruta de aprendizaje por cargo). */
export async function asignarCursoACargo(input: z.infer<typeof AsignarCargoSchema>) {
  const perfil = await getPerfilActual();
  if (!perfil || perfil.rol !== 'admin_th') return { ok: false as const, error: 'No autorizado' };

  const parsed = AsignarCargoSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: 'Datos inválidos' };

  const supabase = createClient();
  const { error } = await supabase.from('nexa_rutas_por_cargo').upsert(
    {
      cargo_id: parsed.data.cargoId,
      curso_id: parsed.data.cursoId,
      nivel_riesgo: parsed.data.nivelRiesgo,
      obligatorio: parsed.data.obligatorio,
    },
    { onConflict: 'cargo_id,curso_id' }
  );

  if (error) return { ok: false as const, error: error.message };
  revalidatePath('/nexa/formacion');
  return { ok: true as const };
}

const ProgresoSchema = z.object({
  rutaId: z.string().uuid(),
  progresoPct: z.number().min(0).max(100),
});

/** El colaborador actualiza su propio avance (o lo marca completado con 100). */
export async function actualizarProgresoCurso(input: z.infer<typeof ProgresoSchema>) {
  const perfil = await getPerfilActual();
  if (!perfil || perfil.rol !== 'colaborador' || !perfil.colaborador_id) {
    return { ok: false as const, error: 'No autorizado' };
  }

  const parsed = ProgresoSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: 'Datos inválidos' };

  const completado = parsed.data.progresoPct >= 100;
  const supabase = createClient();
  const { error } = await supabase
    .from('nexa_rutas_formacion')
    .update({
      progreso_pct: parsed.data.progresoPct,
      estado: completado ? 'completado' : parsed.data.progresoPct > 0 ? 'en_curso' : 'asignado',
      completado_en: completado ? new Date().toISOString() : null,
    })
    .eq('id', parsed.data.rutaId)
    .eq('colaborador_id', perfil.colaborador_id);

  if (error) return { ok: false as const, error: error.message };
  revalidatePath('/nexa/formacion');
  return { ok: true as const };
}

const AsignarColaboradorSchema = z.object({
  cursoId: z.string().uuid(),
  colaboradorId: z.string().uuid(),
  fechaLimite: z.string().optional(),
});

const PreguntaSchema = z.object({
  cursoId: z.string().uuid(),
  enunciado: z.string().trim().min(1, 'La pregunta es requerida'),
  opciones: z
    .array(z.object({ texto: z.string().trim().min(1), correcta: z.boolean() }))
    .min(2, 'Se necesitan al menos 2 opciones'),
});

/** Crea una pregunta de quiz con sus opciones (admin_th). Exactamente una opción debe ser la correcta. */
export async function crearPreguntaConOpciones(input: z.infer<typeof PreguntaSchema>) {
  const perfil = await getPerfilActual();
  if (!perfil || perfil.rol !== 'admin_th') return { ok: false as const, error: 'No autorizado' };

  const parsed = PreguntaSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };

  const correctas = parsed.data.opciones.filter((o) => o.correcta).length;
  if (correctas !== 1) return { ok: false as const, error: 'Marca exactamente una opción como correcta' };

  const supabase = createClient();
  const { data: pregunta, error: errorPregunta } = await supabase
    .from('nexa_curso_preguntas')
    .insert({ curso_id: parsed.data.cursoId, enunciado: parsed.data.enunciado })
    .select('id')
    .single();

  if (errorPregunta || !pregunta) return { ok: false as const, error: errorPregunta?.message ?? 'No se pudo crear la pregunta' };

  const { error: errorOpciones } = await supabase.from('nexa_curso_opciones').insert(
    parsed.data.opciones.map((o, i) => ({
      pregunta_id: pregunta.id,
      texto: o.texto,
      correcta: o.correcta,
      orden: i,
    }))
  );

  if (errorOpciones) {
    await supabase.from('nexa_curso_preguntas').delete().eq('id', pregunta.id);
    return { ok: false as const, error: errorOpciones.message };
  }

  revalidatePath(`/nexa/formacion/${parsed.data.cursoId}/quiz`);
  return { ok: true as const, id: pregunta.id as string };
}

const EditarPreguntaSchema = z.object({
  preguntaId: z.string().uuid(),
  cursoId: z.string().uuid(),
  enunciado: z.string().trim().min(1, 'La pregunta es requerida'),
  opciones: z
    .array(z.object({ id: z.string().uuid().optional(), texto: z.string().trim().min(1), correcta: z.boolean() }))
    .min(2, 'Se necesitan al menos 2 opciones'),
});

/**
 * Edita el enunciado y reemplaza las opciones de una pregunta ya creada
 * (admin_th) -- más simple que llevar el emparejamiento id-por-id de cada
 * opción, y evita dejar huérfana una opción vieja que ya no aplica.
 */
export async function actualizarPreguntaConOpciones(input: z.infer<typeof EditarPreguntaSchema>) {
  const perfil = await getPerfilActual();
  if (!perfil || perfil.rol !== 'admin_th') return { ok: false as const, error: 'No autorizado' };

  const parsed = EditarPreguntaSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };

  const correctas = parsed.data.opciones.filter((o) => o.correcta).length;
  if (correctas !== 1) return { ok: false as const, error: 'Marca exactamente una opción como correcta' };

  const supabase = createClient();
  const { error: errorEnunciado } = await supabase
    .from('nexa_curso_preguntas')
    .update({ enunciado: parsed.data.enunciado })
    .eq('id', parsed.data.preguntaId);
  if (errorEnunciado) return { ok: false as const, error: errorEnunciado.message };

  await supabase.from('nexa_curso_opciones').delete().eq('pregunta_id', parsed.data.preguntaId);
  const { error: errorOpciones } = await supabase.from('nexa_curso_opciones').insert(
    parsed.data.opciones.map((o, i) => ({
      pregunta_id: parsed.data.preguntaId,
      texto: o.texto,
      correcta: o.correcta,
      orden: i,
    }))
  );
  if (errorOpciones) return { ok: false as const, error: errorOpciones.message };

  revalidatePath(`/nexa/formacion/${parsed.data.cursoId}/quiz`);
  return { ok: true as const };
}

/** Elimina una pregunta del quiz (admin_th) — sus opciones se borran en cascada. */
export async function eliminarPregunta(preguntaId: string, cursoId: string) {
  const perfil = await getPerfilActual();
  if (!perfil || perfil.rol !== 'admin_th') return { ok: false as const, error: 'No autorizado' };

  const supabase = createClient();
  const { error } = await supabase.from('nexa_curso_preguntas').delete().eq('id', preguntaId);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath(`/nexa/formacion/${cursoId}/quiz`);
  return { ok: true as const };
}

/** Ajusta el % mínimo de aprobación del quiz de un curso (admin_th). */
export async function actualizarUmbralQuiz(cursoId: string, umbral: number) {
  const perfil = await getPerfilActual();
  if (!perfil || perfil.rol !== 'admin_th') return { ok: false as const, error: 'No autorizado' };
  if (umbral < 1 || umbral > 100) return { ok: false as const, error: 'El umbral debe estar entre 1 y 100' };

  const supabase = createClient();
  const { error } = await supabase.from('nexa_cursos').update({ quiz_umbral_aprobacion: umbral }).eq('id', cursoId);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath(`/nexa/formacion/${cursoId}/quiz`);
  return { ok: true as const };
}

/** El colaborador envía sus respuestas; la calificación real ocurre en la función security definer. */
export async function enviarRespuestasQuiz(rutaId: string, respuestas: Record<string, string>) {
  const perfil = await getPerfilActual();
  if (!perfil || perfil.rol !== 'colaborador') return { ok: false as const, error: 'No autorizado' };

  const supabase = createClient();
  const { data, error } = await supabase.rpc('fn_calificar_intento_quiz', {
    p_ruta_id: rutaId,
    p_respuestas: respuestas,
  });

  if (error) return { ok: false as const, error: error.message };
  const resultado = Array.isArray(data) ? data[0] : data;
  if (!resultado) return { ok: false as const, error: 'No se pudo calificar el quiz' };
  revalidatePath('/nexa/formacion');
  return {
    ok: true as const,
    puntajePct: Number(resultado.puntaje_pct),
    aprobado: Boolean(resultado.aprobado),
    umbral: Number(resultado.umbral),
  };
}

/** Asigna un curso directamente a una persona (admin_th, misma regla que RLS). */
export async function asignarCursoAColaborador(input: z.infer<typeof AsignarColaboradorSchema>) {
  const perfil = await getPerfilActual();
  if (!perfil || perfil.rol !== 'admin_th') return { ok: false as const, error: 'No autorizado' };

  const parsed = AsignarColaboradorSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: 'Datos inválidos' };

  const supabase = createClient();
  const { error } = await supabase.from('nexa_rutas_formacion').insert({
    colaborador_id: parsed.data.colaboradorId,
    curso_id: parsed.data.cursoId,
    fecha_limite: parsed.data.fechaLimite || null,
  });

  if (error) return { ok: false as const, error: error.message };
  revalidatePath('/nexa/formacion');
  return { ok: true as const };
}

const ContenidoSchema = z.object({
  cursoId: z.string().uuid(),
  // undefined = no tocar; null = quitar
  enlace: z.string().trim().max(500).nullable().optional(),
  archivoPath: z.string().max(500).nullable().optional(),
  archivoNombre: z.string().max(200).optional(),
});

/** Guarda el contenido de un curso: enlace externo y/o archivo propio ya subido a Storage (admin_th). */
export async function guardarContenidoCurso(input: z.infer<typeof ContenidoSchema>) {
  const perfil = await getPerfilActual();
  if (!perfil || perfil.rol !== 'admin_th') return { ok: false as const, error: 'No autorizado' };
  const p = ContenidoSchema.safeParse(input);
  if (!p.success) return { ok: false as const, error: 'Datos inválidos' };
  const d = p.data;

  const supabase = createClient() as any;
  const { data: curso } = await supabase
    .from('nexa_cursos')
    .select('id, empresa_id, contenido_archivo_path')
    .eq('id', d.cursoId)
    .maybeSingle();
  if (!curso || curso.empresa_id !== perfil.empresa_id) return { ok: false as const, error: 'Curso no encontrado' };

  const cambios: Record<string, unknown> = {};
  if (d.enlace !== undefined) {
    if (d.enlace && !/^https?:\/\//i.test(d.enlace)) return { ok: false as const, error: 'El enlace debe empezar por http:// o https://' };
    cambios.contenido_url = d.enlace || null;
  }
  if (d.archivoPath !== undefined) {
    if (d.archivoPath && !d.archivoPath.startsWith(`${perfil.empresa_id}/${d.cursoId}/`)) return { ok: false as const, error: 'Ruta de archivo inválida' };
    cambios.contenido_archivo_path = d.archivoPath || null;
    cambios.contenido_archivo_nombre = d.archivoPath ? d.archivoNombre ?? null : null;
  }
  if (Object.keys(cambios).length === 0) return { ok: true as const };

  const { error } = await supabase.from('nexa_cursos').update(cambios).eq('id', d.cursoId).eq('empresa_id', perfil.empresa_id);
  if (error) return { ok: false as const, error: error.message };

  // Si se reemplazó o quitó el archivo, borrar el anterior para no dejar huérfanos.
  if (d.archivoPath !== undefined && curso.contenido_archivo_path && curso.contenido_archivo_path !== d.archivoPath) {
    await supabase.storage.from('cursos-contenido').remove([curso.contenido_archivo_path]);
  }
  revalidatePath('/nexa/formacion');
  revalidatePath(`/nexa/formacion/${d.cursoId}/quiz`);
  return { ok: true as const };
}
