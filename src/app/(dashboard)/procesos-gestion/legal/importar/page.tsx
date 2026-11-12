import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { ImportadorMatrizLegal } from '@/components/procesos-gestion/importador-matriz-legal';
import { MAX_REQUISITOS_IMPORTACION } from '@/lib/legal/importacion-matriz';

export default async function ImportarMatrizLegalPage() {
  const perfil = await getPerfilActual();
  if (!perfil) return null;
  if (perfil.rol !== 'admin_th') redirect('/procesos-gestion/legal');

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <Link href="/procesos-gestion/legal" className="inline-flex items-center gap-1 text-sm text-marmol-500 hover:text-flow-600 mb-2">
          <ChevronLeft size={14} /> Matriz de requisitos legales
        </Link>
        <h1 className="font-display text-2xl font-semibold text-secundario">Importar la matriz legal desde Excel</h1>
        <p className="text-sm text-marmol-500 mt-1">
          Migra la matriz que ya tienes en Excel sin volver a digitarla (hasta {MAX_REQUISITOS_IMPORTACION} requisitos por archivo). Antes de guardar verás una revisión fila por fila.
        </p>
      </div>
      <ImportadorMatrizLegal />
    </div>
  );
}
