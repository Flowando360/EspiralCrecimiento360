import Link from 'next/link';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ChevronLeft, Scale } from 'lucide-react';
import { ListaRequisitosLegales } from '@/components/procesos-gestion/lista-requisitos-legales';

export default async function MatrizLegalPage() {
  const perfil = await getPerfilActual();
  if (!perfil) return null;
  if (!['admin_th', 'lider', 'gerencia'].includes(perfil.rol)) redirect('/inicio');

  const supabase = createClient();

  const [{ data: requisitos }, { data: procesos }] = await Promise.all([
    supabase
      .from('requisitos_legales')
      .select('id, norma, anio, entidad_emisora, asunto, articulo, nombre_articulo, descripcion_articulo, cumple, soporte_cumplimiento, acciones_a_seguir, observaciones, proceso_id, fecha_ultima_revision')
      .eq('empresa_id', perfil.empresa_id)
      .order('created_at', { ascending: false }),
    supabase.from('procesos_gestion').select('id, nombre, codigo').eq('empresa_id', perfil.empresa_id).order('codigo'),
  ]);

  const total = requisitos?.length ?? 0;
  const cumplen = (requisitos ?? []).filter((r: any) => r.cumple === true).length;
  const noCumplen = (requisitos ?? []).filter((r: any) => r.cumple === false).length;
  const sinEvaluar = total - cumplen - noCumplen;

  return (
    <div className="space-y-4">
      <div>
        <Link href="/procesos-gestion" className="inline-flex items-center gap-1 text-sm text-marmol-500 hover:text-flow-600 mb-2">
          <ChevronLeft size={14} /> Procesos y Sistemas de Gestión
        </Link>
        <h1 className="font-display text-2xl font-semibold text-secundario flex items-center gap-2">
          <Scale size={22} className="text-flow-600" /> Matriz de requisitos legales
        </h1>
        <p className="text-sm text-marmol-500 mt-1 max-w-2xl">
          Normas, leyes y reglamentos aplicables por proceso, con su artículo, si se cumple, el soporte y las acciones a
          seguir cuando no se cumple.
        </p>
      </div>

      {total > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="card p-3 text-center">
            <p className="text-xl font-semibold text-alto">{cumplen}</p>
            <p className="text-xs text-marmol-400">Cumplen</p>
          </div>
          <div className="card p-3 text-center">
            <p className="text-xl font-semibold text-bajo">{noCumplen}</p>
            <p className="text-xs text-marmol-400">No cumplen</p>
          </div>
          <div className="card p-3 text-center">
            <p className="text-xl font-semibold text-marmol-500">{sinEvaluar}</p>
            <p className="text-xs text-marmol-400">Sin evaluar</p>
          </div>
        </div>
      )}

      <ListaRequisitosLegales requisitosIniciales={(requisitos ?? []) as any} procesos={(procesos ?? []) as any} puedeEditar={perfil.rol === 'admin_th'} />
    </div>
  );
}
