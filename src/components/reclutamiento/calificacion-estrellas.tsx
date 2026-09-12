'use client';

import { Star } from 'lucide-react';

/** Calificación interna de 1 a 5 estrellas — clic para calificar, null = sin calificar. */
export function CalificacionEstrellas({
  valor,
  onCambiar,
  soloLectura,
  tamano = 15,
}: {
  valor: number | null;
  onCambiar?: (v: number) => void;
  soloLectura?: boolean;
  tamano?: number;
}) {
  return (
    <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={soloLectura}
          onClick={() => onCambiar?.(n)}
          title={`${n} estrella${n === 1 ? '' : 's'}`}
          className={soloLectura ? 'cursor-default' : 'cursor-pointer hover:scale-110 transition-transform'}
        >
          <Star
            size={tamano}
            className={valor != null && n <= valor ? 'fill-medio text-medio' : 'text-marmol-200'}
          />
        </button>
      ))}
    </div>
  );
}
