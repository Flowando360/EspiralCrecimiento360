import { NextResponse } from 'next/server';
import { validarEnlaceEvidenciaPublico, registrarConsultaEnlace } from '@/lib/informes/enlace-evidencia-publico';
import { obtenerEvidenciaAuditoria } from '@/app/(dashboard)/informes/evidencia-auditoria/data';
import { generarZipEvidencia } from '@/lib/informes/evidencia-auditoria-zip';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: { token: string } }) {
  const enlace = await validarEnlaceEvidenciaPublico(params.token);
  if (!enlace) {
    return NextResponse.json({ error: 'Enlace inválido o vencido' }, { status: 404 });
  }

  const { evidencia } = await obtenerEvidenciaAuditoria(enlace.tipoPaquete, { empresaId: enlace.empresaId });
  if (!evidencia) {
    return NextResponse.json({ error: 'No se pudo generar el paquete' }, { status: 500 });
  }

  const zipBuffer = await generarZipEvidencia(enlace.tipoPaquete, evidencia);
  await registrarConsultaEnlace(enlace.id);

  return new NextResponse(new Uint8Array(zipBuffer), {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="evidencia-auditoria-${enlace.tipoPaquete}-${new Date().toISOString().slice(0, 10)}.zip"`,
    },
  });
}
