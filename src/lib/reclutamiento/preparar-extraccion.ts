import { HojaVidaSchema, type SalidaHojaVida } from './esquema-hoja-vida';
import { aniosDesdeMeses, mesesFusionados, type PeriodoLaboral } from './experiencia';
import { normalizarFecha, normalizarNivelCompetencia, normalizarNivelEducativo, normalizarNivelIdioma, normalizarTexto } from './normalizacion';

// Convierte la salida validada de la IA en filas listas para guardar, y decide
// qué requiere revisión humana. No llama a ningún servicio: es pura y testeable.
// Regla del requerimiento (§9.4): cuando no se puede resolver un problema, se
// marca para revisión; nunca se completa con suposiciones.

export interface ContextoCandidato {
  nombre_completo: string;
  correo: string | null;
  telefono: string | null;
}

export interface ConflictoExtraccion {
  campo: string;
  descripcion: string;
}

export interface FilaBase {
  procedencia: 'extraido' | 'inferido';
  evidencia: string | null;
  requiere_revision: boolean;
  activo: true;
}

export interface FilaEducacion extends FilaBase {
  nivel: string | null;
  titulo: string;
  area: string | null;
  institucion: string | null;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  precision_fecha: string | null;
  estado: 'finalizado' | 'en_curso' | 'no_determinado';
}

export interface FilaExperiencia extends FilaBase {
  organizacion: string | null;
  cargo: string;
  sector: string | null;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  precision_fecha: string | null;
  en_curso: boolean;
  funciones: string | null;
  logros: string | null;
  herramientas: string[];
  competencias: string[];
}

export interface FilaCompetencia extends FilaBase {
  tipo: 'tecnica' | 'funcional' | 'conductual' | 'herramienta';
  nombre: string;
  nivel: 'basico' | 'intermedio' | 'avanzado' | null;
}

export interface FilaIdioma extends FilaBase {
  idioma: string;
  nivel: 'basico' | 'intermedio' | 'avanzado' | 'nativo' | null;
}

export interface FilaCertificacion extends FilaBase {
  nombre: string;
  entidad: string | null;
  fecha_expedicion: string | null;
  vigente_hasta: string | null;
}

export interface ExtraccionPreparada {
  candidato: {
    ciudad: string | null;
    pais: string | null;
    profesion: string | null;
    resumen_profesional: string | null;
    anios_experiencia_total: number | null;
  };
  education: FilaEducacion[];
  experience: FilaExperiencia[];
  skills: FilaCompetencia[];
  languages: FilaIdioma[];
  certifications: FilaCertificacion[];
  campos_confianza: Record<string, 'alta' | 'media' | 'baja'>;
  campos_faltantes: string[];
  conflictos: ConflictoExtraccion[];
  revision_requerida: boolean;
  estado: 'completado' | 'requiere_revision';
}

/** Coincidencia de nombres tolerante a orden, tildes y segundos nombres. */
export function nombresCoinciden(a: string, b: string): boolean {
  const tokens = (s: string) => normalizarTexto(s).split(' ').filter((t) => t.length > 1);
  const ta = tokens(a);
  const tb = tokens(b);
  if (ta.length === 0 || tb.length === 0) return true;
  const [corto, largo] = ta.length <= tb.length ? [ta, tb] : [tb, ta];
  const comunes = corto.filter((t) => largo.includes(t)).length;
  return comunes / corto.length >= 0.5;
}

function evidenciaUtil(texto: string): string | null {
  const limpio = texto.trim();
  return limpio ? limpio.slice(0, 500) : null;
}

function esFechaAnterior(inicio: string | null, fin: string | null): boolean {
  return !!inicio && !!fin && fin < inicio;
}

export function prepararExtraccion(entrada: unknown, contexto: ContextoCandidato, hoy: Date = new Date()): ExtraccionPreparada {
  const salida: SalidaHojaVida = HojaVidaSchema.parse(entrada);
  const conflictos: ConflictoExtraccion[] = [...salida.conflicts];
  const faltantes = new Set<string>(salida.missing_fields);
  const confianza = { ...salida.field_confidence };
  let revision = false;

  // ── Identidad: el documento debe corresponder al candidato que se postuló.
  const nombreDoc = salida.candidate.nombre_completo;
  if (nombreDoc && contexto.nombre_completo && !nombresCoinciden(nombreDoc, contexto.nombre_completo)) {
    conflictos.push({ campo: 'candidate.nombre_completo', descripcion: `El formulario dice "${contexto.nombre_completo}" y el documento "${nombreDoc}".` });
  }
  if (salida.candidate.email && contexto.correo && normalizarTexto(salida.candidate.email) !== normalizarTexto(contexto.correo)) {
    conflictos.push({ campo: 'candidate.email', descripcion: 'El correo del documento no coincide con el del formulario.' });
  }
  if (!nombreDoc) faltantes.add('candidate.nombre_completo');

  // ── Formación
  const education: FilaEducacion[] = [];
  for (const e of salida.education) {
    if (!e.titulo) continue;
    const inicio = normalizarFecha(e.fecha_inicio, hoy);
    const fin = normalizarFecha(e.fecha_fin, hoy, 'fin');
    const imposible = inicio.imposible || fin.imposible || esFechaAnterior(inicio.fecha, fin.fecha);
    const nivel = normalizarNivelEducativo(e.nivel || e.titulo);
    if (imposible) conflictos.push({ campo: 'education.fecha', descripcion: `Fechas imposibles o contradictorias en "${e.titulo}".` });
    if (nivel === 'otro') faltantes.add('education.nivel');
    if (!e.institucion) faltantes.add('education.institucion');
    education.push({
      procedencia: e.evidencia ? 'extraido' : 'inferido',
      evidencia: evidenciaUtil(e.evidencia),
      requiere_revision: imposible || !e.evidencia || nivel === 'otro',
      activo: true,
      nivel,
      titulo: e.titulo,
      area: e.area || null,
      institucion: e.institucion || null,
      fecha_inicio: inicio.fecha,
      fecha_fin: fin.fecha,
      precision_fecha: fin.precision ?? inicio.precision,
      estado: e.estado,
    });
  }

  // ── Experiencia: sin duplicados, fechas coherentes, sin contar dos veces periodos simultáneos.
  const experience: FilaExperiencia[] = [];
  const vistos = new Set<string>();
  for (const x of salida.experience) {
    if (!x.cargo && !x.organizacion) continue;
    const inicio = normalizarFecha(x.fecha_inicio, hoy);
    const fin = normalizarFecha(x.fecha_fin, hoy, 'fin');
    const clave = `${normalizarTexto(x.organizacion)}|${normalizarTexto(x.cargo)}|${inicio.fecha ?? ''}`;
    if (vistos.has(clave)) {
      conflictos.push({ campo: 'experience.duplicada', descripcion: `Experiencia repetida: "${x.cargo}" en "${x.organizacion}".` });
      continue;
    }
    vistos.add(clave);

    const imposible = inicio.imposible || fin.imposible || esFechaAnterior(inicio.fecha, fin.fecha);
    if (imposible) conflictos.push({ campo: 'experience.fecha', descripcion: `Fechas imposibles o contradictorias en el cargo "${x.cargo}".` });
    if (!inicio.fecha) faltantes.add('experience.fecha_inicio');
    experience.push({
      procedencia: x.evidencia ? 'extraido' : 'inferido',
      evidencia: evidenciaUtil(x.evidencia),
      requiere_revision: imposible || !x.evidencia || !inicio.fecha,
      activo: true,
      organizacion: x.organizacion || null,
      cargo: x.cargo,
      sector: x.sector || null,
      fecha_inicio: inicio.fecha,
      fecha_fin: x.en_curso ? null : fin.fecha,
      precision_fecha: inicio.precision,
      en_curso: x.en_curso,
      funciones: x.funciones || null,
      logros: x.logros || null,
      herramientas: x.herramientas,
      competencias: x.competencias,
    });
  }

  // ── Tiempo de experiencia (periodos fusionados; los cargos sin fecha de inicio no suman).
  const periodos: PeriodoLaboral[] = [];
  let sinFechas = 0;
  for (const x of experience) {
    if (!x.fecha_inicio) {
      sinFechas++;
      continue;
    }
    const inicio = new Date(`${x.fecha_inicio}T00:00:00`);
    const fin = x.en_curso || !x.fecha_fin ? hoy : new Date(`${x.fecha_fin}T00:00:00`);
    periodos.push({ inicio, fin });
  }
  const anios = periodos.length > 0 ? aniosDesdeMeses(mesesFusionados(periodos)) : null;
  if (sinFechas > 0) faltantes.add('experience.tiempo_total');

  // ── Competencias, idiomas y certificaciones
  const skills: FilaCompetencia[] = salida.skills
    .filter((s) => s.nombre)
    .map((s) => ({
      procedencia: s.evidencia ? 'extraido' : 'inferido',
      evidencia: evidenciaUtil(s.evidencia),
      requiere_revision: !s.evidencia,
      activo: true,
      tipo: s.tipo,
      nombre: s.nombre,
      nivel: normalizarNivelCompetencia(s.nivel),
    }));

  const languages: FilaIdioma[] = salida.languages
    .filter((l) => l.idioma)
    .map((l) => ({
      procedencia: l.evidencia ? 'extraido' : 'inferido',
      evidencia: evidenciaUtil(l.evidencia),
      requiere_revision: !l.evidencia || (!!l.nivel && !normalizarNivelIdioma(l.nivel)),
      activo: true,
      idioma: l.idioma,
      nivel: normalizarNivelIdioma(l.nivel),
    }));

  const certifications: FilaCertificacion[] = salida.certifications
    .filter((c) => c.nombre)
    .map((c) => {
      const expedicion = normalizarFecha(c.fecha_expedicion, hoy);
      const vigencia = normalizarFecha(c.vigente_hasta, hoy, 'fin');
      return {
        procedencia: c.evidencia ? 'extraido' : 'inferido',
        evidencia: evidenciaUtil(c.evidencia),
        requiere_revision: !c.evidencia || expedicion.imposible || vigencia.imposible,
        activo: true,
        nombre: c.nombre,
        entidad: c.entidad || null,
        fecha_expedicion: expedicion.fecha,
        vigente_hasta: vigencia.fecha,
      };
    });

  // ── Campos sin datos y confianza baja
  if (education.length === 0) faltantes.add('education');
  if (experience.length === 0) faltantes.add('experience');
  if (skills.length === 0) faltantes.add('skills');
  if (Object.values(confianza).includes('baja')) revision = true;

  const hayDatos = education.length + experience.length + skills.length + languages.length + certifications.length > 0;
  const filasConRevision = [...education, ...experience, ...skills, ...languages, ...certifications].some((f) => f.requiere_revision);
  if (!hayDatos) {
    conflictos.push({ campo: 'documento', descripcion: 'No se encontraron datos de formación, experiencia ni competencias. Puede no ser una hoja de vida o estar ilegible.' });
  }
  revision = revision || conflictos.length > 0 || filasConRevision || !hayDatos;

  return {
    candidato: {
      ciudad: salida.candidate.ciudad || null,
      pais: salida.candidate.pais || null,
      profesion: salida.professional_summary.profesion || null,
      resumen_profesional: salida.professional_summary.resumen || null,
      anios_experiencia_total: anios,
    },
    education,
    experience,
    skills,
    languages,
    certifications,
    campos_confianza: confianza,
    campos_faltantes: [...faltantes],
    conflictos,
    revision_requerida: revision,
    estado: revision ? 'requiere_revision' : 'completado',
  };
}
