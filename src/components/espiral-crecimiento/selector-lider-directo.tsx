'use client';

import { useState, useTransition } from 'react';
import { actualizarLiderDirecto } from '@/app/(dashboard)/administracion/organigrama/actions';

interface Opcion {
  id: string;
  nombre_completo: string;
}

export function SelectorLiderDirecto({
  colaboradorId,
  liderIdInicial,
  opciones,
}: {
  colaboradorId: string;
  liderIdInicial: string | null;
  opciones: Opcion[];
}) {
  const [liderId, setLiderId] = useState(liderIdInicial ?? '');
  const [pending, startTransition] = useTransition();
  const [estado, setEstado] = useState<'idle' | 'ok' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  function onChange(nuevoId: string) {
    const anterior = liderId;
    setLiderId(nuevoId);
    setEstado('idle');
    setError(null);
    startTransition(async () => {
      const res = await actualizarLiderDirecto(colaboradorId, nuevoId || null);
      if (res.ok) {
        setEstado('ok');
      } else {
        setLiderId(anterior);
        setEstado('error');
        setError(res.error);
      }
    });
  }

  return (
    <div>
      <select
        value={liderId}
        disabled={pending}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-marmol-200 px-2 py-1 text-sm bg-white disabled:opacity-60"
      >
        <option value="">— Sin líder (nivel 1) —</option>
        {opciones.map((o) => (
          <option key={o.id} value={o.id}>
            {o.nombre_completo}
          </option>
        ))}
      </select>
      {pending && <p className="text-xs text-marmol-400 mt-1">Guardando…</p>}
      {!pending && estado === 'ok' && <p className="text-xs text-alto mt-1">Guardado</p>}
      {!pending && estado === 'error' && <p className="text-xs text-bajo mt-1">{error}</p>}
    </div>
  );
}
