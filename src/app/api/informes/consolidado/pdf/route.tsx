import { NextRequest, NextResponse } from 'next/server';
import { leerFiltrosEquipo } from '@/lib/informes/filtros-equipo';
import { renderToBuffer } from '@react-pdf/renderer';
import { obtenerInformeConsolidado } from '@/app/(dashboard)/informes/consolidado/data';
import { InformeConsolidadoDocument } from '@/app/(dashboard)/informes/consolidado/pdf-document';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { perfil, informe } = await obtenerInformeConsolidado(leerFiltrosEquipo(req.nextUrl.searchParams));

  if (!perfil || !informe) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const buffer = await renderToBuffer(<InformeConsolidadoDocument informe={informe} />);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="informe-consolidado-${new Date().toISOString().slice(0, 10)}.pdf"`,
    },
  });
}
