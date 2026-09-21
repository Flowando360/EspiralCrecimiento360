import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { obtenerActaDifusion } from '@/app/(dashboard)/procesos-gestion/documentos/[id]/data';
import { ActaDifusionDocument } from '@/app/(dashboard)/procesos-gestion/documentos/[id]/pdf-document';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const { perfil, acta } = await obtenerActaDifusion(params.id);
  if (!perfil || !acta) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const buffer = await renderToBuffer(<ActaDifusionDocument acta={acta} />);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="acta-difusion-${acta.codigo}-${new Date().toISOString().slice(0, 10)}.pdf"`,
    },
  });
}
