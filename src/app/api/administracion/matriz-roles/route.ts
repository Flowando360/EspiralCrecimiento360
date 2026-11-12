import { NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { ROLES_SISTEMA, ALCANCE_POR_ROL, filasMatrizRoles } from '@/lib/permisos/matriz';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Matriz de roles y permisos del sistema en Excel, para entregarla a auditores. */
export async function GET() {
  const perfil = await getPerfilActual();
  if (!perfil || !['admin_th', 'gerencia', 'auditor_externo'].includes(perfil.rol)) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const wb = new ExcelJS.Workbook();
  wb.creator = 'Espiral de Crecimiento 360°';
  const ws = wb.addWorksheet('Accesos por rol');
  ws.columns = [
    { header: 'Módulo', key: 'grupo', width: 34 },
    { header: 'Pantalla', key: 'pantalla', width: 38 },
    { header: 'Ruta', key: 'ruta', width: 42 },
    ...ROLES_SISTEMA.map((r) => ({ header: r.label, key: r.value, width: 20 })),
  ];
  ws.getRow(1).font = { bold: true };
  ws.views = [{ state: 'frozen', ySplit: 1 }];
  for (const f of filasMatrizRoles()) {
    ws.addRow({ grupo: f.grupo, pantalla: f.pantalla, ruta: f.ruta, ...Object.fromEntries(ROLES_SISTEMA.map((r) => [r.value, f.roles[r.value] ? 'Sí' : ''])) });
  }

  const alcance = wb.addWorksheet('Alcance de cada rol');
  alcance.columns = [
    { header: 'Rol', key: 'rol', width: 34 },
    { header: 'Qué puede hacer', key: 'desc', width: 120 },
  ];
  alcance.getRow(1).font = { bold: true };
  for (const r of ROLES_SISTEMA) alcance.addRow({ rol: r.label, desc: ALCANCE_POR_ROL[r.value] });

  const buffer = await wb.xlsx.writeBuffer();
  return new NextResponse(buffer as ArrayBuffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="matriz-roles-y-permisos.xlsx"',
    },
  });
}
