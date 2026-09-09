import { NextRequest, NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import { obtenerInformeBrechas, type Agrupacion } from '@/app/(dashboard)/informes/brechas/data';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const agrupacion: Agrupacion = req.nextUrl.searchParams.get('agrupacion') === 'area' ? 'area' : 'equipo';
  const { perfil, filas } = await obtenerInformeBrechas(agrupacion);

  if (!perfil) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Espiral de Crecimiento';
  workbook.created = new Date();

  const hoja = workbook.addWorksheet('Brechas');
  hoja.columns = [
    { header: agrupacion === 'equipo' ? 'Equipo (líder)' : 'Área', key: 'grupo', width: 28 },
    { header: 'Personas', key: 'tamano', width: 10 },
    { header: 'Ser (1-5)', key: 'ser', width: 14 },
    { header: 'Saber (%)', key: 'saber', width: 14 },
    { header: 'Hacer (1-5)', key: 'hacer', width: 14 },
    { header: 'Deber (1-5)', key: 'deber', width: 14 },
  ];
  hoja.getRow(1).font = { bold: true };

  for (const f of filas) {
    hoja.addRow({
      grupo: f.grupo,
      tamano: f.tamano,
      ser: f.ser.promedio ?? 'Sin dato',
      saber: f.saber.promedio ?? 'Sin dato',
      hacer: f.hacer.promedio ?? 'Sin dato',
      deber: f.deber.promedio ?? 'Sin dato',
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="informe-brechas-${agrupacion}-${new Date().toISOString().slice(0, 10)}.xlsx"`,
    },
  });
}
