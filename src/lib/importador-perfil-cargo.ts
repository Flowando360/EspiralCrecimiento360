import ExcelJS from 'exceljs';

/**
 * Parser del formato FORSST 61 (perfil y funciones del cargo). Busca cada
 * sección por su título (no por número de fila fijo), porque las tablas de
 * largo variable (funciones, decisiones, factores de riesgo...) corren las
 * filas de abajo de un cargo a otro. Diseñado contra un único archivo real
 * (Auxiliar de Inventarios) — si un futuro archivo no encaja exactamente en
 * este formato, debería aparecer como advertencia en vez de fallar en
 * silencio o guardar datos incorrectos.
 */

export interface HabilidadParseada {
  tipo: 'funcional' | 'tecnica';
  nombre: string;
  nivelEsperado: 'alto' | 'medio' | 'bajo';
}

export interface FuncionParseada {
  proceso: string | null;
  funcion: string;
  tipoPhva: string | null;
  periodicidad: string | null;
  herramientas: string | null;
}

export interface DecisionParseada {
  descripcion: string;
  periodicidad: string | null;
}

export interface FactorRiesgoParseado {
  factor: string;
  categoria: string;
  efectosPosibles: string | null;
}

export interface ExamenMedicoParseado {
  momento: 'ingreso' | 'periodico' | 'retiro';
  nombreExamen: string;
}

export interface PerfilCargoParseado {
  advertencias: string[];
  nombre: string | null;
  procesoArea: string | null;
  objetivoCargo: string | null;
  codigoDocumento: string | null;
  versionDocumento: string | null;
  fechaDocumento: string | null;
  tipoArea: 'administrativa' | 'operativa' | null;
  generoRequerido: string | null;
  edadMinima: number | null;
  edadMaxima: number | null;
  salario: string | null;
  competenciasCardinales: string | null;
  formacionNivel: 'ninguno' | 'bachillerato' | 'tecnico' | 'tecnologo' | 'universitario' | 'empirico' | null;
  formacionTituloEspecifico: string | null;
  experienciaMinimaMeses: number | null;
  formacionMinimaInduccion: string | null;
  cargosALosQueReporta: string | null;
  cargosQueLeReportan: string | null;
  manejoDinero: string | null;
  tomaDecisionesOrganizacionales: string | null;
  cambiosDocumentales: string | null;
  responsabilidadBienesServicios: 'alto' | 'medio' | 'bajo' | null;
  responsabilidadInformacion: 'alto' | 'medio' | 'bajo' | null;
  responsabilidadRelacionesInterpersonales: 'alto' | 'medio' | 'bajo' | null;
  responsabilidadDireccionCoordinacion: 'alto' | 'medio' | 'bajo' | null;
  sgsstResponsabilidadesGenerales: string | null;
  sgsstResponsabilidadesCampo: string | null;
  sgsstRendicionCuentas: string | null;
  sgsstAutoridad: string | null;
  destrezaFisica: boolean;
  destrezaAuditiva: boolean;
  destrezaVisual: boolean;
  destrezaManual: boolean;
  destrezaCoordinacionMotora: boolean;
  recursosSeleccion: string | null;
  habilidades: HabilidadParseada[];
  funcionesPrincipales: FuncionParseada[];
  decisiones: DecisionParseada[];
  factoresRiesgo: FactorRiesgoParseado[];
  examenesMedicos: ExamenMedicoParseado[];
  epp: string[];
}

const CATEGORIA_RIESGO: Record<string, string> = {
  'QUÍMICO': 'quimico',
  'MECÁNICO': 'mecanico',
  'LOCATIVO': 'locativo',
  'ERGONÓMICO': 'ergonomico',
  'PSICOSOCIAL': 'psicosocial',
  'FÍSICO': 'fisico',
  'BIOLÓGICO': 'biologico',
};

const PERIODICIDAD_CODIGO: Record<string, string> = {
  O: 'Ocasional',
  D: 'Diaria',
  S: 'Semanal',
  Q: 'Quincenal',
  M: 'Mensual',
};

function norm(texto: string | null | undefined): string {
  return (texto ?? '').replace(/\s+/g, ' ').trim();
}

function esIgual(texto: string, esperado: string): boolean {
  return norm(texto).toUpperCase() === esperado.toUpperCase();
}

export async function parsearPerfilCargo(buffer: Buffer): Promise<PerfilCargoParseado> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as any);
  const ws = workbook.worksheets[0];
  if (!ws) throw new Error('El archivo no tiene ninguna hoja de cálculo.');

  const advertencias: string[] = [];

  // Matriz de texto por fila/columna (1-indexado como Excel). Se toma el
  // texto de la celda "maestra" de cada combinación de celdas para no
  // duplicar el mismo valor en cada fila que la celda combinada ocupa.
  const filas: string[][] = [];
  ws.eachRow({ includeEmpty: true }, (row, rowNumber) => {
    const cols: string[] = [];
    for (let c = 1; c <= Math.max(ws.columnCount, 7); c++) {
      const cell = row.getCell(c);
      const esEsclavaDeCombinada = (cell as any).isMerged && (cell as any).master !== cell;
      cols[c] = esEsclavaDeCombinada ? '' : norm(cell.text);
    }
    filas[rowNumber] = cols;
  });

  const totalFilas = filas.length;
  const col = (fila: number, c: number) => (filas[fila]?.[c] ?? '');

  function indiceSeccion(titulo: string, desde = 1): number {
    for (let f = desde; f < totalFilas; f++) {
      for (let c = 1; c <= 7; c++) {
        if (esIgual(col(f, c), titulo)) return f;
      }
    }
    return -1;
  }

  function extraerMarcada(celdas: string[]): string | null {
    for (const texto of celdas) {
      const m = texto.match(/^(.*?):\s*X$/i);
      if (m) return norm(m[1]);
    }
    return null;
  }

  /** Para celdas donde la etiqueta y el valor van juntos: "ETIQUETA: valor". */
  function valorConEtiqueta(fila: number, etiqueta: string): string | null {
    for (let c = 1; c <= 7; c++) {
      const texto = col(fila, c);
      if (texto.toUpperCase().startsWith(etiqueta.toUpperCase())) {
        return norm(texto.slice(etiqueta.length).replace(/^[:\s]+/, '')) || null;
      }
    }
    return null;
  }

  /** Para filas donde la etiqueta va sola en una celda y el valor en la siguiente. */
  function valorEnFilaEtiquetada(fila: number, etiqueta: string): string | null {
    if (!esIgual(col(fila, 1), etiqueta)) return null;
    for (let c = 2; c <= 7; c++) {
      if (col(fila, c)) return col(fila, c);
    }
    return null;
  }

  // ── Identificación del cargo ──────────────────────────────────────────
  const nombre = valorConEtiqueta(5, 'CARGO:') ?? valorConEtiqueta(6, 'CARGO:');
  const procesoArea = valorConEtiqueta(5, 'PROCESO:') ?? valorConEtiqueta(6, 'PROCESO:');
  if (!nombre) advertencias.push('No se pudo identificar el nombre del cargo (fila con "CARGO:").');

  const filaArea = [5, 6].find((f) => /Administrativa|Operativa/i.test(col(f, 7))) ?? 6;
  const textoArea = col(filaArea, 7);
  const tipoArea = /Operativa\s*\(\s*X\s*\)/i.test(textoArea)
    ? 'operativa'
    : /Administrativa\s*\(\s*X\s*\)/i.test(textoArea)
      ? 'administrativa'
      : null;

  const objetivoCargo = valorConEtiqueta(7, 'OBJETIVO DEL CARGO:');

  const generoRequerido = col(9, 2) || null;
  const edadTexto = col(9, 4);
  const edadMatch = edadTexto.match(/(\d+)\s*-\s*(\d+)/);
  const edadMinima = edadMatch ? parseInt(edadMatch[1]!, 10) : null;
  const edadMaxima = edadMatch ? parseInt(edadMatch[2]!, 10) : null;
  const salario = col(9, 7) || null;

  const filaCompCardinales = indiceSeccion('COMPETENCIAS CARDINALES:');
  const competenciasCardinales = filaCompCardinales > 0 ? col(filaCompCardinales, 2) || null : null;

  // ── Educación / formación académica ────────────────────────────────────
  const filaEducacion = indiceSeccion('EDUCACION');
  const filaCompLaborales = indiceSeccion('COMPETENCIAS LABORALES');
  let formacionNivel: PerfilCargoParseado['formacionNivel'] = null;
  let formacionTituloEspecifico: string | null = null;

  if (filaEducacion > 0) {
    const NIVEL_TEXTO: Record<string, PerfilCargoParseado['formacionNivel']> = {
      NINGUNO: 'ninguno',
      BACHILLERATO: 'bachillerato',
      'TÉCNICO': 'tecnico',
      TECNICO: 'tecnico',
      TECNOLOGO: 'tecnologo',
      'TECNÓLOGO': 'tecnologo',
      UNIVERSITARIO: 'universitario',
      'EMPÍRICO': 'empirico',
      EMPIRICO: 'empirico',
    };
    for (let f = filaEducacion; f <= filaEducacion + 5; f++) {
      const marcada = extraerMarcada([col(f, 3), col(f, 4), col(f, 5), col(f, 6), col(f, 7)]);
      const nivelDetectado = marcada ? NIVEL_TEXTO[marcada.toUpperCase().replace(/:$/, '')] : undefined;
      if (nivelDetectado) formacionNivel = nivelDetectado;
      const titulo = valorConEtiqueta(f, 'Titulo:') ?? valorConEtiqueta(f, 'Título:');
      if (titulo) formacionTituloEspecifico = titulo;
    }
    if (!formacionNivel) advertencias.push('No se pudo determinar el nivel de formación académica marcado.');
  }

  // ── Habilidades funcionales y técnicas ──────────────────────────────────
  const filaHabilidades = indiceSeccion('HABILIDADES', filaEducacion > 0 ? filaEducacion : 1);
  const filaDestrezas = indiceSeccion('DESTREZAS');
  const habilidades: HabilidadParseada[] = [];
  if (filaHabilidades > 0 && filaDestrezas > 0) {
    // La celda de categoría (FUINCIONALES/TÉCNICAS) está combinada verticalmente:
    // solo trae texto en la primera fila de cada bloque, hay que arrastrarla.
    let categoriaVigente = '';
    for (let f = filaHabilidades + 1; f < filaDestrezas; f++) {
      if (col(f, 2)) categoriaVigente = col(f, 2).toUpperCase();
      const nombreHabilidad = col(f, 3) || col(f, 4);
      if (!nombreHabilidad) continue;
      const nivel = col(f, 5) === 'X' ? 'alto' : col(f, 6) === 'X' ? 'medio' : col(f, 7) === 'X' ? 'bajo' : null;
      if (!nivel) continue;
      habilidades.push({
        tipo: categoriaVigente.includes('TÉCNIC') || categoriaVigente.includes('TECNIC') ? 'tecnica' : 'funcional',
        nombre: nombreHabilidad,
        nivelEsperado: nivel,
      });
    }
  } else {
    advertencias.push('No se encontró la sección de habilidades funcionales/técnicas.');
  }

  // ── Destrezas físicas ───────────────────────────────────────────────────
  let destrezaFisica = false;
  let destrezaAuditiva = false;
  let destrezaVisual = false;
  let destrezaManual = false;
  let destrezaCoordinacionMotora = false;
  if (filaDestrezas > 0) {
    for (let c = 1; c <= 7; c++) {
      const texto = col(filaDestrezas, c);
      if (/^F[ií]sica:\s*X$/i.test(texto)) destrezaFisica = true;
      if (/^Auditiva:\s*X$/i.test(texto)) destrezaAuditiva = true;
      if (/^Visual:\s*X$/i.test(texto)) destrezaVisual = true;
      if (/^Manual:\s*X$/i.test(texto)) destrezaManual = true;
      if (/^Coordinaci[oó]n Motora:\s*X$/i.test(texto)) destrezaCoordinacionMotora = true;
    }
  }

  // ── Experiencia y formación de inducción ────────────────────────────────
  const filaExperiencia = indiceSeccion('EXPERIENCIA');
  let experienciaMinimaMeses: number | null = null;
  if (filaExperiencia > 0) {
    const texto = col(filaExperiencia, 2);
    const mesesMatch = texto.match(/\((\d+)\)\s*mes/i);
    const anosMatch = texto.match(/\((\d+)\)\s*a[ñn]o/i);
    if (mesesMatch) experienciaMinimaMeses = parseInt(mesesMatch[1]!, 10);
    else if (anosMatch) experienciaMinimaMeses = parseInt(anosMatch[1]!, 10) * 12;
    else advertencias.push('No se pudo convertir la experiencia mínima a un número de meses; revisar manualmente.');
  }

  const filaFormacionInduccion = indiceSeccion('FORMACIÓN', filaExperiencia > 0 ? filaExperiencia : 1);
  const filaNivelesAutoridad = indiceSeccion('NIVELES DE AUTORIDAD');
  let formacionMinimaInduccion: string | null = null;
  if (filaFormacionInduccion > 0 && filaNivelesAutoridad > 0) {
    const partes: string[] = [];
    for (let f = filaFormacionInduccion; f < filaNivelesAutoridad; f++) {
      const texto = col(f, 2);
      if (texto) partes.push(texto);
    }
    formacionMinimaInduccion = partes.join(' ') || null;
  }

  // ── Niveles de autoridad (etiqueta en col1, valor en la celda siguiente) ──
  const cargosALosQueReporta = valorEnFilaEtiquetada(filaNivelesAutoridad + 1, 'CARGOS A LOS QUE REPORTA');
  const cargosQueLeReportan = valorEnFilaEtiquetada(filaNivelesAutoridad + 2, 'CARGOS QUE LE REPORTAN');
  const manejoDinero = valorEnFilaEtiquetada(filaNivelesAutoridad + 3, 'MANEJO DE DINERO');
  const tomaDecisionesOrganizacionales = valorEnFilaEtiquetada(filaNivelesAutoridad + 4, 'TOMA DE DESICIONES ORGANIZACIONALES');
  const cambiosDocumentales = valorEnFilaEtiquetada(filaNivelesAutoridad + 5, 'CAMBIOS DOCUMENTALES');

  // ── Funciones principales ────────────────────────────────────────────────
  const filaFunciones = indiceSeccion('FUNCIONES PRINCIPALES');
  const filaResponsabilidades = indiceSeccion('RESPONSABILIDADES', filaFunciones > 0 ? filaFunciones : 1);
  const funcionesPrincipales: FuncionParseada[] = [];
  if (filaFunciones > 0 && filaResponsabilidades > 0) {
    for (let f = filaFunciones + 2; f < filaResponsabilidades; f++) {
      const funcion = col(f, 1) || col(f, 2) || col(f, 3);
      if (!funcion) continue;
      const codigoPeriodicidad = col(f, 5).toUpperCase();
      funcionesPrincipales.push({
        proceso: procesoArea,
        funcion,
        tipoPhva: /^[PHVA]$/i.test(col(f, 4)) ? col(f, 4).toUpperCase() : null,
        periodicidad: PERIODICIDAD_CODIGO[codigoPeriodicidad] ?? null,
        herramientas: col(f, 6) || col(f, 7) || null,
      });
    }
    if (funcionesPrincipales.length === 0) advertencias.push('No se encontraron filas de funciones principales.');
  } else {
    advertencias.push('No se encontró la sección de funciones principales.');
  }

  // ── Responsabilidades (bienes/información/relaciones/dirección) ─────────
  let responsabilidadBienesServicios: PerfilCargoParseado['responsabilidadBienesServicios'] = null;
  let responsabilidadInformacion: PerfilCargoParseado['responsabilidadInformacion'] = null;
  let responsabilidadRelacionesInterpersonales: PerfilCargoParseado['responsabilidadRelacionesInterpersonales'] = null;
  let responsabilidadDireccionCoordinacion: PerfilCargoParseado['responsabilidadDireccionCoordinacion'] = null;
  const filaDecisiones = indiceSeccion('DESICIONES QUE PUEDE TOMAR EL CARGO', filaResponsabilidades > 0 ? filaResponsabilidades : 1);
  if (filaResponsabilidades > 0 && filaDecisiones > 0) {
    for (let f = filaResponsabilidades + 1; f < filaDecisiones; f++) {
      const etiqueta = col(f, 1).toLowerCase();
      const nivel = col(f, 5) === 'X' ? 'alto' : col(f, 6) === 'X' ? 'medio' : col(f, 7) === 'X' ? 'bajo' : null;
      if (!nivel) continue;
      if (etiqueta.includes('bienes')) responsabilidadBienesServicios = nivel;
      else if (etiqueta.includes('información') || etiqueta.includes('informacion')) responsabilidadInformacion = nivel;
      else if (etiqueta.includes('relaciones')) responsabilidadRelacionesInterpersonales = nivel;
      else if (etiqueta.includes('dirección') || etiqueta.includes('direccion')) responsabilidadDireccionCoordinacion = nivel;
    }
  }

  // ── Decisiones que puede tomar el cargo ──────────────────────────────────
  const filaSgsst = indiceSeccion('RESPONSABILIDADES FRENTE AL SG-SST', filaDecisiones > 0 ? filaDecisiones : 1);
  const decisiones: DecisionParseada[] = [];
  if (filaDecisiones > 0 && filaSgsst > 0) {
    // +2: la fila filaDecisiones+1 es el encabezado de columnas ("DESCRIPCIÓN
    // DE LA DECISIÓN" / "PERIODICIDAD"), no una decisión real.
    for (let f = filaDecisiones + 2; f < filaSgsst; f++) {
      const descripcion = col(f, 1) || col(f, 2) || col(f, 3) || col(f, 4);
      if (!descripcion) continue;
      decisiones.push({ descripcion, periodicidad: col(f, 5) || col(f, 6) || col(f, 7) || null });
    }
  }

  // ── SG-SST ────────────────────────────────────────────────────────────────
  let sgsstResponsabilidadesGenerales: string | null = null;
  let sgsstResponsabilidadesCampo: string | null = null;
  let sgsstRendicionCuentas: string | null = null;
  let sgsstAutoridad: string | null = null;
  const filaFactoresRiesgo = indiceSeccion('FACTORES DE RIESGO', filaSgsst > 0 ? filaSgsst : 1);
  if (filaSgsst > 0) {
    const filaCampo = indiceSeccion('CAMPO', filaSgsst);
    const filaRendicion = indiceSeccion('RENDICION DE CUENTAS FRENTE AL COMPONENTE DE SG - SST', filaSgsst);
    if (filaCampo > 0) {
      sgsstResponsabilidadesGenerales = col(filaSgsst + 1, 1) || null;
      const partesCampo: string[] = [];
      const finCampo = filaRendicion > 0 ? filaRendicion : filaFactoresRiesgo;
      for (let f = filaCampo + 1; f < finCampo; f++) {
        if (col(f, 1)) partesCampo.push(col(f, 1));
      }
      sgsstResponsabilidadesCampo = partesCampo.join('\n') || null;
    }
    if (filaRendicion > 0) {
      sgsstRendicionCuentas = col(filaRendicion + 1, 1) || null;
      sgsstAutoridad = col(filaRendicion + 1, 4) || null;
    }
  }

  // ── Factores de riesgo ────────────────────────────────────────────────────
  const filaExamenes = indiceSeccion('EXÁMENES MÉDICOS OCUPACIONALES', filaFactoresRiesgo > 0 ? filaFactoresRiesgo : 1);
  const factoresRiesgo: FactorRiesgoParseado[] = [];
  if (filaFactoresRiesgo > 0 && filaExamenes > 0) {
    for (let f = filaFactoresRiesgo + 1; f < filaExamenes; f++) {
      const factor = col(f, 1);
      if (!factor) continue;
      const prefijo = factor.split(':')[0]?.trim().toUpperCase() ?? '';
      const categoria =
        CATEGORIA_RIESGO[prefijo] ??
        (prefijo.includes('TRÁNSITO') || prefijo.includes('TRANSITO')
          ? 'seguridad_transito'
          : prefijo.includes('ALMACENAMIENTO')
            ? 'seguridad_almacenamiento'
            : 'otro');
      factoresRiesgo.push({ factor, categoria, efectosPosibles: col(f, 4) || null });
    }
  }

  // ── Exámenes médicos ocupacionales ───────────────────────────────────────
  const filaEpp = indiceSeccion('ELEMENTOS DE PROTECCIÓN PERSONAL Y DOTACIÓN', filaExamenes > 0 ? filaExamenes : 1);
  const examenesMedicos: ExamenMedicoParseado[] = [];
  if (filaExamenes > 0 && filaEpp > 0) {
    const MOMENTOS: { titulo: string; momento: ExamenMedicoParseado['momento'] }[] = [
      { titulo: 'EXÁMENES DE INGRESO', momento: 'ingreso' },
      { titulo: 'EXÁMENES PERIÓDICOS', momento: 'periodico' },
      { titulo: 'EXÁMENES DE RETIRO', momento: 'retiro' },
    ];
    for (let i = 0; i < MOMENTOS.length; i++) {
      const actual = MOMENTOS[i]!;
      const inicio = indiceSeccion(actual.titulo, filaExamenes);
      if (inicio < 0) continue;
      const siguiente = MOMENTOS[i + 1];
      const fin = siguiente ? indiceSeccion(siguiente.titulo, filaExamenes) : filaEpp;
      for (let f = inicio + 1; f < (fin > 0 ? fin : filaEpp); f++) {
        const nombreExamen = col(f, 1);
        if (nombreExamen) examenesMedicos.push({ momento: actual.momento, nombreExamen });
      }
    }
  }

  // ── EPP ───────────────────────────────────────────────────────────────────
  const filaRecursos = indiceSeccion('RECURSOS UTILIZADOS EN LA SELECCIÓN', filaEpp > 0 ? filaEpp : 1);
  const epp: string[] = [];
  if (filaEpp > 0 && filaRecursos > 0) {
    for (let f = filaEpp + 1; f < filaRecursos; f++) {
      const item = col(f, 1);
      if (item) epp.push(item);
    }
  }

  // ── Recursos utilizados en la selección ──────────────────────────────────
  let recursosSeleccion: string | null = null;
  if (filaRecursos > 0) {
    const marcados: string[] = [];
    for (let f = filaRecursos + 1; f <= filaRecursos + 2; f++) {
      for (let c = 1; c <= 7; c++) {
        const m = extraerMarcada([col(f, c)]);
        if (m) marcados.push(m.replace(/:$/, ''));
      }
    }
    recursosSeleccion = marcados.length > 0 ? marcados.join(', ') : null;
  }

  const filaCodigo = indiceSeccion('CÓDIGO', 1) > 0 ? 1 : -1;
  const codigoDocumento = filaCodigo > 0 ? col(1, 7) || null : null;
  const versionDocumento = col(2, 7) || null;
  const fechaRaw = ws.getRow(3).getCell(7).value;
  const fechaDocumento = fechaRaw instanceof Date ? fechaRaw.toISOString().slice(0, 10) : null;

  return {
    advertencias,
    nombre,
    procesoArea,
    objetivoCargo,
    codigoDocumento,
    versionDocumento,
    fechaDocumento,
    tipoArea,
    generoRequerido,
    edadMinima,
    edadMaxima,
    salario,
    competenciasCardinales,
    formacionNivel,
    formacionTituloEspecifico,
    experienciaMinimaMeses,
    formacionMinimaInduccion,
    cargosALosQueReporta,
    cargosQueLeReportan,
    manejoDinero,
    tomaDecisionesOrganizacionales,
    cambiosDocumentales,
    responsabilidadBienesServicios,
    responsabilidadInformacion,
    responsabilidadRelacionesInterpersonales,
    responsabilidadDireccionCoordinacion,
    sgsstResponsabilidadesGenerales,
    sgsstResponsabilidadesCampo,
    sgsstRendicionCuentas,
    sgsstAutoridad,
    destrezaFisica,
    destrezaAuditiva,
    destrezaVisual,
    destrezaManual,
    destrezaCoordinacionMotora,
    recursosSeleccion,
    habilidades,
    funcionesPrincipales,
    decisiones,
    factoresRiesgo,
    examenesMedicos,
    epp,
  };
}
