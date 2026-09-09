import { NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import { obtenerInformeCultura } from '@/app/(dashboard)/informes/cultura/data';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const { perfil, filas } = await obtenerInformeCultura();

  if (!perfil) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Espiral de Crecimiento';
  workbook.created = new Date();

  const hoja = workbook.addWorksheet('Cultura y Engagement');
  hoja.columns = [
    { header: 'Colaborador', key: 'colaborador', width: 26 },
    { header: 'Reconocimientos', key: 'reconocimientos', width: 18 },
    { header: 'Puntos', key: 'puntos', width: 12 },
    { header: 'Reacciones dadas', key: 'reacciones', width: 18 },
    { header: 'Formación de cultura', key: 'formacion', width: 20 },
  ];
  hoja.getRow(1).font = { bold: true };
  for (const f of filas) {
    hoja.addRow({
      colaborador: f.colaborador_nombre,
      reconocimientos: f.reconocimientos_recibidos,
      puntos: f.puntos_totales,
      reacciones: f.reacciones_dadas,
      formacion: f.cursos_cultura_completados,
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="informe-cultura-${new Date().toISOString().slice(0, 10)}.xlsx"`,
    },
  });
}
