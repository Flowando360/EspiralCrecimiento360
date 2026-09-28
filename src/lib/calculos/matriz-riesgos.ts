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

/**
 * Escala de probabilidad/impacto configurable por empresa (columna
 * `empresas.riesgos_escala`, ver migración 0097). Los valores de acá son el
 * respaldo cuando la empresa todavía no ha guardado su propia configuración
 * — son exactamente los de GC-MT-005/GC-PL-002, para no cambiar nada por
 * defecto.
 */
export interface EscalaRiesgosConfig {
  etiquetasImpacto: Record<TipoRiesgo, [string, string, string]>;
  etiquetasProbabilidad: Record<TipoRiesgo, [string, string, string]>;
  /** valoración <= umbralBajo → "bajo" */
  umbralBajo: number;
  /** valoración <= umbralMedio → "medio" (riesgo) / "alto" (oportunidad); por encima → "alto" (riesgo) / "clave" (oportunidad) */
  umbralMedio: number;
}

export const ESCALA_RIESGOS_DEFECTO: EscalaRiesgosConfig = {
  etiquetasImpacto: {
    riesgo: ['Menor', 'Moderado', 'Catastrófico'],
    oportunidad: ['Beneficio mínimo', 'Beneficio relevante', 'Beneficio alto'],
  },
  etiquetasProbabilidad: {
    riesgo: ['Inusual', 'Probable', 'Muy posible'],
    oportunidad: ['Difícil de lograr', 'Probable', 'Factible'],
  },
  umbralBajo: 2,
  umbralMedio: 5,
};

export function etiquetaGradoImpacto(tipo: TipoRiesgo, grado: 1 | 2 | 3, escala: EscalaRiesgosConfig = ESCALA_RIESGOS_DEFECTO): string {
  return escala.etiquetasImpacto[tipo][(grado - 1) as 0 | 1 | 2];
}

export function etiquetaGradoProbabilidad(tipo: TipoRiesgo, grado: 1 | 2 | 3, escala: EscalaRiesgosConfig = ESCALA_RIESGOS_DEFECTO): string {
  return escala.etiquetasProbabilidad[tipo][(grado - 1) as 0 | 1 | 2];
}

/** Impacto (o beneficio) × probabilidad — 1 a 9. */
export function calcularValoracionInherente(gradoImpacto: number, gradoProbabilidad: number): number {
  return gradoImpacto * gradoProbabilidad;
}

/** Riesgo: Bajo/Medio/Alto. Oportunidad: Bajo/Alto/Clave. Los cortes (por defecto 2 y 5) son configurables por empresa. */
export function evaluarNivel(valoracion: number, tipo: TipoRiesgo, escala: EscalaRiesgosConfig = ESCALA_RIESGOS_DEFECTO): NivelEvaluacion {
  if (tipo === 'oportunidad') {
    if (valoracion <= escala.umbralBajo) return 'bajo';
    if (valoracion <= escala.umbralMedio) return 'alto';
    return 'clave';
  }
  if (valoracion <= escala.umbralBajo) return 'bajo';
  if (valoracion <= escala.umbralMedio) return 'medio';
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
