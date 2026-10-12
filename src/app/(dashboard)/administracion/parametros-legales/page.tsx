import { createClient } from '@/lib/supabase/server';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { redirect } from 'next/navigation';
import { FormularioParametrosLegales } from '@/components/administracion/formulario-parametros-legales';

export default async function ParametrosLegalesPage() {
  const perfil = await getPerfilActual();
  if (!perfil) return null;
  if (perfil.rol !== 'admin_th') redirect('/inicio');

  const supabase = createClient();
  const { data } = await supabase
    .from('parametros_legales')
    .select('anio, smlmv')
    .eq('empresa_id', perfil.empresa_id)
    .order('anio', { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-secundario">Parámetros legales</h1>
        <p className="text-sm text-marmol-500 mt-1">
          Valores que cambian cada año. El SMLMV define el tope de salario para recibir dotación (hasta 2 SMLMV). Regístralo al inicio de cada año.
        </p>
      </div>

      <FormularioParametrosLegales inicial={(data ?? []) as { anio: number; smlmv: number }[]} />
    </div>
  );
}
