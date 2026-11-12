import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { ImportadorIncapacidades } from '@/components/espiral-crecimiento/importador-incapacidades';
import { MAX_INCAPACIDADES_IMPORTACION } from '@/lib/incapacidades/importacion';

export default async function ImportarIncapacidadesPage() {
  const perfil = await getPerfilActual();
  if (!perfil) return null;
  if (perfil.rol !== 'admin_th') redirect('/espiral-crecimiento/colaboradores');

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <Link href="/espiral-crecimiento/colaboradores" className="inline-flex items-center gap-1 text-xs text-marmol-400 hover:text-marmol-600 mb-2">
          <ArrowLeft size={12} /> Volver a Colaboradores
        </Link>
        <h1 className="font-display text-2xl font-semibold text-secundario">Importar incapacidades desde Excel</h1>
        <p className="text-sm text-marmol-500 mt-1">
          Para cargar de una vez las novedades de incapacidades y licencias (hasta {MAX_INCAPACIDADES_IMPORTACION} por archivo), por ejemplo desde tu archivo de nómina. Antes de guardar verás una revisión fila por fila.
          Es información de salud: solo Talento Humano y cada persona la ven, y no se guarda el diagnóstico.
        </p>
      </div>
      <ImportadorIncapacidades />
    </div>
  );
}
