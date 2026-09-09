'use server';

import { createAdminClient } from '@/lib/supabase/server';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

/**
 * Panel meta-admin (Modelo de Negocio Espiral Evolutiva secc. 5): cuentas y
 * membresías de TODAS las empresas cliente de la alianza Flowando/Nexus/V&E.
 * Se autoriza en la capa de aplicación (perfiles_usuario.es_superadmin) y se
 * consulta con el cliente admin (service role) porque un superadmin no
 * pertenece a una sola empresa — las policies existentes de "empresas" y
 * "perfiles_usuario" siguen intactas para todos los demás roles.
 */
async function requerirSuperadmin() {
  const perfil = await getPerfilActual();
  if (!perfil || !perfil.es_superadmin) return null;
  return perfil;
}

const MembresiaSchema = z.object({
  empresaId: z.string().uuid(),
  planMembresia: z.enum(['piloto', 'estandar', 'premium']),
  precioMembresiaMensual: z.number().min(0).nullable(),
  estadoFacturacion: z.enum(['al_dia', 'pendiente', 'vencido']),
  fechaProximoPago: z.string().nullable(),
});

export async function actualizarMembresia(input: z.infer<typeof MembresiaSchema>) {
  const perfil = await requerirSuperadmin();
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const parsed = MembresiaSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };

  const admin = createAdminClient();
  const { error } = await admin
    .from('empresas')
    .update({
      plan_membresia: parsed.data.planMembresia,
      precio_membresia_mensual: parsed.data.precioMembresiaMensual,
      estado_facturacion: parsed.data.estadoFacturacion,
      fecha_proximo_pago: parsed.data.fechaProximoPago || null,
    })
    .eq('id', parsed.data.empresaId);

  if (error) return { ok: false as const, error: error.message };
  revalidatePath('/meta-admin');
  return { ok: true as const };
}
