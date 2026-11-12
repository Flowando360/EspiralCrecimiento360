/**
 * Motor de afinidad entre una persona y un cargo, para detectar potencial subutilizado y opciones de movilidad interna.
 * Compara lo que EXIGE el cargo (habilidades con su nivel, formación y experiencia mínima) con lo que la persona YA
 * ACREDITA (verificaciones de Saber y hoja de vida). Es una ayuda para conversar, no una decisión: no mira el Ser ni
 * el desempeño, y el cruce por nombre es textual (se puede equivocar), por eso siempre muestra el detalle.
 */

export type NivelEsperado = 'bajo' | 'medio' | 'alto';

export interface RequisitoCargo {
  tipo: 'habilidad' | 'formacion' | 'experiencia';
  nombre: string;
  /** 1 básico, 2 intermedio, 3 avanzado (solo habilidades). */
  nivelRequerido?: number | null;
  /** Meses mínimos de experiencia (solo experiencia). */
  meses?: number | null;
}

export interface EvidenciaPersona {
  verificaciones: { item_evaluado: string; estado: string; nivel_dominio: number | null }[];
  hoja: { tipo: string | null; titulo: string; institucion: string | null; verificado: boolean; fecha_inicio: string | null; fecha_fin: string | null; fecha_vencimiento: string | null }[];
}

export interface DetalleRequisito {
  requisito: RequisitoCargo;
  /** 1 cubierto, 0,5 parcial, 0 faltante. */
  cobertura: 0 | 0.5 | 1;
  motivo: string;
}

export interface ResultadoMatch {
  porcentaje: number | null;
  detalle: DetalleRequisito[];
}

export const nivelDesdeEsperado = (n: string | null | undefined): number | null => (n === 'bajo' ? 1 : n === 'medio' ? 2 : n === 'alto' ? 3 : null);

const MARCAS_DIACRITICAS = new RegExp('[' + String.fromCharCode(0x300) + '-' + String.fromCharCode(0x36f) + ']', 'g');

export function normalizar(t: string | null | undefined): string {
  return (t ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(MARCAS_DIACRITICAS, '')
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const VACIAS = new Set(['de', 'del', 'la', 'el', 'los', 'las', 'y', 'en', 'con', 'para', 'por', 'un', 'una', 'al', 'nivel', 'basico', 'avanzado', 'intermedio']);

function tokens(t: string): string[] {
  return normalizar(t).split(' ').filter((x) => x.length >= 3 && !VACIAS.has(x));
}

/** ¿El texto menciona el requisito? Coincide si contiene la frase completa o todas sus palabras significativas. */
export function menciona(texto: string, requisito: string): boolean {
  const t = normalizar(texto);
  const r = normalizar(requisito);
  if (!r) return false;
  if (t.includes(r)) return true;
  const toks = tokens(requisito);
  return toks.length > 0 && toks.every((k) => t.includes(k));
}

function mesesEntre(inicio: string, fin: string | null, hoy: Date): number {
  const a = new Date(inicio);
  const b = fin ? new Date(fin) : hoy;
  return Math.max(0, (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth()));
}

export function evaluarRequisito(req: RequisitoCargo, ev: EvidenciaPersona, hoy: Date = new Date()): DetalleRequisito {
  const hoyIso = hoy.toISOString().slice(0, 10);

  if (req.tipo === 'habilidad') {
    // 1) Verificación de Saber con el mismo nombre
    const v = ev.verificaciones.find((x) => menciona(x.item_evaluado, req.nombre));
    if (v) {
      if (v.nivel_dominio != null && req.nivelRequerido != null) {
        if (v.nivel_dominio >= req.nivelRequerido) return { requisito: req, cobertura: 1, motivo: 'Dominio verificado en su nivel de Saber' };
        if (req.nivelRequerido - v.nivel_dominio === 1) return { requisito: req, cobertura: 0.5, motivo: 'Dominio verificado, un nivel por debajo' };
        return { requisito: req, cobertura: 0, motivo: 'Dominio verificado, por debajo del nivel exigido' };
      }
      if (v.estado === 'cumple') return { requisito: req, cobertura: 1, motivo: 'Verificada como cumplida' };
      if (v.estado === 'cumple_parcial') return { requisito: req, cobertura: 0.5, motivo: 'Verificada parcialmente' };
    }
    // 2) Hoja de vida (curso, certificación o formación que la mencione y no esté vencida vigente)
    const h = ev.hoja.find((x) => menciona(`${x.titulo} ${x.institucion ?? ''}`, req.nombre) && !(x.fecha_vencimiento && x.fecha_vencimiento < hoyIso));
    if (h) return { requisito: req, cobertura: h.verificado ? 1 : 0.5, motivo: `${h.verificado ? 'Acreditada' : 'Mencionada'} en su hoja de vida: ${h.titulo}` };
    return { requisito: req, cobertura: 0, motivo: 'Sin evidencia registrada' };
  }

  if (req.tipo === 'formacion') {
    const academicas = ev.hoja.filter((x) => x.tipo === 'academica');
    if (academicas.length === 0) return { requisito: req, cobertura: 0, motivo: 'Sin formación académica registrada' };
    const coincide = academicas.some((a) => menciona(`${a.titulo} ${a.institucion ?? ''}`, req.nombre));
    return { requisito: req, cobertura: coincide ? 1 : 0.5, motivo: coincide ? 'Formación coincide con la exigida' : 'Tiene formación académica; falta confirmar que corresponda a la exigida' };
  }

  // experiencia
  const meses = ev.hoja.filter((x) => x.tipo === 'experiencia_laboral' && x.fecha_inicio).reduce((s, x) => s + mesesEntre(x.fecha_inicio as string, x.fecha_fin, hoy), 0);
  const exigidos = req.meses ?? 0;
  if (exigidos <= 0) return { requisito: req, cobertura: 1, motivo: 'El cargo no exige experiencia mínima' };
  if (meses >= exigidos) return { requisito: req, cobertura: 1, motivo: `Acredita ${meses} meses (se exigen ${exigidos})` };
  if (meses > 0) return { requisito: req, cobertura: 0.5, motivo: `Acredita ${meses} de ${exigidos} meses` };
  return { requisito: req, cobertura: 0, motivo: 'Sin experiencia registrada' };
}

/** % de requisitos del cargo cubiertos por la persona (null si el cargo no tiene requisitos definidos). */
export function calcularMatch(requisitos: RequisitoCargo[], ev: EvidenciaPersona, hoy: Date = new Date()): ResultadoMatch {
  if (requisitos.length === 0) return { porcentaje: null, detalle: [] };
  const detalle = requisitos.map((r) => evaluarRequisito(r, ev, hoy));
  const suma = detalle.reduce((s, d) => s + d.cobertura, 0);
  return { porcentaje: Math.round((100 * suma) / detalle.length), detalle };
}

const ORDEN_NIVEL: Record<string, number> = { operativo: 1, tecnico_administrativo: 2, supervision: 3, directivo: 4 };
export const rangoNivel = (n: string | null | undefined): number => ORDEN_NIVEL[n ?? ''] ?? 0;
