import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import ExcelJS from 'exceljs';
import JSZip from 'jszip';
import { createAdminClient } from '@/lib/supabase/server';
import { obtenerEvidenciaAuditoria, type TipoPaqueteAuditoria } from '@/app/(dashboard)/informes/evidencia-auditoria/data';
import { EvidenciaAuditoriaDocument } from '@/app/(dashboard)/informes/evidencia-auditoria/pdf-document';
import { formatearFecha } from '@/lib/utils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const TIPOS_VALIDOS: TipoPaqueteAuditoria[] = ['todos', 'sst', 'iso_9001', 'sarlaft_sagrilaft', 'ptee'];

async function construirExcel(evidencia: Awaited<ReturnType<typeof obtenerEvidenciaAuditoria>>['evidencia']) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Espiral de Crecimiento';
  workbook.created = new Date();

  if (evidencia!.certificacionesSST.length > 0) {
    const hoja = workbook.addWorksheet('Certificaciones SST');
    hoja.columns = [
      { header: 'Colaborador', key: 'colaborador', width: 26 },
      { header: 'Certificación', key: 'titulo', width: 32 },
      { header: 'Vencimiento', key: 'vencimiento', width: 14 },
      { header: 'Verificado', key: 'verificado', width: 12 },
      { header: 'Link evidencia', key: 'link', width: 40 },
    ];
    hoja.getRow(1).font = { bold: true };
    for (const c of evidencia!.certificacionesSST) {
      hoja.addRow({
        colaborador: c.colaborador_nombre,
        titulo: c.titulo,
        vencimiento: c.fecha_vencimiento ? formatearFecha(c.fecha_vencimiento) : '',
        verificado: c.verificado ? 'Sí' : 'No',
        link: c.documento_url ?? '',
      });
    }
  }

  if (evidencia!.checklist.length > 0) {
    const hoja = workbook.addWorksheet('Checklist cumplimiento');
    hoja.columns = [
      { header: 'Marco normativo', key: 'marco', width: 20 },
      { header: 'Ítem', key: 'item', width: 40 },
      { header: 'Estado', key: 'estado', width: 16 },
      { header: 'Evidencia', key: 'evidencia', width: 20 },
    ];
    hoja.getRow(1).font = { bold: true };
    for (const c of evidencia!.checklist) {
      hoja.addRow({ marco: c.marco_normativo, item: c.item, estado: c.estado, evidencia: c.evidencia_url ? 'Adjunta en el ZIP' : 'Sin evidencia' });
    }
  }

  if (evidencia!.riesgos.length > 0) {
    const hoja = workbook.addWorksheet('Matriz de riesgos');
    hoja.columns = [
      { header: 'Marco normativo', key: 'marco', width: 20 },
      { header: 'Riesgo', key: 'riesgo', width: 40 },
      { header: 'Impacto', key: 'impacto', width: 12 },
      { header: 'Control', key: 'control', width: 32 },
    ];
    hoja.getRow(1).font = { bold: true };
    for (const r of evidencia!.riesgos) {
      hoja.addRow({ marco: r.marco_normativo, riesgo: r.riesgo, impacto: r.impacto ?? '', control: r.control ?? '' });
    }
  }

  if (evidencia!.procesos.length > 0) {
    const hoja = workbook.addWorksheet('Procesos documentados');
    hoja.columns = [
      { header: 'Área / proceso', key: 'area', width: 24 },
      { header: 'Nombre', key: 'nombre', width: 32 },
      { header: 'Versión', key: 'version', width: 12 },
    ];
    hoja.getRow(1).font = { bold: true };
    for (const p of evidencia!.procesos) {
      hoja.addRow({ area: p.area_proceso, nombre: p.nombre, version: p.version ?? '' });
    }
  }

  return workbook.xlsx.writeBuffer();
}

export async function GET(req: NextRequest) {
  const tipoParam = req.nextUrl.searchParams.get('tipo') ?? 'todos';
  const tipo = (TIPOS_VALIDOS.includes(tipoParam as TipoPaqueteAuditoria) ? tipoParam : 'todos') as TipoPaqueteAuditoria;

  const { perfil, evidencia } = await obtenerEvidenciaAuditoria(tipo);
  if (!perfil || !evidencia) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const zip = new JSZip();

  const pdfBuffer = await renderToBuffer(<EvidenciaAuditoriaDocument evidencia={evidencia} tipo={tipo} />);
  zip.file('resumen.pdf', pdfBuffer);

  const excelBuffer = await construirExcel(evidencia);
  zip.file('detalle.xlsx', excelBuffer);

  // Documentos reales de evidencia adjuntos al checklist (bucket propio
  // evidencia-procesos) — las certificaciones SST solo quedan como link de
  // referencia en el PDF/Excel, porque su documento vive en una URL externa,
  // no en storage de este proyecto.
  const admin = createAdminClient();
  const carpetaEvidencia = zip.folder('evidencia-checklist');
  let contadorArchivo = 0;
  for (const item of evidencia.checklist) {
    if (!item.evidencia_url) continue;
    const { data, error } = await admin.storage.from('evidencia-procesos').download(item.evidencia_url);
    if (error || !data) continue;
    contadorArchivo++;
    const nombreArchivo = item.evidencia_url.split('/').pop() || `evidencia-${contadorArchivo}`;
    const buffer = Buffer.from(await data.arrayBuffer());
    carpetaEvidencia?.file(`${contadorArchivo}-${nombreArchivo}`, buffer);
  }

  const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });

  return new NextResponse(new Uint8Array(zipBuffer), {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="evidencia-auditoria-${tipo}-${new Date().toISOString().slice(0, 10)}.zip"`,
    },
  });
}
