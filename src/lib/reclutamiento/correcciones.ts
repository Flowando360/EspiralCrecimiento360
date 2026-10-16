import { normalizarFecha, normalizarNivelCompetencia, normalizarNivelEducativo, normalizarNivelIdioma } from './normalizacion';

// Lista blanca de campos que la persona de Talento Humano puede corregir a mano.
// Cada campo declara cómo se normaliza su valor, para que una corrección quede
// en el mismo formato que los datos extraídos.

export type TablaFicha = 'candidato_educacion' | 'candidato_experiencia' | 'candidato_competencias' | 'candidato_idiomas' | 'candidato_certificaciones';

type Tipo = 'texto' | 'fecha_inicio' | 'fecha_fin' | 'nivel_educativo' | 'nivel_idioma' | 'nivel_competencia' | 'estado_educacion' | 'booleano';

export const CAMPOS_CORREGIBLES: Record<TablaFicha, Partial<Record<string, Tipo>>> = {
  candidato_educacion: { titulo: 'texto', area: 'texto', institucion: 'texto', nivel: 'nivel_educativo', fecha_inicio: 'fecha_inicio', fecha_fin: 'fecha_fin', estado: 'estado_educacion' },
  candidato_experiencia: { cargo: 'texto', organizacion: 'texto', sector: 'texto', funciones: 'texto', logros: 'texto', fecha_inicio: 'fecha_inicio', fecha_fin: 'fecha_fin', en_curso: 'booleano' },
  candidato_competencias: { nombre: 'texto', nivel: 'nivel_competencia' },
  candidato_idiomas: { idioma: 'texto', nivel: 'nivel_idioma' },
  candidato_certificaciones: { nombre: 'texto', entidad: 'texto', fecha_expedicion: 'fecha_inicio', vigente_hasta: 'fecha_fin' },
};

export const TABLAS_FICHA = Object.keys(CAMPOS_CORREGIBLES) as TablaFicha[];

export type ResultadoValor = { ok: true; valor: string | boolean | null } | { ok: false; error: string };

/** Convierte el texto que escribe la persona en el valor que se guarda. */
export function normalizarValorCorregido(tipo: Tipo, entrada: string, hoy: Date = new Date()): ResultadoValor {
  const texto = entrada.trim();
  switch (tipo) {
    case 'texto':
      return texto ? { ok: true, valor: texto.slice(0, 500) } : { ok: true, valor: null };
    case 'fecha_inicio':
    case 'fecha_fin': {
      if (!texto) return { ok: true, valor: null };
      const f = normalizarFecha(texto, hoy, tipo === 'fecha_fin' ? 'fin' : 'inicio');
      if (f.imposible || !f.fecha) return { ok: false, error: 'La fecha no es válida. Usa AAAA, AAAA-MM o AAAA-MM-DD.' };
      return { ok: true, valor: f.fecha };
    }
    case 'nivel_educativo':
      return texto ? { ok: true, valor: normalizarNivelEducativo(texto) } : { ok: true, valor: null };
    case 'nivel_idioma':
      return { ok: true, valor: normalizarNivelIdioma(texto) };
    case 'nivel_competencia':
      return { ok: true, valor: normalizarNivelCompetencia(texto) };
    case 'estado_educacion': {
      const t = texto.toLowerCase();
      if (t === 'finalizado' || t === 'en_curso' || t === 'no_determinado') return { ok: true, valor: t };
      return { ok: false, error: 'El estado debe ser finalizado, en_curso o no_determinado.' };
    }
    case 'booleano':
      return { ok: true, valor: texto === 'true' || texto === 'sí' || texto === 'si' };
  }
}
