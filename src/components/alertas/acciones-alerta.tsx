'use client';

import { useState, useTransition } from 'react';
import { actualizarEstadoAlerta } from '@/app/(dashboard)/alertas/actions';
import { Check, X } from 'lucide-react';

export function AccionesAlerta({ id }: { id: string }) {
  const [resuelta, setResuelta] = useState<'resuelta' | 'descartada' | null>(null);
  const [pending, startTransition] = useTransition();

  if (resuelta) {
    return (
      <span className="text-xs text-marmol-400 shrink-0">
        {resuelta === 'resuelta' ? 'Marcada como resuelta' : 'Descartada'}
      </span>
    );
  }

  function actualizar(estado: 'resuelta' | 'descartada') {
    startTransition(async () => {
      const res = await actualizarEstadoAlerta({ id, estado });
      if (res.ok) setResuelta(estado);
    });
  }

  return (
    <div className="flex items-center gap-1.5 shrink-0">
      <button
        type="button"
        disabled={pending}
        onClick={() => actualizar('resuelta')}
        title="Marcar como resuelta"
        className="inline-flex items-center justify-center h-7 w-7 rounded-lg border border-marmol-200 hover:border-alto hover:text-alto text-marmol-400 transition disabled:opacity-50"
      >
        <Check size={14} />
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => actualizar('descartada')}
        title="Descartar"
        className="inline-flex items-center justify-center h-7 w-7 rounded-lg border border-marmol-200 hover:border-bajo hover:text-bajo text-marmol-400 transition disabled:opacity-50"
      >
        <X size={14} />
      </button>
    </div>
  );
}
