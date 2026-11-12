import { NextResponse } from 'next/server';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { createClient } from '@/lib/supabase/server';
import { construirPlantillaMatriz } from '@/lib/legal/importacion-matriz';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Plantilla de carga masiva de la matriz legal, con los procesos de la empresa como lista desplegable. */
export async function GET() {
  const perfil = await getPerfilActual();
  if (!perfil || perfil.rol !== 'admin_th') return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const supabase = createClient();
  const { data } = await supabase.from('procesos_gestion').select('nombre').eq('empresa_id', perfil.empresa_id).order('nombre');
  const buffer = await construirPlantillaMatriz((data ?? []).map((p: any) => p.nombre as string));

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="plantilla-matriz-legal.xlsx"',
    },
  });
}
