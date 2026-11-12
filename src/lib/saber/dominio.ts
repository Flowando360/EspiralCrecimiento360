import type { EstadoVerificacionSaber } from '@/types/colaborador';

/** Nivel de dominio de un conocimiento: 0 sin dominio, 1 básico, 2 intermedio, 3 avanzado. */
export const NIVELES_DOMINIO: { valor: number; etiqueta: string }[] = [
  { valor: 0, etiqueta: 'Sin dominio' },
  { valor: 1, etiqueta: 'Básico' },
  { valor: 2, etiqueta: 'Intermedio' },
  { valor: 3, etiqueta: 'Avanzado' },
];

/** Nivel que exige el cargo (1 a 3), a partir del bajo/medio/alto de cargo_habilidades. */
export const NIVELES_REQUERIDOS: { valor: number; etiqueta: string }[] = NIVELES_DOMINIO.filter((n) => n.valor >= 1);

export function nivelDesdeEsperado(esperado: string | null | undefined): number | null {
  return esperado === 'bajo' ? 1 : esperado === 'medio' ? 2 : esperado === 'alto' ? 3 : null;
}

export const FUENTES_EVIDENCIA: { valor: string; etiqueta: string }[] = [
  { valor: 'prueba', etiqueta: 'Prueba o examen' },
  { valor: 'demostracion', etiqueta: 'Demostración práctica' },
  { valor: 'entrevista', etiqueta: 'Entrevista' },
  { valor: 'certificacion', etiqueta: 'Certificación' },
  { valor: 'documento', etiqueta: 'Documento (hoja de vida, título)' },
  { valor: 'observacion_lider', etiqueta: 'Observación del líder' },
];

export const ETIQUETA_FUENTE: Record<string, string> = Object.fromEntries(FUENTES_EVIDENCIA.map((f) => [f.valor, f.etiqueta]));

/**
 * Estado sugerido a partir de los niveles: dominado (al menos el requerido), parcial (un nivel por debajo) o brecha
 * (dos o más por debajo). Sin ambos niveles no se sugiere nada.
 */
export function estadoSugerido(dominio: number | null | undefined, requerido: number | null | undefined): EstadoVerificacionSaber | null {
  if (dominio == null || requerido == null) return null;
  if (dominio >= requerido) return 'cumple';
  if (requerido - dominio === 1) return 'cumple_parcial';
  return 'no_cumple_pendiente';
}

export interface ResumenDominio {
  dominados: number;
  parciales: number;
  brechas: number;
  total: number;
  /** Ítems verificados sin fuente de evidencia declarada. */
  sinFuente: number;
}

export function resumirDominio(items: { estado: EstadoVerificacionSaber; fuente_evidencia?: string | null }[]): ResumenDominio {
  return {
    dominados: items.filter((i) => i.estado === 'cumple').length,
    parciales: items.filter((i) => i.estado === 'cumple_parcial').length,
    brechas: items.filter((i) => i.estado === 'no_cumple_pendiente').length,
    total: items.length,
    sinFuente: items.filter((i) => !i.fuente_evidencia).length,
  };
}
