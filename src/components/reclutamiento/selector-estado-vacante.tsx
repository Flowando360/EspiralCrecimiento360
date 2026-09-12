'use client';

import { useTransition } from 'react';
import { actualizarEstadoVacante } from '@/app/(dashboard)/reclutamiento/actions';

export function SelectorEstadoVacante({ vacanteId, estadoActual }: { vacanteId: string; estadoActual: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <select
      className="rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm bg-white disabled:opacity-50"
      defaultValue={estadoActual}
      disabled={pending}
      onChange={(e) => startTransition(() => { actualizarEstadoVacante(vacanteId, e.target.value as any); })}
    >
      <option value="abierta">Abierta</option>
      <option value="pausada">En pausa</option>
      <option value="cancelada">Cancelada</option>
      <option value="cubierta">Cubierto</option>
    </select>
  );
}
