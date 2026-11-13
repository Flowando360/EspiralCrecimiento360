/**
 * Afirmaciones de la encuesta de clima (informe de Luisa 11.1).
 * Pulso: solo la primera de cada dimensión (la que cada empresa puede reescribir en Configuración).
 * Completo: las tres. Todas están redactadas en positivo (1 = muy en desacuerdo, 5 = muy de acuerdo) para que el alfa de
 * Cronbach no se distorsione por ítems invertidos. Son un borrador editable: la empresa ajusta la primera de cada dimensión.
 */
export type ClaveDimensionClima =
  | 'reconocimiento'
  | 'liderazgo'
  | 'desarrollo'
  | 'comunicacion'
  | 'condiciones'
  | 'pertenencia'
  | 'relaciones_pares'
  | 'compensacion'
  | 'equidad';

export const ITEMS_POR_DIMENSION = 3;

export const DIMENSIONES_ITEMS: { clave: ClaveDimensionClima; titulo: string; items: [string, string, string] }[] = [
  {
    clave: 'reconocimiento',
    titulo: 'Reconocimiento',
    items: [
      'Me siento reconocido/a por mi trabajo',
      'Cuando hago bien mi trabajo, alguien se da cuenta y me lo dice',
      'Los logros de mi equipo se celebran y se valoran',
    ],
  },
  {
    clave: 'liderazgo',
    titulo: 'Liderazgo',
    items: [
      'Confío en el liderazgo de mi jefe directo',
      'Mi jefe directo me da retroalimentación útil para mejorar',
      'Mi jefe directo escucha mis ideas y preocupaciones',
    ],
  },
  {
    clave: 'desarrollo',
    titulo: 'Desarrollo',
    items: [
      'Tengo oportunidades reales de crecer y aprender',
      'La empresa me ofrece formación que me ayuda en mi cargo',
      'Veo posibilidades de avanzar o asumir nuevos retos aquí',
    ],
  },
  {
    clave: 'comunicacion',
    titulo: 'Comunicación',
    items: [
      'La comunicación en la empresa es clara y oportuna',
      'Me entero a tiempo de los cambios que afectan mi trabajo',
      'Puedo expresar mi opinión sin temor a represalias',
    ],
  },
  {
    clave: 'condiciones',
    titulo: 'Condiciones de trabajo',
    items: [
      'Mis condiciones de trabajo son adecuadas',
      'Cuento con las herramientas y los equipos que necesito para trabajar bien',
      'Mi puesto y mi entorno de trabajo son seguros y cómodos',
    ],
  },
  {
    clave: 'pertenencia',
    titulo: 'Pertenencia',
    items: [
      'Siento que pertenezco a esta empresa',
      'Me siento orgulloso/a de trabajar en esta empresa',
      'Me veo trabajando aquí dentro de un año',
    ],
  },
  {
    clave: 'relaciones_pares',
    titulo: 'Relaciones entre compañeros',
    items: [
      'Tengo buenas relaciones de trabajo con mis compañeros',
      'En mi equipo nos ayudamos entre todos cuando hay mucha carga de trabajo',
      'Los conflictos entre compañeros se resuelven con respeto',
    ],
  },
  {
    clave: 'compensacion',
    titulo: 'Compensación',
    items: [
      'Mi compensación es justa frente a mi trabajo',
      'Mi salario y mis beneficios son competitivos frente a lo que ofrece el mercado',
      'Entiendo cómo se define lo que me pagan',
    ],
  },
  {
    clave: 'equidad',
    titulo: 'Equidad',
    items: [
      'En mi equipo se trata a todas las personas con equidad',
      'Las oportunidades y los ascensos se dan con criterios justos',
      'Las normas y las sanciones se aplican igual para todas las personas',
    ],
  },
];

export type ItemsClima = Partial<Record<ClaveDimensionClima, number[]>>;

/** ¿Las respuestas ítem por ítem están completas (9 dimensiones × 3, cada una de 1 a 5)? */
export function itemsCompletos(items: unknown): items is Record<ClaveDimensionClima, number[]> {
  if (!items || typeof items !== 'object') return false;
  return DIMENSIONES_ITEMS.every((d) => {
    const v = (items as Record<string, unknown>)[d.clave];
    return Array.isArray(v) && v.length === ITEMS_POR_DIMENSION && v.every((n) => Number.isInteger(n) && n >= 1 && n <= 5);
  });
}

/** Promedio redondeado de los ítems de una dimensión: es lo que se guarda en la columna de 1 a 5 de siempre. */
export function promedioDimension(valores: number[]): number {
  return Math.min(5, Math.max(1, Math.round(valores.reduce((a, b) => a + b, 0) / valores.length)));
}
