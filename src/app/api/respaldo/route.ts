import { NextResponse } from 'next/server';
import JSZip from 'jszip';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { createAdminClient } from '@/lib/supabase/server';
import { exportarRespaldoEmpresa, textoLeeme } from '@/lib/respaldo/exportar';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * GET /api/respaldo[?empresa_id=uuid]
 * Descarga un ZIP con un CSV por tabla de la empresa.
 *  · admin_th: solo su propia empresa.
 *  · superadmin: cualquier empresa (con ?empresa_id) y además las tablas globales.
 */
export async function GET(request: Request) {
  const perfil = await getPerfilActual();
  if (!perfil) return new NextResponse('No autorizado', { status: 401 });

  const solicitada = new URL(request.url).searchParams.get('empresa_id');
  let empresaId = perfil.empresa_id;

  if (solicitada && solicitada !== perfil.empresa_id) {
    if (!perfil.es_superadmin) return new NextResponse('No autorizado', { status: 403 });
    if (!UUID.test(solicitada)) return new NextResponse('empresa_id inválido', { status: 400 });
    empresaId = solicitada;
  }

  const puedeRespaldar = perfil.es_superadmin || perfil.rol === 'admin_th';
  if (!puedeRespaldar) return new NextResponse('No autorizado', { status: 403 });

  const incluirGlobales = perfil.es_superadmin;
  const generadoEn = new Date();

  try {
    const resultado = await exportarRespaldoEmpresa(createAdminClient(), empresaId, { incluirGlobales });

    const zip = new JSZip();
    for (const [nombre, contenido] of Object.entries(resultado.archivos)) zip.file(nombre, contenido);
    zip.file('LEEME.txt', textoLeeme(resultado, generadoEn, incluirGlobales));
    const buffer = await zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE' });

    const fecha = generadoEn.toISOString().slice(0, 10);
    return new NextResponse(buffer as unknown as BodyInit, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="respaldo-${resultado.empresaSlug}-${fecha}.zip"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : 'Error desconocido';
    return new NextResponse(`No se pudo generar el respaldo: ${mensaje}`, { status: 500 });
  }
}
