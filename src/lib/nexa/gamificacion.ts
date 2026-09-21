import { createAdminClient } from '@/lib/supabase/server';

/**
 * Otorga puntos automáticos al pool existente de gamificación de Nexa
 * (nexa_reconocimientos — antes solo se llenaba manualmente desde
 * Reconocimientos). Usa el cliente admin porque quien ejecuta la acción que
 * dispara el punto (ej. un colaborador confirmando lectura de un documento)
 * no necesariamente tiene permiso de RLS para escribir reconocimientos por
 * su cuenta — el otorgamiento automático es una acción del sistema, no un
 * reconocimiento manual de un líder.
 *
 * Nunca lanza: un fallo al otorgar puntos no debe tumbar la acción principal
 * (confirmar lectura, cerrar una ACPM, etc.) que sí importa que se guarde.
 */
export async function otorgarPuntos(colaboradorId: string | null, puntos: number, motivo: string, otorgadoPor?: string | null) {
  if (!colaboradorId) return;
  try {
    const admin = createAdminClient();
    await admin.from('nexa_reconocimientos').insert({
      colaborador_id: colaboradorId,
      puntos,
      motivo,
      otorgado_por: otorgadoPor || null,
    });
  } catch {
    // silencioso a propósito — ver comentario arriba
  }
}

/** Puntos por cada acción del módulo de Procesos que alimenta el ranking de Nexa (punto 3.3). */
export const PUNTOS_PROCESOS = {
  confirmarLecturaDocumento: 5,
  marcarRiesgoRevisado: 5,
  registrarRiesgoConControl: 10,
  registrarAcpm: 10,
  completarPlanDeAccionAcpm: 20,
  cerrarAcpmEficaz: 60,
} as const;
