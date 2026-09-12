'use server';

import { createClient } from '@/lib/supabase/server';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { generarInformesParaGuia } from '@/lib/guia-flow/generar-informes';

/**
 * admin_th puede gestionar la Guía del Flow de cualquier colaborador de su
 * empresa; el líder, solo la de su propio equipo (mismo alcance que ya
 * tiene para ver el informe). Ninguno de los dos gana acceso a los 12
 * aspectos sensibles ni al PDF — eso sigue bloqueado por RLS aparte.
 */
async function puedeGestionarGuiaFlow(colaboradorId: string) {
  const perfil = await getPerfilActual();
  if (!perfil || (perfil.rol !== 'admin_th' && perfil.rol !== 'lider')) return null;

  const supabase = createClient();
  const { data: colaborador } = await supabase
    .from('colaboradores')
    .select('id, empresa_id, lider_id')
    .eq('id', colaboradorId)
    .maybeSingle();

  if (!colaborador || colaborador.empresa_id !== perfil.empresa_id) return null;
  if (perfil.rol === 'lider' && colaborador.lider_id !== perfil.colaborador_id) return null;

  return perfil;
}

function revalidar(colaboradorId: string) {
  revalidatePath(`/espiral-crecimiento/colaboradores/${colaboradorId}/guia-flow`);
  revalidatePath(`/espiral-crecimiento/colaboradores/${colaboradorId}`);
  revalidatePath('/informes/brechas');
}

const InvitarSchema = z.object({ colaboradorId: z.string().uuid() });

/**
 * Genera una invitación a la Guía del Flow para este colaborador — un link
 * con un token único, ya asociado a su colaborador_id exacto. Resuelve el
 * problema de emparejar por correo o por nombre (frágil: errores de
 * tipeo, correos personales, nombres repetidos entre colaboradores
 * reales): acá es admin_th o el líder quien decide explícitamente a quién
 * le manda el link, no el sistema quien adivina quién respondió.
 */
export async function crearInvitacionGuiaFlow(input: z.infer<typeof InvitarSchema>) {
  const parsed = InvitarSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: 'Datos inválidos' };

  const perfil = await puedeGestionarGuiaFlow(parsed.data.colaboradorId);
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const supabase = createClient();
  const { data, error } = await supabase
    .from('guia_del_flow_invitaciones')
    .insert({ colaborador_id: parsed.data.colaboradorId, creado_por: perfil.usuario_id })
    .select('token')
    .single();

  if (error) return { ok: false as const, error: error.message };

  const baseUrl = process.env.GUIADELFLOW_URL ?? 'https://guia-del-flow.vercel.app';
  const link = `${baseUrl}/registro?invitacion=${data.token}`;

  revalidar(parsed.data.colaboradorId);
  return { ok: true as const, link };
}

const CrearGuiaSchema = z.object({ colaboradorId: z.string().uuid() });

/** Inicia una nueva aplicación de la Guía del Flow (admin_th o el líder de este colaborador). */
export async function crearGuiaDelFlow(input: z.infer<typeof CrearGuiaSchema>) {
  const parsed = CrearGuiaSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: 'Datos inválidos' };

  const perfil = await puedeGestionarGuiaFlow(parsed.data.colaboradorId);
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const supabase = createClient();
  const { data, error } = await supabase
    .from('guia_del_flow')
    .insert({ colaborador_id: parsed.data.colaboradorId })
    .select('id')
    .single();

  if (error) return { ok: false as const, error: error.message };

  revalidar(parsed.data.colaboradorId);
  return { ok: true as const, guiaDelFlowId: data.id as string };
}

const PuntajeSchema = z.object({
  colaboradorId: z.string().uuid(),
  guiaDelFlowId: z.string().uuid(),
  aspectoId: z.string().uuid(),
  puntaje: z.number().int().min(1).max(5),
  nota: z.string().trim().max(300).optional(),
});

/** Carga el puntaje oficial de un aspecto, y opcionalmente una nota corta que resuma el resultado (admin_th o el líder de este colaborador). */
export async function guardarPuntajeSer(input: z.infer<typeof PuntajeSchema>) {
  const parsed = PuntajeSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: 'Datos inválidos' };

  const perfil = await puedeGestionarGuiaFlow(parsed.data.colaboradorId);
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const supabase = createClient();
  const { error } = await supabase.from('ser_puntajes').upsert(
    {
      guia_del_flow_id: parsed.data.guiaDelFlowId,
      aspecto_id: parsed.data.aspectoId,
      puntaje: parsed.data.puntaje,
      ...(parsed.data.nota !== undefined ? { nota: parsed.data.nota || null } : {}),
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'guia_del_flow_id,aspecto_id' }
  );

  if (error) return { ok: false as const, error: error.message };

  revalidar(parsed.data.colaboradorId);
  return { ok: true as const };
}

const ComentarioSchema = z.object({
  colaboradorId: z.string().uuid(),
  guiaDelFlowId: z.string().uuid(),
  aspectoId: z.string().uuid().nullable(),
  comentario: z.string().trim().min(1, 'Escribe algo antes de guardar'),
});

/**
 * Guarda la reflexión del propio colaborador sobre un aspecto puntual
 * (aspectoId) o sobre el conjunto (aspectoId null). Nunca toca ser_puntajes.
 */
export async function guardarComentarioColaborador(input: z.infer<typeof ComentarioSchema>) {
  const parsed = ComentarioSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };

  const perfil = await getPerfilActual();
  if (!perfil || perfil.rol !== 'colaborador' || perfil.colaborador_id !== parsed.data.colaboradorId) {
    return { ok: false as const, error: 'No autorizado' };
  }

  const supabase = createClient();
  let buscar = supabase
    .from('ser_comentarios_colaborador')
    .select('id')
    .eq('guia_del_flow_id', parsed.data.guiaDelFlowId);
  buscar = parsed.data.aspectoId ? buscar.eq('aspecto_id', parsed.data.aspectoId) : buscar.is('aspecto_id', null);
  const { data: existente } = await buscar.maybeSingle();

  const supabaseWrite = createClient();
  const { error } = existente
    ? await supabaseWrite
        .from('ser_comentarios_colaborador')
        .update({ comentario: parsed.data.comentario, updated_at: new Date().toISOString() })
        .eq('id', existente.id)
    : await supabaseWrite.from('ser_comentarios_colaborador').insert({
        guia_del_flow_id: parsed.data.guiaDelFlowId,
        aspecto_id: parsed.data.aspectoId,
        colaborador_id: parsed.data.colaboradorId,
        comentario: parsed.data.comentario,
      });

  if (error) return { ok: false as const, error: error.message };

  revalidar(parsed.data.colaboradorId);
  return { ok: true as const };
}

// ── Informes sintetizados (IA) ──────────────────────────────────────────────
// Se generan SOLO a partir de los aspectos no sensibles (ver 0051_ser_priva-
// cidad_organizacional.sql — RLS ya impide leer/escribir puntajes de los 12
// aspectos psicológicos/íntimos, así que ni siquiera llegan a este código).
// El PDF de la Guía del Flow no tiene ningún papel aquí: ese documento le
// llega al colaborador por fuera de este sistema.
//
// El núcleo (llamada a Claude + guardar) vive en
// src/lib/guia-flow/generar-informes.ts, compartido con el endpoint que
// dispara guiadelflow apenas alguien termina su Guía del Flow y con el cron
// de respaldo (api/guia-flow/generar-informes-pendientes) — ninguno de esos
// dos tiene sesión de usuario, así que esta acción es la única que valida
// rol/equipo antes de llamarlo.

const GenerarInformesSchema = z.object({
  colaboradorId: z.string().uuid(),
  guiaDelFlowId: z.string().uuid(),
});

/**
 * Genera (o regenera) los dos informes sintetizados de una aplicación de la
 * Guía del Flow, a partir de los puntajes ya cargados de los aspectos no
 * sensibles. admin_th o el líder de este colaborador.
 */
export async function generarInformesSer(input: z.infer<typeof GenerarInformesSchema>) {
  const parsed = GenerarInformesSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: 'Datos inválidos' };

  const perfil = await puedeGestionarGuiaFlow(parsed.data.colaboradorId);
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const supabase = createClient();
  const resultado = await generarInformesParaGuia(supabase, parsed.data.guiaDelFlowId);
  if (!resultado.ok) return { ok: false as const, error: resultado.error };

  revalidar(parsed.data.colaboradorId);
  return { ok: true as const };
}
