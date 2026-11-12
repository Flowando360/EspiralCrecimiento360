import ExcelJS from 'exceljs';
import { claveDocumento, norm, parseFecha, texto } from '@/lib/colaboradores/importacion';

/**
 * Carga masiva de incapacidades y licencias desde Excel (informe de pruebas, 4.11), para empresas con
 * alto volumen de novedades que hoy las tienen en el archivo de nómina. Solo lee y valida; guardar lo hace la acción del servidor.
 * A propósito no hay columna de diagnóstico: es un dato de salud sensible (Ley 1581) y no se guarda como texto.
 */

export const MAX_INCAPACIDADES_IMPORTACION = 500;

export const TIPOS_INCAPACIDAD = [
  { value: 'enfermedad_general', label: 'Enfermedad general' },
  { value: 'accidente_laboral', label: 'Accidente laboral' },
  { value: 'enfermedad_laboral', label: 'Enfermedad laboral' },
  { value: 'licencia_maternidad', label: 'Licencia de maternidad' },
  { value: 'licencia_paternidad', label: 'Licencia de paternidad' },
  { value: 'otra', label: 'Otra' },
] as const;

export type TipoIncapacidad = (typeof TIPOS_INCAPACIDAD)[number]['value'];

export const COLUMNAS_INCAPACIDADES = [
  { clave: 'documento', encabezado: 'Documento del colaborador', obligatoria: true, ancho: 22 },
  { clave: 'nombre', encabezado: 'Nombre (referencia)', obligatoria: false, ancho: 32 },
  { clave: 'tipo', encabezado: 'Tipo de incapacidad', obligatoria: true, ancho: 26 },
  { clave: 'inicio', encabezado: 'Fecha de inicio', obligatoria: true, ancho: 16 },
  { clave: 'fin', encabezado: 'Fecha de fin', obligatoria: true, ancho: 16 },
  { clave: 'entidad', encabezado: 'Entidad emisora (EPS o ARL)', obligatoria: false, ancho: 26 },
] as const;

type Clave = (typeof COLUMNAS_INCAPACIDADES)[number]['clave'];

/** Otros nombres con que suelen llegar estas columnas en los archivos de nómina. */
const SINONIMOS: Record<Clave, string[]> = {
  documento: ['cedula', 'identificacion', 'documento', 'cc', 'numero de documento'],
  nombre: ['nombre', 'empleado', 'trabajador', 'colaborador'],
  tipo: ['tipo', 'clase', 'concepto', 'novedad'],
  inicio: ['inicio', 'desde', 'fecha inicial', 'fecha inicio'],
  fin: ['fin', 'hasta', 'fecha final', 'fecha fin', 'terminacion'],
  entidad: ['entidad', 'eps', 'arl', 'emisora'],
};

export interface DatosIncapacidad {
  colaboradorId: string;
  colaboradorNombre: string;
  tipo: TipoIncapacidad;
  inicio: string;
  fin: string;
  dias: number;
  entidad: string | null;
}

export interface FilaIncapacidad {
  fila: number;
  colaborador: string;
  estado: 'ok' | 'error' | 'omitida';
  errores: string[];
  avisos: string[];
  datos: DatosIncapacidad | null;
}

export interface ContextoIncapacidades {
  colaboradores: { id: string; nombre_completo: string; numero_documento: string | null }[];
  /** Incapacidades ya registradas, para no duplicarlas y avisar de cruces. */
  existentes: { colaborador_id: string; tipo: string; fecha_inicio: string; fecha_fin: string }[];
}

const ALIAS_TIPO: Record<string, TipoIncapacidad> = {
  eg: 'enfermedad_general',
  'enfermedad comun': 'enfermedad_general',
  comun: 'enfermedad_general',
  general: 'enfermedad_general',
  at: 'accidente_laboral',
  'accidente de trabajo': 'accidente_laboral',
  'accidente laboral': 'accidente_laboral',
  el: 'enfermedad_laboral',
  maternidad: 'licencia_maternidad',
  paternidad: 'licencia_paternidad',
};

function resolverTipo(t: string): TipoIncapacidad | null {
  const k = norm(t);
  if (!k) return null;
  for (const x of TIPOS_INCAPACIDAD) if (norm(x.label) === k || norm(x.value) === k || norm(x.value.replace(/_/g, ' ')) === k) return x.value;
  return ALIAS_TIPO[k] ?? null;
}

const diasEntre = (a: string, b: string) => Math.round((new Date(b + 'T00:00:00Z').getTime() - new Date(a + 'T00:00:00Z').getTime()) / 86400000) + 1;

export async function analizarExcelIncapacidades(buffer: ArrayBuffer, ctx: ContextoIncapacidades): Promise<{ filas: FilaIncapacidad[]; errorGeneral?: string }> {
  const wb = new ExcelJS.Workbook();
  try {
    await wb.xlsx.load(buffer);
  } catch {
    return { filas: [], errorGeneral: 'No se pudo leer el archivo. Usa la plantilla en formato .xlsx.' };
  }
  const ws = wb.getWorksheet('Incapacidades') ?? wb.worksheets[0];
  if (!ws) return { filas: [], errorGeneral: 'El archivo no tiene hojas.' };

  const columna = new Map<Clave, number>();
  ws.getRow(1).eachCell((celda, n) => {
    const h = norm(texto(celda.value));
    const col = COLUMNAS_INCAPACIDADES.find((c) => {
      const completo = norm(c.encabezado);
      const palabras = (t: string) => t.replace(/[()/*]/g, ' ').split(' ').filter(Boolean);
      const hp = palabras(h);
      if (SINONIMOS[c.clave].some((sn) => h === sn || h.startsWith(sn + ' '))) return true;
      return h === completo || h.startsWith(completo.split(' (')[0]!) || (h.length >= 3 && hp.length > 0 && hp.every((w) => palabras(completo).includes(w)));
    });
    if (col && !columna.has(col.clave)) columna.set(col.clave, n);
  });
  const faltan = COLUMNAS_INCAPACIDADES.filter((c) => c.obligatoria && !columna.has(c.clave)).map((c) => c.encabezado);
  if (faltan.length > 0) return { filas: [], errorGeneral: `Faltan columnas obligatorias en la primera fila: ${faltan.join(', ')}. Descarga la plantilla para ver el formato.` };
  const get = (fila: ExcelJS.Row, clave: Clave): unknown => {
    const n = columna.get(clave);
    return n ? fila.getCell(n).value : null;
  };

  const porDocumento = new Map<string, { id: string; nombre_completo: string }[]>();
  const porNombre = new Map<string, { id: string; nombre_completo: string }[]>();
  for (const c of ctx.colaboradores) {
    const kd = claveDocumento(c.numero_documento);
    if (kd) porDocumento.set(kd, [...(porDocumento.get(kd) ?? []), c]);
    porNombre.set(norm(c.nombre_completo), [...(porNombre.get(norm(c.nombre_completo)) ?? []), c]);
  }
  const existentes = new Set(ctx.existentes.map((e) => `${e.colaborador_id}|${e.tipo}|${e.fecha_inicio}|${e.fecha_fin}`));
  const vistas = new Map<string, number>();

  const filas: FilaIncapacidad[] = [];
  for (let n = 2; n <= ws.rowCount; n++) {
    const fila = ws.getRow(n);
    if (COLUMNAS_INCAPACIDADES.every((c) => !texto(get(fila, c.clave)))) continue;
    if (filas.length >= MAX_INCAPACIDADES_IMPORTACION) {
      return { filas, errorGeneral: `El archivo tiene más de ${MAX_INCAPACIDADES_IMPORTACION} incapacidades. Divídelo en varios archivos.` };
    }

    const errores: string[] = [];
    const avisos: string[] = [];

    // Colaborador: por documento; si no hay documento, por nombre completo exacto.
    const documento = texto(get(fila, 'documento'));
    const nombreRef = texto(get(fila, 'nombre'));
    let colab: { id: string; nombre_completo: string } | undefined;
    if (!documento && !nombreRef) errores.push('Falta el documento del colaborador');
    else {
      const candidatos = documento ? porDocumento.get(claveDocumento(documento)) : porNombre.get(norm(nombreRef));
      if (!candidatos) errores.push(documento ? `No hay ningún colaborador con el documento «${documento}»` : `No hay ningún colaborador llamado «${nombreRef}»`);
      else if (candidatos.length > 1) errores.push('Hay varios colaboradores que coinciden; usa el documento');
      else colab = candidatos[0];
      if (colab && documento && nombreRef && norm(nombreRef) !== norm(colab.nombre_completo)) avisos.push(`El nombre del archivo («${nombreRef}») no coincide con el de la ficha («${colab.nombre_completo}»): revisa el documento`);
    }

    const tipoTexto = texto(get(fila, 'tipo'));
    const tipo = tipoTexto ? resolverTipo(tipoTexto) : null;
    if (!tipoTexto) errores.push('Falta el tipo de incapacidad');
    else if (!tipo) errores.push(`Tipo no reconocido: «${tipoTexto}». Usa Enfermedad general, Accidente laboral, Enfermedad laboral, Licencia de maternidad, Licencia de paternidad u Otra`);

    const inicioCruda = get(fila, 'inicio');
    const finCruda = get(fila, 'fin');
    const inicio = parseFecha(inicioCruda);
    const fin = parseFecha(finCruda);
    if (!texto(inicioCruda)) errores.push('Falta la fecha de inicio');
    else if (!inicio) errores.push(`Fecha de inicio no válida («${texto(inicioCruda)}»). Usa día/mes/año`);
    if (!texto(finCruda)) errores.push('Falta la fecha de fin');
    else if (!fin) errores.push(`Fecha de fin no válida («${texto(finCruda)}»). Usa día/mes/año`);
    if (inicio && fin && fin < inicio) errores.push('La fecha de fin es anterior a la de inicio');

    let omitida = false;
    if (colab && tipo && inicio && fin && fin >= inicio) {
      const k = `${colab.id}|${tipo}|${inicio}|${fin}`;
      if (existentes.has(k)) {
        omitida = true;
        avisos.push('Ya está registrada esta incapacidad: se omite');
      } else if (vistas.has(k)) errores.push(`Repetida: igual a la fila ${vistas.get(k)} del archivo`);
      else {
        vistas.set(k, n);
        const cruce = ctx.existentes.find((e) => e.colaborador_id === colab!.id && e.fecha_inicio <= fin && e.fecha_fin >= inicio);
        if (cruce) avisos.push(`Se cruza con otra incapacidad ya registrada (${cruce.fecha_inicio} a ${cruce.fecha_fin})`);
      }
    }
    if (inicio && fin && fin >= inicio && diasEntre(inicio, fin) > 540) avisos.push('Dura más de 540 días: verifica las fechas');

    const hayErrores = errores.length > 0;
    filas.push({
      fila: n,
      colaborador: colab?.nombre_completo ?? (nombreRef || documento || '(sin identificar)'),
      estado: hayErrores ? 'error' : omitida ? 'omitida' : 'ok',
      errores,
      avisos,
      datos:
        hayErrores || omitida || !colab || !tipo || !inicio || !fin
          ? null
          : { colaboradorId: colab.id, colaboradorNombre: colab.nombre_completo, tipo, inicio, fin, dias: diasEntre(inicio, fin), entidad: texto(get(fila, 'entidad')) || null },
    });
  }

  if (filas.length === 0) return { filas, errorGeneral: 'No se encontraron incapacidades en el archivo (debajo de la fila de encabezados).' };
  return { filas };
}

export async function construirPlantillaIncapacidades(): Promise<ArrayBuffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Espiral de Crecimiento 360°';

  const ws = wb.addWorksheet('Incapacidades');
  ws.columns = COLUMNAS_INCAPACIDADES.map((c) => ({ header: c.encabezado + (c.obligatoria ? ' *' : ''), key: c.clave, width: c.ancho }));
  const enc = ws.getRow(1);
  enc.font = { bold: true };
  enc.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F5E9' } };
  ws.views = [{ state: 'frozen', ySplit: 1 }];
  const colDe = (clave: Clave) => COLUMNAS_INCAPACIDADES.findIndex((c) => c.clave === clave) + 1;
  ws.getColumn(colDe('documento')).numFmt = '@';
  ws.getColumn(colDe('inicio')).numFmt = 'dd/mm/yyyy';
  ws.getColumn(colDe('fin')).numFmt = 'dd/mm/yyyy';

  const listas = wb.addWorksheet('Listas');
  listas.getCell('A1').value = 'Tipos de incapacidad';
  listas.getRow(1).font = { bold: true };
  TIPOS_INCAPACIDAD.forEach((t, i) => (listas.getCell(i + 2, 1).value = t.label));
  listas.columns = [{ width: 32 }];
  for (let r = 2; r <= MAX_INCAPACIDADES_IMPORTACION + 1; r++) {
    ws.getCell(r, colDe('tipo')).dataValidation = { type: 'list', allowBlank: true, formulae: [`Listas!$A$2:$A$${TIPOS_INCAPACIDAD.length + 1}`] };
  }

  const ins = wb.addWorksheet('Instrucciones');
  ins.columns = [{ width: 110 }];
  [
    'CÓMO USAR ESTA PLANTILLA',
    '',
    '1. Llena la hoja «Incapacidades»: una incapacidad o licencia por fila, desde la fila 2. No cambies ni borres los encabezados.',
    '2. Obligatorios (*): Documento del colaborador, Tipo de incapacidad, Fecha de inicio y Fecha de fin. La persona debe existir ya como colaborador.',
    '3. Documento: el número sin puntos. La columna «Nombre» es solo de referencia (si no hay documento se busca por el nombre completo exacto).',
    '4. Tipo: elige de la lista (Enfermedad general, Accidente laboral, Enfermedad laboral, Licencia de maternidad o paternidad, Otra). También se entienden EG, AT y EL.',
    '5. Fechas: día/mes/año, por ejemplo 15/03/2026. Los días se calculan solos (inicio y fin cuentan).',
    '6. Entidad emisora: la EPS (enfermedad general) o la ARL (accidente o enfermedad laboral) que la certifica. Es opcional.',
    `7. Máximo ${MAX_INCAPACIDADES_IMPORTACION} incapacidades por archivo. Si la misma incapacidad ya está registrada, esa fila se omite.`,
    '8. A propósito NO hay columna de diagnóstico: es un dato de salud sensible y la plataforma solo guarda la categoría general. El detalle va en el soporte (PDF) que se adjunta en la ficha de cada persona.',
    '9. Súbelo en Colaboradores → Importar incapacidades. Antes de guardar verás una revisión fila por fila.',
  ].forEach((t, i) => {
    ins.getCell(i + 1, 1).value = t;
    if (i === 0) ins.getCell(1, 1).font = { bold: true, size: 13 };
  });

  return (await wb.xlsx.writeBuffer()) as ArrayBuffer;
}
