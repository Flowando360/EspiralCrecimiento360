import { NextRequest, NextResponse } from 'next/server';
import QRCode from 'qrcode';
import { cargarVacanteParaDifusion, urlPostulacion } from '@/lib/reclutamiento/difusion';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Código QR del formulario público de postulación de una vacante (PNG o SVG). */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const vacante = await cargarVacanteParaDifusion(params.id);
  if (!vacante) return NextResponse.json({ error: 'No autorizado o vacante no encontrada' }, { status: 404 });

  const url = urlPostulacion(req.nextUrl.origin, vacante.id);
  const formato = req.nextUrl.searchParams.get('formato') === 'svg' ? 'svg' : 'png';
  const nombre = `qr-${vacante.titulo.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'vacante'}`;

  if (formato === 'svg') {
    const svg = await QRCode.toString(url, { type: 'svg', margin: 2, errorCorrectionLevel: 'M' });
    return new NextResponse(svg, { headers: { 'Content-Type': 'image/svg+xml', 'Content-Disposition': `attachment; filename="${nombre}.svg"` } });
  }
  const png = await QRCode.toBuffer(url, { margin: 2, width: 900, errorCorrectionLevel: 'M' });
  return new NextResponse(new Uint8Array(png), { headers: { 'Content-Type': 'image/png', 'Content-Disposition': `attachment; filename="${nombre}.png"` } });
}
