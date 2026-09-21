import { NextRequest, NextResponse } from 'next/server';
import { obtenerEvidenciaAuditoria, type TipoPaqueteAuditoria } from '@/app/(dashboard)/informes/evidencia-auditoria/data';
import { generarZipEvidencia } from '@/lib/informes/evidencia-auditoria-zip';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const TIPOS_VALIDOS: TipoPaqueteAuditoria[] = ['todos', 'sst', 'iso_9001', 'sarlaft_sagrilaft', 'ptee'];

export async function GET(req: NextRequest) {
  const tipoParam = req.nextUrl.searchParams.get('tipo') ?? 'todos';
  const tipo = (TIPOS_VALIDOS.includes(tipoParam as TipoPaqueteAuditoria) ? tipoParam : 'todos') as TipoPaqueteAuditoria;

  const { perfil, evidencia } = await obtenerEvidenciaAuditoria(tipo);
  if (!perfil || !evidencia) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const zipBuffer = await generarZipEvidencia(tipo, evidencia);

  return new NextResponse(new Uint8Array(zipBuffer), {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="evidencia-auditoria-${tipo}-${new Date().toISOString().slice(0, 10)}.zip"`,
    },
  });
}
