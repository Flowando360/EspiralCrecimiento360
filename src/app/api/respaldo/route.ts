import { NextResponse } from 'next/server';
import JSZip from 'jszip';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { getProveedorActual, registrarBitacora } from '@/lib/proveedor/auth';
import { createAdminClient } from '@/lib/supabase/server';
import { exportarRespaldoEmpresa, textoLeeme } from '@/lib/respaldo/exportar';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * GET /api/respaldo[?empresa_id=uuid]
 * Descarga un ZIP con un CSV por tabla de la empresa.
 *  · admin_th: solo su propia empresa.
 *  · proveedor (tabla proveedores): cualquier empresa con ?empresa_id, más las tablas globales.
 */
export async function GET(request: Request) {
  const proveedor = await getProveedorActual();
  const perfil = proveedor ? null : await getPerfilActual();
  if (!proveedor && !perfil) return new NextResponse('No autorizado', { status: 401 });

  const solicitada = new URL(request.url).searchParams.get('empresa_id');
  let empresaId: string;

  if (proveedor) {
    if (solicitada && !UUID.test(solicitada)) return new NextResponse('empresa_id inválido', { status: 400 });
    empresaId = solicitada ?? '';
    if (!empresaId) return new NextResponse('Indica la empresa (empresa_id)', { status: 400 });
  } else if (perfil) {
    if (perfil.rol !== 'admin_th') return new NextResponse('No autorizado', { status: 403 });
    if (solicitada && solicitada !== perfil.empresa_id) return new NextResponse('No autorizado', { status: 403 });
    empresaId = perfil.empresa_id;
  } else {
    return new NextResponse('No autorizado', { status: 401 });
  }

  const incluirGlobales = Boolean(proveedor);
  const generadoEn = new Date();

  try {
    const resultado = await exportarRespaldoEmpresa(createAdminClient(), empresaId, { incluirGlobales });
    if (proveedor) await registrarBitacora(proveedor.id, 'descargar_respaldo', empresaId);

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
