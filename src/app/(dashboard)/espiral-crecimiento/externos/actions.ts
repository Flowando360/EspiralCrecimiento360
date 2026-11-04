'use server';

import { createClient } from '@/lib/supabase/server';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const TIPOS = ['contratista', 'transportador', 'asesor', 'freelance', 'proveedor', 'otro'] as const;

const ComunSchema = z.object({
  tipoExterno: z.enum(TIPOS),
  entidad: z.string().trim().optional(),
  servicio: z.string().trim().min(1, 'Escribe el servicio o cargo que presta'),
  responsableId: z.string().uuid().optional().or(z.literal('')),
  fechaInicio: z.string().min(1, 'La fecha de inicio es requerida'),
  fechaFin: z.string().optional(),
  notas: z.string().trim().optional(),
});

const ExternoSchema = ComunSchema.extend({
  nombreCompleto: z.string().trim().min(1, 'El nombre es requerido'),
  numeroDocumento: z.string().trim().optional(),
  email: z.string().trim().email('Correo inválido').optional().or(z.literal('')),
  telefono: z.string().trim().optional(),
});

type Cliente = ReturnType<typeof createClient>;

async function adminTh() {
  const perfil = await getPerfilActual();
  return perfil && perfil.rol === 'admin_th' ? perfil : null;
}

/** Los externos necesitan un cargo (la ficha lo exige): se reutiliza uno con ese nombre o se crea. */
async function cargoParaServicio(supabase: Cliente, empresaId: string, servicio: string): Promise<string | null> {
  const { data: existente } = await supabase
    .from('cargos')
    .select('id')
    .eq('empresa_id', empresaId)
    .ilike('nombre', servicio)
    .limit(1)
    .maybeSingle();
  if (existente) return existente.id as string;
  const { data: nuevo, error } = await supabase
    .from('cargos')
    .insert({ empresa_id: empresaId, nombre: servicio, proceso_area: 'Externos', tiene_personal_a_cargo: false })
    .select('id')
    .single();
  return error || !nuevo ? null : (nuevo.id as string);
}

async function responsableValido(supabase: Cliente, empresaId: string, responsableId?: string) {
  if (!responsableId) return true;
  const { data } = await supabase
    .from('colaboradores')
    .select('id, es_externo')
    .eq('id', responsableId)
    .eq('empresa_id', empresaId)
    .maybeSingle();
  return Boolean(data) && !data!.es_externo;
}

/** Alerta de vencimiento del vínculo (30 días antes). Reemplaza la anterior si cambia la fecha. */
async function sincronizarAlertaVencimiento(
  supabase: Cliente,
  empresaId: string,
  colaboradorId: string,
  nombre: string,
  fechaFin: string | null
) {
  await supabase.from('alertas').delete().eq('colaborador_id', colaboradorId).eq('tipo', 'contrato_vencimiento').eq('estado', 'pendiente');
  if (!fechaFin) return;
  await supabase.from('alertas').insert({
    empresa_id: empresaId,
    colaborador_id: colaboradorId,
    tipo: 'contrato_vencimiento',
    severidad: 'atencion',
    titulo: `Vence el vínculo de ${nombre} (externo)`,
    fecha_objetivo: fechaFin,
    dias_anticipacion: 30,
  });
}

export async function crearExterno(input: z.infer<typeof ExternoSchema>) {
  const perfil = await adminTh();
  if (!perfil) return { ok: false as const, error: 'No autorizado' };
  const parsed = ExternoSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  const d = parsed.data;
  if (d.fechaFin && d.fechaFin < d.fechaInicio) return { ok: false as const, error: 'La fecha de fin no puede ser anterior a la de inicio' };

  const supabase = createClient();
  if (!(await responsableValido(supabase, perfil.empresa_id, d.responsableId || undefined)))
    return { ok: false as const, error: 'El responsable interno no es válido' };

  if (d.numeroDocumento) {
    const { data: repetido } = await supabase
      .from('colaboradores')
      .select('id')
      .eq('empresa_id', perfil.empresa_id)
      .eq('numero_documento', d.numeroDocumento)
      .maybeSingle();
    if (repetido) return { ok: false as const, error: 'Ya hay una persona registrada con ese documento' };
  }

  const cargoId = await cargoParaServicio(supabase, perfil.empresa_id, d.servicio);
  if (!cargoId) return { ok: false as const, error: 'No se pudo preparar el cargo del servicio' };

  const { data, error } = await supabase
    .from('colaboradores')
    .insert({
      empresa_id: perfil.empresa_id,
      nombre_completo: d.nombreCompleto,
      numero_documento: d.numeroDocumento || null,
      email: d.email || null,
      telefono: d.telefono || null,
      cargo_id: cargoId,
      lider_id: d.responsableId || null,
      es_externo: true,
      tipo_contrato: 'externo',
      estado: 'activo',
      fecha_ingreso: d.fechaInicio,
      tipo_externo: d.tipoExterno,
      entidad_externa: d.entidad || null,
      servicio: d.servicio,
      fecha_fin_vinculo: d.fechaFin || null,
      notas_externo: d.notas || null,
    })
    .select('id')
    .single();
  if (error || !data) return { ok: false as const, error: error?.message ?? 'No se pudo crear' };

  await sincronizarAlertaVencimiento(supabase, perfil.empresa_id, data.id as string, d.nombreCompleto, d.fechaFin || null);
  revalidatePath('/espiral-crecimiento/externos');
  revalidatePath('/espiral-crecimiento/organigrama');
  return { ok: true as const, id: data.id as string };
}

const MasivoSchema = ComunSchema.extend({ lineas: z.string().min(1, 'Pega al menos una persona') });

/**
 * Carga varias personas de una vez (p. ej. 13 contratistas instaladores): una por línea,
 * «Nombre ; documento ; correo ; teléfono» (solo el nombre es obligatorio). Todas comparten
 * tipo, entidad, servicio, responsable y fechas.
 */
export async function crearExternosMasivo(input: z.infer<typeof MasivoSchema>) {
  const perfil = await adminTh();
  if (!perfil) return { ok: false as const, error: 'No autorizado' };
  const parsed = MasivoSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  const d = parsed.data;
  if (d.fechaFin && d.fechaFin < d.fechaInicio) return { ok: false as const, error: 'La fecha de fin no puede ser anterior a la de inicio' };

  const filas = d.lineas
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => l.split(/[;\t|]/).map((x) => x.trim()));
  if (filas.length > 200) return { ok: false as const, error: 'Máximo 200 personas por carga' };

  const supabase = createClient();
  if (!(await responsableValido(supabase, perfil.empresa_id, d.responsableId || undefined)))
    return { ok: false as const, error: 'El responsable interno no es válido' };
  const cargoId = await cargoParaServicio(supabase, perfil.empresa_id, d.servicio);
  if (!cargoId) return { ok: false as const, error: 'No se pudo preparar el cargo del servicio' };

  const { data: existentes } = await supabase
    .from('colaboradores')
    .select('numero_documento')
    .eq('empresa_id', perfil.empresa_id)
    .not('numero_documento', 'is', null);
  const documentos = new Set((existentes ?? []).map((c: any) => c.numero_documento as string));

  let creados = 0;
  const omitidas: string[] = [];
  for (const [nombre, documento, correo, telefono] of filas) {
    if (!nombre) continue;
    if (documento && documentos.has(documento)) {
      omitidas.push(`${nombre}: el documento ya está registrado`);
      continue;
    }
    if (correo && !z.string().email().safeParse(correo).success) {
      omitidas.push(`${nombre}: correo inválido`);
      continue;
    }
    const { data, error } = await supabase
      .from('colaboradores')
      .insert({
        empresa_id: perfil.empresa_id,
        nombre_completo: nombre,
        numero_documento: documento || null,
        email: correo || null,
        telefono: telefono || null,
        cargo_id: cargoId,
        lider_id: d.responsableId || null,
        es_externo: true,
        tipo_contrato: 'externo',
        estado: 'activo',
        fecha_ingreso: d.fechaInicio,
        tipo_externo: d.tipoExterno,
        entidad_externa: d.entidad || null,
        servicio: d.servicio,
        fecha_fin_vinculo: d.fechaFin || null,
        notas_externo: d.notas || null,
      })
      .select('id')
      .single();
    if (error || !data) {
      omitidas.push(`${nombre}: ${error?.message ?? 'no se pudo crear'}`);
      continue;
    }
    if (documento) documentos.add(documento);
    creados++;
    if (d.fechaFin) await sincronizarAlertaVencimiento(supabase, perfil.empresa_id, data.id as string, nombre, d.fechaFin);
  }

  revalidatePath('/espiral-crecimiento/externos');
  revalidatePath('/espiral-crecimiento/organigrama');
  return { ok: true as const, creados, omitidas };
}

const EditarSchema = ExternoSchema.extend({
  colaboradorId: z.string().uuid(),
  estado: z.enum(['activo', 'inactivo']),
});

export async function actualizarExterno(input: z.infer<typeof EditarSchema>) {
  const perfil = await adminTh();
  if (!perfil) return { ok: false as const, error: 'No autorizado' };
  const parsed = EditarSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  const d = parsed.data;
  if (d.fechaFin && d.fechaFin < d.fechaInicio) return { ok: false as const, error: 'La fecha de fin no puede ser anterior a la de inicio' };

  const supabase = createClient();
  const { data: actual } = await supabase
    .from('colaboradores')
    .select('id, empresa_id, es_externo')
    .eq('id', d.colaboradorId)
    .maybeSingle();
  if (!actual || actual.empresa_id !== perfil.empresa_id || !actual.es_externo) return { ok: false as const, error: 'Externo no encontrado' };
  if (!(await responsableValido(supabase, perfil.empresa_id, d.responsableId || undefined)))
    return { ok: false as const, error: 'El responsable interno no es válido' };

  const cargoId = await cargoParaServicio(supabase, perfil.empresa_id, d.servicio);
  if (!cargoId) return { ok: false as const, error: 'No se pudo preparar el cargo del servicio' };

  const { error } = await supabase
    .from('colaboradores')
    .update({
      nombre_completo: d.nombreCompleto,
      numero_documento: d.numeroDocumento || null,
      email: d.email || null,
      telefono: d.telefono || null,
      cargo_id: cargoId,
      lider_id: d.responsableId || null,
      estado: d.estado,
      fecha_ingreso: d.fechaInicio,
      fecha_salida: d.estado === 'inactivo' ? new Date().toISOString().slice(0, 10) : null,
      tipo_externo: d.tipoExterno,
      entidad_externa: d.entidad || null,
      servicio: d.servicio,
      fecha_fin_vinculo: d.fechaFin || null,
      notas_externo: d.notas || null,
    })
    .eq('id', d.colaboradorId);
  if (error) return { ok: false as const, error: error.message };

  await sincronizarAlertaVencimiento(
    supabase,
    perfil.empresa_id,
    d.colaboradorId,
    d.nombreCompleto,
    d.estado === 'activo' ? d.fechaFin || null : null
  );
  revalidatePath('/espiral-crecimiento/externos');
  revalidatePath(`/espiral-crecimiento/externos/${d.colaboradorId}`);
  revalidatePath('/espiral-crecimiento/organigrama');
  return { ok: true as const };
}

/** Pasa a una persona de externa a colaboradora vinculada (queda en período de prueba, con su líder actual). */
export async function convertirExternoEnColaborador(colaboradorId: string) {
  const perfil = await adminTh();
  if (!perfil) return { ok: false as const, error: 'No autorizado' };
  const supabase = createClient();
  const { data: c } = await supabase
    .from('colaboradores')
    .select('id, empresa_id, es_externo')
    .eq('id', colaboradorId)
    .maybeSingle();
  if (!c || c.empresa_id !== perfil.empresa_id || !c.es_externo) return { ok: false as const, error: 'Externo no encontrado' };

  const { error } = await supabase
    .from('colaboradores')
    .update({ es_externo: false, tipo_contrato: 'indefinido', estado: 'periodo_prueba', fecha_fin_vinculo: null })
    .eq('id', colaboradorId);
  if (error) return { ok: false as const, error: error.message };
  await supabase.from('alertas').delete().eq('colaborador_id', colaboradorId).eq('tipo', 'contrato_vencimiento').eq('estado', 'pendiente');

  revalidatePath('/espiral-crecimiento/externos');
  revalidatePath('/espiral-crecimiento/colaboradores');
  revalidatePath('/espiral-crecimiento/organigrama');
  return { ok: true as const };
}

const SeguimientoSchema = z.object({
  colaboradorId: z.string().uuid(),
  fecha: z.string().min(1),
  calificacion: z.number().int().min(1).max(5).nullable(),
  comentario: z.string().trim().min(3, 'Escribe el comentario (mínimo 3 caracteres)'),
});

export async function registrarSeguimientoExterno(input: z.infer<typeof SeguimientoSchema>) {
  const perfil = await getPerfilActual();
  if (!perfil || (perfil.rol !== 'admin_th' && perfil.rol !== 'lider')) return { ok: false as const, error: 'No autorizado' };
  const parsed = SeguimientoSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  const d = parsed.data;

  const supabase = createClient();
  const { data: c } = await supabase
    .from('colaboradores')
    .select('id, empresa_id, es_externo, lider_id')
    .eq('id', d.colaboradorId)
    .maybeSingle();
  if (!c || c.empresa_id !== perfil.empresa_id || !c.es_externo) return { ok: false as const, error: 'Externo no encontrado' };
  if (perfil.rol === 'lider' && c.lider_id !== perfil.colaborador_id) return { ok: false as const, error: 'Solo puedes registrar seguimiento de tus externos' };

  const { error } = await supabase.from('externos_seguimiento').insert({
    empresa_id: perfil.empresa_id,
    colaborador_id: d.colaboradorId,
    fecha: d.fecha,
    calificacion: d.calificacion,
    comentario: d.comentario,
    registrado_por: perfil.usuario_id,
  });
  if (error) return { ok: false as const, error: error.message };
  revalidatePath(`/espiral-crecimiento/externos/${d.colaboradorId}`);
  return { ok: true as const };
}

export async function eliminarSeguimientoExterno(seguimientoId: string, colaboradorId: string) {
  const perfil = await adminTh();
  if (!perfil) return { ok: false as const, error: 'No autorizado' };
  const supabase = createClient();
  const { error } = await supabase
    .from('externos_seguimiento')
    .delete()
    .eq('id', seguimientoId)
    .eq('empresa_id', perfil.empresa_id);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath(`/espiral-crecimiento/externos/${colaboradorId}`);
  return { ok: true as const };
}
