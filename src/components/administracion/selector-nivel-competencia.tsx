'use client';

import { useState, useTransition } from 'react';
import { actualizarNivelCompetencia } from '@/app/(dashboard)/administracion/competencias/actions';
import { NIVELES_CARGO, type NivelCargo } from '@/lib/competencias/nivel-cargo';

export function SelectorNivelCompetencia({ competenciaId, nivelInicial }: { competenciaId: string; nivelInicial: NivelCargo }) {
  const [nivel, setNivel] = useState<NivelCargo>(nivelInicial);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function cambiar(nuevo: NivelCargo) {
    const anterior = nivel;
    setNivel(nuevo);
    setError(null);
    startTransition(async () => {
      const res = await actualizarNivelCompetencia({ competenciaId, nivelMinimo: nuevo });
      if (!res.ok) {
        setNivel(anterior);
        setError(res.error);
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-0.5">
      <select
        value={nivel}
        disabled={pending}
        onChange={(e) => cambiar(e.target.value as NivelCargo)}
        aria-label="Nivel mínimo de cargo"
        className="rounded-lg border border-marmol-200 px-2 py-1 text-sm disabled:opacity-60"
      >
        {NIVELES_CARGO.map((n) => (
          <option key={n.value} value={n.value}>
            {n.value === 'operativo' ? 'Todos los cargos' : `Desde ${n.label.toLowerCase()}`}
          </option>
        ))}
      </select>
      {error && <span className="text-xs text-bajo">{error}</span>}
    </div>
  );
}
