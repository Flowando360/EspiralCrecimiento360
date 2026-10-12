'use server';

import { createAdminClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Canal público para que el titular ejerza sus derechos. Usa service_role porque
// quien escribe es un candidato sin sesión; la empresa se toma de la vacante.
const SolicitudSchema = z.object({
  vacanteId: z.string().uuid('Enlace inválido'),
  tipo: z.enum(['consulta', 'correccion', 'revocacion', 'supresion']),
  nombreTitular: z.string().trim().min(1, 'Tu nombre es requerido').max(200),
  numeroDocumento: z.string().trim().max(50).optional(),
  correo: z.string().trim().email('Correo inválido').max(200),
  detalle: z.string().trim().min(10, 'Cuéntanos un poco más (mínimo 10 caracteres)').max(2000),
});

export async function enviarSolicitudTitular(formData: FormData) {
  const parsed = SolicitudSchema.safeParse({
    vacanteId: formData.get('vacanteId'),
    tipo: formData.get('tipo'),
    nombreTitular: formData.get('nombreTitular'),
    numeroDocumento: formData.get('numeroDocumento') || undefined,
    correo: formData.get('correo'),
    detalle: formData.get('detalle'),
  });
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };

  const supabase = createAdminClient();
  const { data: vacante } = await supabase.from('vacantes').select('empresa_id').eq('id', parsed.data.vacanteId).maybeSingle();
  if (!vacante) return { ok: false as const, error: 'No encontramos la vacante asociada a este enlace.' };

  const { error } = await supabase.from('solicitudes_titular').insert({
    empresa_id: vacante.empresa_id,
    tipo: parsed.data.tipo,
    nombre_titular: parsed.data.nombreTitular,
    numero_documento: parsed.data.numeroDocumento || null,
    correo: parsed.data.correo,
    detalle: parsed.data.detalle,
  });
  if (error) return { ok: false as const, error: error.message };
  return { ok: true as const };
}
