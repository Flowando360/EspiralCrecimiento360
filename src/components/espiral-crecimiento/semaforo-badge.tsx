import { cn, etiquetaSemaforo } from '@/lib/utils';
import type { SemaforoNivel } from '@/types/colaborador';

export function SemaforoBadge({ nivel }: { nivel: SemaforoNivel | null | undefined }) {
  if (!nivel) {
    return (
      <span className="inline-flex items-center rounded-full border border-marmol-200 bg-marmol-100 px-2.5 py-0.5 text-xs font-medium text-marmol-400">
        Sin datos
      </span>
    );
  }

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        nivel === 'alto' && 'badge-alto',
        nivel === 'medio' && 'badge-medio',
        nivel === 'bajo' && 'badge-bajo'
      )}
    >
      {etiquetaSemaforo[nivel]}
    </span>
  );
}
