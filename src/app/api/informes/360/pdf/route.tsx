import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { obtenerInforme360 } from '@/app/(dashboard)/informes/360/data';
import { Informe360Document } from '@/app/(dashboard)/informes/360/pdf-document';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const colaboradorId = req.nextUrl.searchParams.get('colaboradorId');
  if (!colaboradorId) {
    return NextResponse.json({ error: 'colaboradorId es requerido' }, { status: 400 });
  }

  const { informe } = await obtenerInforme360(colaboradorId);
  if (!informe) {
    return NextResponse.json({ error: 'No autorizado o no encontrado' }, { status: 403 });
  }

  const buffer = await renderToBuffer(<Informe360Document informe={informe} />);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="informe-360-${informe.colaborador.nombre_completo.replace(/\s+/g, '-')}.pdf"`,
    },
  });
}
