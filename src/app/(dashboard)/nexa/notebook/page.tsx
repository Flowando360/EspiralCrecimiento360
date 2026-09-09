import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { createClient } from '@/lib/supabase/server';
import { NotebookLista } from '@/components/espiral-crecimiento/notebook-lista';
import { NotebookPen } from 'lucide-react';

export default async function NotebookPage() {
  const perfil = await getPerfilActual();
  if (!perfil) return null;

  const supabase = createClient();
  const { data: notas } = await supabase
    .from('notebook_notas')
    .select('id, titulo, contenido, updated_at')
    .eq('usuario_id', perfil.usuario_id)
    .order('updated_at', { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-secundario flex items-center gap-2">
          <NotebookPen size={22} className="text-flow-600" /> Mi cuaderno
        </h1>
        <p className="text-sm text-marmol-500 mt-1">
          Apuntes personales de tu proceso de aprendizaje — privados, nadie más los ve.
        </p>
      </div>

      <NotebookLista notasIniciales={notas ?? []} />
    </div>
  );
}
