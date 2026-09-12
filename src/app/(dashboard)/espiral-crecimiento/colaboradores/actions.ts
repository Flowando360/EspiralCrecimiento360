'use server';

import { createClient } from '@/lib/supabase/server';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

const EditarColaboradorSchema = z.object({
  colaboradorId: z.string().uuid(),
  nombreCompleto: z.string().trim().min(1, 'El nombre es requerido'),
  numeroDocumento: z.string().trim().optional(),
  email: z.string().trim().email('Correo inválido').optional().or(z.literal('')),
  telefono: z.string().trim().optional(),
  cargoId: z.string().uuid('Selecciona un cargo'),
  liderId: z.string().uuid().optional().or(z.literal('')),
  fechaIngreso: z.string().min(1, 'La fecha de ingreso es requerida'),
  tipoContrato: z.enum(['indefinido', 'fijo', 'obra_labor', 'prestacion_servicios', 'aprendizaje', 'externo']),
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
 * inactiva), esto borra la fila por completo — pensado para corregir errores
 * de captura (ficha duplicada, persona equivocada), no para el retiro normal
 * de alguien que deja la empresa.
 *
 * La mayoría de tablas relacionadas (evaluaciones, SER, hoja de vida,
 * inducción, alertas, dotación, incapacidades, fechas especiales, Guía del
 * Flow...) tienen "on delete cascade" contra colaboradores — es decir, borrar
 * la ficha borra también todo ese historial sin avisar aparte, por eso el
 * mensaje de confirmación en pantalla lo explicita. Solo se bloquea (con
 * error de Postgres) si esta persona sigue siendo el líder de alguien más
 * en `colaboradores.lider_id` — ahí se sugiere "Salida" en su lugar.
 */
export async function eliminarColaborador(colaboradorId: string) {
  const perfil = await getPerfilActual();
  if (!perfil || perfil.rol !== 'admin_th') return { ok: false as const, error: 'No autorizado' };

  const supabase = createClient();

  const { data: colaborador } = await supabase
    .from('colaboradores')
    .select('id, empresa_id')
    .eq('id', colaboradorId)
    .maybeSingle();

  if (!colaborador || colaborador.empresa_id !== perfil.empresa_id) {
    return { ok: false as const, error: 'Colaborador no encontrado' };
  }

  const { error } = await supabase.from('colaboradores').delete().eq('id', colaboradorId);

  if (error) {
    const esConflictoDeReferencias = /foreign key|constraint|violates/i.test(error.message);
    return {
      ok: false as const,
      error: esConflictoDeReferencias
        ? 'No se pudo eliminar: esta persona sigue registrada como líder de alguien más. Reasigna primero ese equipo a otro líder, o usa "Salida" desde su Historial para dejarla inactiva en su lugar.'
        : error.message,
    };
  }

  revalidatePath('/espiral-crecimiento/colaboradores');
  return { ok: true as const };
}
