import { NextRequest, NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import { obtenerInformeSST } from '@/app/(dashboard)/informes/sst/data';
import { formatearFecha } from '@/lib/utils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ETIQUETA_ESTADO: Record<string, string> = {
  vigente: 'Vigente',
  por_vencer: 'Por vencer',
  vencido: 'Vencido',
  sin_vencimiento: 'Sin vencimiento',
};

export async function GET(req: NextRequest) {
  const colaboradorId = req.nextUrl.searchParams.get('colaboradorId') ?? undefined;
  const { informe } = await obtenerInformeSST(colaboradorId);

  if (!informe) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Espiral de Crecimiento';
  workbook.created = new Date();

  const certs = workbook.addWorksheet('Certificaciones');
  certs.columns = [
    { header: 'Colaborador', key: 'colaborador', width: 26 },
    { header: 'Certificación', key: 'titulo', width: 32 },
    { header: 'Institución', key: 'institucion', width: 22 },
    { header: 'Vencimiento', key: 'vencimiento', width: 14 },
    { header: 'Verificado', key: 'verificado', width: 12 },
    { header: 'Estado', key: 'estado', width: 14 },
    { header: 'Evidencia', key: 'evidencia', width: 30 },
  ];
  certs.getRow(1).font = { bold: true };
  for (const c of informe.certificaciones) {
    certs.addRow({
      colaborador: c.colaborador_nombre,
      titulo: c.titulo,
      institucion: c.institucion ?? '',
      vencimiento: c.fecha_vencimiento ? formatearFecha(c.fecha_vencimiento) : '',
      verificado: c.verificado ? 'Sí' : 'No',
      estado: ETIQUETA_ESTADO[c.estado],
      evidencia: c.documento_url ?? '',
    });
  }

  const alertas = workbook.addWorksheet('Alertas SST');
  alertas.columns = [
    { header: 'Colaborador', key: 'colaborador', width: 26 },
    { header: 'Título', key: 'titulo', width: 36 },
    { header: 'Tipo', key: 'tipo', width: 20 },
    { header: 'Severidad', key: 'severidad', width: 14 },
    { header: 'Fecha objetivo', key: 'fecha', width: 16 },
    { header: 'Estado', key: 'estado', width: 14 },
  ];
  alertas.getRow(1).font = { bold: true };
  for (const a of informe.alertas) {
    alertas.addRow({
      colaborador: a.colaborador_nombre,
      titulo: a.titulo,
      tipo: a.tipo,
      severidad: a.severidad,
      fecha: formatearFecha(a.fecha_objetivo),
      estado: a.estado,
    });
  }

  const requisitos = workbook.addWorksheet('Exámenes y EPP');
  requisitos.columns = [
    { header: 'Colaborador', key: 'colaborador', width: 26 },
    { header: 'Cargo', key: 'cargo', width: 22 },
    { header: 'Tipo', key: 'tipo', width: 14 },
    { header: 'Requisito', key: 'requisito', width: 32 },
    { header: 'Estado', key: 'estado', width: 20 },
  ];
  requisitos.getRow(1).font = { bold: true };
  for (const r of informe.requisitosSinDato) {
    requisitos.addRow({
      colaborador: r.colaborador_nombre,
      cargo: r.cargo_nombre,
      tipo: r.tipo,
      requisito: r.detalle ? `${r.requisito} (${r.detalle})` : r.requisito,
      estado: 'Sin dato registrado',
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="informe-sst-${new Date().toISOString().slice(0, 10)}.xlsx"`,
    },
  });
}
