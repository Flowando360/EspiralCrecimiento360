import Link from 'next/link';
import { Bell, ChevronRight } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';

const ETIQUETA_TIPO: Record<string, string> = {
  autoevaluacion: 'Autoevaluación',
  lider: 'Valorar como líder',
  par: 'Valorar como par',
  colaborador_a_cargo: 'Valorar como colaborador a cargo',
};

export interface TareaPendiente {
  evaluacionId: string;
  tipoEvaluador: string;
  colaboradorEvaluado: string;
  cicloNombre: string;
}

/**
 * Lista de "fichas" (evaluacion_tareas) pendientes de la persona logueada,
 * con link directo a /espiral-crecimiento/evaluar/[evaluacionId]. Antes de
 * esto, las tareas se generaban bien al abrir un ciclo (ver
 * /api/evaluaciones) pero no había ninguna pantalla que las mostrara —
 * nadie tenía cómo llegar a valorar sin conocer de memoria la URL.
 */
export function TareasPendientesEvaluacion({ tareas }: { tareas: TareaPendiente[] }) {
  if (tareas.length === 0) {
    return (
      <EmptyState
        icon={Bell}
        titulo="Sin Encuentros de Crecimiento pendientes por ahora"
        descripcion="Cuando se abra un nuevo ciclo o tengas una valoración pendiente, aparecerá aquí."
      />
    );
  }

  return (
    <div className="card p-5">
      <h2 className="font-display text-base font-semibold text-secundario flex items-center gap-2 mb-4">
        <Bell size={16} /> Encuentros de Crecimiento pendientes ({tareas.length})
      </h2>
      <div className="space-y-2">
        {tareas.map((t) => (
          <Link
            key={t.evaluacionId + t.tipoEvaluador}
            href={`/espiral-crecimiento/evaluar/${t.evaluacionId}`}
            className="flex items-center justify-between gap-3 py-2.5 px-3 -mx-3 rounded-lg border-b border-marmol-100 last:border-0 hover:bg-marmol-50 transition"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-marmol-900">
                {ETIQUETA_TIPO[t.tipoEvaluador] ?? t.tipoEvaluador}
                {t.tipoEvaluador !== 'autoevaluacion' && `: ${t.colaboradorEvaluado}`}
              </p>
              <p className="text-xs text-marmol-400">{t.cicloNombre}</p>
            </div>
            <ChevronRight size={16} className="text-marmol-300 shrink-0" />
          </Link>
        ))}
      </div>
    </div>
  );
}
