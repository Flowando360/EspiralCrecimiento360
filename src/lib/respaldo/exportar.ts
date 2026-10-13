import { RUTA_A_EMPRESA, ORDEN_PAGINACION, TABLAS_GLOBALES, type PasoRuta } from './rutas';

/**
 * Exporta a CSV todos los datos de una empresa, tabla por tabla, para
 * respaldo. Usa el cliente de servicio (service role) porque un respaldo debe
 * salir completo aunque alguna policy de RLS oculte filas a quien lo pide.
 * Por eso TODA lectura se filtra explícitamente por empresa: la autorización
 * de quién puede pedir el respaldo vive en la ruta /api/respaldo.
 */

const PAGINA = 1000;
const LOTE_IN = 200;

// El cliente se tipa como cualquiera porque los nombres de tabla llegan de
// rutas.ts en tiempo de ejecución; la forma de cada fila la dicta el esquema.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = any;
type Fila = Record<string, unknown>;

export interface ResumenTabla {
  tabla: string;
  filas: number;
}

export interface ResultadoRespaldo {
  empresaSlug: string;
  empresaNombre: string;
  archivos: Record<string, string>;
  resumen: ResumenTabla[];
}

/** Ruta de una tabla hasta la empresa; falla si la tabla no está en la configuración. */
function rutaDe(tabla: string): PasoRuta[] {
  const ruta = RUTA_A_EMPRESA[tabla];
  if (!ruta) throw new Error(`Tabla sin ruta de respaldo: ${tabla}`);
  return ruta;
}

/** Lee todas las filas de una consulta paginando de a PAGINA. */
async function leerTodo(
  db: Db,
  tabla: string,
  columnas: string,
  filtrar: (q: Db) => Db
): Promise<Fila[]> {
  const orden = ORDEN_PAGINACION[tabla];
  const filas: Fila[] = [];
  for (let desde = 0; ; desde += PAGINA) {
    const consulta = filtrar(db.from(tabla).select(columnas)).order(orden).range(desde, desde + PAGINA - 1);
    const { data, error } = await consulta;
    if (error) throw new Error(`Respaldo de ${tabla}: ${error.message}`);
    const lote = (data ?? []) as Fila[];
    filas.push(...lote);
    if (lote.length < PAGINA) break;
  }
  return filas;
}

/** Filas de `tabla` cuya columna `columna` está en `valores`, por lotes para no exceder el largo de la URL. */
async function filasPorValores(db: Db, tabla: string, columnas: string, columna: string, valores: string[]): Promise<Fila[]> {
  const filas: Fila[] = [];
  for (let i = 0; i < valores.length; i += LOTE_IN) {
    const lote = valores.slice(i, i + LOTE_IN);
    filas.push(...(await leerTodo(db, tabla, columnas, (q) => q.in(columna, lote))));
  }
  return filas;
}

/** Ids de una tabla que pertenecen a la empresa, siguiendo su ruta de claves foráneas. */
async function idsDe(db: Db, tabla: string, empresaId: string, memo: Map<string, string[]>): Promise<string[]> {
  const memoizado = memo.get(tabla);
  if (memoizado) return memoizado;

  const ruta = rutaDe(tabla);
  let ids: string[];
  if (ruta.length === 0) {
    const filas = await leerTodo(db, tabla, 'id', (q) => q.eq('empresa_id', empresaId));
    ids = filas.map((f) => f.id as string);
  } else {
    const [paso] = ruta;
    if (!paso) throw new Error(`Ruta vacía para ${tabla}`);
    const idsPadre = await idsDe(db, paso.padre, empresaId, memo);
    const filas = await filasPorValores(db, tabla, 'id', paso.fk, idsPadre);
    ids = filas.map((f) => f.id as string);
  }

  memo.set(tabla, ids);
  return ids;
}

/** Todas las filas de `tabla` que pertenecen a la empresa. */
async function filasDeEmpresa(db: Db, tabla: string, empresaId: string, memo: Map<string, string[]>): Promise<Fila[]> {
  const ruta = rutaDe(tabla);
  if (ruta.length === 0) return leerTodo(db, tabla, '*', (q) => q.eq('empresa_id', empresaId));
  const [paso] = ruta;
  if (!paso) throw new Error(`Ruta vacía para ${tabla}`);
  const idsPadre = await idsDe(db, paso.padre, empresaId, memo);
  return filasPorValores(db, tabla, '*', paso.fk, idsPadre);
}

/** Convierte filas a CSV. BOM al inicio para que Excel respete tildes y eñes. */
export function aCsv(filas: Fila[]): string {
  if (filas.length === 0) return '﻿';
  const columnas: string[] = [];
  const vistas = new Set<string>();
  for (const fila of filas) {
    for (const k of Object.keys(fila)) {
      if (!vistas.has(k)) {
        vistas.add(k);
        columnas.push(k);
      }
    }
  }
  const escapar = (valor: unknown): string => {
    if (valor === null || valor === undefined) return '';
    const texto = typeof valor === 'object' ? JSON.stringify(valor) : String(valor);
    return /[",\r\n]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
  };
  const lineas = [columnas.join(',')];
  for (const fila of filas) lineas.push(columnas.map((c) => escapar(fila[c])).join(','));
  return '﻿' + lineas.join('\r\n') + '\r\n';
}

/**
 * Genera el respaldo de una empresa. Con `incluirGlobales` (solo superadmin)
 * agrega las tablas que no pertenecen a ninguna empresa, para que el respaldo
 * completo de la plataforma no deje nada por fuera.
 */
export async function exportarRespaldoEmpresa(
  db: Db,
  empresaId: string,
  { incluirGlobales }: { incluirGlobales: boolean }
): Promise<ResultadoRespaldo> {
  const { data: empresaData, error: errorEmpresa } = await db
    .from('empresas')
    .select('*')
    .eq('id', empresaId)
    .maybeSingle();
  if (errorEmpresa) throw new Error(errorEmpresa.message);
  if (!empresaData) throw new Error('La empresa no existe');
  const empresa = empresaData as Fila;

  const archivos: Record<string, string> = {};
  const resumen: ResumenTabla[] = [];
  const agregar = (tabla: string, filas: Fila[]) => {
    archivos[`${tabla}.csv`] = aCsv(filas);
    resumen.push({ tabla, filas: filas.length });
  };

  agregar('empresas', [empresa]);

  const memo = new Map<string, string[]>();
  for (const tabla of Object.keys(RUTA_A_EMPRESA).sort()) {
    agregar(tabla, await filasDeEmpresa(db, tabla, empresaId, memo));
  }

  if (incluirGlobales) {
    for (const tabla of TABLAS_GLOBALES) {
      agregar(tabla, await leerTodo(db, tabla, '*', (q) => q));
    }
  }

  return {
    empresaSlug: String(empresa.slug ?? 'empresa'),
    empresaNombre: String(empresa.nombre ?? ''),
    archivos,
    resumen,
  };
}

/** Texto de LEEME.txt que acompaña cada respaldo. */
export function textoLeeme(resultado: ResultadoRespaldo, generadoEn: Date, incluirGlobales: boolean): string {
  const total = resultado.resumen.reduce((acumulado, r) => acumulado + r.filas, 0);
  const lineas = [
    `Respaldo de ${resultado.empresaNombre}`,
    `Generado: ${generadoEn.toISOString()}`,
    `Tablas: ${resultado.resumen.length} · Filas totales: ${total}`,
    '',
    'Cada archivo .csv es una tabla de la plataforma. Está en UTF-8 con BOM para que Excel abra las tildes bien.',
    'Las columnas con datos complejos (listas u objetos) están en formato JSON dentro de la celda.',
    '',
    'Conteo por tabla:',
    ...resultado.resumen.map((r) => `  ${r.tabla}: ${r.filas}`),
  ];
  if (incluirGlobales) {
    lineas.push('', 'Incluye tablas globales de la plataforma (no pertenecen a una sola empresa):', ...TABLAS_GLOBALES.map((t) => `  ${t}`));
  }
  return lineas.join('\n') + '\n';
}
