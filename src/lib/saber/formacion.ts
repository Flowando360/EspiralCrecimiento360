/**
 * Compara la formación que exige el cargo con la que acredita la hoja de vida (informe de Luisa 4.8).
 * Distingue «no cumple» de «supera el requisito»: un contador público ya es bachiller, así que frente a un cargo
 * que pide bachillerato SUPERA lo exigido (puede estar sobrecalificado), no lo incumple.
 */

export type NivelFormacion = 'ninguno' | 'empirico' | 'bachillerato' | 'tecnico' | 'tecnologo' | 'universitario';

const ORDEN: Record<NivelFormacion, number> = { ninguno: 0, empirico: 0, bachillerato: 1, tecnico: 2, tecnologo: 3, universitario: 4 };

function sinTildes(t: string): string {
  return t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

/** Nivel que sugiere el título escrito en la hoja de vida; null si no se puede deducir. */
export function nivelDeTitulo(titulo: string | null | undefined): NivelFormacion | null {
  const t = sinTildes(titulo ?? '');
  if (!t.trim()) return null;
  if (/(maestria|magister|master|doctorado|especializacion|posgrado|postgrado|profesional|pregrado|universitari|ingenier|abogad|contador|licenciad|administrador|medic|psicolog|economista|arquitect|enfermer|diseñador|comunicador|trabajador social|odontolog)/.test(t)) return 'universitario';
  if (/tecnolog/.test(t)) return 'tecnologo';
  if (/tecnic/.test(t)) return 'tecnico';
  if (/(bachiller|bachillerato|media vocacional|secundaria)/.test(t)) return 'bachillerato';
  return null;
}

export interface ResultadoFormacion {
  estado: 'cumple' | 'cumple_parcial' | 'no_cumple_pendiente';
  detalle: string;
}

const ETIQUETA: Record<string, string> = { bachillerato: 'bachillerato', tecnico: 'técnico', tecnologo: 'tecnólogo', universitario: 'universitario' };

export function compararFormacion(requerido: string, titulos: string[]): ResultadoFormacion {
  const req = ORDEN[requerido as NivelFormacion] ?? 0;
  if (titulos.length === 0) return { estado: 'no_cumple_pendiente', detalle: 'Sin formación académica en la hoja de vida.' };
  const niveles = titulos.map(nivelDeTitulo);
  const conocidos = niveles.filter((n): n is NivelFormacion => n !== null);
  if (conocidos.length === 0) {
    return { estado: 'cumple_parcial', detalle: 'Hay formación cargada, pero no se pudo deducir su nivel por el título: confírmalo con el soporte.' };
  }
  const mejor = conocidos.reduce((a, b) => (ORDEN[b] > ORDEN[a] ? b : a));
  if (ORDEN[mejor] > req) {
    return {
      estado: 'cumple',
      detalle: `Supera el requisito (${ETIQUETA[mejor] ?? mejor} frente a ${ETIQUETA[requerido] ?? requerido}): puede haber sobrecalificación para el cargo; revisa expectativas y riesgo de rotación; no es un incumplimiento.`,
    };
  }
  if (ORDEN[mejor] === req) return { estado: 'cumple', detalle: 'Cumple el nivel exigido.' };
  return { estado: 'no_cumple_pendiente', detalle: `El nivel más alto acreditado (${ETIQUETA[mejor] ?? mejor}) está por debajo del exigido (${ETIQUETA[requerido] ?? requerido}).` };
}
