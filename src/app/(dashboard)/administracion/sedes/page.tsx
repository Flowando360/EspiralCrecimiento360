import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { puedeAdministrar } from '@/lib/permisos/administracion';
import { GestorSedes } from '@/components/administracion/gestor-sedes';

export const dynamic = 'force-dynamic';

export default async function SedesPage() {
  const perfil = await getPerfilActual();
  if (!perfil) return null;
  if (!puedeAdministrar(perfil)) redirect('/inicio');
  const supabase = createClient();

  const [{ data: sedes }, { data: asignadas }] = await Promise.all([
    supabase.from('sedes').select('id, nombre, ciudad, direccion, activa').eq('empresa_id', perfil.empresa_id).order('nombre'),
    supabase.from('colaboradores').select('sede_id').eq('empresa_id', perfil.empresa_id).not('sede_id', 'is', null),
  ]);
  const conteo = new Map<string, number>();
  for (const c of (asignadas ?? []) as any[]) conteo.set(c.sede_id, (conteo.get(c.sede_id) ?? 0) + 1);

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="font-display text-2xl font-semibold text-secundario">Sedes</h1>
        <p className="text-sm text-marmol-500 mt-1 max-w-xl">
          Las ubicaciones de tu empresa (planta, oficina, bodega…). Después puedes asignar cada persona a una sede desde su ficha y comparar informes por sede. Es opcional.
        </p>
      </div>
      <GestorSedes sedes={((sedes ?? []) as any[]).map((s) => ({ ...s, personas: conteo.get(s.id) ?? 0 }))} />
    </div>
  );
}
