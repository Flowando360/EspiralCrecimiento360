import ExcelJS from 'exceljs';
import { norm, parseFecha, texto } from '@/lib/colaboradores/importacion';

/**
 * Carga masiva de la matriz de requisitos legales desde Excel (informe de pruebas, 9.4):
 * muchas empresas ya tienen su matriz en Excel (hecha con la ARL, una consultora o su implementación ISO).
 * Este módulo solo lee y valida; guardar lo hace la acción del servidor.
 */

export const MAX_REQUISITOS_IMPORTACION = 500;

export const COLUMNAS_MATRIZ = [
  { clave: 'norma', encabezado: 'Norma / ley / reglamento', obligatoria: true, ancho: 34 },
  { clave: 'anio', encabezado: 'Año de expedición', obligatoria: false, ancho: 14 },
  { clave: 'entidad', encabezado: 'Entidad emisora', obligatoria: false, ancho: 24 },
  { clave: 'asunto', encabezado: 'Asunto / tema', obligatoria: false, ancho: 28 },
  { clave: 'articulo', encabezado: 'Artículo', obligatoria: false, ancho: 14 },
  { clave: 'nombreArticulo', encabezado: 'Título del artículo', obligatoria: false, ancho: 28 },
  { clave: 'descripcion', encabezado: 'Descripción del requisito', obligatoria: false, ancho: 50 },
  { clave: 'cumple', encabezado: 'Cumple', obligatoria: false, ancho: 14 },
  { clave: 'soporte', encabezado: 'Soporte de cumplimiento', obligatoria: false, ancho: 36 },
  { clave: 'acciones', encabezado: 'Acciones a seguir', obligatoria: false, ancho: 40 },
  { clave: 'observaciones', encabezado: 'Observaciones', obligatoria: false, ancho: 30 },
  { clave: 'proceso', encabezado: 'Proceso (nombre o código)', obligatoria: false, ancho: 26 },
  { clave: 'revision', encabezado: 'Fecha de última revisión', obligatoria: false, ancho: 18 },
] as const;

type Clave = (typeof COLUMNAS_MATRIZ)[number]['clave'];

export interface DatosRequisito {
  norma: string;
  anio: number | null;
  entidad: string | null;
  asunto: string | null;
  articulo: string | null;
  nombreArticulo: string | null;
  descripcion: string | null;
  cumple: boolean | null;
  soporte: string | null;
  acciones: string | null;
  observaciones: string | null;
  procesoId: string | null;
  revision: string | null;
}

export interface FilaRequisito {
  fila: number;
  norma: string;
  articulo: string | null;
  estado: 'ok' | 'error' | 'omitida';
  errores: string[];
  avisos: string[];
  datos: DatosRequisito | null;
}

export interface ContextoMatriz {
  procesos: { id: string; nombre: string; codigo: string | null }[];
  /** Claves norma|artículo que ya existen en la matriz. */
  existentes: Set<string>;
}

export const claveRequisito = (norma: string, articulo: string | null | undefined) => `${norm(norma)}|${norm(articulo)}`;

function resolverCumple(t: string): boolean | null | undefined {
  const k = norm(t);
  if (!k || ['sin evaluar', 'pendiente', 'por evaluar', 'n/a', 'na'].includes(k)) return null;
  if (['cumple', 'si', 'sí', 'x', 'true', '1'].includes(k)) return true;
  if (['no cumple', 'no', 'incumple', 'false', '0'].includes(k)) return false;
  return undefined; // no reconocido
}

export async function analizarExcelMatriz(buffer: ArrayBuffer, ctx: ContextoMatriz): Promise<{ filas: FilaRequisito[]; errorGeneral?: string }> {
  const wb = new ExcelJS.Workbook();
  try {
    await wb.xlsx.load(buffer);
  } catch {
    return { filas: [], errorGeneral: 'No se pudo leer el archivo. Usa la plantilla en formato .xlsx.' };
  }
  const ws = wb.getWorksheet('Matriz legal') ?? wb.worksheets[0];
  if (!ws) return { filas: [], errorGeneral: 'El archivo no tiene hojas.' };

  const columna = new Map<Clave, number>();
  ws.getRow(1).eachCell((celda, n) => {
    const h = norm(texto(celda.value));
    const col = COLUMNAS_MATRIZ.find((c) => {
      const completo = norm(c.encabezado);
      // Tolera encabezados propios del cliente: «Norma», «Año», «Descripción»… (basta el inicio del nombre).
      const palabras = (t: string) => t.replace(/[()/*]/g, ' ').split(' ').filter(Boolean);
      const hp = palabras(h);
      const cp = palabras(completo);
      return h === completo || h.startsWith(completo.split(' (')[0]!.split(' / ')[0]!) || (h.length >= 3 && hp.length > 0 && hp.every((w) => cp.includes(w)));
    });
    if (col && !columna.has(col.clave)) columna.set(col.clave, n);
  });
  if (!columna.has('norma')) {
    return { filas: [], errorGeneral: 'Falta la columna «Norma / ley / reglamento» en la primera fila. Descarga la plantilla para ver el formato.' };
  }
  const get = (fila: ExcelJS.Row, clave: Clave): unknown => {
    const n = columna.get(clave);
    return n ? fila.getCell(n).value : null;
  };

  const procesosPorClave = new Map<string, { id: string }[]>();
  for (const p of ctx.procesos) {
    for (const k of [norm(p.nombre), norm(p.codigo)]) if (k) procesosPorClave.set(k, [...(procesosPorClave.get(k) ?? []), { id: p.id }]);
  }

  const filas: FilaRequisito[] = [];
  const vistos = new Map<string, number>();

  for (let n = 2; n <= ws.rowCount; n++) {
    const fila = ws.getRow(n);
    if (COLUMNAS_MATRIZ.every((c) => !texto(get(fila, c.clave)))) continue;
    if (filas.length >= MAX_REQUISITOS_IMPORTACION) {
      return { filas, errorGeneral: `El archivo tiene más de ${MAX_REQUISITOS_IMPORTACION} requisitos. Divídelo en varios archivos.` };
    }

    const errores: string[] = [];
    const avisos: string[] = [];
    const norma = texto(get(fila, 'norma'));
    const articulo = texto(get(fila, 'articulo')) || null;
    if (!norma) errores.push('Falta la norma, ley o reglamento');

    const anioTexto = texto(get(fila, 'anio'));
    let anio: number | null = null;
    if (anioTexto) {
      const a = Number(anioTexto.replace(/\D/g, '').slice(0, 4));
      if (a >= 1800 && a <= 2100) anio = a;
      else errores.push(`Año no válido: «${anioTexto}»`);
    }

    const cumpleTexto = texto(get(fila, 'cumple'));
    const cumple = resolverCumple(cumpleTexto);
    if (cumple === undefined) errores.push(`Valor de «Cumple» no reconocido: «${cumpleTexto}». Usa Cumple, No cumple o Sin evaluar`);

    const acciones = texto(get(fila, 'acciones')) || null;
    if (cumple === false && !acciones) avisos.push('Marcado «No cumple» sin acciones a seguir');

    const procesoTexto = texto(get(fila, 'proceso'));
    let procesoId: string | null = null;
    if (procesoTexto) {
      const c = procesosPorClave.get(norm(procesoTexto));
      if (c && c.length === 1) procesoId = c[0]!.id;
      else avisos.push(c && c.length > 1 ? `Hay varios procesos «${procesoTexto}»: queda sin proceso` : `El proceso «${procesoTexto}» no existe: queda sin proceso`);
    }

    const revisionCruda = get(fila, 'revision');
    const revision = parseFecha(revisionCruda);
    if (texto(revisionCruda) && !revision) avisos.push(`Fecha de revisión no válida («${texto(revisionCruda)}»): se usará la de hoy`);

    let omitida = false;
    if (norma) {
      const k = claveRequisito(norma, articulo);
      if (ctx.existentes.has(k)) {
        omitida = true;
        avisos.push('Ya existe este requisito en la matriz (misma norma y artículo): se omite');
      } else if (vistos.has(k)) {
        errores.push(`Repetido: igual a la fila ${vistos.get(k)} del archivo (misma norma y artículo)`);
      } else vistos.set(k, n);
    }

    const hayErrores = errores.length > 0;
    filas.push({
      fila: n,
      norma: norma || '(sin norma)',
      articulo,
      estado: hayErrores ? 'error' : omitida ? 'omitida' : 'ok',
      errores,
      avisos,
      datos:
        hayErrores || omitida
          ? null
          : {
              norma,
              anio,
              entidad: texto(get(fila, 'entidad')) || null,
              asunto: texto(get(fila, 'asunto')) || null,
              articulo,
              nombreArticulo: texto(get(fila, 'nombreArticulo')) || null,
              descripcion: texto(get(fila, 'descripcion')) || null,
              cumple: cumple ?? null,
              soporte: texto(get(fila, 'soporte')) || null,
              acciones,
              observaciones: texto(get(fila, 'observaciones')) || null,
              procesoId,
              revision,
            },
    });
  }

  if (filas.length === 0) return { filas, errorGeneral: 'No se encontraron requisitos en el archivo (debajo de la fila de encabezados).' };
  return { filas };
}

export async function construirPlantillaMatriz(procesos: string[]): Promise<ArrayBuffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Espiral de Crecimiento 360°';

  const ws = wb.addWorksheet('Matriz legal');
  ws.columns = COLUMNAS_MATRIZ.map((c) => ({ header: c.encabezado + (c.obligatoria ? ' *' : ''), key: c.clave, width: c.ancho }));
  const encabezado = ws.getRow(1);
  encabezado.font = { bold: true };
  encabezado.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F5E9' } };
  ws.views = [{ state: 'frozen', ySplit: 1 }];
  const colDe = (clave: Clave) => COLUMNAS_MATRIZ.findIndex((c) => c.clave === clave) + 1;
  ws.getColumn(colDe('revision')).numFmt = 'dd/mm/yyyy';
  ws.getColumn(colDe('articulo')).numFmt = '@';

  const listas = wb.addWorksheet('Listas');
  listas.getCell('A1').value = 'Cumple';
  listas.getCell('B1').value = 'Procesos de la empresa';
  listas.getRow(1).font = { bold: true };
  ['Cumple', 'No cumple', 'Sin evaluar'].forEach((v, i) => (listas.getCell(i + 2, 1).value = v));
  procesos.forEach((p, i) => (listas.getCell(i + 2, 2).value = p));
  listas.columns = [{ width: 16 }, { width: 40 }];
  for (let r = 2; r <= MAX_REQUISITOS_IMPORTACION + 1; r++) {
    ws.getCell(r, colDe('cumple')).dataValidation = { type: 'list', allowBlank: true, formulae: ['Listas!$A$2:$A$4'] };
    if (procesos.length > 0) ws.getCell(r, colDe('proceso')).dataValidation = { type: 'list', allowBlank: true, formulae: [`Listas!$B$2:$B$${procesos.length + 1}`] };
  }

  const ins = wb.addWorksheet('Instrucciones');
  ins.columns = [{ width: 110 }];
  [
    'CÓMO USAR ESTA PLANTILLA',
    '',
    '1. Llena la hoja «Matriz legal»: un requisito (norma + artículo) por fila, desde la fila 2. No cambies ni borres los encabezados.',
    '2. Solo la norma es obligatoria. Si ya tienes tu matriz en Excel (hecha con la ARL, una consultora o tu implementación ISO), copia y pega tus columnas aquí: basta con que los encabezados se parezcan a los de esta plantilla.',
    '3. Cumple: Cumple, No cumple o Sin evaluar (hay lista desplegable). Si pones «No cumple», escribe las acciones a seguir.',
    '4. Proceso: nombre o código de un proceso ya creado en Procesos y Sistemas de Gestión; si no existe, el requisito se carga sin proceso.',
    '5. Fecha de última revisión: día/mes/año, por ejemplo 15/03/2026. Si la dejas vacía se usa la de hoy.',
    `6. Máximo ${MAX_REQUISITOS_IMPORTACION} requisitos por archivo. Si una misma norma + artículo ya está en la matriz, esa fila se omite para no duplicarla.`,
    '7. Súbelo en Matriz de requisitos legales → Importar desde Excel. Antes de guardar verás una revisión fila por fila.',
  ].forEach((t, i) => {
    ins.getCell(i + 1, 1).value = t;
    if (i === 0) ins.getCell(1, 1).font = { bold: true, size: 13 };
  });

  return (await wb.xlsx.writeBuffer()) as ArrayBuffer;
}
