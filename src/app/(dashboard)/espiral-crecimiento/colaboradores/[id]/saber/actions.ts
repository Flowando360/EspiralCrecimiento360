'use server';

import { createClient } from '@/lib/supabase/server';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import type { VerificacionSaber } from '@/types/colaborador';

const BLOQUES = [
  'formacion_academica',
  'habilidades_funcionales_tecnicas',
  'certificaciones',
  'experiencia',
] as const;

const ESTADOS = ['cumple', 'cumple_parcial', 'no_cumple_pendiente'] as const;

/**
 * Replica en el servidor la misma regla que ya aplica RLS (fn_es_mi_equipo):
 * admin_th certifica cualquier colaborador de su empresa; un líder solo el
 * de sus reportes directos. Se revalida aquí también porque las acciones
 * corren con la service_role key (BYPASS_AUTH), que salta RLS.
 */
async function puedeCertificar(colaboradorId: string) {
  const perfil = await getPerfilActual();
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const supabase = createClient();
  const { data: colaborador } = await supabase
    .from('colaboradores')
    .select('id, empresa_id, lider_id')
    .eq('id', colaboradorId)
    .maybeSingle();

  if (!colaborador || colaborador.empresa_id !== perfil.empresa_id) {
    return { ok: false as const, error: 'Colaborador no encontrado' };
  }

  const autorizado =
    perfil.rol === 'admin_th' || (perfil.rol === 'lider' && colaborador.lider_id === perfil.colaborador_id);

  if (!autorizado) return { ok: false as const, error: 'No autorizado' };
  return { ok: true as const, perfil };
}

function revalidar(colaboradorId: string) {
  revalidatePath(`/espiral-crecimiento/colaboradores/${colaboradorId}/saber`);
  revalidatePath(`/espiral-crecimiento/colaboradores/${colaboradorId}`);
}

const AgregarSchema = z.object({
  colaboradorId: z.string().uuid(),
  bloque: z.enum(BLOQUES),
  itemEvaluado: z.string().trim().min(1, 'Escribe qué se va a verificar'),
});

export async function agregarVerificacionSaber(input: z.infer<typeof AgregarSchema>) {
  const parsed = AgregarSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };

  const permiso = await puedeCertificar(parsed.data.colaboradorId);
  if (!permiso.ok) return { ok: false as const, error: permiso.error };

  const supabase = createClient();
  const { data, error } = await supabase
    .from('verificaciones_saber')
    .insert({
      colaborador_id: parsed.data.colaboradorId,
      bloque: parsed.data.bloque,
      item_evaluado: parsed.data.itemEvaluado,
    })
    .select('*')
    .single();

  if (error) return { ok: false as const, error: error.message };

  revalidar(parsed.data.colaboradorId);
  return { ok: true as const, item: data as unknown as VerificacionSaber };
}

const ActualizarSchema = z.object({
  id: z.string().uuid(),
  colaboradorId: z.string().uuid(),
  estado: z.enum(ESTADOS),
  evidenciaUrl: z.string().trim().optional(),
  observaciones: z.string().trim().optional(),
});

export async function actualizarVerificacionSaber(input: z.infer<typeof ActualizarSchema>) {
  const parsed = ActualizarSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };

  const permiso = await puedeCertificar(parsed.data.colaboradorId);
  if (!permiso.ok) return { ok: false as const, error: permiso.error };

  const supabase = createClient();
  const { error } = await supabase
    .from('verificaciones_saber')
    .update({
      estado: parsed.data.estado,
      evidencia_url: parsed.data.evidenciaUrl || null,
      observaciones: parsed.data.observaciones || null,
      certificado_por: permiso.perfil.usuario_id,
      fecha_verificacion: new Date().toISOString().slice(0, 10),
    })
    .eq('id', parsed.data.id)
    .eq('colaborador_id', parsed.data.colaboradorId);

  if (error) return { ok: false as const, error: error.message };

  revalidar(parsed.data.colaboradorId);
  return { ok: true as const };
}

const EliminarSchema = z.object({
  id: z.string().uuid(),
  colaboradorId: z.string().uuid(),
});

export async function eliminarVerificacionSaber(input: z.infer<typeof EliminarSchema>) {
  const parsed = EliminarSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };

  const permiso = await puedeCertificar(parsed.data.colaboradorId);
  if (!permiso.ok) return { ok: false as const, error: permiso.error };

  const supabase = createClient();
  const { error } = await supabase
    .from('verificaciones_saber')
    .delete()
    .eq('id', parsed.data.id)
    .eq('colaborador_id', parsed.data.colaboradorId);

  if (error) return { ok: false as const, error: error.message };

  revalidar(parsed.data.colaboradorId);
  return { ok: true as const };
}

const ETIQUETA_FORMACION: Record<string, string> = {
  bachillerato: 'Bachillerato',
  tecnico: 'Técnico',
  tecnologo: 'Tecnólogo',
  universitario: 'Universitario',
};

function mesesEntre(inicio: string, fin: string | null) {
  const a = new Date(inicio);
  const b = fin ? new Date(fin) : new Date();
  return Math.max(0, (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth()));
}

/**
 * Arma el checklist de Saber cruzando lo que EXIGE el cargo con lo que la
 * persona YA ACREDITÓ en su hoja de vida: formación mínima, cada habilidad del
 * cargo, cada certificación/curso cargado y los meses de experiencia. No
 * duplica ítems que ya existan (compara por nombre). Pensado para que TH o el
 * líder no tengan que volver a digitar lo que ya está en la hoja de vida.
 */
export async function generarChecklistSaber(colaboradorId: string) {
  const permiso = await puedeCertificar(colaboradorId);
  if (!permiso.ok) return { ok: false as const, error: permiso.error };

  const supabase = createClient();
  const { data: col } = await supabase
    .from('colaboradores')
    .select('cargo:cargos(id, formacion_nivel, formacion_titulo_especifico, experiencia_minima_meses)')
    .eq('id', colaboradorId)
    .maybeSingle();
  const cargo = (col as any)?.cargo;
  if (!cargo) return { ok: false as const, error: 'El colaborador no tiene cargo asignado' };

  const [{ data: hoja }, { data: habilidades }, { data: existentes }] = await Promise.all([
    supabase.from('hoja_vida_formacion').select('*').eq('colaborador_id', colaboradorId),
    supabase.from('cargo_habilidades').select('nombre, tipo, nivel_esperado').eq('cargo_id', cargo.id).order('orden'),
    supabase.from('verificaciones_saber').select('item_evaluado').eq('colaborador_id', colaboradorId),
  ]);
  const yaEstan = new Set((existentes ?? []).map((e: any) => String(e.item_evaluado).trim().toLowerCase()));
  const registros = (hoja ?? []) as any[];
  const hoy = new Date().toISOString().slice(0, 10);

  const nuevos: { bloque: string; item_evaluado: string; estado: string; evidencia_url?: string | null; observaciones: string }[] = [];
  const origen = 'Generado desde el cargo y la hoja de vida.';

  // 1. Formación académica mínima
  if (cargo.formacion_nivel && ETIQUETA_FORMACION[cargo.formacion_nivel]) {
    const academicas = registros.filter((r) => r.tipo === 'academica');
    nuevos.push({
      bloque: 'formacion_academica',
      item_evaluado:
        `Formación requerida: ${ETIQUETA_FORMACION[cargo.formacion_nivel]}` +
        (cargo.formacion_titulo_especifico ? ` — ${cargo.formacion_titulo_especifico}` : ''),
      estado: academicas.length > 0 ? 'cumple' : 'no_cumple_pendiente',
      evidencia_url: academicas.find((a) => a.documento_url)?.documento_url ?? null,
      observaciones: academicas.length > 0 ? `${origen} Acredita: ${academicas.map((a) => a.titulo).join('; ')}.` : `${origen} Sin formación académica en la hoja de vida.`,
    });
  }

  // 2. Habilidades del cargo (se verifican con la evaluación o con el líder)
  for (const h of habilidades ?? []) {
    nuevos.push({
      bloque: 'habilidades_funcionales_tecnicas',
      item_evaluado: `${h.nombre} (${h.tipo}, nivel ${h.nivel_esperado})`,
      estado: 'no_cumple_pendiente',
      observaciones: `${origen} Pendiente de verificar por el líder.`,
    });
  }

  // 3. Certificaciones y cursos de la hoja de vida
  for (const r of registros.filter((x) => x.tipo === 'certificacion' || x.tipo === 'curso')) {
    const vencida = r.fecha_vencimiento && r.fecha_vencimiento < hoy;
    nuevos.push({
      bloque: 'certificaciones',
      item_evaluado: r.titulo + (r.institucion ? ` — ${r.institucion}` : ''),
      estado: vencida ? 'no_cumple_pendiente' : r.documento_url || r.verificado ? 'cumple' : 'cumple_parcial',
      evidencia_url: r.documento_url ?? null,
      observaciones: vencida
        ? `${origen} Vencida el ${r.fecha_vencimiento}.`
        : `${origen}${r.documento_url || r.verificado ? '' : ' Sin soporte cargado.'}`,
    });
  }

  // 4. Experiencia mínima
  if (cargo.experiencia_minima_meses) {
    const meses = registros
      .filter((r) => r.tipo === 'experiencia_laboral' && r.fecha_inicio)
      .reduce((acc, r) => acc + mesesEntre(r.fecha_inicio, r.fecha_fin), 0);
    nuevos.push({
      bloque: 'experiencia',
      item_evaluado: `Experiencia mínima: ${cargo.experiencia_minima_meses} meses`,
      estado: meses >= cargo.experiencia_minima_meses ? 'cumple' : meses > 0 ? 'cumple_parcial' : 'no_cumple_pendiente',
      observaciones: `${origen} Acredita ${meses} meses en la hoja de vida.`,
    });
  }

  const porCrear = nuevos.filter((n) => !yaEstan.has(n.item_evaluado.trim().toLowerCase()));
  if (porCrear.length === 0) return { ok: true as const, creados: 0 };

  const { error } = await supabase.from('verificaciones_saber').insert(
    porCrear.map((n) => ({
      colaborador_id: colaboradorId,
      bloque: n.bloque as (typeof BLOQUES)[number],
      item_evaluado: n.item_evaluado,
      estado: n.estado as (typeof ESTADOS)[number],
      evidencia_url: n.evidencia_url ?? null,
      observaciones: n.observaciones,
    }))
  );
  if (error) return { ok: false as const, error: error.message };

  revalidar(colaboradorId);
  return { ok: true as const, creados: porCrear.length };
}
