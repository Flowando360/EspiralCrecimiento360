'use server';

import { createClient } from '@/lib/supabase/server';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { redirect } from 'next/navigation';
import { z } from 'zod';

const CrearColaboradorSchema = z.object({
  usuarioId: z.string().uuid().optional(),
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
 * Crea la ficha del colaborador (tabla `colaboradores`) con todos sus datos
 * asociados -- este era el hueco real: el botón "Nuevo colaborador" llevaba
 * a Usuarios y roles, que solo crea una CUENTA DE ACCESO (login), nunca la
 * ficha en sí.
 *
 * `usuarioId` es opcional y sirve para el caso inverso: alguien ya le creó
 * la cuenta de acceso a esta persona desde Usuarios y roles (sin ficha
 * todavía) -- pasa exactamente igual con cualquier cuenta sin colaborador
 * vinculado -- y ahora se le arma la ficha completa. Se valida que esa
 * cuenta exista en la misma empresa y que de verdad no tenga ya una ficha --
 * `colaboradores.usuario_id` no tiene restricción UNIQUE en la base de
 * datos, así que sin este chequeo dos fichas podrían terminar apuntando a
 * la misma cuenta de acceso sin que nada lo impidiera.
 */
export async function crearColaborador(input: z.infer<typeof CrearColaboradorSchema>) {
  const perfil = await getPerfilActual();
  if (!perfil || perfil.rol !== 'admin_th') return { ok: false as const, error: 'No autorizado' };

  const parsed = CrearColaboradorSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  }
  const d = parsed.data;

  const salarioNum = d.salario?.trim() ? Number(d.salario) : null;
  if (d.salario?.trim() && (salarioNum === null || Number.isNaN(salarioNum))) {
    return { ok: false as const, error: 'El salario debe ser un número' };
  }

  const supabase = createClient();

  if (d.usuarioId) {
    const { data: cuenta } = await supabase
      .from('perfiles_usuario')
      .select('id')
      .eq('id', d.usuarioId)
      .eq('empresa_id', perfil.empresa_id)
      .maybeSingle();
    if (!cuenta) return { ok: false as const, error: 'Esa cuenta de acceso no existe en tu empresa' };

    const { data: yaVinculado } = await supabase
      .from('colaboradores')
      .select('id')
      .eq('usuario_id', d.usuarioId)
      .maybeSingle();
    if (yaVinculado) return { ok: false as const, error: 'Esa cuenta ya tiene una ficha de colaborador' };
  }

  const { data, error } = await supabase
    .from('colaboradores')
    .insert({
      empresa_id: perfil.empresa_id,
      usuario_id: d.usuarioId || null,
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
    .select('id')
    .single();

  if (error) return { ok: false as const, error: error.message };

  redirect(`/espiral-crecimiento/colaboradores/${data.id}`);
}
