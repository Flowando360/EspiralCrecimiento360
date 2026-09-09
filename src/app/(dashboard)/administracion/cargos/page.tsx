import Link from 'next/link';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { EmptyState } from '@/components/ui/empty-state';
import { ImportadorPerfilCargo } from '@/components/espiral-crecimiento/importador-perfil-cargo';
import { Sparkles } from 'lucide-react';

export default async function AdminCargosPage() {
  const perfil = await getPerfilActual();
  if (!perfil) return null;
  if (perfil.rol !== 'admin_th') redirect('/inicio');

  const supabase = createClient();
  const { data: cargos } = await supabase
    .from('cargos')
    .select('id, nombre, proceso_area, tiene_personal_a_cargo, formacion_nivel, habilidades:cargo_habilidades(id)')
    .eq('empresa_id', perfil.empresa_id)
    .order('proceso_area');

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-secundario">Cargos y perfiles</h1>
          <p className="text-sm text-marmol-500 mt-1">
            Plantilla estándar de la dimensión Saber: formación, habilidades funcionales y técnicas,
            destrezas y experiencia mínima por cargo.
          </p>
        </div>
        <ImportadorPerfilCargo />
      </div>

      {!cargos || cargos.length === 0 ? (
        <EmptyState icon={Sparkles} titulo="Sin cargos cargados" />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-marmol-200 text-left text-xs uppercase tracking-wide text-marmol-400">
                <th className="px-4 py-3 font-medium">Cargo</th>
                <th className="px-4 py-3 font-medium">Área</th>
                <th className="px-4 py-3 font-medium">Formación requerida</th>
                <th className="px-4 py-3 font-medium">¿Personal a cargo?</th>
                <th className="px-4 py-3 font-medium">Habilidades definidas</th>
              </tr>
            </thead>
            <tbody>
              {cargos.map((c: any) => (
                <tr key={c.id} className="border-b border-marmol-100 last:border-0 hover:bg-marmol-50">
                  <td className="px-4 py-3 font-medium text-marmol-900">
                    <Link href={`/administracion/cargos/${c.id}`} className="hover:text-flow-600">
                      {c.nombre}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-marmol-600">{c.proceso_area}</td>
                  <td className="px-4 py-3 text-marmol-600 capitalize">{c.formacion_nivel ?? '—'}</td>
                  <td className="px-4 py-3">{c.tiene_personal_a_cargo ? 'Sí' : 'No'}</td>
                  <td className="px-4 py-3 text-marmol-500">{c.habilidades?.length ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
