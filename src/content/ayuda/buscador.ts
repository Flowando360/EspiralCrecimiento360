import { MODULOS, preguntasFrecuentes, glosario } from './index';

export interface ResultadoBusqueda {
  tipo: 'manual' | 'faq' | 'glosario';
  titulo: string;
  texto: string;
  href: string;
}

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

const INDICE = construirIndice();

export function buscarEnAyuda(consulta: string, limite = 20): ResultadoBusqueda[] {
  const q = normalizar(consulta.trim());
  if (!q) return [];

  return INDICE.filter((item) => normalizar(item.titulo).includes(q) || normalizar(item.texto).includes(q)).slice(
    0,
    limite
  );
}
