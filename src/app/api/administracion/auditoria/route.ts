import { NextRequest, NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { puedeAdministrar } from '@/lib/permisos/administracion';
import { obtenerAuditoria, leerFiltrosAuditoria, MODULOS_AUDITORIA } from '@/app/(dashboard)/administracion/auditoria/data';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Exporta el registro de auditoría (con los filtros activos) a Excel, hasta 5.000 cambios. */
export async function GET(req: NextRequest) {
  const perfil = await getPerfilActual();
  if (!perfil || !puedeAdministrar(perfil)) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const { filas } = await obtenerAuditoria(perfil.empresa_id, leerFiltrosAuditoria(req.nextUrl.searchParams), 5000);

  const wb = new ExcelJS.Workbook();
  wb.creator = 'Espiral de Crecimiento 360°';
  const ws = wb.addWorksheet('Auditoría de cambios');
  ws.columns = [
    { header: 'Fecha y hora (Colombia)', key: 'fecha', width: 22 },
    { header: 'Quién', key: 'quien', width: 28 },
    { header: 'Rol de sistema', key: 'rol', width: 16 },
    { header: 'Módulo', key: 'modulo', width: 22 },
    { header: 'Acción', key: 'accion', width: 22 },
    { header: 'Qué cambió', key: 'resumen', width: 80 },
    { header: 'Detalle', key: 'detalle', width: 60 },
  ];
  ws.getRow(1).font = { bold: true };
  ws.views = [{ state: 'frozen', ySplit: 1 }];
  for (const f of filas) {
    ws.addRow({
      fecha: new Date(f.creado_en).toLocaleString('es-CO', { timeZone: 'America/Bogota' }),
      quien: f.usuario_nombre ?? '',
      rol: f.usuario_rol ?? '',
      modulo: MODULOS_AUDITORIA.find((m) => m.value === f.modulo)?.label ?? f.modulo,
      accion: f.accion,
      resumen: f.resumen,
      detalle: f.detalle ? JSON.stringify(f.detalle) : '',
    });
  }
  ws.autoFilter = { from: 'A1', to: 'G1' };

  const buffer = await wb.xlsx.writeBuffer();
  return new NextResponse(buffer as ArrayBuffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="auditoria-de-cambios.xlsx"',
    },
  });
}
