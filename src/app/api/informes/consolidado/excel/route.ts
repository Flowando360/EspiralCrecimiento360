import { NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import { obtenerInformeConsolidado } from '@/app/(dashboard)/informes/consolidado/data';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const { perfil, informe } = await obtenerInformeConsolidado();

  if (!perfil || !informe) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Espiral de Crecimiento';
  workbook.created = new Date();

  const indicadores = workbook.addWorksheet('Indicadores');
  indicadores.columns = [
    { header: 'Indicador', key: 'indicador', width: 30 },
    { header: 'Valor', key: 'valor', width: 16 },
  ];
  indicadores.getRow(1).font = { bold: true };
  indicadores.addRows([
    { indicador: 'Colaboradores activos', valor: informe.totalActivos },
    { indicador: 'En proceso de salida', valor: informe.enProcesoSalida },
    { indicador: 'Alineación talento-rol', valor: informe.pctAlineacionTalentoRol != null ? `${informe.pctAlineacionTalentoRol}%` : '' },
    { indicador: 'Alertas críticas abiertas', valor: informe.alertasCriticas },
    { indicador: 'Alertas abiertas (total)', valor: informe.alertasAbiertas },
    { indicador: 'Índice de Hacer (promedio)', valor: informe.promedioHacerEmpresa ?? '' },
    { indicador: 'Índice de Deber (promedio)', valor: informe.promedioDeberEmpresa ?? '' },
    { indicador: 'Cumplimiento de Saber', valor: informe.promedioSaberEmpresa != null ? `${informe.promedioSaberEmpresa}%` : '' },
  ]);

  const porArea = workbook.addWorksheet('Por área');
  porArea.columns = [
    { header: 'Área', key: 'area', width: 28 },
    { header: 'Personas', key: 'personas', width: 12 },
    { header: 'Hacer (promedio)', key: 'hacer', width: 16 },
    { header: 'Deber (promedio)', key: 'deber', width: 16 },
  ];
  porArea.getRow(1).font = { bold: true };
  for (const a of informe.porArea) {
    porArea.addRow({
      area: a.area,
      personas: a.tamano,
      hacer: a.promedioHacer ?? '',
      deber: a.promedioDeber ?? '',
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="informe-consolidado-${new Date().toISOString().slice(0, 10)}.xlsx"`,
    },
  });
}
