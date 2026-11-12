import { NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { createClient } from '@/lib/supabase/server';
import { crearNormalizadorAreas } from '@/lib/areas';
import { TIPOS_CONTRATO } from '@/lib/contratos';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ETIQUETA_ESTADO: Record<string, string> = {
  activo: 'Activo',
  inactivo: 'Inactivo',
  en_proceso_salida: 'En proceso de salida',
  periodo_prueba: 'Período de prueba',
};

/** Exporta a .xlsx la base de colaboradores que el usuario puede ver (RLS decide el alcance). */
export async function GET() {
  const perfil = await getPerfilActual();
  if (!perfil || perfil.rol === 'colaborador' || perfil.rol === 'auditor_externo') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const supabase = createClient();
  let query = supabase
    .from('colaboradores')
    .select('numero_documento, nombre_completo, email, telefono, estado, tipo_contrato, fecha_ingreso, lider:lider_id(nombre_completo), cargo:cargos(nombre, proceso_area)')
    .eq('empresa_id', perfil.empresa_id)
    .eq('es_externo', false)
    .order('nombre_completo');
  if (perfil.rol === 'lider' && perfil.colaborador_id) {
    query = query.or(`lider_id.eq.${perfil.colaborador_id},id.eq.${perfil.colaborador_id}`);
  }
  const { data } = await query;
  const filas = (data ?? []) as any[];
  const normalizarArea = crearNormalizadorAreas(filas.map((f) => f.cargo?.proceso_area));
  const etiquetaContrato = new Map<string, string>(TIPOS_CONTRATO.map((t) => [t.value, t.label]));

  const wb = new ExcelJS.Workbook();
  wb.creator = 'Espiral de Crecimiento 360°';
  wb.created = new Date();
  const ws = wb.addWorksheet('Colaboradores');
  ws.columns = [
    { header: 'Documento', key: 'doc', width: 16 },
    { header: 'Nombre', key: 'nombre', width: 34 },
    { header: 'Cargo', key: 'cargo', width: 30 },
    { header: 'Área', key: 'area', width: 22 },
    { header: 'Líder', key: 'lider', width: 30 },
    { header: 'Ingreso', key: 'ingreso', width: 12 },
    { header: 'Estado', key: 'estado', width: 20 },
    { header: 'Tipo de contrato', key: 'contrato', width: 28 },
    { header: 'Correo', key: 'email', width: 30 },
    { header: 'Teléfono', key: 'tel', width: 16 },
  ];
  ws.getRow(1).font = { bold: true };
  ws.views = [{ state: 'frozen', ySplit: 1 }];
  for (const f of filas) {
    ws.addRow({
      doc: f.numero_documento ?? '',
      nombre: f.nombre_completo,
      cargo: f.cargo?.nombre ?? '',
      area: normalizarArea(f.cargo?.proceso_area) ?? '',
      lider: f.lider?.nombre_completo ?? '',
      ingreso: f.fecha_ingreso,
      estado: ETIQUETA_ESTADO[f.estado] ?? f.estado,
      contrato: etiquetaContrato.get(f.tipo_contrato) ?? f.tipo_contrato ?? '',
      email: f.email ?? '',
      tel: f.telefono ?? '',
    });
  }
  ws.getColumn('doc').numFmt = '@';
  ws.autoFilter = { from: 'A1', to: 'J1' };

  const buffer = await wb.xlsx.writeBuffer();
  return new NextResponse(buffer as ArrayBuffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="colaboradores.xlsx"',
    },
  });
}
