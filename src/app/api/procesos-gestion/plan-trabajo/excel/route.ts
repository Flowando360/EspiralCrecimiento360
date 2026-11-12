import { NextRequest, NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { obtenerActividadesPlan, leerFiltrosPlan } from '@/app/(dashboard)/procesos-gestion/plan-trabajo/data';
import { TIPOS_ACTIVIDAD, SISTEMAS, ESTADOS_ACTIVIDAD, POBLACIONES, etiqueta, estaAtrasada, resumirPlan } from '@/lib/plan-trabajo/catalogos';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Plan de trabajo del año (con los filtros activos) en Excel: hoja de actividades y hoja de indicadores. */
export async function GET(req: NextRequest) {
  const perfil = await getPerfilActual();
  if (!perfil || !['admin_th', 'lider', 'gerencia'].includes(perfil.rol)) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const filtros = leerFiltrosPlan(req.nextUrl.searchParams);
  const filas = await obtenerActividadesPlan(perfil.empresa_id, filtros);
  const hoy = new Date().toISOString().slice(0, 10);

  const wb = new ExcelJS.Workbook();
  wb.creator = 'Espiral de Crecimiento 360°';
  const ws = wb.addWorksheet(`Plan ${filtros.anio}`);
  ws.columns = [
    { header: 'Actividad', key: 'nombre', width: 40 },
    { header: 'Tipo', key: 'tipo', width: 26 },
    { header: 'Sistema', key: 'sistema', width: 16 },
    { header: 'Fecha programada', key: 'prog', width: 16 },
    { header: 'Fecha ejecutada', key: 'ejec', width: 16 },
    { header: 'Estado', key: 'estado', width: 14 },
    { header: 'Atrasada', key: 'atrasada', width: 10 },
    { header: 'Responsable', key: 'resp', width: 28 },
    { header: 'Población', key: 'pob', width: 26 },
    { header: 'Personas objetivo', key: 'obj', width: 12 },
    { header: 'Personas alcanzadas', key: 'alc', width: 12 },
    { header: 'Horas', key: 'horas', width: 8 },
    { header: 'Presupuesto estimado', key: 'pe', width: 18 },
    { header: 'Presupuesto ejecutado', key: 'pj', width: 18 },
    { header: 'Aliado / proveedor', key: 'aliado', width: 24 },
    { header: 'Calificación', key: 'cal', width: 10 },
    { header: 'Acción ACPM', key: 'acpm', width: 12 },
    { header: 'Notas', key: 'notas', width: 40 },
  ];
  ws.getRow(1).font = { bold: true };
  ws.views = [{ state: 'frozen', ySplit: 1 }];
  for (const r of filas) {
    ws.addRow({
      nombre: r.nombre,
      tipo: etiqueta(TIPOS_ACTIVIDAD, r.tipo),
      sistema: etiqueta(SISTEMAS, r.sistema),
      prog: r.fecha_programada,
      ejec: r.fecha_ejecutada ?? '',
      estado: etiqueta(ESTADOS_ACTIVIDAD, r.estado),
      atrasada: estaAtrasada(r, hoy) ? 'Sí' : '',
      resp: r.responsable?.nombre_completo ?? '',
      pob: r.poblacion_tipo === 'todos' ? etiqueta(POBLACIONES, 'todos') : `${etiqueta(POBLACIONES, r.poblacion_tipo)}: ${r.poblacion_detalle ?? ''}`,
      obj: r.personas_objetivo ?? '',
      alc: r.personas_alcanzadas ?? '',
      horas: r.horas != null ? Number(r.horas) : '',
      pe: r.presupuesto_estimado != null ? Number(r.presupuesto_estimado) : '',
      pj: r.presupuesto_ejecutado != null ? Number(r.presupuesto_ejecutado) : '',
      aliado: r.aliado?.nombre ?? '',
      cal: r.calificacion != null ? Number(r.calificacion) : '',
      acpm: r.acpm?.codigo ?? '',
      notas: r.notas ?? '',
    });
  }
  ws.getColumn('pe').numFmt = '"$"#,##0';
  ws.getColumn('pj').numFmt = '"$"#,##0';
  ws.autoFilter = { from: 'A1', to: 'R1' };

  const res = resumirPlan(filas, hoy);
  const ind = wb.addWorksheet('Indicadores');
  ind.columns = [
    { header: 'Indicador', key: 'k', width: 38 },
    { header: 'Valor', key: 'v', width: 22 },
  ];
  ind.getRow(1).font = { bold: true };
  [
    ['Año', filtros.anio],
    ['Actividades programadas (sin canceladas)', res.programadas],
    ['Ejecutadas', res.ejecutadas],
    ['Atrasadas', res.atrasadas],
    ['Cumplimiento a la fecha', res.cumplimientoPct != null ? `${res.cumplimientoPct}%` : ''],
    ['Cobertura (alcanzadas / objetivo)', res.coberturaPct != null ? `${res.coberturaPct}%` : ''],
    ['Horas programadas', res.horasProgramadas],
    ['Horas ejecutadas', res.horasEjecutadas],
    ['Presupuesto estimado', res.presupuestoEstimado],
    ['Presupuesto ejecutado', res.presupuestoEjecutado],
  ].forEach(([k, v]) => ind.addRow({ k, v }));

  const buffer = await wb.xlsx.writeBuffer();
  return new NextResponse(buffer as ArrayBuffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="plan-trabajo-${filtros.anio}.xlsx"`,
    },
  });
}
