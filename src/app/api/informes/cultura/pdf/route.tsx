import { NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { obtenerInformeCultura } from '@/app/(dashboard)/informes/cultura/data';
import { InformeCulturaDocument } from '@/app/(dashboard)/informes/cultura/pdf-document';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const { perfil, filas } = await obtenerInformeCultura();

  if (!perfil) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const buffer = await renderToBuffer(<InformeCulturaDocument filas={filas} />);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="informe-cultura-${new Date().toISOString().slice(0, 10)}.pdf"`,
    },
  });
}
