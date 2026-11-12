import { NextResponse } from 'next/server';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { construirPlantillaIncapacidades } from '@/lib/incapacidades/importacion';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const perfil = await getPerfilActual();
  if (!perfil || perfil.rol !== 'admin_th') return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const buffer = await construirPlantillaIncapacidades();
  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="plantilla-incapacidades.xlsx"',
    },
  });
}
