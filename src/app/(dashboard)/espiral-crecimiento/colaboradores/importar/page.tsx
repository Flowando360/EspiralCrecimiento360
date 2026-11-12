import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { ImportadorColaboradores } from '@/components/espiral-crecimiento/importador-colaboradores';
import { MAX_FILAS_IMPORTACION } from '@/lib/colaboradores/importacion';

export default async function ImportarColaboradoresPage() {
  const perfil = await getPerfilActual();
  if (!perfil) return null;
  if (perfil.rol !== 'admin_th') redirect('/espiral-crecimiento/colaboradores');

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <Link href="/espiral-crecimiento/colaboradores" className="inline-flex items-center gap-1 text-xs text-marmol-400 hover:text-marmol-600 mb-2">
          <ArrowLeft size={12} /> Volver a Colaboradores
        </Link>
        <h1 className="font-display text-2xl font-semibold text-secundario">Importar colaboradores desde Excel</h1>
        <p className="text-sm text-marmol-500 mt-1">
          Para cargar de una vez a toda la planta de personal (hasta {MAX_FILAS_IMPORTACION} personas por archivo), por ejemplo desde tu ERP de nómina. Antes de guardar
          verás una revisión fila por fila.
        </p>
      </div>
      <ImportadorColaboradores />
    </div>
  );
}
