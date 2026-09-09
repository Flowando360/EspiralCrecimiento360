import { NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import { obtenerInformeFormacion } from '@/app/(dashboard)/informes/formacion/data';
import { formatearFecha } from '@/lib/utils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CATEGORIA_LABEL: Record<string, string> = {
  induccion_sst: 'Inducción SST',
  alturas: 'Alturas',
  manejo_cargas: 'Manejo de cargas',
  epp: 'EPP',
  protocolos_emergencia: 'Protocolos de emergencia',
  cultura: 'Cultura',
  tecnico: 'Técnico',
  otro: 'Otro',
};

export async function GET() {
  const { perfil, filas } = await obtenerInformeFormacion();

  if (!perfil) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Espiral de Crecimiento';
  workbook.created = new Date();

  const hoja = workbook.addWorksheet('Formación');
  hoja.columns = [
    { header: 'Colaborador', key: 'colaborador', width: 26 },
    { header: 'Curso', key: 'curso', width: 32 },
    { header: 'Categoría', key: 'categoria', width: 20 },
    { header: 'Avance', key: 'avance', width: 10 },
    { header: 'Fecha límite', key: 'fecha_limite', width: 14 },
    { header: 'Completado en', key: 'completado_en', width: 16 },
    { header: 'Estado', key: 'estado', width: 14 },
  ];
  hoja.getRow(1).font = { bold: true };
  for (const f of filas) {
    hoja.addRow({
      colaborador: f.colaborador_nombre,
      curso: f.curso_titulo,
      categoria: CATEGORIA_LABEL[f.categoria] ?? f.categoria,
      avance: `${f.progreso_pct}%`,
      fecha_limite: f.fecha_limite ? formatearFecha(f.fecha_limite) : '',
      completado_en: f.completado_en ? formatearFecha(f.completado_en) : '',
      estado: f.estado.replace(/_/g, ' '),
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="informe-formacion-${new Date().toISOString().slice(0, 10)}.xlsx"`,
    },
  });
}
