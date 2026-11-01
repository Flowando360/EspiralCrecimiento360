import Link from 'next/link';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { FormularioNuevoCargo } from '@/components/espiral-crecimiento/formulario-nuevo-cargo';

export default async function NuevoCargoPage() {
  const perfil = await getPerfilActual();
  if (!perfil) return null;
  if (perfil.rol !== 'admin_th') redirect('/inicio');

  return (
    <div className="space-y-6">
      <div>
        <Link href="/administracion/cargos" className="inline-flex items-center gap-1 text-xs text-marmol-400 hover:text-marmol-600 mb-2">
          <ArrowLeft size={12} /> Volver a cargos
        </Link>
        <h1 className="font-display text-2xl font-semibold text-secundario">Nuevo cargo</h1>
        <p className="text-sm text-marmol-500 mt-1">
          Crea el cargo con sus datos básicos. En el siguiente paso completas el manual de funciones,
          habilidades, riesgos, exámenes y EPP.
        </p>
      </div>
      <FormularioNuevoCargo />
    </div>
  );
}
