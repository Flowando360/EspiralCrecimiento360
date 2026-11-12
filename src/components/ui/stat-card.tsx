import { cn } from '@/lib/utils';
import { Info, type LucideIcon } from 'lucide-react';

export function StatCard({
  label,
  value,
  hint,
  info,
  icon: Icon,
  tono = 'neutral',
}: {
  label: string;
  value: string | number;
  hint?: string;
  /** Explicación del indicador: qué mide, cómo se calcula y qué implica un valor alto o bajo. Se ve al pasar el cursor o enfocar la «i». */
  info?: string;
  icon?: LucideIcon;
  tono?: 'neutral' | 'alto' | 'medio' | 'bajo' | 'flow';
}) {
  const tonos: Record<string, string> = {
    neutral: 'text-secundario',
    alto: 'text-alto',
    medio: 'text-medio',
    bajo: 'text-bajo',
    flow: 'text-flow-600',
  };

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-medium text-marmol-500 flex items-center gap-1">
          {label}
          {info && (
            <span className="relative group inline-flex">
              <button type="button" aria-label={`¿Qué mide «${label}»?`} className="text-marmol-300 hover:text-flow-600 focus:text-flow-600 outline-none">
                <Info size={12} />
              </button>
              <span
                role="tooltip"
                className="pointer-events-none absolute left-0 top-full z-20 mt-1 w-60 rounded-lg bg-secundario text-white text-[11px] font-normal leading-snug p-2.5 shadow-lg opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity"
              >
                {info}
              </span>
            </span>
          )}
        </p>
        {Icon && <Icon size={16} className="text-marmol-300" />}
      </div>
      <p className={cn('text-2xl font-display font-semibold', tonos[tono])}>{value}</p>
      {hint && <p className="text-xs text-marmol-400 mt-1">{hint}</p>}
    </div>
  );
}
