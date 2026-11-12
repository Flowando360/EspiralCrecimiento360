/**
 * Niveles de cargo y aplicabilidad de las competencias (informe de pruebas, hallazgo 4.9).
 * Las competencias se diferencian por nivel de autonomía: corporativas (aplican a todos),
 * de nivel (según el grupo de cargos) y específicas de supervisión o gestión.
 */
export type NivelCargo = 'operativo' | 'tecnico_administrativo' | 'supervision' | 'directivo';

export const NIVELES_CARGO: { value: NivelCargo; label: string; ayuda: string }[] = [
  { value: 'operativo', label: 'Operativo', ayuda: 'Ejecuta tareas del proceso; no coordina a otros.' },
  { value: 'tecnico_administrativo', label: 'Técnico / administrativo', ayuda: 'Trabajo técnico o de apoyo con autonomía, sin personal a cargo.' },
  { value: 'supervision', label: 'Supervisión / coordinación', ayuda: 'Coordina o supervisa a un equipo.' },
  { value: 'directivo', label: 'Directivo / gestión', ayuda: 'Define rumbo, gestiona áreas y toma decisiones estratégicas.' },
];

const RANGO: Record<NivelCargo, number> = { operativo: 0, tecnico_administrativo: 1, supervision: 2, directivo: 3 };

export const ETIQUETA_NIVEL: Record<NivelCargo, string> = Object.fromEntries(
  NIVELES_CARGO.map((n) => [n.value, n.label])
) as Record<NivelCargo, string>;

/** Nivel del cargo; si no se ha definido se deduce de si tiene personal a cargo. */
export function nivelEfectivo(nivelCargo: string | null | undefined, tienePersonalACargo: boolean): NivelCargo {
  if (nivelCargo && nivelCargo in RANGO) return nivelCargo as NivelCargo;
  return tienePersonalACargo ? 'supervision' : 'tecnico_administrativo';
}

/**
 * ¿Aplica la competencia a este cargo? Se respeta el criterio anterior (las de liderazgo
 * exigen personal a cargo) y se suma el nivel mínimo de la competencia.
 */
export function competenciaAplicaAlCargo(
  competencia: { solo_con_personal_a_cargo?: boolean | null; nivel_minimo?: string | null },
  cargo: { nivel_cargo?: string | null; tiene_personal_a_cargo?: boolean | null }
): boolean {
  const tiene = Boolean(cargo.tiene_personal_a_cargo);
  if (competencia.solo_con_personal_a_cargo && !tiene) return false;
  const minimo = (competencia.nivel_minimo && competencia.nivel_minimo in RANGO ? competencia.nivel_minimo : 'operativo') as NivelCargo;
  return RANGO[nivelEfectivo(cargo.nivel_cargo, tiene)] >= RANGO[minimo];
}
