import { NextRequest, NextResponse } from 'next/server';
import { ImageResponse } from 'next/og';
import QRCode from 'qrcode';
import { cargarVacanteParaDifusion, colorSeguro, textoSobre, urlPostulacion, type VacanteDifusion } from '@/lib/reclutamiento/difusion';
import { ETIQUETA_MODALIDAD } from '@/lib/reclutamiento/oferta';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function lineasRequisitos(texto: string | null, max = 4): string[] {
  return (texto ?? '')
    .split('\n')
    .map((l) => l.replace(/^[•\-*\s]+/, '').trim())
    .filter(Boolean)
    .slice(0, max)
    .map((l) => (l.length > 70 ? `${l.slice(0, 67)}…` : l));
}

function dibujo(v: VacanteDifusion, qr: string, ancho: number, alto: number, conLogo: boolean) {
  const fondo = colorSeguro(v.empresa.colorMarca);
  const tinta = textoSobre(fondo);
  const datos = [v.modalidad ? ETIQUETA_MODALIDAD[v.modalidad] ?? v.modalidad : null, v.ciudad, v.tipoContrato, v.horario].filter(Boolean) as string[];
  const reqs = lineasRequisitos(v.requisitos);
  const historia = alto > ancho;
  return (
    <div style={{ width: ancho, height: alto, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: fondo, color: tinta, padding: historia ? 90 : 70, fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', fontSize: 34, fontWeight: 700 }}>{v.empresa.nombre}</div>
        {conLogo && v.empresa.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={v.empresa.logoUrl} height={80} alt="" style={{ maxWidth: 260, objectFit: 'contain' }} />
        ) : null}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', fontSize: 30, letterSpacing: 4, opacity: 0.85, textTransform: 'uppercase' }}>Estamos contratando</div>
        <div style={{ display: 'flex', fontSize: historia ? 96 : 84, fontWeight: 800, lineHeight: 1.05, marginTop: 16 }}>{v.titulo}</div>
        {datos.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', marginTop: 28 }}>
            {datos.map((d, i) => (
              <div key={i} style={{ display: 'flex', fontSize: 30, padding: '8px 22px', marginRight: 14, marginBottom: 12, border: `2px solid ${tinta}`, borderRadius: 40 }}>{d}</div>
            ))}
          </div>
        )}
        {reqs.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', marginTop: 20 }}>
            <div style={{ display: 'flex', fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Requisitos principales</div>
            {reqs.map((r, i) => (
              <div key={i} style={{ display: 'flex', fontSize: 28, marginBottom: 6 }}>{`• ${r}`}</div>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', flexDirection: 'column', maxWidth: ancho - 420 }}>
          <div style={{ display: 'flex', fontSize: 40, fontWeight: 800 }}>Postúlate escaneando el QR</div>
          <div style={{ display: 'flex', fontSize: 26, opacity: 0.85, marginTop: 8 }}>desde tu celular, en un minuto</div>
        </div>
        <div style={{ display: 'flex', background: '#ffffff', padding: 16, borderRadius: 24 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qr} width={historia ? 300 : 260} height={historia ? 300 : 260} alt="" />
        </div>
      </div>
    </div>
  );
}

/** Imagen para redes sociales de una vacante, con la marca de la empresa y el QR de postulación (PNG). */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const vacante = await cargarVacanteParaDifusion(params.id);
  if (!vacante) return NextResponse.json({ error: 'No autorizado o vacante no encontrada' }, { status: 404 });

  const formato = req.nextUrl.searchParams.get('formato') === 'historia' ? 'historia' : 'cuadrada';
  const [ancho, alto] = formato === 'historia' ? [1080, 1920] : [1080, 1080];
  const qr = await QRCode.toDataURL(urlPostulacion(req.nextUrl.origin, vacante.id), { margin: 1, width: 420, errorCorrectionLevel: 'M' });

  const cabeceras = { 'Content-Disposition': `attachment; filename="vacante-${formato}.png"`, 'Cache-Control': 'no-store' };
  // Si el logo remoto no carga, se genera la imagen sin él.
  try {
    const img = new ImageResponse(dibujo(vacante, qr, ancho, alto, true), { width: ancho, height: alto, headers: cabeceras });
    const buf = await img.arrayBuffer();
    return new NextResponse(buf, { headers: { 'Content-Type': 'image/png', ...cabeceras } });
  } catch {
    const img = new ImageResponse(dibujo(vacante, qr, ancho, alto, false), { width: ancho, height: alto, headers: cabeceras });
    const buf = await img.arrayBuffer();
    return new NextResponse(buf, { headers: { 'Content-Type': 'image/png', ...cabeceras } });
  }
}
