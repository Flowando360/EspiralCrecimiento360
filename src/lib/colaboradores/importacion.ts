import ExcelJS from 'exceljs';
import { TIPOS_CONTRATO } from '@/lib/contratos';
import type { EstadoColaborador, TipoContrato } from '@/types/colaborador';

/**
 * Carga masiva de colaboradores desde Excel (informe de pruebas, hallazgo 4.3).
 * Este módulo solo lee y valida; la escritura en base de datos la hace la acción del servidor.
 */

export const MAX_FILAS_IMPORTACION = 200;

export const COLUMNAS_PLANTILLA = [
  { clave: 'nombre', encabezado: 'Nombre completo', obligatoria: true, ancho: 32 },
  { clave: 'documento', encabezado: 'Documento', obligatoria: false, ancho: 16 },
  { clave: 'correo', encabezado: 'Correo', obligatoria: false, ancho: 30 },
  { clave: 'telefono', encabezado: 'Teléfono', obligatoria: false, ancho: 16 },
  { clave: 'cargo', encabezado: 'Cargo', obligatoria: true, ancho: 30 },
  { clave: 'lider', encabezado: 'Líder (nombre o documento)', obligatoria: false, ancho: 30 },
  { clave: 'ingreso', encabezado: 'Fecha de ingreso', obligatoria: true, ancho: 16 },
  { clave: 'contrato', encabezado: 'Tipo de contrato', obligatoria: false, ancho: 26 },
  { clave: 'estado', encabezado: 'Estado', obligatoria: false, ancho: 20 },
  { clave: 'salario', encabezado: 'Salario', obligatoria: false, ancho: 14 },
  { clave: 'eps', encabezado: 'EPS', obligatoria: false, ancho: 18 },
  { clave: 'arl', encabezado: 'ARL', obligatoria: false, ancho: 18 },
  { clave: 'afp', encabezado: 'AFP (pensiones)', obligatoria: false, ancho: 18 },
  { clave: 'caja', encabezado: 'Caja de compensación', obligatoria: false, ancho: 22 },
] as const;

type Clave = (typeof COLUMNAS_PLANTILLA)[number]['clave'];

export const ESTADOS_IMPORTACION: { value: EstadoColaborador; label: string }[] = [
  { value: 'activo', label: 'Activo' },
  { value: 'periodo_prueba', label: 'Período de prueba' },
  { value: 'inactivo', label: 'Inactivo' },
  { value: 'en_proceso_salida', label: 'En proceso de salida' },
];

export interface DatosColaboradorImportado {
  nombre: string;
  documento: string | null;
  correo: string | null;
  telefono: string | null;
  cargoId: string;
  cargoNombre: string;
  liderTexto: string | null;
  ingreso: string;
  contrato: TipoContrato;
  estado: EstadoColaborador;
  salario: number | null;
  eps: string | null;
  arl: string | null;
  afp: string | null;
  caja: string | null;
}

export interface FilaImportacion {
  /** Número de fila en el Excel (para que Talento Humano la encuentre). */
  fila: number;
  nombre: string;
  estado: 'ok' | 'error' | 'omitida';
  errores: string[];
  avisos: string[];
  datos: DatosColaboradorImportado | null;
}

export interface ContextoImportacion {
  cargos: { id: string; nombre: string }[];
  /** Documentos (solo dígitos y letras) que ya existen en la empresa. */
  documentosExistentes: Set<string>;
}

export const norm = (t: string | null | undefined): string =>
  (t ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

export const claveDocumento = (t: string | null | undefined): string => (t ?? '').replace(/[^0-9a-zA-Z]/g, '').toLowerCase();

function texto(v: unknown): string {
  if (v == null) return '';
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (typeof v === 'object') {
    const o = v as any;
    if (Array.isArray(o.richText)) return o.richText.map((t: any) => t.text).join('').trim();
    if ('result' in o) return texto(o.result);
    if ('text' in o) return String(o.text).trim();
    if ('hyperlink' in o) return String(o.text ?? o.hyperlink).trim();
    return '';
  }
  return String(v).trim();
}

function parseFecha(v: unknown): string | null {
  const ok = (iso: string) => {
    const y = Number(iso.slice(0, 4));
    return y >= 1950 && y <= 2100 && !Number.isNaN(new Date(iso + 'T00:00:00Z').getTime()) ? iso : null;
  };
  if (v instanceof Date) return ok(v.toISOString().slice(0, 10));
  if (typeof v === 'number' && v > 20000 && v < 80000) return ok(new Date(Math.round((v - 25569) * 86400000)).toISOString().slice(0, 10));
  const t = texto(v);
  if (!t) return null;
  let m = t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return ok(`${m[1]}-${m[2]!.padStart(2, '0')}-${m[3]!.padStart(2, '0')}`);
  m = t.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/);
  if (m) return ok(`${m[3]}-${m[2]!.padStart(2, '0')}-${m[1]!.padStart(2, '0')}`); // día/mes/año (formato colombiano)
  return null;
}

const ALIAS_CONTRATO: Record<string, TipoContrato> = {
  'termino indefinido': 'indefinido',
  'a termino indefinido': 'indefinido',
  'termino fijo': 'fijo',
  'a termino fijo': 'fijo',
  'obra o labor': 'obra_labor',
  'obra labor': 'obra_labor',
  'prestacion de servicios': 'prestacion_servicios',
  'prestacion servicios': 'prestacion_servicios',
  'en mision': 'empleado_mision',
  'empleado en mision': 'empleado_mision',
  'temporal': 'empleado_mision',
  'aprendizaje': 'aprendizaje',
  'aprendiz': 'aprendizaje',
  'pasantia': 'pasantia',
};

function resolverContrato(t: string): TipoContrato | null {
  const k = norm(t);
  if (!k) return null;
  for (const c of TIPOS_CONTRATO) {
    if (norm(c.value) === k || norm(c.label) === k || norm(c.label).startsWith(k + ' ')) return c.value;
  }
  return ALIAS_CONTRATO[k] ?? null;
}

function resolverEstado(t: string): EstadoColaborador | null {
  const k = norm(t);
  if (!k) return null;
  for (const e of ESTADOS_IMPORTACION) if (norm(e.label) === k || norm(e.value) === k || norm(e.value.replace(/_/g, ' ')) === k) return e.value;
  return null;
}

/** Lee el Excel y devuelve una fila validada por cada persona. No escribe nada. */
export async function analizarExcelColaboradores(buffer: ArrayBuffer, ctx: ContextoImportacion): Promise<{ filas: FilaImportacion[]; errorGeneral?: string }> {
  const wb = new ExcelJS.Workbook();
  try {
    await wb.xlsx.load(buffer);
  } catch {
    return { filas: [], errorGeneral: 'No se pudo leer el archivo. Usa la plantilla en formato .xlsx.' };
  }
  const ws = wb.getWorksheet('Colaboradores') ?? wb.worksheets[0];
  if (!ws) return { filas: [], errorGeneral: 'El archivo no tiene hojas.' };

  // Encabezados: se buscan por nombre (sin tildes ni mayúsculas), en cualquier orden.
  const columna = new Map<Clave, number>();
  ws.getRow(1).eachCell((celda, n) => {
    const h = norm(texto(celda.value));
    const col = COLUMNAS_PLANTILLA.find((c) => norm(c.encabezado) === h || h.startsWith(norm(c.encabezado).split(' (')[0]!));
    if (col && !columna.has(col.clave)) columna.set(col.clave, n);
  });
  const faltan = COLUMNAS_PLANTILLA.filter((c) => c.obligatoria && !columna.has(c.clave)).map((c) => c.encabezado);
  if (faltan.length > 0) return { filas: [], errorGeneral: `Faltan columnas obligatorias en la primera fila: ${faltan.join(', ')}. Descarga la plantilla para ver el formato.` };

  const get = (fila: ExcelJS.Row, clave: Clave): unknown => {
    const n = columna.get(clave);
    return n ? fila.getCell(n).value : null;
  };

  const cargosPorNombre = new Map<string, { id: string; nombre: string }[]>();
  for (const c of ctx.cargos) {
    const k = norm(c.nombre);
    cargosPorNombre.set(k, [...(cargosPorNombre.get(k) ?? []), c]);
  }

  const filas: FilaImportacion[] = [];
  const documentosEnArchivo = new Map<string, number>();

  for (let n = 2; n <= ws.rowCount; n++) {
    const fila = ws.getRow(n);
    const nombre = texto(get(fila, 'nombre'));
    const vacia = COLUMNAS_PLANTILLA.every((c) => !texto(get(fila, c.clave)));
    if (vacia) continue;
    if (filas.length >= MAX_FILAS_IMPORTACION) {
      return { filas, errorGeneral: `El archivo tiene más de ${MAX_FILAS_IMPORTACION} personas. Divídelo en varios archivos y cárgalos uno a uno.` };
    }

    const errores: string[] = [];
    const avisos: string[] = [];
    if (!nombre) errores.push('Falta el nombre completo');

    const cargoTexto = texto(get(fila, 'cargo'));
    let cargo: { id: string; nombre: string } | undefined;
    if (!cargoTexto) errores.push('Falta el cargo');
    else {
      const candidatos = cargosPorNombre.get(norm(cargoTexto));
      if (!candidatos) errores.push(`El cargo «${cargoTexto}» no existe. Créalo antes en Cargos y perfiles o corrige el nombre`);
      else if (candidatos.length > 1) errores.push(`Hay varios cargos llamados «${cargoTexto}»`);
      else cargo = candidatos[0];
    }

    const ingresoCruda = get(fila, 'ingreso');
    const ingreso = parseFecha(ingresoCruda);
    if (!texto(ingresoCruda)) errores.push('Falta la fecha de ingreso');
    else if (!ingreso) errores.push(`Fecha de ingreso no válida («${texto(ingresoCruda)}»). Usa día/mes/año, por ejemplo 15/03/2024`);

    const contratoTexto = texto(get(fila, 'contrato'));
    let contrato: TipoContrato = 'indefinido';
    if (!contratoTexto) avisos.push('Sin tipo de contrato: se usará «Indefinido»');
    else {
      const c = resolverContrato(contratoTexto);
      if (c) contrato = c;
      else errores.push(`Tipo de contrato no reconocido: «${contratoTexto}»`);
    }

    const estadoTexto = texto(get(fila, 'estado'));
    let estado: EstadoColaborador = 'activo';
    if (estadoTexto) {
      const e = resolverEstado(estadoTexto);
      if (e) estado = e;
      else errores.push(`Estado no reconocido: «${estadoTexto}»`);
    }

    const correo = texto(get(fila, 'correo'));
    if (correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) errores.push(`Correo no válido: «${correo}»`);

    const salarioTexto = texto(get(fila, 'salario'));
    let salario: number | null = null;
    if (salarioTexto) {
      const limpio = salarioTexto.replace(/[$\s]/g, '').replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.');
      const num = Number(limpio);
      if (Number.isNaN(num) || num < 0) errores.push(`Salario no válido: «${salarioTexto}»`);
      else salario = num;
    }

    const documento = texto(get(fila, 'documento'));
    let omitida = false;
    if (documento) {
      const k = claveDocumento(documento);
      if (ctx.documentosExistentes.has(k)) {
        omitida = true;
        avisos.push('Ya existe una persona con este documento: se omite para no duplicarla');
      } else if (documentosEnArchivo.has(k)) {
        errores.push(`El documento se repite en la fila ${documentosEnArchivo.get(k)} del archivo`);
      } else documentosEnArchivo.set(k, n);
    } else avisos.push('Sin documento: no se podrá detectar si la persona ya existe');

    const hayErrores = errores.length > 0;
    filas.push({
      fila: n,
      nombre: nombre || '(sin nombre)',
      estado: hayErrores ? 'error' : omitida ? 'omitida' : 'ok',
      errores,
      avisos,
      datos:
        hayErrores || omitida || !cargo || !ingreso
          ? null
          : {
              nombre,
              documento: documento || null,
              correo: correo || null,
              telefono: texto(get(fila, 'telefono')) || null,
              cargoId: cargo.id,
              cargoNombre: cargo.nombre,
              liderTexto: texto(get(fila, 'lider')) || null,
              ingreso,
              contrato,
              estado,
              salario,
              eps: texto(get(fila, 'eps')) || null,
              arl: texto(get(fila, 'arl')) || null,
              afp: texto(get(fila, 'afp')) || null,
              caja: texto(get(fila, 'caja')) || null,
            },
    });
  }

  if (filas.length === 0) return { filas, errorGeneral: 'No se encontraron personas en el archivo (debajo de la fila de encabezados).' };
  return { filas };
}

/** Plantilla .xlsx descargable: hoja de datos, hoja de instrucciones y hoja de listas válidas. */
export async function construirPlantillaColaboradores(cargos: string[]): Promise<ArrayBuffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Espiral de Crecimiento 360°';

  const ws = wb.addWorksheet('Colaboradores');
  ws.columns = COLUMNAS_PLANTILLA.map((c) => ({ header: c.encabezado + (c.obligatoria ? ' *' : ''), key: c.clave, width: c.ancho }));
  const encabezado = ws.getRow(1);
  encabezado.font = { bold: true };
  encabezado.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F5E9' } };
  ws.views = [{ state: 'frozen', ySplit: 1 }];
  ws.getColumn('documento').numFmt = '@';
  ws.getColumn('telefono').numFmt = '@';
  ws.getColumn('ingreso').numFmt = 'dd/mm/yyyy';

  // Listas desplegables (hasta 200 filas)
  const listas = wb.addWorksheet('Listas');
  listas.getCell('A1').value = 'Cargos de la empresa';
  listas.getCell('B1').value = 'Tipos de contrato';
  listas.getCell('C1').value = 'Estados';
  listas.getRow(1).font = { bold: true };
  cargos.forEach((c, i) => (listas.getCell(i + 2, 1).value = c));
  TIPOS_CONTRATO.forEach((t, i) => (listas.getCell(i + 2, 2).value = t.label));
  ESTADOS_IMPORTACION.forEach((e, i) => (listas.getCell(i + 2, 3).value = e.label));
  listas.columns = [{ width: 36 }, { width: 40 }, { width: 24 }];

  const colDe = (clave: Clave) => COLUMNAS_PLANTILLA.findIndex((c) => c.clave === clave) + 1;
  for (let r = 2; r <= MAX_FILAS_IMPORTACION + 1; r++) {
    if (cargos.length > 0) ws.getCell(r, colDe('cargo')).dataValidation = { type: 'list', allowBlank: true, formulae: [`Listas!$A$2:$A$${cargos.length + 1}`] };
    ws.getCell(r, colDe('contrato')).dataValidation = { type: 'list', allowBlank: true, formulae: [`Listas!$B$2:$B$${TIPOS_CONTRATO.length + 1}`] };
    ws.getCell(r, colDe('estado')).dataValidation = { type: 'list', allowBlank: true, formulae: [`Listas!$C$2:$C$${ESTADOS_IMPORTACION.length + 1}`] };
  }

  const ins = wb.addWorksheet('Instrucciones');
  ins.columns = [{ width: 110 }];
  [
    'CÓMO USAR ESTA PLANTILLA',
    '',
    '1. Llena la hoja «Colaboradores»: una persona por fila, desde la fila 2. No cambies ni borres los encabezados.',
    '2. Las columnas con * son obligatorias: Nombre completo, Cargo y Fecha de ingreso.',
    '3. El Cargo debe existir ya en Cargos y perfiles, escrito igual (la hoja «Listas» trae los de tu empresa y la celda ofrece una lista desplegable).',
    '4. Fecha de ingreso: día/mes/año, por ejemplo 15/03/2024.',
    '5. Tipo de contrato y Estado: elige de la lista. Si los dejas vacíos se usa «Indefinido» y «Activo».',
    '6. Líder: escribe el nombre completo o el documento de su jefe directo (puede estar en este mismo archivo o ya en la plataforma). Es opcional.',
    '7. Documento: pon el número sin puntos. Si ya existe una persona con ese documento, la fila se omite para no duplicarla.',
    `8. Máximo ${MAX_FILAS_IMPORTACION} personas por archivo.`,
    '9. Súbelo en Colaboradores → Importar desde Excel. Antes de guardar verás una revisión fila por fila con lo que se importará y lo que hay que corregir.',
    '',
    'Esta carga NO crea cuentas de acceso (usuarios): solo las fichas. Las cuentas se crean aparte en Usuarios y roles.',
  ].forEach((t, i) => {
    ins.getCell(i + 1, 1).value = t;
    if (i === 0) ins.getCell(1, 1).font = { bold: true, size: 13 };
  });

  return (await wb.xlsx.writeBuffer()) as ArrayBuffer;
}
