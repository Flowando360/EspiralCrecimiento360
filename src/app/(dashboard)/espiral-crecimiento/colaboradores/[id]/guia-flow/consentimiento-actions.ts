'use server';

import { createClient } from '@/lib/supabase/server';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { revalidatePath } from 'next/cache';
import { registrarAuditoria } from '@/lib/auditoria/registrar';
import { VERSION_FINALIDAD_GUIA } from '@/lib/guia-flow/consentimiento';

/** Solo la propia persona decide si su líder puede ver el informe de su Guía del Flow. */
export async function guardarConsentimientoGuia(input: { comparteConLider: boolean }) {
  const perfil = await getPerfilActual();
  if (!perfil?.colaborador_id) return { ok: false as const, error: 'No autorizado' };

  const supabase = createClient();
  const { error } = await supabase.from('ser_consentimientos').upsert(
    {
      empresa_id: perfil.empresa_id,
      colaborador_id: perfil.colaborador_id,
      comparte_con_lider: Boolean(input.comparteConLider),
      version_finalidad: VERSION_FINALIDAD_GUIA,
      aceptado_en: new Date().toISOString(),
      actualizado_en: new Date().toISOString(),
    },
    { onConflict: 'colaborador_id' }
  );
  if (error) return { ok: false as const, error: error.message };

  await registrarAuditoria(perfil, {
    modulo: 'usuarios',
    accion: 'guia_flow.consentimiento',
    resumen: `${perfil.nombre_completo} ${input.comparteConLider ? 'permitió' : 'no permitió'} que su líder vea el informe de su Guía del Flow`,
    objetoTipo: 'colaborador',
    objetoId: perfil.colaborador_id,
    detalle: { comparte_con_lider: Boolean(input.comparteConLider), version_finalidad: VERSION_FINALIDAD_GUIA },
  });

  revalidatePath(`/espiral-crecimiento/colaboradores/${perfil.colaborador_id}/guia-flow`);
  revalidatePath('/mi-perfil');
  return { ok: true as const };
}
