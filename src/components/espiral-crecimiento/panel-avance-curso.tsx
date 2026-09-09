'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { actualizarProgresoCurso } from '@/app/(dashboard)/nexa/formacion/actions';
import { CheckCircle2 } from 'lucide-react';

export function PanelAvanceCurso({ rutaId, progresoInicial }: { rutaId: string; progresoInicial: number }) {
  const router = useRouter();
  const [progreso, setProgreso] = useState(progresoInicial);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function guardar(valor: number) {
    setError(null);
    startTransition(async () => {
      const res = await actualizarProgresoCurso({ rutaId, progresoPct: valor });
      if (res.ok) {
        setProgreso(valor);
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  }

  const modificado = progreso !== progresoInicial;

  return (
    <div className="mt-3 space-y-1.5" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center gap-2">
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={progreso}
          onChange={(e) => setProgreso(Number(e.target.value))}
          disabled={pending}
          className="flex-1 accent-flow-500"
        />
        <span className="text-xs text-marmol-500 w-9 text-right">{progreso}%</span>
      </div>
      <div className="flex items-center gap-3">
        {modificado && (
          <button
            type="button"
            onClick={() => guardar(progreso)}
            disabled={pending}
            className="text-xs font-medium text-flow-600 hover:text-flow-700 disabled:opacity-40"
          >
            {pending ? 'Guardando…' : 'Guardar avance'}
          </button>
        )}
        <button
          type="button"
          onClick={() => guardar(100)}
          disabled={pending || progreso >= 100}
          className="inline-flex items-center gap-1 text-xs font-medium text-marmol-500 hover:text-flow-700 disabled:opacity-40"
        >
          <CheckCircle2 size={12} /> Marcar como completado
        </button>
      </div>
      {error && <p className="text-xs text-bajo">{error}</p>}
    </div>
  );
}
