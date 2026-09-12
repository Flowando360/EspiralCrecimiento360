import { NextRequest, NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import { obtenerInforme360 } from '@/app/(dashboard)/informes/360/data';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ETIQUETA_EVALUADOR: Record<string, string> = {
  autoevaluacion: 'Autoevaluación',
  lider: 'Líder',
  par: 'Pares',
  colaborador_a_cargo: 'Colaboradores a cargo',
};

export async function GET(req: NextRequest) {
  const colaboradorId = req.nextUrl.searchParams.get('colaboradorId');
  if (!colaboradorId) {
    return NextResponse.json({ error: 'colaboradorId es requerido' }, { status: 400 });
  }

  const { informe } = await obtenerInforme360(colaboradorId);
  if (!informe) {
    return NextResponse.json({ error: 'No autorizado o no encontrado' }, { status: 403 });
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Círculo de Crecimiento';
  workbook.created = new Date();

  const resumen = workbook.addWorksheet('Resumen');
  resumen.columns = [
    { header: 'Dimensión', key: 'dimension', width: 16 },
    { header: 'Resultado', key: 'resultado', width: 24 },
  ];
  resumen.getRow(1).font = { bold: true };
  resumen.addRow({
    dimension: 'Ser',
    resultado:
      informe.ser?.promedio_ser != null
        ? `${informe.ser.promedio_ser} / 5 (${informe.ser.total_aspectos_calificados} aspectos)`
        : informe.ser
          ? 'Guía del Flow completada, cargando puntajes'
          : 'Pendiente',
  });
  resumen.addRow({
    dimension: 'Saber',
    resultado: informe.saber?.porcentaje_cumplimiento != null ? `${informe.saber.porcentaje_cumplimiento}%` : '—',
  });
  resumen.addRow({
    dimension: 'Hacer',
    resultado: `${informe.resultado?.indice_hacer ?? '—'} (${informe.resultado?.semaforo_hacer ?? 'sin datos'})`,
  });
  resumen.addRow({
    dimension: 'Deber',
    resultado: `${informe.resultado?.indice_deber ?? '—'} (${informe.resultado?.semaforo_deber ?? 'sin datos'})`,
  });

  const detalle = workbook.addWorksheet('Detalle por acompañante');
  detalle.columns = [
    { header: 'Dimensión', key: 'dimension', width: 14 },
    { header: 'Tipo de acompañante', key: 'evaluador', width: 24 },
    { header: 'Promedio', key: 'promedio', width: 12 },
    { header: 'Respuestas', key: 'respuestas', width: 12 },
  ];
  detalle.getRow(1).font = { bold: true };
  for (const d of informe.detallePorEvaluador) {
    detalle.addRow({
      dimension: d.dimension === 'hacer' ? 'Hacer' : 'Deber',
      evaluador: ETIQUETA_EVALUADOR[d.tipo_evaluador] ?? d.tipo_evaluador,
      promedio: d.promedio,
      respuestas: d.total_respuestas,
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="informe-360-${informe.colaborador.nombre_completo.replace(/\s+/g, '-')}.xlsx"`,
    },
  });
}
