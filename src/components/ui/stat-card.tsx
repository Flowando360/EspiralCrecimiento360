import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tono = 'neutral',
}: {
  label: string;
  value: string | number;
  hint?: string;
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
        <p className="text-xs font-medium text-marmol-500">{label}</p>
        {Icon && <Icon size={16} className="text-marmol-300" />}
      </div>
      <p className={cn('text-2xl font-display font-semibold', tonos[tono])}>{value}</p>
      {hint && <p className="text-xs text-marmol-400 mt-1">{hint}</p>}
    </div>
  );
}
