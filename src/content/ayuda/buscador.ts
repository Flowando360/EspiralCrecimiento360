import { MODULOS, preguntasFrecuentes, glosario } from './index';

export interface ResultadoBusqueda {
  tipo: 'manual' | 'faq' | 'glosario';
  titulo: string;
  texto: string;
  href: string;
  /** Pasos a seguir, si el resultado es una página del manual que los tiene. */
  pasos?: string[];
}

interface EntradaIndice extends ResultadoBusqueda {
  tituloNormal: string;
  textoNormal: string;
}

/** Palabras que no aportan a la búsqueda ("cómo hago para…"). */
const PALABRAS_VACIAS = new Set([
  'como', 'hago', 'hacer', 'para', 'de', 'la', 'el', 'en', 'un', 'una', 'que', 'se', 'puedo', 'puede', 'mi', 'mis',
  'y', 'a', 'los', 'las', 'por', 'con', 'del', 'es', 'lo', 'al', 'o', 'si', 'no', 'donde', 'dónde', 'quiero', 'necesito',
]);

/** Verbos muy comunes en las preguntas que no distinguen un tema de otro (solo para la recuperación de Gino). */
const VERBOS_GENERICOS = new Set([
  'registro', 'registrar', 'registra', 'creo', 'crear', 'crea', 'funciona', 'funcionan', 'uso', 'usar', 'veo', 'ver', 'quiero', 'sirve',
  'significa', 'cuando', 'cuales', 'cual', 'sobre', 'tiene', 'tengo', 'hay', 'esta', 'este', 'esto', 'son', 'mas',
]);

function normalizar(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function construirIndice(): ResultadoBusqueda[] {
  const indice: ResultadoBusqueda[] = [];

  for (const modulo of MODULOS) {
    for (const pagina of modulo.paginas) {
      const partesTexto = [
        pagina.resumen,
        ...(pagina.camposYBotones?.map((c) => `${c.nombre}: ${c.explicacion}`) ?? []),
        ...(pagina.proceso ?? []),
        ...(pagina.notas ?? []),
      ];
      indice.push({
        tipo: 'manual',
        titulo: `${modulo.titulo} · ${pagina.titulo}`,
        texto: partesTexto.join(' '),
        href: `/ayuda/modulo/${modulo.slug}/${pagina.slug}`,
        pasos: pagina.proceso,
      });
    }
  }

  for (const [i, faq] of preguntasFrecuentes.entries()) {
    indice.push({ tipo: 'faq', titulo: faq.pregunta, texto: faq.respuesta, href: `/ayuda/faq#faq-${i}` });
  }

  for (const [i, termino] of glosario.entries()) {
    indice.push({ tipo: 'glosario', titulo: termino.termino, texto: termino.definicion, href: `/ayuda/glosario#term-${i}` });
  }

  return indice;
}

const INDICE: EntradaIndice[] = construirIndice().map((item) => ({
  ...item,
  tituloNormal: normalizar(item.titulo),
  textoNormal: normalizar(item.texto),
}));

/**
 * Variantes de una palabra para que "creo", "crear" o "creas" encuentren lo mismo.
 * Solo cubre verbos regulares comunes y plurales; no es un analizador morfológico.
 */
function variantes(palabra: string): string[] {
  const base = palabra.replace(/(o|as|a|es|e|amos|an|en)$/, '');
  const raices = new Set([palabra, base]);
  for (const fin of ['ar', 'er', 'ir']) raices.add(base + fin);
  if (palabra.endsWith('s') && palabra.length > 3) raices.add(palabra.slice(0, -1));
  return [...raices].filter((v) => v.length >= 3);
}

/**
 * Busca por palabras, no por frase exacta. Un resultado sirve si contiene al menos
 * el 60% de las palabras de la consulta; los que tienen más palabras y coinciden
 * en el título salen primero.
 */
export function buscarEnAyuda(consulta: string, limite = 20): ResultadoBusqueda[] {
  const todas = normalizar(consulta.trim()).replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((p) => p.length >= 2);
  if (todas.length === 0) return [];
  const utiles = todas.filter((p) => !PALABRAS_VACIAS.has(p));
  const palabras = utiles.length > 0 ? utiles : todas;
  const minimo = Math.max(1, Math.ceil(palabras.length * 0.5));

  const formas = palabras.map((p) => variantes(p));
  const contiene = (texto: string, forma: string[]) => forma.some((v) => texto.includes(v));

  return INDICE.map((item) => {
    const enTitulo = formas.filter((f) => contiene(item.tituloNormal, f)).length;
    const enTexto = formas.filter((f) => contiene(item.textoNormal, f)).length;
    return { item, coincidencias: Math.max(enTitulo, enTexto), score: enTitulo * 3 + enTexto };
  })
    .filter((r) => r.coincidencias >= minimo)
    .sort((a, b) => b.coincidencias - a.coincidencias || b.score - a.score)
    .slice(0, limite)
    .map(({ item }) => ({ tipo: item.tipo, titulo: item.titulo, texto: item.texto, href: item.href, pasos: item.pasos }));
}

/**
 * Recupera los fragmentos del manual, las preguntas frecuentes y el glosario más relacionados con una
 * pregunta, para dárselos a Gino (la IA) como contexto. A diferencia del buscador de la ayuda, no exige
 * que coincida la mayoría de las palabras: ordena por cuántas coinciden y trae siempre lo mejor disponible,
 * así una pregunta en lenguaje natural ("¿cómo hago para pasar una estrategia al plan?") no se queda sin contexto.
 */
export function recuperarParaIA(consulta: string, limite = 8): ResultadoBusqueda[] {
  const todas = normalizar(consulta.trim()).replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((p) => p.length >= 3);
  const utiles = todas.filter((p) => !PALABRAS_VACIAS.has(p) && !VERBOS_GENERICOS.has(p));
  const palabras = utiles.length > 0 ? utiles : todas;
  if (palabras.length === 0) return [];
  const formas = palabras.map((p) => variantes(p));
  const contiene = (texto: string, forma: string[]) => forma.some((v) => texto.includes(v));

  // Peso de cada palabra: las raras (simulacro, FODA, incapacidad) valen mucho más que las comunes (registro, funciona).
  const total = INDICE.length;
  const pesos = formas.map((f) => {
    const df = INDICE.filter((item) => contiene(item.textoNormal, f) || contiene(item.tituloNormal, f)).length;
    return df === 0 ? 0 : Math.log(1 + total / df);
  });

  return INDICE.map((item) => {
    let score = 0;
    formas.forEach((f, i) => {
      const w = pesos[i]!;
      if (contiene(item.tituloNormal, f)) score += w * 3;
      else if (contiene(item.textoNormal, f)) score += w;
    });
    // Las páginas del manual pesan un poco más: son las que explican cómo se hace cada cosa.
    return { item, score: item.tipo === 'manual' && score > 0 ? score * 1.15 : score };
  })
    .filter((r) => r.score > 0)
    .sort((x, y) => y.score - x.score)
    .slice(0, limite)
    .map(({ item }) => ({ tipo: item.tipo, titulo: item.titulo, texto: item.texto, href: item.href, pasos: item.pasos }));
}
