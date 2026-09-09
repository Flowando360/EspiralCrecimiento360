import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { SemaforoBadge } from '@/components/espiral-crecimiento/semaforo-badge';
import { notFound } from 'next/navigation';
import { ArrowLeft, FileText } from 'lucide-react';
import { guardarBriefForm } from './actions';

export default async function BriefPage({ params }: { params: { evaluacionId: string } }) {
  const perfil = await getPerfilActual();
  if (!perfil) return null;

  const supabase = createClient();

  const { data: evaluacion } = await supabase
    .from('evaluaciones')
    .select(
      `id, ciclo_id,
       colaborador:colaborador_evaluado_id(id, nombre_completo, empresa_id, lider_id),
       resultado:resultados_evaluacion(indice_hacer, indice_deber, semaforo_hacer, semaforo_deber)`
    )
    .eq('id', params.evaluacionId)
    .maybeSingle();

  if (!evaluacion) notFound();

  const colaborador = evaluacion.colaborador as any;
  const resultado = (evaluacion.resultado as any)?.[0];

  if (!colaborador || colaborador.empresa_id !== perfil.empresa_id) notFound();

  // El brief es material de preparación del líder; el colaborador evaluado
  // no tiene acceso, igual que en la política de RLS.
  const puedeEditar =
    perfil.rol === 'admin_th' || (perfil.rol === 'lider' && colaborador.lider_id === perfil.colaborador_id);
  if (!puedeEditar) notFound();

  const { data: brief } = await supabase
    .from('briefs_retroalimentacion')
    .select('*')
    .eq('evaluacion_id', params.evaluacionId)
    .maybeSingle();

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <Link
          href={`/espiral-crecimiento/ciclos/${evaluacion.ciclo_id}`}
          className="inline-flex items-center gap-1 text-xs text-marmol-400 hover:text-marmol-600 mb-2"
        >
          <ArrowLeft size={12} /> Volver al ciclo
        </Link>
        <h1 className="font-display text-2xl font-semibold text-secundario flex items-center gap-2">
          <FileText size={22} className="text-flow-600" /> Brief de retroalimentación
        </h1>
        <p className="text-sm text-marmol-500 mt-1">
          Prepara la reunión con {colaborador.nombre_completo}. Solo lo ven quien lo escribe y Talento Humano.
        </p>
      </div>

      <div className="card p-4 flex items-center gap-8">
        <div>
          <p className="text-xs text-marmol-500 mb-1">Hacer</p>
          <div className="flex items-center gap-2">
            <span className="font-display text-lg font-semibold text-secundario">
              {resultado?.indice_hacer ?? '—'}
            </span>
            <SemaforoBadge nivel={resultado?.semaforo_hacer} />
          </div>
        </div>
        <div>
          <p className="text-xs text-marmol-500 mb-1">Deber</p>
          <div className="flex items-center gap-2">
            <span className="font-display text-lg font-semibold text-secundario">
              {resultado?.indice_deber ?? '—'}
            </span>
            <SemaforoBadge nivel={resultado?.semaforo_deber} />
          </div>
        </div>
      </div>

      <form action={guardarBriefForm} className="card p-5 space-y-4">
        <input type="hidden" name="evaluacionId" value={params.evaluacionId} />

        <div>
          <label className="block text-sm font-medium text-marmol-700 mb-1">Talento central</label>
          <textarea
            name="talento_central"
            defaultValue={brief?.talento_central ?? ''}
            rows={2}
            className="w-full rounded-lg border border-marmol-200 px-3 py-2 text-sm"
            placeholder="Lo más fuerte de esta persona, para partir la conversación desde ahí…"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-marmol-700 mb-1">Resumen de Hacer</label>
          <textarea
            name="resumen_hacer"
            defaultValue={brief?.resumen_hacer ?? ''}
            rows={3}
            className="w-full rounded-lg border border-marmol-200 px-3 py-2 text-sm"
            placeholder="Lo más relevante del resultado en Hacer…"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-marmol-700 mb-1">Resumen de Deber</label>
          <textarea
            name="resumen_deber"
            defaultValue={brief?.resumen_deber ?? ''}
            rows={3}
            className="w-full rounded-lg border border-marmol-200 px-3 py-2 text-sm"
            placeholder="Lo más relevante del resultado en Deber…"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-marmol-700 mb-1">Sugerencias de enfoque</label>
          <textarea
            name="sugerencias_enfoque"
            defaultValue={brief?.sugerencias_enfoque ?? ''}
            rows={3}
            className="w-full rounded-lg border border-marmol-200 px-3 py-2 text-sm"
            placeholder="Cómo abordar la conversación, qué priorizar…"
          />
        </div>

        <button
          type="submit"
          className="rounded-lg bg-flow-500 hover:bg-flow-600 text-white text-sm font-medium px-4 py-2 transition"
        >
          Guardar
        </button>
      </form>
    </div>
  );
}
