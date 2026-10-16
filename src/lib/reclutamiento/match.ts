import { aniosDesdeMeses, mesesFusionados, type PeriodoLaboral } from './experiencia';
import {
  NIVELES_EDUCATIVOS,
  RANGO_NIVEL_EDUCATIVO,
  RANGO_NIVEL_IDIOMA,
  normalizarNivelEducativo,
  normalizarTexto,
  separarPalabrasClave,
  type NivelEducativo,
} from './normalizacion';

// Motor de correspondencia (match). Determinista: mismos datos + mismos criterios
// = mismo resultado. La IA no interviene aquí: solo se usan datos ya validados.
// Reglas del requerimiento §10: obligatorios separados del promedio, falta de
// información = "pendiente de validación" y no "no cumple", cobertura visible.

export const VERSION_REGLAS_MATCH = 'match-v1';
export const UMBRAL_COBERTURA_PROVISIONAL = 70;
export const UMBRAL_COBERTURA_MINIMA = 30;

export type CategoriaCriterio = 'formacion' | 'experiencia' | 'competencia_tecnica' | 'competencia_conductual' | 'certificacion_idioma' | 'requisito_adicional';
export type TipoCriterio = 'obligatorio' | 'deseable' | 'informativo';
export type ResultadoCriterio = 'cumple' | 'cumple_parcialmente' | 'no_cumple' | 'no_informado' | 'contradictorio' | 'pendiente_validacion';

export const ORDEN_CATEGORIAS: CategoriaCriterio[] = [
  'formacion',
  'experiencia',
  'competencia_tecnica',
  'competencia_conductual',
  'certificacion_idioma',
  'requisito_adicional',
];

export const ETIQUETA_CATEGORIA: Record<CategoriaCriterio, string> = {
  formacion: 'Formación académica',
  experiencia: 'Experiencia relevante',
  competencia_tecnica: 'Competencias técnicas',
  competencia_conductual: 'Competencias conductuales',
  certificacion_idioma: 'Certificaciones e idiomas',
  requisito_adicional: 'Requisitos adicionales',
};

export interface CriterioMatch {
  id: string;
  descripcion: string;
  categoria: CategoriaCriterio;
  tipo: TipoCriterio;
  peso: number;
  valor_requerido: string | null;
  nivel_requerido: string | null;
  meses_requeridos: number | null;
  activo: boolean;
}

export interface DatosMatchCandidato {
  educacion: Array<{ nivel: string | null; titulo: string; area: string | null; estado: string }>;
  experiencia: Array<{
    cargo: string | null;
    organizacion: string | null;
    sector: string | null;
    funciones: string | null;
    logros: string | null;
    herramientas: string[];
    competencias: string[];
    fecha_inicio: string | null;
    fecha_fin: string | null;
    en_curso: boolean;
  }>;
  competencias: Array<{ tipo: string; nombre: string; nivel: string | null }>;
  idiomas: Array<{ idioma: string; nivel: string | null }>;
  certificaciones: Array<{ nombre: string; vigente_hasta: string | null }>;
  resumen: string | null;
  /** Hay datos extraídos pendientes de revisión humana: lo no evidenciado queda "pendiente", no "no informado". */
  revision_pendiente: boolean;
}

export interface DetalleMatch {
  criterio_id: string;
  descripcion: string;
  categoria: CategoriaCriterio;
  tipo: TipoCriterio;
  peso: number;
  resultado: ResultadoCriterio;
  puntaje: number | null;
  evidencia: string | null;
  motivo: string;
}

export interface ResultadoMatch {
  puntaje: number | null;
  cobertura: number;
  clasificacion: 'alta' | 'buena' | 'parcial' | 'baja' | 'sin_evaluar';
  provisional: boolean;
  obligatorios_estado: 'cumple' | 'pendiente' | 'no_cumple' | 'sin_criterios';
  fortalezas: string[];
  brechas: string[];
  detalles: DetalleMatch[];
}

interface Evaluacion {
  resultado: ResultadoCriterio;
  puntaje: number | null;
  evidencia: string | null;
  motivo: string;
}

const EVALUADOS: ResultadoCriterio[] = ['cumple', 'cumple_parcialmente', 'no_cumple'];

function isoLocal(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function contiene(texto: string, palabra: string): boolean {
  return palabra.length > 0 && texto.includes(palabra);
}

/** Coincidencia de nombres de competencia/idioma en ambos sentidos ("Power BI" ~ "power bi avanzado"). */
function coincideNombre(a: string, b: string): boolean {
  const na = normalizarTexto(a);
  const nb = normalizarTexto(b);
  return !!na && !!nb && (na.includes(nb) || nb.includes(na));
}

/** Falta información para decidir: nunca equivale a "no cumple" (§10.6). */
function pendiente(motivo: string): Evaluacion {
  return { resultado: 'pendiente_validacion', puntaje: null, evidencia: null, motivo };
}

function sinEvidencia(d: DatosMatchCandidato, motivo: string): Evaluacion {
  return {
    resultado: d.revision_pendiente ? 'pendiente_validacion' : 'no_informado',
    puntaje: null,
    evidencia: null,
    motivo: d.revision_pendiente ? `${motivo} Hay datos de la hoja de vida pendientes de validación.` : motivo,
  };
}

// ── Formación ───────────────────────────────────────────────────────────────
function evaluarFormacion(c: CriterioMatch, d: DatosMatchCandidato): Evaluacion {
  if (d.educacion.length === 0) return sinEvidencia(d, 'No hay formación documentada.');

  const valor = normalizarTexto(c.valor_requerido);
  const esNivel = (NIVELES_EDUCATIVOS as readonly string[]).includes(valor);

  if (esNivel) {
    const requerido = RANGO_NIVEL_EDUCATIVO[valor as NivelEducativo];
    const finalizados = d.educacion.filter((e) => e.estado === 'finalizado');
    const enCurso = d.educacion.filter((e) => e.estado === 'en_curso');
    const noDeterminados = d.educacion.filter((e) => e.estado === 'no_determinado');
    const rango = (lista: typeof d.educacion) => Math.max(0, ...lista.map((e) => RANGO_NIVEL_EDUCATIVO[normalizarNivelEducativo(e.nivel ?? e.titulo)]));

    if (rango(finalizados) >= requerido) {
      const que = finalizados.find((e) => RANGO_NIVEL_EDUCATIVO[normalizarNivelEducativo(e.nivel ?? e.titulo)] >= requerido);
      return { resultado: 'cumple', puntaje: 100, evidencia: que?.titulo ?? null, motivo: 'Formación finalizada que cumple el nivel exigido.' };
    }
    if (rango(enCurso) >= requerido) {
      return { resultado: 'cumple_parcialmente', puntaje: 50, evidencia: null, motivo: 'La formación exigida está en curso; no está terminada.' };
    }
    if (rango(noDeterminados) >= requerido) {
      return pendiente('No se sabe si la formación exigida está terminada.');
    }
    const masAlto = rango(d.educacion);
    const nombreNivel = NIVELES_EDUCATIVOS.find((n) => RANGO_NIVEL_EDUCATIVO[n] === masAlto) ?? 'otro';
    return {
      resultado: 'no_cumple',
      puntaje: 0,
      evidencia: d.educacion[0]?.titulo ?? null,
      motivo: `El nivel más alto documentado es "${nombreNivel}" y se exige "${valor}".`,
    };
  }

  // Área o título específico: palabras clave contra título y área.
  const palabras = separarPalabrasClave(c.valor_requerido);
  if (palabras.length === 0) return sinEvidencia(d, 'El criterio no tiene palabras clave para comparar.');
  const textos = d.educacion.map((e) => ({ e, t: normalizarTexto(`${e.titulo} ${e.area ?? ''}`) }));
  const coincidencias = textos.filter(({ t }) => palabras.some((p) => contiene(t, p)));
  const finalizada = coincidencias.find(({ e }) => e.estado === 'finalizado');
  if (finalizada) return { resultado: 'cumple', puntaje: 100, evidencia: finalizada.e.titulo, motivo: 'Formación finalizada en el área exigida.' };
  const enCurso = coincidencias.find(({ e }) => e.estado === 'en_curso');
  if (enCurso) return { resultado: 'cumple_parcialmente', puntaje: 50, evidencia: enCurso.e.titulo, motivo: 'Formación en el área exigida, en curso.' };
  if (coincidencias.length > 0) return pendiente('Hay formación en el área, pero no se sabe si está terminada.');
  if (d.revision_pendiente || d.educacion.some((e) => e.estado === 'no_determinado')) {
    return sinEvidencia(d, 'No se encontró formación en el área exigida.');
  }
  return { resultado: 'no_cumple', puntaje: 0, evidencia: null, motivo: 'No se encontró formación en el área exigida.' };
}

// ── Experiencia ─────────────────────────────────────────────────────────────
function evaluarExperiencia(c: CriterioMatch, d: DatosMatchCandidato, hoy: Date): Evaluacion {
  if (d.experiencia.length === 0) return sinEvidencia(d, 'No hay experiencia laboral documentada.');

  if (c.meses_requeridos !== null) {
    const requeridos = c.meses_requeridos;
    const periodos: PeriodoLaboral[] = [];
    let sinFecha = 0;
    for (const x of d.experiencia) {
      if (!x.fecha_inicio) {
        sinFecha++;
        continue;
      }
      const inicio = new Date(`${x.fecha_inicio}T00:00:00`);
      const fin = x.en_curso || !x.fecha_fin ? hoy : new Date(`${x.fecha_fin}T00:00:00`);
      periodos.push({ inicio, fin });
    }
    const meses = mesesFusionados(periodos);
    const anios = aniosDesdeMeses(meses);
    const evidencia = `${anios} años documentados (periodos sin superposición)`;

    if (meses >= requeridos) return { resultado: 'cumple', puntaje: 100, evidencia, motivo: 'Experiencia documentada igual o superior a la exigida.' };
    if (sinFecha > 0) {
      return { ...sinEvidencia(d, `${sinFecha} cargo(s) sin fecha de inicio; no se pueden contar.`), evidencia };
    }
    if (meses >= requeridos / 2) {
      return { resultado: 'cumple_parcialmente', puntaje: 50, evidencia, motivo: 'Experiencia documentada inferior a la exigida.' };
    }
    return {
      resultado: 'no_cumple',
      puntaje: Math.min(49, Math.round((meses / requeridos) * 100)),
      evidencia,
      motivo: `Se exigen ${requeridos} meses y hay ${meses} documentados.`,
    };
  }

  // Experiencia específica: palabras clave en funciones, cargos, sectores y herramientas.
  const palabras = separarPalabrasClave(c.valor_requerido);
  if (palabras.length === 0) return sinEvidencia(d, 'El criterio no tiene palabras clave ni tiempo requerido.');
  const texto = normalizarTexto(
    d.experiencia
      .map((x) => [x.cargo, x.organizacion, x.sector, x.funciones, x.logros, ...x.herramientas, ...x.competencias].join(' '))
      .join(' ')
  );
  const encontradas = palabras.filter((p) => contiene(texto, p));
  const puntaje = Math.round((encontradas.length / palabras.length) * 100);
  const evidencia = encontradas.length > 0 ? `Funciones o cargos que mencionan: ${encontradas.join(', ')}` : null;
  if (encontradas.length === palabras.length) return { resultado: 'cumple', puntaje: 100, evidencia, motivo: 'La experiencia documentada cubre las funciones exigidas.' };
  if (encontradas.length > 0) {
    return {
      resultado: 'cumple_parcialmente',
      puntaje,
      evidencia,
      motivo: `Falta evidencia de: ${palabras.filter((p) => !encontradas.includes(p)).join(', ')}.`,
    };
  }
  return sinEvidencia(d, 'No se encontró experiencia en las funciones exigidas.');
}

// ── Competencias técnicas y conductuales ────────────────────────────────────
/**
 * Técnicas: una competencia declarada como habilidad cuenta completa; si solo
 * aparece en la experiencia, cuenta 75 %. Conductuales: nunca se da el 100 %
 * porque una hoja de vida no demuestra por sí sola el nivel (§10.5).
 */
function evaluarCompetencia(c: CriterioMatch, d: DatosMatchCandidato, conductual: boolean): Evaluacion {
  const palabras = separarPalabrasClave(c.valor_requerido ?? c.descripcion);
  if (palabras.length === 0) return sinEvidencia(d, 'El criterio no tiene competencias para comparar.');

  const tipos = conductual ? ['conductual', 'funcional'] : ['tecnica', 'herramienta'];
  const habilidades = d.competencias.filter((s) => tipos.includes(s.tipo));
  const textoExperiencia = normalizarTexto(
    d.experiencia.map((x) => [x.funciones, x.logros, ...x.herramientas, ...x.competencias].join(' ')).join(' ')
  );
  const nivelRequerido = c.nivel_requerido ? RANGO_NIVEL_IDIOMA[c.nivel_requerido as keyof typeof RANGO_NIVEL_IDIOMA] : null;
  const rangoNivel = (n: string | null) => (n ? (RANGO_NIVEL_IDIOMA[n as keyof typeof RANGO_NIVEL_IDIOMA] ?? 0) : 0);

  const factores = palabras.map((p) => {
    const habilidad = habilidades.find((s) => coincideNombre(s.nombre, p));
    if (habilidad) {
      if (conductual) return { f: 0.75, origen: `declarada: ${habilidad.nombre}` };
      const factor = nivelRequerido && habilidad.nivel && rangoNivel(habilidad.nivel) < nivelRequerido ? 0.5 : 1;
      return { f: factor, origen: `declarada: ${habilidad.nombre}` };
    }
    if (contiene(textoExperiencia, p)) return { f: 0.75, origen: `en la experiencia: ${p}` };
    return { f: 0, origen: null };
  });

  const encontradas = factores.filter((f) => f.f > 0);
  const puntaje = Math.round((factores.reduce((s, f) => s + f.f, 0) / palabras.length) * 100);
  const evidencia = encontradas.length > 0 ? encontradas.map((f) => f.origen).join('; ') : null;

  if (encontradas.length === 0) return sinEvidencia(d, `No se encontró evidencia de: ${palabras.join(', ')}.`);
  if (!conductual && puntaje === 100) return { resultado: 'cumple', puntaje, evidencia, motivo: 'Competencias exigidas declaradas en la hoja de vida.' };
  if (conductual && encontradas.length === palabras.length) {
    return { resultado: 'cumple_parcialmente', puntaje, evidencia, motivo: 'Evidencia documentada; el nivel debe validarse en la entrevista o prueba.' };
  }
  return {
    resultado: 'cumple_parcialmente',
    puntaje,
    evidencia,
    motivo: `Sin evidencia de: ${palabras.filter((_, i) => factores[i]?.f === 0).join(', ')}.`,
  };
}

// ── Idiomas y certificaciones ───────────────────────────────────────────────
function evaluarIdioma(c: CriterioMatch, d: DatosMatchCandidato): Evaluacion {
  const idioma = normalizarTexto(c.valor_requerido);
  const encontrado = d.idiomas.find((i) => coincideNombre(i.idioma, idioma));
  if (!encontrado) return sinEvidencia(d, `No se encontró el idioma ${c.valor_requerido ?? ''} en la hoja de vida.`.trim());
  const requerido = RANGO_NIVEL_IDIOMA[c.nivel_requerido as keyof typeof RANGO_NIVEL_IDIOMA];
  const evidencia = `${encontrado.idioma}${encontrado.nivel ? ` (${encontrado.nivel})` : ''}`;
  if (!requerido) return { resultado: 'cumple', puntaje: 100, evidencia, motivo: 'Idioma declarado.' };
  if (!encontrado.nivel) return { ...sinEvidencia(d, 'El nivel de idioma no está especificado.'), evidencia };
  if (rangoNivelIdioma(encontrado.nivel) >= requerido) {
    return { resultado: 'cumple', puntaje: 100, evidencia, motivo: 'Nivel de idioma igual o superior al exigido.' };
  }
  return { resultado: 'cumple_parcialmente', puntaje: 50, evidencia, motivo: `Se exige nivel ${c.nivel_requerido} y consta ${encontrado.nivel}.` };
}

function rangoNivelIdioma(nivel: string): number {
  return RANGO_NIVEL_IDIOMA[nivel as keyof typeof RANGO_NIVEL_IDIOMA] ?? 0;
}

function evaluarCertificacion(c: CriterioMatch, d: DatosMatchCandidato, hoy: Date): Evaluacion {
  const palabras = separarPalabrasClave(c.valor_requerido ?? c.descripcion);
  const encontrada = d.certificaciones.find((x) => palabras.some((p) => contiene(normalizarTexto(x.nombre), p)));
  if (!encontrada) return sinEvidencia(d, `No se encontró la certificación exigida (${palabras.join(', ')}).`);
  const vigente = !encontrada.vigente_hasta || encontrada.vigente_hasta >= isoLocal(hoy);
  if (vigente) return { resultado: 'cumple', puntaje: 100, evidencia: encontrada.nombre, motivo: 'Certificación vigente.' };
  return {
    resultado: 'cumple_parcialmente',
    puntaje: 50,
    evidencia: encontrada.nombre,
    motivo: `La certificación venció el ${encontrada.vigente_hasta}.`,
  };
}

// ── Requisitos adicionales (deseables) ──────────────────────────────────────
function evaluarRequisitoAdicional(c: CriterioMatch, d: DatosMatchCandidato): Evaluacion {
  const palabras = separarPalabrasClave(c.valor_requerido ?? c.descripcion);
  if (palabras.length === 0) return sinEvidencia(d, 'El criterio no tiene palabras clave para comparar.');
  const texto = normalizarTexto(
    [
      d.resumen,
      ...d.educacion.map((e) => `${e.titulo} ${e.area ?? ''}`),
      ...d.experiencia.map((x) => [x.cargo, x.funciones, x.logros, ...x.herramientas, ...x.competencias].join(' ')),
      ...d.competencias.map((s) => s.nombre),
      ...d.certificaciones.map((x) => x.nombre),
      ...d.idiomas.map((i) => i.idioma),
    ].join(' ')
  );
  const encontradas = palabras.filter((p) => contiene(texto, p));
  if (encontradas.length === 0) return sinEvidencia(d, 'No se encontró evidencia de este requisito adicional.');
  const puntaje = Math.round((encontradas.length / palabras.length) * 100);
  return {
    resultado: encontradas.length === palabras.length ? 'cumple' : 'cumple_parcialmente',
    puntaje,
    evidencia: encontradas.join(', '),
    motivo: encontradas.length === palabras.length ? 'Requisito adicional evidenciado.' : 'Evidencia parcial del requisito adicional.',
  };
}

export function evaluarCriterio(c: CriterioMatch, d: DatosMatchCandidato, hoy: Date = new Date()): Evaluacion {
  switch (c.categoria) {
    case 'formacion':
      return evaluarFormacion(c, d);
    case 'experiencia':
      return evaluarExperiencia(c, d, hoy);
    case 'competencia_tecnica':
      return evaluarCompetencia(c, d, false);
    case 'competencia_conductual':
      return evaluarCompetencia(c, d, true);
    case 'certificacion_idioma':
      // Un criterio de idioma siempre lleva nivel requerido; sin nivel es una certificación.
      return c.nivel_requerido ? evaluarIdioma(c, d) : evaluarCertificacion(c, d, hoy);
    case 'requisito_adicional':
      return evaluarRequisitoAdicional(c, d);
  }
}

const redondear = (n: number) => Math.round(n * 100) / 100;

function clasificar(puntaje: number | null, cobertura: number): ResultadoMatch['clasificacion'] {
  if (puntaje === null || cobertura < UMBRAL_COBERTURA_MINIMA) return 'sin_evaluar';
  if (puntaje >= 85) return 'alta';
  if (puntaje >= 70) return 'buena';
  if (puntaje >= 50) return 'parcial';
  return 'baja';
}

/**
 * Calcula la correspondencia de un candidato con los criterios activos de una vacante.
 * - Score = Σ(wᵢ·sᵢ) sobre los criterios evaluados, con wᵢ normalizados a suma 1.
 * - Criterios sin evidencia no suman ni restan; bajan la cobertura.
 * - Los obligatorios no se diluyen en el promedio: se reportan aparte.
 */
export function calcularMatch(criterios: CriterioMatch[], datos: DatosMatchCandidato, hoy: Date = new Date()): ResultadoMatch {
  const activos = criterios.filter((c) => c.activo);
  const puntuables = activos.filter((c) => c.tipo !== 'informativo' && c.peso > 0);

  const detalles: DetalleMatch[] = activos
    .map((c) => {
      const base = { criterio_id: c.id, descripcion: c.descripcion, categoria: c.categoria, tipo: c.tipo, peso: c.peso };
      if (c.tipo === 'informativo' || c.peso <= 0) {
        const ev = evaluarCriterio(c, datos, hoy);
        return { ...base, resultado: ev.resultado, puntaje: null, evidencia: ev.evidencia, motivo: `Informativo: no afecta el puntaje. ${ev.motivo}` };
      }
      const ev = evaluarCriterio(c, datos, hoy);
      return { ...base, ...ev, motivo: ev.motivo };
    })
    .sort((a, b) => ORDEN_CATEGORIAS.indexOf(a.categoria) - ORDEN_CATEGORIAS.indexOf(b.categoria));

  const puntuadosDetalle = detalles.filter((d) => d.tipo !== 'informativo' && d.peso > 0);
  const evaluados = puntuadosDetalle.filter((d) => EVALUADOS.includes(d.resultado));
  const pesoTotal = puntuadosDetalle.reduce((s, d) => s + d.peso, 0);
  const pesoEvaluado = evaluados.reduce((s, d) => s + d.peso, 0);

  const cobertura = pesoTotal > 0 ? redondear((pesoEvaluado / pesoTotal) * 100) : 0;
  const puntaje = pesoEvaluado > 0 ? redondear(evaluados.reduce((s, d) => s + d.peso * (d.puntaje ?? 0), 0) / pesoEvaluado) : null;

  const obligatorios = puntuadosDetalle.filter((d) => d.tipo === 'obligatorio');
  let obligatorios_estado: ResultadoMatch['obligatorios_estado'] = 'sin_criterios';
  if (obligatorios.length > 0) {
    if (obligatorios.some((d) => d.resultado === 'no_cumple')) obligatorios_estado = 'no_cumple';
    else if (obligatorios.every((d) => d.resultado === 'cumple')) obligatorios_estado = 'cumple';
    else obligatorios_estado = 'pendiente';
  }

  const fortalezas = detalles
    .filter((d) => d.resultado === 'cumple')
    .map((d) => `${d.descripcion}${d.evidencia ? `: ${d.evidencia}` : ''}`);
  const brechas = detalles
    .filter((d) => d.resultado !== 'cumple' && d.tipo !== 'informativo')
    .map((d) => `${d.descripcion} — ${d.motivo}`);

  return {
    puntaje,
    cobertura,
    clasificacion: clasificar(puntaje, cobertura),
    provisional: cobertura < UMBRAL_COBERTURA_PROVISIONAL || obligatorios_estado === 'pendiente' || datos.revision_pendiente,
    obligatorios_estado,
    fortalezas,
    brechas,
    detalles,
  };
}
