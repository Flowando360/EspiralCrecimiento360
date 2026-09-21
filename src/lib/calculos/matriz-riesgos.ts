/**
 * Metodología real de la matriz de riesgos y oportunidades (Documentos/
 * GC-MT-005 Matriz de riesgos y oportunidades.xlsx + GC-PL-002 Política de
 * gestión de riesgos y oportunidades). El nivel inherente y residual nunca
 * se guardan en la base — se calculan siempre acá, para que no puedan
 * quedar desincronizados del resto de los campos.
 */

export type TipoRiesgo = 'riesgo' | 'oportunidad';
export type NivelEvaluacion = 'bajo' | 'medio' | 'alto' | 'clave';

export const CATEGORIAS_RIESGO = ['estrategico', 'operativo', 'financiero', 'legal', 'reputacional'] as const;
export type CategoriaRiesgo = (typeof CATEGORIAS_RIESGO)[number];

export const ETIQUETA_CATEGORIA: Record<CategoriaRiesgo, string> = {
  estrategico: 'Estratégico',
  operativo: 'Operativo',
  financiero: 'Financiero',
  legal: 'Legal',
  reputacional: 'Reputacional',
};

export const DESCRIPCION_CATEGORIA: Record<CategoriaRiesgo, string> = {
  estrategico: 'Puede afectar la capacidad de la empresa de cumplir sus objetivos a largo plazo (mercado, tecnología, competencia).',
  operativo: 'Procesos del día a día: fallas en procedimientos, errores humanos, tecnología, producción o logística.',
  financiero: 'Impacta la salud económica: pérdidas, errores de presupuesto, liquidez, tasas de cambio, incumplimientos de pago.',
  legal: 'Incumplir leyes, normas o regulaciones — sanciones, multas o pérdida de licencias para operar.',
  reputacional: 'Afecta la imagen y confianza de clientes, aliados y la sociedad hacia la empresa.',
};

const ETIQUETA_GRADO_IMPACTO: Record<TipoRiesgo, Record<1 | 2 | 3, string>> = {
  riesgo: { 1: 'Menor', 2: 'Moderado', 3: 'Catastrófico' },
  oportunidad: { 1: 'Beneficio mínimo', 2: 'Beneficio relevante', 3: 'Beneficio alto' },
};

const ETIQUETA_GRADO_PROBABILIDAD: Record<TipoRiesgo, Record<1 | 2 | 3, string>> = {
  riesgo: { 1: 'Inusual', 2: 'Probable', 3: 'Muy posible' },
  oportunidad: { 1: 'Difícil de lograr', 2: 'Probable', 3: 'Factible' },
};

export function etiquetaGradoImpacto(tipo: TipoRiesgo, grado: 1 | 2 | 3): string {
  return ETIQUETA_GRADO_IMPACTO[tipo][grado];
}

export function etiquetaGradoProbabilidad(tipo: TipoRiesgo, grado: 1 | 2 | 3): string {
  return ETIQUETA_GRADO_PROBABILIDAD[tipo][grado];
}

/** Impacto (o beneficio) × probabilidad — 1 a 9. */
export function calcularValoracionInherente(gradoImpacto: number, gradoProbabilidad: number): number {
  return gradoImpacto * gradoProbabilidad;
}

/** Riesgo: Bajo(1-2) / Medio(3-5) / Alto(6-9). Oportunidad: Bajo(1-2) / Alto(3-5) / Clave(6-9). */
export function evaluarNivel(valoracion: number, tipo: TipoRiesgo): NivelEvaluacion {
  if (tipo === 'oportunidad') {
    if (valoracion <= 2) return 'bajo';
    if (valoracion <= 5) return 'alto';
    return 'clave';
  }
  if (valoracion <= 2) return 'bajo';
  if (valoracion <= 5) return 'medio';
  return 'alto';
}

export const ETIQUETA_EVALUACION: Record<NivelEvaluacion, string> = {
  bajo: 'Bajo',
  medio: 'Medio',
  alto: 'Alto',
  clave: 'Clave',
};

export const ACCION_SUGERIDA: Record<TipoRiesgo, Record<NivelEvaluacion, string>> = {
  riesgo: { bajo: 'Supervisión mínima', medio: 'Aplicar mitigación', alto: 'Tratamiento inmediato', clave: '' },
  oportunidad: { bajo: 'Observar / no prioritaria', alto: 'Evaluar factibilidad e implementar', clave: 'Explotar activamente', medio: '' },
};

/** Efectividad del control (0-5) → factor de reducción del riesgo inherente. Solo aplica a riesgos, no a oportunidades. */
export const ETIQUETA_EFECTIVIDAD_CONTROL: Record<number, string> = {
  0: 'No existe control',
  1: 'Ineficaz',
  2: 'Débil',
  3: 'Moderado',
  4: 'Bueno',
  5: 'Eficaz',
};

export const FACTOR_REDUCCION_CONTROL: Record<number, number> = {
  0: 0,
  1: 0.2,
  2: 0.4,
  3: 0.5,
  4: 0.8,
  5: 1,
};

/** Riesgo residual = inherente × (1 - factor de reducción del control). Sin control (o para oportunidades) el residual queda igual al inherente. */
export function calcularValoracionResidual(valoracionInherente: number, gradoEfectividadControl: number | null): number {
  const factor = FACTOR_REDUCCION_CONTROL[gradoEfectividadControl ?? 0] ?? 0;
  return Math.round(valoracionInherente * (1 - factor));
}
