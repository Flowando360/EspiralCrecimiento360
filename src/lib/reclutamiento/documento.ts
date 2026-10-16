import JSZip from 'jszip';

// Validación y lectura de hojas de vida. Se decide el tipo por el contenido
// real del archivo (firma), no por la extensión (requerimiento §7.2, sección B).
// Sin I/O de red: solo recibe bytes.

export type TipoDocumento = 'pdf' | 'docx';

export const TAMANO_MAXIMO_HOJA_VIDA = 8 * 1024 * 1024;
const MAX_CARACTERES_TEXTO = 120_000;

export interface ResultadoValidacionDocumento {
  ok: boolean;
  tipo?: TipoDocumento;
  error?: string;
}

/** Identifica PDF o DOCX por su firma. Rechaza ejecutables, .doc antiguo y cualquier otro formato. */
export async function validarHojaVida(bytes: Uint8Array): Promise<ResultadoValidacionDocumento> {
  if (bytes.byteLength === 0) return { ok: false, error: 'El archivo está vacío.' };
  if (bytes.byteLength > TAMANO_MAXIMO_HOJA_VIDA) return { ok: false, error: 'La hoja de vida no puede pesar más de 8 MB.' };

  const cabecera = String.fromCharCode(...bytes.subarray(0, 5));
  if (cabecera.startsWith('%PDF')) return { ok: true, tipo: 'pdf' };

  // DOCX es un contenedor ZIP con word/document.xml dentro.
  if (bytes[0] === 0x50 && bytes[1] === 0x4b) {
    try {
      const zip = await JSZip.loadAsync(bytes);
      if (zip.file('word/document.xml')) return { ok: true, tipo: 'docx' };
    } catch {
      return { ok: false, error: 'No se pudo leer el archivo. Verifica que no esté dañado.' };
    }
  }

  // DOC antiguo (OLE2): se pide convertirlo, no se procesa.
  if (bytes[0] === 0xd0 && bytes[1] === 0xcf && bytes[2] === 0x11 && bytes[3] === 0xe0) {
    return { ok: false, error: 'El formato .doc no es compatible. Guárdalo como PDF o DOCX e intenta de nuevo.' };
  }
  return { ok: false, error: 'Formato no permitido. Sube tu hoja de vida en PDF o DOCX.' };
}

/** Texto plano de un DOCX (párrafos separados por salto de línea). */
export async function textoDeDocx(bytes: Uint8Array): Promise<string> {
  const zip = await JSZip.loadAsync(bytes);
  const xml = await zip.file('word/document.xml')!.async('string');
  const texto = xml
    .replace(/<w:tab\/>/g, '\t')
    .replace(/<\/w:p>/g, '\n')
    .replace(/<w:br\/>/g, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return texto.slice(0, MAX_CARACTERES_TEXTO);
}
