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
 * Busca por palabras, no por frase exacta. Un resultado sirve si contiene al menos
 * el 60% de las palabras de la consulta; los que tienen más palabras y coinciden
 * en el título salen primero.
 */
export function buscarEnAyuda(consulta: string, limite = 20): ResultadoBusqueda[] {
  const todas = normalizar(consulta.trim()).split(/\s+/).filter((p) => p.length >= 2);
  if (todas.length === 0) return [];
  const utiles = todas.filter((p) => !PALABRAS_VACIAS.has(p));
  const palabras = utiles.length > 0 ? utiles : todas;
  const minimo = Math.max(1, Math.ceil(palabras.length * 0.6));

  return INDICE.map((item) => {
    const enTitulo = palabras.filter((p) => item.tituloNormal.includes(p)).length;
    const enTexto = palabras.filter((p) => item.textoNormal.includes(p)).length;
    return { item, coincidencias: Math.max(enTitulo, enTexto), score: enTitulo * 3 + enTexto };
  })
    .filter((r) => r.coincidencias >= minimo)
    .sort((a, b) => b.coincidencias - a.coincidencias || b.score - a.score)
    .slice(0, limite)
    .map(({ item }) => ({ tipo: item.tipo, titulo: item.titulo, texto: item.texto, href: item.href, pasos: item.pasos }));
}
