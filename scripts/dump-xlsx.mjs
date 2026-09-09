import ExcelJS from 'exceljs';

const archivo = process.argv[2];
if (!archivo) {
  console.error('Uso: node scripts/dump-xlsx.mjs "ruta/archivo.xlsx"');
  process.exit(1);
}

const workbook = new ExcelJS.Workbook();
await workbook.xlsx.readFile(archivo);

for (const hoja of workbook.worksheets) {
  console.log(`\n=== HOJA: ${hoja.name} ===`);
  hoja.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    const valores = [];
    row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
      let v = cell.value;
      if (v && typeof v === 'object' && 'result' in v) v = v.result;
      if (v && typeof v === 'object' && 'text' in v) v = v.text;
      if (v && typeof v === 'object' && 'richText' in v) v = v.richText.map((r) => r.text).join('');
      if (v !== null && v !== undefined && String(v).trim() !== '') {
        valores.push(`${colNumber}:${String(v).trim()}`);
      }
    });
    if (valores.length > 0) console.log(`F${rowNumber}: ${valores.join(' | ')}`);
  });
}
