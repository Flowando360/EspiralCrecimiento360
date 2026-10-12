'use client';

import { useState, useTransition } from 'react';
import { confirmarFirmaDotacion } from '@/app/(dashboard)/dotacion/actions';
import { CheckCircle2 } from 'lucide-react';

/** Botón de confirmación de recibido: el trabajador declara que recibió el elemento en buenas condiciones. */
export function ConfirmarRecibido({ entregaId }: { entregaId: string }) {
  const [buenas, setBuenas] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function confirmar() {
    setError(null);
    startTransition(async () => {
      const res = await confirmarFirmaDotacion(entregaId, buenas);
      if (!res.ok) setError(res.error);
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <label className="inline-flex items-center gap-1.5 text-xs text-marmol-600">
        <input type="checkbox" checked={buenas} onChange={(e) => setBuenas(e.target.checked)} />
        Lo recibí en buenas condiciones
      </label>
      <button
        type="button"
        disabled={pending || !buenas}
        onClick={confirmar}
        className="inline-flex items-center gap-1 text-xs bg-flow-500 hover:bg-flow-600 disabled:opacity-50 text-white font-medium rounded-lg px-2.5 py-1.5"
      >
        <CheckCircle2 size={13} /> {pending ? 'Confirmando…' : 'Confirmar recibido'}
      </button>
      {error && <p className="text-xs text-bajo">{error}</p>}
    </div>
  );
}
