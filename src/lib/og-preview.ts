import { lookup } from 'dns/promises';
import { isIP } from 'net';

const TIMEOUT_MS = 5000;
const MAX_BYTES = 500_000;

export interface OgPreview {
  titulo: string | null;
  imagen: string | null;
  descripcion: string | null;
}

function esIpPrivadaOLocal(ip: string): boolean {
  if (ip === '127.0.0.1' || ip === '::1' || ip === '0.0.0.0') return true;
  if (/^10\./.test(ip)) return true;
  if (/^192\.168\./.test(ip)) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(ip)) return true;
  if (/^169\.254\./.test(ip)) return true; // link-local, incluye metadata de nube (AWS/GCP/Azure)
  if (/^f[cd][0-9a-f]{2}:/i.test(ip)) return true; // IPv6 ULA (fc00::/7)
  if (/^fe80:/i.test(ip)) return true; // IPv6 link-local
  return false;
}

/**
 * Descarga los metadatos Open Graph de una URL externa para la vista previa
 * del feed. La URL la pega un usuario cualquiera, así que antes de pedirla
 * se verifica que no apunte a una IP privada/local (SSRF: alguien podría
 * intentar usar esto para sondear la red interna de Supabase/Vercel).
 * Nunca lanza error: si algo falla, devuelve campos en null y la publicación
 * sigue adelante solo con el link.
 */
export async function obtenerVistaPreviaLink(urlTexto: string): Promise<OgPreview> {
  const vacio: OgPreview = { titulo: null, imagen: null, descripcion: null };

  let url: URL;
  try {
    url = new URL(urlTexto);
  } catch {
    return vacio;
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return vacio;

  try {
    const hostIp = isIP(url.hostname) ? url.hostname : (await lookup(url.hostname)).address;
    if (esIpPrivadaOLocal(hostIp)) return vacio;
  } catch {
    return vacio;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: { 'User-Agent': 'EspiralCrecimiento-LinkPreview/1.0' },
    });
    if (!res.ok || !res.body) return vacio;

    const contentType = res.headers.get('content-type') ?? '';
    if (!contentType.includes('text/html')) return vacio;

    const reader = res.body.getReader();
    let html = '';
    let leidos = 0;
    while (leidos < MAX_BYTES) {
      const { done, value } = await reader.read();
      if (done) break;
      leidos += value.length;
      html += Buffer.from(value).toString('utf-8');
    }
    reader.cancel().catch(() => {});

    return {
      titulo: extraerMetaOg(html, 'og:title'),
      imagen: extraerMetaOg(html, 'og:image'),
      descripcion: extraerMetaOg(html, 'og:description'),
    };
  } catch {
    return vacio;
  } finally {
    clearTimeout(timeout);
  }
}

function extraerMetaOg(html: string, propiedad: string): string | null {
  const regex = new RegExp(
    `<meta[^>]+property=["']${propiedad}["'][^>]+content=["']([^"']*)["']`,
    'i'
  );
  const regexInvertido = new RegExp(
    `<meta[^>]+content=["']([^"']*)["'][^>]+property=["']${propiedad}["']`,
    'i'
  );
  const match = html.match(regex) ?? html.match(regexInvertido);
  return match?.[1] ? decodeEntidadesHtml(match[1]) : null;
}

function decodeEntidadesHtml(texto: string): string {
  return texto
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}
