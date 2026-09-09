import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { obtenerInformeSST } from '@/app/(dashboard)/informes/sst/data';
import { InformeSSTDocument } from '@/app/(dashboard)/informes/sst/pdf-document';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const colaboradorId = req.nextUrl.searchParams.get('colaboradorId') ?? undefined;
  const { informe } = await obtenerInformeSST(colaboradorId);

  if (!informe) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const buffer = await renderToBuffer(<InformeSSTDocument informe={informe} />);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="informe-sst-${new Date().toISOString().slice(0, 10)}.pdf"`,
    },
  });
}
