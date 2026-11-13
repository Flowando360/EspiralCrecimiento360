/**
 * Esquema del Ser: lo que la empresa ve de cada persona a partir de su Guía del Flow.
 *
 * La empresa nunca ve la Guía (ni su carta): solo este esquema, aspecto por aspecto, con lo que tiene
 * relevancia laboral. Se agrupa por la pregunta que se hace un líder, no por los bloques de la Guía.
 * Los aspectos íntimos (infancia, pasado, emociones, sanación…) no entran en ningún grupo.
 */

export type EnfoqueSer = 'aprovechar' | 'equilibrado' | 'acompanar';

export const ENFOQUES_SER: Record<EnfoqueSer, { etiqueta: string; clase: string }> = {
  // Colores neutros a propósito: el Ser se describe, no se califica (nada de verde/rojo).
  aprovechar: { etiqueta: 'Para aprovechar', clase: 'badge-saber' },
  equilibrado: { etiqueta: 'En equilibrio', clase: 'badge-marmol' },
  acompanar: { etiqueta: 'Para acompañar', clase: 'badge-flow' },
};

export interface GrupoSer {
  clave: string;
  titulo: string;
  pregunta: string;
  aspectos: string[];
}

export const GRUPOS_SER: GrupoSer[] = [
  {
    clave: 'talento',
    titulo: 'Talento y esencia',
    pregunta: '¿Qué le sale natural y dónde brilla?',
    aspectos: ['Talento único', 'Carácter', 'Temperamento', 'Talentos innatos', 'Talentos para potenciar'],
  },
  {
    clave: 'motivacion',
    titulo: 'Propósito y motivación',
    pregunta: '¿Qué la mueve y qué le da sentido a su trabajo?',
    aspectos: ['Propósito – Intuición', 'Propósito – Equilibrio'],
  },
  {
    clave: 'liderazgo',
    titulo: 'Liderazgo y comunicación',
    pregunta: '¿Cómo influye y cómo se comunica?',
    aspectos: ['Liderazgo – Inspirar', 'Liderazgo – Transformacional', 'Comunicación'],
  },
  {
    clave: 'equipo',
    titulo: 'Trabajo con otros',
    pregunta: '¿Cómo trabaja en equipo y cómo cumple?',
    aspectos: ['Trabajo en equipo', 'Responsabilidad', 'Compromiso'],
  },
  {
    clave: 'agilidad',
    titulo: 'Cambio, negociación y recursividad',
    pregunta: '¿Cómo reacciona ante el cambio y cómo resuelve?',
    aspectos: ['Adaptación al cambio', 'Negociación', 'Recursividad'],
  },
  {
    clave: 'inteligencias',
    titulo: 'Inteligencias y formas de aprender',
    pregunta: '¿Por cuáles canales aprende, crea y se conecta mejor?',
    aspectos: [
      'Inteligencia verbal',
      'Inteligencia lógica',
      'Inteligencia visual',
      'Inteligencia musical',
      'Inteligencia corporal',
      'Inteligencia interpersonal',
      'Inteligencia intrapersonal',
      'Inteligencia naturalista',
      'Inteligencia existencial',
    ],
  },
];

/** Nombres de todos los aspectos que forman parte del esquema (los únicos que la empresa puede ver). */
export const ASPECTOS_DEL_ESQUEMA: string[] = GRUPOS_SER.flatMap((g) => g.aspectos);

export interface AspectoEsquema {
  aspectoId: string;
  nombre: string;
  titulo: string | null;
  descripcion: string | null;
  aprovechar: string | null;
  acompanar: string | null;
  enfoque: EnfoqueSer | null;
}

/** Agrupa los aspectos por grupo laboral, en el orden del esquema. */
export function agruparEsquema(aspectos: AspectoEsquema[]): { grupo: GrupoSer; aspectos: AspectoEsquema[] }[] {
  const porNombre = new Map(aspectos.map((a) => [a.nombre, a]));
  return GRUPOS_SER.map((grupo) => ({
    grupo,
    aspectos: grupo.aspectos.map((n) => porNombre.get(n)).filter((a): a is AspectoEsquema => Boolean(a)),
  })).filter((g) => g.aspectos.length > 0);
}
