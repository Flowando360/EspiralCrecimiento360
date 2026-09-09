import type { LucideIcon } from 'lucide-react';

export function EmptyState({
  icon: Icon,
  titulo,
  descripcion,
}: {
  icon: LucideIcon;
  titulo: string;
  descripcion?: string;
}) {
  return (
    <div className="card flex flex-col items-center justify-center gap-2 py-16 text-center">
      <Icon size={28} className="text-marmol-300" />
      <p className="text-sm font-medium text-marmol-700">{titulo}</p>
      {descripcion && <p className="text-xs text-marmol-400 max-w-sm">{descripcion}</p>}
    </div>
  );
}
