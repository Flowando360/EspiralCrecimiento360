import { NextResponse } from 'next/server';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { createClient } from '@/lib/supabase/server';
import { construirPlantillaColaboradores } from '@/lib/colaboradores/importacion';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Plantilla de carga masiva con los cargos de la empresa ya cargados como lista desplegable. */
export async function GET() {
  const perfil = await getPerfilActual();
  if (!perfil || perfil.rol !== 'admin_th') return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const supabase = createClient();
  const { data } = await supabase.from('cargos').select('nombre').eq('empresa_id', perfil.empresa_id).eq('activo', true).order('nombre');
  const buffer = await construirPlantillaColaboradores((data ?? []).map((c: any) => c.nombre as string));

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="plantilla-colaboradores.xlsx"',
    },
  });
}
