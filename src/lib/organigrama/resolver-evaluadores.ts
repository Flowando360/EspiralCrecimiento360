import type { Colaborador } from '@/types/colaborador';

export type TipoEvaluador = 'autoevaluacion' | 'lider' | 'par' | 'colaborador_a_cargo';

export interface AsignacionEvaluador {
  colaborador_evaluado_id: string;
  evaluador_id: string;
  tipo: TipoEvaluador;
}

/**
 * Traduce el organigrama (lider_id de cada colaborador) en la matriz completa
 * de evaluadores para un ciclo, replicando en TypeScript la misma lógica que
 * vive en la vista SQL `v_organigrama_evaluadores` (0005_vistas_indicadores.sql).
 *
 * Se usa en el cliente para previsualizar "quién evaluará a quién" antes de
 * abrir un ciclo; el cálculo real y autoritativo ocurre en la base de datos.
 *
 * Reglas (sección 9.2 del documento):
 *  - Líder: colaborador.lider_id directo.
 *  - Pares: quienes comparten el mismo lider_id.
 *  - Colaboradores a cargo: quienes tienen a esta persona como lider_id.
 *  - Autoevaluación: siempre aplica.
 *  - Caso especial (9.3): personas sin líder interno pero que sí lideran un
 *    equipo (p. ej. Gerencia General, o "líderes de línea") se evalúan entre
 *    sí como pares.
 */
export function resolverEvaluadores(colaboradores: Colaborador[]): AsignacionEvaluador[] {
  const activos = colaboradores.filter((c) => c.estado === 'activo' && !c.es_externo);
  const asignaciones: AsignacionEvaluador[] = [];

  const idsQueLideran = new Set(activos.filter((c) => c.lider_id).map((c) => c.lider_id as string));
  const lideresDeLinea = activos.filter((c) => !c.lider_id && idsQueLideran.has(c.id));

  for (const persona of activos) {
    // Autoevaluación
    asignaciones.push({ colaborador_evaluado_id: persona.id, evaluador_id: persona.id, tipo: 'autoevaluacion' });

    // Líder directo
    if (persona.lider_id) {
      asignaciones.push({ colaborador_evaluado_id: persona.id, evaluador_id: persona.lider_id, tipo: 'lider' });
    }

    // Pares: mismo lider_id, distinto id
    if (persona.lider_id) {
      const pares = activos.filter((p) => p.lider_id === persona.lider_id && p.id !== persona.id);
      for (const par of pares) {
        asignaciones.push({ colaborador_evaluado_id: persona.id, evaluador_id: par.id, tipo: 'par' });
      }
    } else if (lideresDeLinea.some((l) => l.id === persona.id)) {
      // Caso especial: líderes de línea sin líder interno se evalúan entre sí
      const otrosLideres = lideresDeLinea.filter((l) => l.id !== persona.id);
      for (const otro of otrosLideres) {
        asignaciones.push({ colaborador_evaluado_id: persona.id, evaluador_id: otro.id, tipo: 'par' });
      }
    }

    // Colaboradores a cargo: quienes reportan directamente a esta persona
    const aCargo = activos.filter((c) => c.lider_id === persona.id);
    for (const subordinado of aCargo) {
      asignaciones.push({ colaborador_evaluado_id: persona.id, evaluador_id: subordinado.id, tipo: 'colaborador_a_cargo' });
    }
  }

  return asignaciones;
}

/** ¿Este cargo activa la competencia de Liderazgo y la fuente "colaboradores a cargo"? */
export function tienePersonalACargo(colaboradorId: string, colaboradores: Colaborador[]): boolean {
  return colaboradores.some((c) => c.lider_id === colaboradorId && c.estado === 'activo');
}
