// Utilidades puras para normalizar los datos que entrega la IA antes de
// guardarlos. Sin I/O: se pueden probar de forma aislada.

export type PrecisionFecha = 'anio' | 'mes' | 'dia';

export interface FechaNormalizada {
  fecha: string | null; // YYYY-MM-DD
  precision: PrecisionFecha | null;
  /** true si la fecha es imposible (mes 13, año futuro, etc.). */
  imposible: boolean;
}

const ANIO_MINIMO = 1950;

/**
 * Acepta "2021", "2021-01", "2021-01-15" (o "" / null). Un año o un mes solos no
 * se completan con un día inventado: la fecha queda con la precisión original,
 * como pide el requerimiento (si solo dice 2021, no se inventa el mes).
 * Para poder ordenar y calcular, el año se representa como 01-01 (o 31-dic si
 * es fin de periodo) y el mes como día 01 (o último día si es fin de periodo).
 */
export function normalizarFecha(valor: string | null | undefined, hoy: Date = new Date(), extremo: 'inicio' | 'fin' = 'inicio'): FechaNormalizada {
  const limpio = (valor ?? '').trim();
  if (!limpio) return { fecha: null, precision: null, imposible: false };

  const m = /^(\d{4})(?:-(\d{1,2})(?:-(\d{1,2}))?)?$/.exec(limpio);
  if (!m) return { fecha: null, precision: null, imposible: true };

  const anio = Number(m[1]);
  const mes = m[2] ? Number(m[2]) : null;
  const dia = m[3] ? Number(m[3]) : null;
  const maxAnio = hoy.getFullYear() + 1;

  if (anio < ANIO_MINIMO || anio > maxAnio) return { fecha: null, precision: null, imposible: true };
  if (mes !== null && (mes < 1 || mes > 12)) return { fecha: null, precision: null, imposible: true };
  if (dia !== null) {
    const diasDelMes = new Date(anio, mes!, 0).getDate();
    if (dia < 1 || dia > diasDelMes) return { fecha: null, precision: null, imposible: true };
  }

  const pad = (n: number) => String(n).padStart(2, '0');
  // Una fecha de fin solo con año o mes se toma en su último día: "diciembre de 2024" termina el 31-dic.
  if (mes === null) {
    return { fecha: extremo === 'fin' ? `${anio}-12-31` : `${anio}-01-01`, precision: 'anio', imposible: false };
  }
  if (dia === null) {
    const ultimo = new Date(anio, mes, 0).getDate();
    return { fecha: `${anio}-${pad(mes)}-${pad(extremo === 'fin' ? ultimo : 1)}`, precision: 'mes', imposible: false };
  }
  return { fecha: `${anio}-${pad(mes)}-${pad(dia)}`, precision: 'dia', imposible: false };
}

/** Texto para comparar: minúsculas, sin tildes, espacios colapsados. */
export function normalizarTexto(valor: string | null | undefined): string {
  return (valor ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9+#.\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export const NIVELES_EDUCATIVOS = [
  'bachillerato',
  'tecnico',
  'tecnologo',
  'universitario',
  'especializacion',
  'maestria',
  'doctorado',
  'certificacion_corta',
  'otro',
] as const;
export type NivelEducativo = (typeof NIVELES_EDUCATIVOS)[number];

/** Orden de los niveles para comparar (mayor = más formación). Certificación corta y "otro" no cuentan como título profesional. */
export const RANGO_NIVEL_EDUCATIVO: Record<NivelEducativo, number> = {
  otro: 0,
  certificacion_corta: 0,
  bachillerato: 1,
  tecnico: 2,
  tecnologo: 3,
  universitario: 4,
  especializacion: 5,
  maestria: 6,
  doctorado: 7,
};

const SINONIMOS_NIVEL: Array<[RegExp, NivelEducativo]> = [
  [/doctor|phd/, 'doctorado'],
  [/maestr|magister|master/, 'maestria'],
  [/especializ|posgrado|postgrado/, 'especializacion'],
  [/universitari|profesional|pregrado|ingenier|licenciad|abogad|administrador de empresas|contador/, 'universitario'],
  [/tecnolog/, 'tecnologo'],
  [/tecnic/, 'tecnico'],
  [/bachiller|secundaria|media vocacional/, 'bachillerato'],
  [/certificaci|diplomad|curso|seminario/, 'certificacion_corta'],
];

/** Convierte un nivel libre ("Ingeniería", "Técnico laboral") a uno de los niveles del sistema. */
export function normalizarNivelEducativo(valor: string | null | undefined): NivelEducativo {
  const t = normalizarTexto(valor);
  if (!t) return 'otro';
  for (const [patron, nivel] of SINONIMOS_NIVEL) if (patron.test(t)) return nivel;
  return 'otro';
}

export const NIVELES_IDIOMA = ['basico', 'intermedio', 'avanzado', 'nativo'] as const;
export type NivelIdioma = (typeof NIVELES_IDIOMA)[number];
export const RANGO_NIVEL_IDIOMA: Record<NivelIdioma, number> = { basico: 1, intermedio: 2, avanzado: 3, nativo: 4 };

/** Normaliza niveles de idioma: MCER (A1–C2), palabras (básico, fluido, nativo…). */
export function normalizarNivelIdioma(valor: string | null | undefined): NivelIdioma | null {
  const t = normalizarTexto(valor);
  if (!t) return null;
  if (/nativo|materno|lengua madre/.test(t)) return 'nativo';
  if (/avanzad|fluid|c1|c2|advanced/.test(t)) return 'avanzado';
  if (/intermedi|b1|b2|medio|intermediate/.test(t)) return 'intermedio';
  if (/basic|a1|a2|elemental|principiante/.test(t)) return 'basico';
  return null;
}

/** Nivel de competencia (básico/intermedio/avanzado) a partir de texto libre. */
export function normalizarNivelCompetencia(valor: string | null | undefined): 'basico' | 'intermedio' | 'avanzado' | null {
  const nivelIdioma = normalizarNivelIdioma(valor);
  if (nivelIdioma === 'nativo') return 'avanzado';
  return nivelIdioma;
}

/** Palabras clave de un criterio: "Excel, Power BI; SAP" → ["excel", "power bi", "sap"]. */
export function separarPalabrasClave(valor: string | null | undefined): string[] {
  return (valor ?? '')
    .split(/[,;\n]/)
    .map((p) => normalizarTexto(p))
    .filter((p) => p.length > 0);
}
