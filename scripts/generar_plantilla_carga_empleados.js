// Script de un solo uso para generar la plantilla de carga de empleados
// que se le envía a Flow, Nexus y Visión. No forma parte del aplicativo.
const ExcelJS = require('exceljs');
const path = require('path');

const CARGOS = [
  'Administrador',
  'Auxiliar Contable',
  'Auxiliar de Aseo y Cafetería',
  'Auxiliar de Inventarios',
  'Auxiliar Logístico',
  'Auxiliar TH y SST',
  'Desarrollo Organizacional y TH',
  'Gerente General',
  'Líder de Operaciones Internacionales',
  'Operario de Montacargas y Oficios de Producción',
  'Operario de Puente Grúa y Oficios de Producción',
  'Operario Logístico y de Inventarios',
  'Otro (indicar cuál en la columna de observaciones)',
];

const TIPOS_CONTRATO = ['Indefinido', 'Fijo', 'Obra o labor', 'Prestación de servicios', 'Aprendizaje', 'Externo'];
const ROLES_PLATAFORMA = ['RRHH (admin_th)', 'Líder de área', 'Colaborador', 'Gerencia'];
const SI_NO = ['Sí', 'No'];
const TIPOS_FORMACION = ['Formación académica', 'Certificación', 'Curso', 'Experiencia laboral'];

const HEADER_FILL = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF7C3AED' } };
const HEADER_FONT = { color: { argb: 'FFFFFFFF' }, bold: true };

function styleHeader(row) {
  row.eachCell((cell) => {
    cell.fill = HEADER_FILL;
    cell.font = HEADER_FONT;
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  });
  row.height = 30;
}

function addValidation(sheet, colLetter, firstRow, lastRow, list) {
  for (let r = firstRow; r <= lastRow; r++) {
    sheet.getCell(`${colLetter}${r}`).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: [`"${list.join(',')}"`],
      showErrorMessage: true,
      errorTitle: 'Valor no válido',
      error: 'Por favor selecciona un valor de la lista.',
    };
  }
}

async function main() {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'FlowAndo';
  wb.created = new Date();

  // ── Hoja 1: Instrucciones ────────────────────────────────────────────────
  const s0 = wb.addWorksheet('Instrucciones');
  s0.columns = [{ width: 100 }];
  const lines = [
    'Plantilla de carga de empleados — Flow, Nexus y Visión',
    '',
    'Esta plantilla tiene 3 hojas:',
    '1. Datos del empleado: una fila por cada uno de los 37 empleados.',
    '2. Formación y certificaciones: una fila por cada estudio, curso o certificación (un empleado puede tener varias filas).',
    '3. Datos de la empresa: se llena una sola vez, no por persona.',
    '',
    'Recomendaciones:',
    '- No borrar ni renombrar las columnas.',
    '- Usar el nombre completo tal cual aparece en la cédula.',
    '- En "Cargo" y "Nombre de su jefe/líder directo" usar exactamente el mismo texto para la misma persona en todas las filas donde aparezca (para poder cruzar la información).',
    '- Si un cargo no está en la lista desplegable, elegir "Otro" y escribir el nombre real en la columna de Observaciones.',
    '- La columna "Fecha de vencimiento" en la hoja de Formación es muy importante para certificaciones como trabajo en alturas, manejo de montacargas, manipulación de alimentos, etc. — con esa fecha el sistema genera alertas automáticas antes de que venzan.',
    '- El salario y el contrato firmado son datos sensibles: solo los verá Talento Humano y la propia persona dentro del sistema.',
    '',
    'Cargos ya registrados en el sistema (perfil de cargo completo ya cargado):',
    ...CARGOS.slice(0, -1).map((c) => `  • ${c}`),
  ];
  lines.forEach((text, i) => {
    const row = s0.getRow(i + 1);
    row.getCell(1).value = text;
    if (i === 0) {
      row.getCell(1).font = { bold: true, size: 14, color: { argb: 'FF7C3AED' } };
    } else if (text.endsWith(':') && !text.startsWith('  ')) {
      row.getCell(1).font = { bold: true };
    }
    row.getCell(1).alignment = { wrapText: true, vertical: 'top' };
  });

  // ── Hoja 2: Datos del empleado ───────────────────────────────────────────
  const s1 = wb.addWorksheet('Datos del empleado');
  const empleadoCols = [
    { header: 'N°', key: 'n', width: 6 },
    { header: 'Nombre completo', key: 'nombre', width: 28 },
    { header: 'N° de cédula', key: 'cedula', width: 16 },
    { header: 'Cargo', key: 'cargo', width: 30 },
    { header: 'Fecha de ingreso (dd/mm/aaaa)', key: 'fecha_ingreso', width: 20 },
    { header: 'Tipo de contrato', key: 'tipo_contrato', width: 20 },
    { header: 'Nombre de su jefe/líder directo', key: 'lider', width: 28 },
    { header: 'Correo electrónico', key: 'email', width: 26 },
    { header: 'Teléfono', key: 'telefono', width: 15 },
    { header: 'Rol en la plataforma', key: 'rol', width: 20 },
    { header: 'Salario', key: 'salario', width: 14 },
    { header: '¿Contrato firmado en PDF disponible?', key: 'contrato_pdf', width: 22 },
    { header: '¿Hoja de vida en PDF disponible?', key: 'hv_pdf', width: 20 },
    { header: 'Observaciones', key: 'obs', width: 30 },
  ];
  s1.columns = empleadoCols;
  styleHeader(s1.getRow(1));
  s1.views = [{ state: 'frozen', ySplit: 1 }];

  const TOTAL_EMPLEADOS = 37;
  for (let i = 1; i <= TOTAL_EMPLEADOS; i++) {
    s1.addRow({ n: i });
  }
  addValidation(s1, 'D', 2, TOTAL_EMPLEADOS + 1, CARGOS);
  addValidation(s1, 'F', 2, TOTAL_EMPLEADOS + 1, TIPOS_CONTRATO);
  addValidation(s1, 'J', 2, TOTAL_EMPLEADOS + 1, ROLES_PLATAFORMA);
  addValidation(s1, 'L', 2, TOTAL_EMPLEADOS + 1, SI_NO);
  addValidation(s1, 'M', 2, TOTAL_EMPLEADOS + 1, SI_NO);

  // ── Hoja 3: Formación y certificaciones ──────────────────────────────────
  const s2 = wb.addWorksheet('Formación y certificaciones');
  const formacionCols = [
    { header: 'Nombre completo del empleado', key: 'nombre', width: 28 },
    { header: 'Tipo', key: 'tipo', width: 20 },
    { header: 'Título / Nombre', key: 'titulo', width: 30 },
    { header: 'Institución', key: 'institucion', width: 26 },
    { header: 'Fecha de inicio (dd/mm/aaaa)', key: 'fecha_inicio', width: 18 },
    { header: 'Fecha de fin (dd/mm/aaaa)', key: 'fecha_fin', width: 18 },
    { header: 'Fecha de vencimiento (dd/mm/aaaa) — solo si aplica', key: 'fecha_vencimiento', width: 30 },
  ];
  s2.columns = formacionCols;
  styleHeader(s2.getRow(1));
  s2.views = [{ state: 'frozen', ySplit: 1 }];
  for (let i = 0; i < 60; i++) s2.addRow({});
  addValidation(s2, 'B', 2, 61, TIPOS_FORMACION);

  // ── Hoja 4: Datos de la empresa ──────────────────────────────────────────
  const s3 = wb.addWorksheet('Datos de la empresa');
  s3.columns = [
    { header: 'Campo', key: 'campo', width: 30 },
    { header: 'Valor', key: 'valor', width: 40 },
  ];
  styleHeader(s3.getRow(1));
  [
    'NIT',
    'Dirección',
    'Teléfono',
    'Ciudad',
    'Nombre de quien firma los certificados laborales',
    'Cargo de quien firma los certificados laborales',
  ].forEach((campo) => s3.addRow({ campo }));
  s3.getColumn('campo').font = { bold: true };

  const outPath = path.join(__dirname, '..', 'docs', 'Plantilla_Carga_Empleados_MarmolesyServicios.xlsx');
  await wb.xlsx.writeFile(outPath);
  console.log('Generado:', outPath);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
