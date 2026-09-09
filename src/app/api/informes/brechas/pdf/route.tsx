import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { obtenerInformeBrechas, type Agrupacion } from '@/app/(dashboard)/informes/brechas/data';
import { BrechasDocument } from '@/app/(dashboard)/informes/brechas/pdf-document';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const agrupacion: Agrupacion = req.nextUrl.searchParams.get('agrupacion') === 'area' ? 'area' : 'equipo';
  const { perfil, filas } = await obtenerInformeBrechas(agrupacion);

  if (!perfil) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const buffer = await renderToBuffer(<BrechasDocument filas={filas} agrupacion={agrupacion} />);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="informe-brechas-${agrupacion}-${new Date().toISOString().slice(0, 10)}.pdf"`,
    },
  });
}
