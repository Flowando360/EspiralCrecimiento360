import { NextRequest, NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import { obtenerPlanesInforme } from '@/app/(dashboard)/informes/pdi/data';
import { formatearFecha } from '@/lib/utils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const colaboradorId = req.nextUrl.searchParams.get('colaboradorId') ?? undefined;
  const { perfil, planes } = await obtenerPlanesInforme(colaboradorId);

  if (!perfil) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Espiral de Crecimiento';
  workbook.created = new Date();

  const hoja = workbook.addWorksheet('PDI');
  hoja.columns = [
    { header: 'Colaborador', key: 'colaborador', width: 28 },
    { header: 'Origen', key: 'origen', width: 12 },
    { header: 'Brecha detectada', key: 'brecha', width: 40 },
    { header: 'Acción', key: 'accion', width: 40 },
    { header: 'Fecha compromiso', key: 'compromiso', width: 16 },
    { header: 'Fecha cumplimiento', key: 'cumplimiento', width: 16 },
    { header: 'Estado', key: 'estado', width: 14 },
    { header: 'Notas', key: 'notas', width: 40 },
  ];
  hoja.getRow(1).font = { bold: true };

  for (const p of planes) {
    hoja.addRow({
      colaborador: p.colaborador_nombre,
      origen: p.origen,
      brecha: p.brecha_detectada,
      accion: p.accion,
      compromiso: p.fecha_compromiso ? formatearFecha(p.fecha_compromiso) : '',
      cumplimiento: p.fecha_cumplimiento ? formatearFecha(p.fecha_cumplimiento) : '',
      estado: p.estado.replace(/_/g, ' '),
      notas: p.notas ?? '',
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="informe-pdi-${new Date().toISOString().slice(0, 10)}.xlsx"`,
    },
  });
}
