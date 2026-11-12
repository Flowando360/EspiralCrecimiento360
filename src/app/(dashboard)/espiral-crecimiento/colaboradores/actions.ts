'use server';

import { VALORES_TIPO_CONTRATO } from '@/lib/contratos';

import { createClient } from '@/lib/supabase/server';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { primero } from '@/lib/utils';

const EditarColaboradorSchema = z.object({
  colaboradorId: z.string().uuid(),
  nombreCompleto: z.string().trim().min(1, 'El nombre es requerido'),
  numeroDocumento: z.string().trim().optional(),
  email: z.string().trim().email('Correo inválido').optional().or(z.literal('')),
  telefono: z.string().trim().optional(),
  cargoId: z.string().uuid('Selecciona un cargo'),
  liderId: z.string().uuid().optional().or(z.literal('')),
  fechaIngreso: z.string().min(1, 'La fecha de ingreso es requerida'),
  tipoContrato: z.enum(VALORES_TIPO_CONTRATO),
  estado: z.enum(['activo', 'periodo_prueba', 'inactivo', 'en_proceso_salida']),
  salario: z.string().optional(),
  eps: z.string().trim().optional(),
  arl: z.string().trim().optional(),
  afp: z.string().trim().optional(),
  cajaCompensacion: z.string().trim().optional(),
});

/**
 * Actualiza todos los datos editables de la ficha de un colaborador
 * (admin_th únicamente) -- antes solo se podían corregir el salario/contrato
 * (Documentos) y las afiliaciones, uno por uno y desde pantallas separadas;
 * esto cubre el resto (nombre, documento, contacto, cargo, líder, fecha de
 * ingreso, tipo de contrato y estado) desde un solo formulario.
 *
 * Deliberadamente NO toca fecha_salida/motivo_salida ni usuario_id: la
 * salida de una persona se registra desde su Historial (agregarMovimiento),
 * que además retira su cuenta de acceso -- duplicar esa lógica aquí abriría
 * la puerta a dejar esos datos inconsistentes.
 */
export async function actualizarColaborador(input: z.infer<typeof EditarColaboradorSchema>) {
  const perfil = await getPerfilActual();
  if (!perfil || perfil.rol !== 'admin_th') return { ok: false as const, error: 'No autorizado' };

  const parsed = EditarColaboradorSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  }
  const d = parsed.data;

  if (d.liderId === d.colaboradorId) {
    return { ok: false as const, error: 'Una persona no puede ser su propio líder' };
  }

  const salarioNum = d.salario?.trim() ? Number(d.salario) : null;
  if (d.salario?.trim() && (salarioNum === null || Number.isNaN(salarioNum))) {
    return { ok: false as const, error: 'El salario debe ser un número' };
  }

  const supabase = createClient();

  const { data: colaborador } = await supabase
    .from('colaboradores')
    .select('id, empresa_id')
    .eq('id', d.colaboradorId)
    .maybeSingle();
  if (!colaborador || colaborador.empresa_id !== perfil.empresa_id) {
    return { ok: false as const, error: 'Colaborador no encontrado' };
  }

  const { error } = await supabase
    .from('colaboradores')
    .update({
      nombre_completo: d.nombreCompleto,
      numero_documento: d.numeroDocumento || null,
      email: d.email || null,
      telefono: d.telefono || null,
      cargo_id: d.cargoId,
      lider_id: d.liderId || null,
      fecha_ingreso: d.fechaIngreso,
      tipo_contrato: d.tipoContrato,
      estado: d.estado,
      salario: salarioNum,
      eps: d.eps || null,
      arl: d.arl || null,
      afp: d.afp || null,
      caja_compensacion: d.cajaCompensacion || null,
    })
    .eq('id', d.colaboradorId);

  if (error) return { ok: false as const, error: error.message };

  revalidatePath(`/espiral-crecimiento/colaboradores/${d.colaboradorId}`);
  revalidatePath('/espiral-crecimiento/colaboradores');
  redirect(`/espiral-crecimiento/colaboradores/${d.colaboradorId}`);
}

/**
 * Elimina definitivamente la ficha de un colaborador (admin_th únicamente).
 * A diferencia de registrar una "Salida" en su Historial (que solo la deja
 * inactiva), esto borra la fila por completo.
 *
 * ANTES de borrar se guarda un registro en `colaboradores_historico` (migración
 * 0110): nombre, documento, cargo, líder, fechas, motivo y su línea de tiempo
 * de movimientos. Así queda constancia de quién pasó por la empresa aunque la
 * ficha ya no exista. Si ese registro no se puede guardar, NO se borra nada.
 *
 * La mayoría de tablas relacionadas (evaluaciones, SER, hoja de vida,
 * inducción, alertas...) caen en cascada con la ficha. Solo se bloquea si esta
 * persona sigue siendo el líder de alguien: primero hay que reasignar su equipo
 * (Administración → Organigrama).
 */
export async function eliminarColaborador(colaboradorId: string, motivo?: string) {
  const perfil = await getPerfilActual();
  if (!perfil || perfil.rol !== 'admin_th') return { ok: false as const, error: 'No autorizado' };

  const supabase = createClient();

  const { data: colaborador } = await supabase
    .from('colaboradores')
    .select(
      'id, empresa_id, nombre_completo, numero_documento, email, estado, fecha_ingreso, fecha_salida, motivo_salida, cargo:cargos(nombre), lider:lider_id(nombre_completo)'
    )
    .eq('id', colaboradorId)
    .maybeSingle();

  if (!colaborador || colaborador.empresa_id !== perfil.empresa_id) {
    return { ok: false as const, error: 'Colaborador no encontrado' };
  }

  // Si todavía lidera a alguien, avisar antes de intentar nada.
  const { count: aCargo } = await supabase
    .from('colaboradores')
    .select('id', { count: 'exact', head: true })
    .eq('lider_id', colaboradorId);
  if ((aCargo ?? 0) > 0) {
    return {
      ok: false as const,
      error: `Esta persona es líder de ${aCargo} colaborador(es). Reasigna primero ese equipo a otro líder en Administración → Organigrama, o usa "Salida" desde su Historial para dejarla inactiva.`,
    };
  }

  const { data: movimientos } = await supabase
    .from('historial_movimientos')
    .select('tipo, descripcion, fecha')
    .eq('colaborador_id', colaboradorId)
    .order('fecha');

  const cargo = primero(colaborador.cargo as any) as { nombre?: string } | null;
  const lider = primero(colaborador.lider as any) as { nombre_completo?: string } | null;

  const { error: errHist } = await supabase.from('colaboradores_historico').insert({
    empresa_id: perfil.empresa_id,
    colaborador_id_original: colaboradorId,
    nombre_completo: colaborador.nombre_completo,
    numero_documento: colaborador.numero_documento,
    email: colaborador.email,
    cargo_nombre: cargo?.nombre ?? null,
    lider_nombre: lider?.nombre_completo ?? null,
    fecha_ingreso: colaborador.fecha_ingreso,
    fecha_salida: colaborador.fecha_salida,
    estado_al_eliminar: colaborador.estado,
    motivo: motivo?.trim() || colaborador.motivo_salida || null,
    resumen: { movimientos: movimientos ?? [] },
    eliminado_por: perfil.usuario_id,
  });
  if (errHist) {
    return {
      ok: false as const,
      error: `No se eliminó: no se pudo guardar el registro en el histórico (${errHist.message}). Verifica que la migración 0110 esté aplicada en Supabase.`,
    };
  }

  const { error } = await supabase.from('colaboradores').delete().eq('id', colaboradorId);

  if (error) {
    const esConflictoDeReferencias = /foreign key|constraint|violates/i.test(error.message);
    return {
      ok: false as const,
      error: esConflictoDeReferencias
        ? 'No se pudo eliminar: esta persona sigue referenciada en otros registros. Usa "Salida" desde su Historial para dejarla inactiva en su lugar.'
        : error.message,
    };
  }

  revalidatePath('/espiral-crecimiento/colaboradores');
  revalidatePath('/espiral-crecimiento/colaboradores/historico');
  revalidatePath('/espiral-crecimiento/organigrama');
  return { ok: true as const };
}
