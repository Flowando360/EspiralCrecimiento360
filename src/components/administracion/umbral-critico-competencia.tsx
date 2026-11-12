'use client';

import { useState, useTransition } from 'react';
import { actualizarUmbralCompetencia } from '@/app/(dashboard)/administracion/competencias/actions';

/** Mínimo crítico de una competencia: si la nota consolidada queda por debajo, el resultado lo advierte aunque el índice sea alto. */
export function UmbralCriticoCompetencia({ competenciaId, umbralInicial, justificacionInicial }: { competenciaId: string; umbralInicial: number | null; justificacionInicial: string | null }) {
  const [umbral, setUmbral] = useState<string>(umbralInicial ? String(umbralInicial) : '');
  const [justificacion, setJustificacion] = useState(justificacionInicial ?? '');
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [guardado, setGuardado] = useState(false);

  const cambio = (umbral ? Number(umbral) : null) !== umbralInicial || (justificacion.trim() || null) !== (justificacionInicial ?? null);

  function guardar() {
    setError(null);
    setGuardado(false);
    startTransition(async () => {
      const res = await actualizarUmbralCompetencia({ competenciaId, umbral: umbral ? Number(umbral) : null, justificacion });
      if (!res.ok) setError(res.error);
      else setGuardado(true);
    });
  }

  return (
    <div className="w-full pt-2 mt-1 border-t border-marmol-100 flex items-start gap-2 flex-wrap">
      <label className="text-xs text-marmol-500 flex items-center gap-1.5">
        Mínimo crítico
        <select
          value={umbral}
          onChange={(e) => {
            setUmbral(e.target.value);
            setGuardado(false);
          }}
          className="rounded-lg border border-marmol-200 px-2 py-1 text-sm"
        >
          <option value="">Sin mínimo</option>
          <option value="2">Menos de 2</option>
          <option value="3">Menos de 3 (por debajo de «Esperado»)</option>
          <option value="4">Menos de 4</option>
        </select>
      </label>
      {umbral && (
        <input
          value={justificacion}
          onChange={(e) => {
            setJustificacion(e.target.value);
            setGuardado(false);
          }}
          placeholder="¿Por qué es crítico y por qué ese mínimo? (obligatorio)"
          className="flex-1 min-w-[14rem] rounded-lg border border-marmol-200 px-2.5 py-1 text-sm"
        />
      )}
      {cambio && (
        <button type="button" onClick={guardar} disabled={pending} className="rounded-lg bg-flow-500 hover:bg-flow-600 disabled:opacity-40 text-white text-xs font-medium px-3 py-1.5">
          {pending ? 'Guardando…' : 'Guardar'}
        </button>
      )}
      {guardado && <span className="text-xs text-alto">Guardado</span>}
      {error && <span className="text-xs text-bajo">{error}</span>}
    </div>
  );
}
