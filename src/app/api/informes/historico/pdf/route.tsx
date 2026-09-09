import { NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { obtenerInformeHistorico } from '@/app/(dashboard)/informes/historico/data';
import { InformeHistoricoDocument } from '@/app/(dashboard)/informes/historico/pdf-document';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const { perfil, filas } = await obtenerInformeHistorico();

  if (!perfil) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const buffer = await renderToBuffer(<InformeHistoricoDocument filas={filas} />);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="informe-historico-${new Date().toISOString().slice(0, 10)}.pdf"`,
    },
  });
}
