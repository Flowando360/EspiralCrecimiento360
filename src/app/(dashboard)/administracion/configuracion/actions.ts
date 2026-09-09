'use server';

import { createClient } from '@/lib/supabase/server';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const PonderacionesSchema = z
  .object({
    cicloId: z.string().uuid(),
    liderConEquipo: z.number().int().min(0).max(100),
    paresConEquipo: z.number().int().min(0).max(100),
    colaboradoresConEquipo: z.number().int().min(0).max(100),
    liderSinEquipo: z.number().int().min(0).max(100),
    paresSinEquipo: z.number().int().min(0).max(100),
  })
  .refine((v) => v.liderConEquipo + v.paresConEquipo + v.colaboradoresConEquipo === 100, {
    message: 'Los pesos de "con personal a cargo" deben sumar 100%',
  })
  .refine((v) => v.liderSinEquipo + v.paresSinEquipo === 100, {
    message: 'Los pesos de "sin personal a cargo" deben sumar 100%',
  });

/**
 * Guarda los pesos de ponderación de un ciclo. Solo se permite mientras el
 * ciclo sigue en estado 'planeado': una vez 'abierto', el trigger de
 * recálculo (fn_recalcular_resultados_evaluacion) lee estos pesos en vivo
 * desde ciclos_evaluacion, así que cambiarlos ahí afectaría evaluaciones ya
 * en curso — por eso el aviso "se aplica al próximo ciclo que se abra".
 */
export async function guardarPonderaciones(input: z.infer<typeof PonderacionesSchema>) {
  const perfil = await getPerfilActual();
  if (!perfil || perfil.rol !== 'admin_th') return { ok: false, error: 'No autorizado' };

  const parsed = PonderacionesSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  }

  const supabase = createClient();

  const { data: ciclo } = await supabase
    .from('ciclos_evaluacion')
    .select('id, estado, empresa_id')
    .eq('id', parsed.data.cicloId)
    .maybeSingle();

  if (!ciclo || ciclo.empresa_id !== perfil.empresa_id) {
    return { ok: false, error: 'Ciclo no encontrado' };
  }
  if (ciclo.estado !== 'planeado') {
    return { ok: false, error: 'Este ciclo ya está abierto; los pesos solo se pueden editar antes de abrirlo' };
  }

  const { error } = await supabase
    .from('ciclos_evaluacion')
    .update({
      peso_lider_con_equipo: parsed.data.liderConEquipo / 100,
      peso_pares_con_equipo: parsed.data.paresConEquipo / 100,
      peso_colaboradores_con_equipo: parsed.data.colaboradoresConEquipo / 100,
      peso_lider_sin_equipo: parsed.data.liderSinEquipo / 100,
      peso_pares_sin_equipo: parsed.data.paresSinEquipo / 100,
    })
    .eq('id', parsed.data.cicloId);

  if (error) return { ok: false, error: error.message };

  revalidatePath('/administracion/configuracion');
  return { ok: true };
}

const DatosEmpresaSchema = z.object({
  nit: z.string().trim().optional(),
  direccion: z.string().trim().optional(),
  telefono: z.string().trim().optional(),
  ciudad: z.string().trim().optional(),
  firmanteNombre: z.string().trim().optional(),
  firmanteCargo: z.string().trim().optional(),
  siglas: z.string().trim().optional(),
});

/**
 * Guarda los datos legales de la empresa que usa el certificado laboral
 * (NIT, dirección, teléfono, ciudad y quién lo firma), más las siglas que
 * usa Guía del Flow (proyecto hermano) para nombrar los PDF de su
 * descarga masiva.
 */
export async function guardarDatosEmpresa(input: z.infer<typeof DatosEmpresaSchema>) {
  const perfil = await getPerfilActual();
  if (!perfil || perfil.rol !== 'admin_th') return { ok: false, error: 'No autorizado' };

  const parsed = DatosEmpresaSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };

  const supabase = createClient();
  const { error } = await supabase
    .from('empresas')
    .update({
      nit: parsed.data.nit || null,
      direccion: parsed.data.direccion || null,
      telefono: parsed.data.telefono || null,
      ciudad: parsed.data.ciudad || null,
      firmante_nombre: parsed.data.firmanteNombre || null,
      firmante_cargo: parsed.data.firmanteCargo || null,
      siglas: parsed.data.siglas || null,
    })
    .eq('id', perfil.empresa_id);

  if (error) return { ok: false, error: error.message };

  revalidatePath('/administracion/configuracion');
  return { ok: true };
}

/**
 * Configura qué curso de Nexa refuerza una brecha de Hacer o de Deber —
 * fuente del motor automático brecha→PDI→formación (ver
 * 0025_motor_pdi_automatico.sql y docs/ARQUITECTURA.md).
 */
export async function agregarCursoRecomendado(dimension: 'hacer' | 'deber', cursoId: string) {
  const perfil = await getPerfilActual();
  if (!perfil || perfil.rol !== 'admin_th') return { ok: false, error: 'No autorizado' };
  if (!cursoId) return { ok: false, error: 'Selecciona un curso' };

  const supabase = createClient();
  const { error } = await supabase
    .from('dimension_cursos_recomendados')
    .insert({ empresa_id: perfil.empresa_id, dimension, curso_id: cursoId });

  if (error) return { ok: false, error: error.message };
  revalidatePath('/administracion/configuracion');
  return { ok: true };
}

const PreguntasClimaSchema = z.object({
  enps: z.string().trim().max(500).optional(),
  reconocimiento: z.string().trim().max(300).optional(),
  liderazgo: z.string().trim().max(300).optional(),
  desarrollo: z.string().trim().max(300).optional(),
  comunicacion: z.string().trim().max(300).optional(),
  condiciones: z.string().trim().max(300).optional(),
  pertenencia: z.string().trim().max(300).optional(),
});

/**
 * Guarda el enunciado personalizado de cada pregunta de Clima Organizacional
 * (eNPS + 6 dimensiones fijas — ver 0049). Un campo vacío borra la
 * personalización y vuelve a usar el texto por defecto del formulario.
 */
export async function guardarPreguntasClima(input: z.infer<typeof PreguntasClimaSchema>) {
  const perfil = await getPerfilActual();
  if (!perfil || perfil.rol !== 'admin_th') return { ok: false, error: 'No autorizado' };

  const parsed = PreguntasClimaSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };

  const supabase = createClient();
  const { error } = await supabase
    .from('empresas')
    .update({
      clima_pregunta_enps: parsed.data.enps || null,
      clima_pregunta_reconocimiento: parsed.data.reconocimiento || null,
      clima_pregunta_liderazgo: parsed.data.liderazgo || null,
      clima_pregunta_desarrollo: parsed.data.desarrollo || null,
      clima_pregunta_comunicacion: parsed.data.comunicacion || null,
      clima_pregunta_condiciones: parsed.data.condiciones || null,
      clima_pregunta_pertenencia: parsed.data.pertenencia || null,
    })
    .eq('id', perfil.empresa_id);

  if (error) return { ok: false, error: error.message };

  revalidatePath('/administracion/configuracion');
  revalidatePath('/nexa/clima');
  return { ok: true };
}

const UmbralClimaSchema = z
  .object({
    tipo: z.enum(['cantidad', 'porcentaje']),
    cantidad: z.number().int().min(1).optional(),
    porcentaje: z.number().min(0.1).max(100).optional(),
  })
  .refine((v) => v.tipo !== 'cantidad' || v.cantidad != null, { message: 'Indica la cantidad mínima de respuestas' })
  .refine((v) => v.tipo !== 'porcentaje' || v.porcentaje != null, { message: 'Indica el porcentaje' });

/**
 * Guarda cómo se calcula el umbral de anonimato de Clima Organizacional
 * (0050): por cantidad fija de respuestas, o por % de la planta activa de
 * cada grupo (empresa o equipo). Las vistas v_clima_ronda_resumen y
 * v_clima_equipo_resumen leen esto en vivo a través de fn_clima_umbral().
 */
export async function guardarUmbralClima(input: z.infer<typeof UmbralClimaSchema>) {
  const perfil = await getPerfilActual();
  if (!perfil || perfil.rol !== 'admin_th') return { ok: false, error: 'No autorizado' };

  const parsed = UmbralClimaSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };

  const supabase = createClient();
  const { error } = await supabase
    .from('empresas')
    .update({
      clima_umbral_tipo: parsed.data.tipo,
      clima_umbral_cantidad: parsed.data.tipo === 'cantidad' ? parsed.data.cantidad : 5,
      clima_umbral_porcentaje: parsed.data.tipo === 'porcentaje' ? parsed.data.porcentaje : null,
    })
    .eq('id', perfil.empresa_id);

  if (error) return { ok: false, error: error.message };

  revalidatePath('/administracion/configuracion');
  revalidatePath('/nexa/clima');
  return { ok: true };
}

export async function eliminarCursoRecomendado(id: string) {
  const perfil = await getPerfilActual();
  if (!perfil || perfil.rol !== 'admin_th') return { ok: false, error: 'No autorizado' };

  const supabase = createClient();
  const { error } = await supabase.from('dimension_cursos_recomendados').delete().eq('id', id);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/administracion/configuracion');
  return { ok: true };
}
