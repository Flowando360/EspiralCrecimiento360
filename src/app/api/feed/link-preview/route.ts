import { NextRequest, NextResponse } from 'next/server';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { obtenerVistaPreviaLink } from '@/lib/og-preview';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const perfil = await getPerfilActual();
  if (!perfil || !['admin_th', 'lider'].includes(perfil.rol)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const url = req.nextUrl.searchParams.get('url');
  if (!url) return NextResponse.json({ error: 'Falta la URL' }, { status: 400 });

  const preview = await obtenerVistaPreviaLink(url);
  return NextResponse.json(preview);
}
