import { NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { obtenerInformeFormacion } from '@/app/(dashboard)/informes/formacion/data';
import { InformeFormacionDocument } from '@/app/(dashboard)/informes/formacion/pdf-document';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const { perfil, filas } = await obtenerInformeFormacion();

  if (!perfil) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const buffer = await renderToBuffer(<InformeFormacionDocument filas={filas} />);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="informe-formacion-${new Date().toISOString().slice(0, 10)}.pdf"`,
    },
  });
}
