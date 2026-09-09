import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { obtenerPlanesInforme } from '@/app/(dashboard)/informes/pdi/data';
import { PdiDocument } from '@/app/(dashboard)/informes/pdi/pdf-document';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const colaboradorId = req.nextUrl.searchParams.get('colaboradorId') ?? undefined;
  const { perfil, planes } = await obtenerPlanesInforme(colaboradorId);

  if (!perfil) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const buffer = await renderToBuffer(<PdiDocument planes={planes} generadoPor={perfil.nombre_completo} />);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="informe-pdi-${new Date().toISOString().slice(0, 10)}.pdf"`,
    },
  });
}
