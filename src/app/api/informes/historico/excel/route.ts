import { NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import { obtenerInformeHistorico } from '@/app/(dashboard)/informes/historico/data';
import { formatearFecha } from '@/lib/utils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function tendencia(actual: number | null, anterior: number | null | undefined): string {
  if (actual == null || anterior == null) return '';
  const diferencia = Math.round((actual - anterior) * 100) / 100;
  if (diferencia > 0) return `+${diferencia}`;
  if (diferencia < 0) return `${diferencia}`;
  return 'sin cambio';
}

export async function GET() {
  const { perfil, filas } = await obtenerInformeHistorico();

  if (!perfil) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Espiral de Crecimiento';
  workbook.created = new Date();

  const hoja = workbook.addWorksheet('Histórico');
  hoja.columns = [
    { header: 'Ciclo', key: 'ciclo', width: 26 },
    { header: 'Apertura', key: 'apertura', width: 14 },
    { header: 'Personas evaluadas', key: 'personas', width: 18 },
    { header: 'Hacer (promedio)', key: 'hacer', width: 16 },
    { header: 'Hacer vs. anterior', key: 'hacer_tendencia', width: 16 },
    { header: 'Deber (promedio)', key: 'deber', width: 16 },
    { header: 'Deber vs. anterior', key: 'deber_tendencia', width: 16 },
  ];
  hoja.getRow(1).font = { bold: true };
  filas.forEach((f, i) => {
    hoja.addRow({
      ciclo: f.cicloNombre,
      apertura: formatearFecha(f.fechaApertura),
      personas: f.personas,
      hacer: f.promedioHacer ?? '',
      hacer_tendencia: tendencia(f.promedioHacer, filas[i - 1]?.promedioHacer),
      deber: f.promedioDeber ?? '',
      deber_tendencia: tendencia(f.promedioDeber, filas[i - 1]?.promedioDeber),
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="informe-historico-${new Date().toISOString().slice(0, 10)}.xlsx"`,
    },
  });
}
