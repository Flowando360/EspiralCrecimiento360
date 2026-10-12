'use client';

import { useState, useTransition } from 'react';
import { devolverEvaluacionLider } from '@/app/(dashboard)/reclutamiento/actions';

export interface EvaluacionPendiente {
  id: string;
  candidato: string;
  vacante: string;
}

/** Paso 3 del flujo, del lado del líder: escribe sus apreciaciones y las devuelve a Talento Humano. */
export function EvaluacionesLider({ items }: { items: EvaluacionPendiente[] }) {
  const [pendientes, setPendientes] = useState(items);
  const [textos, setTextos] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function devolver(id: string) {
    setError(null);
    startTransition(async () => {
      const res = await devolverEvaluacionLider(id, textos[id] ?? '');
      if (res.ok) setPendientes((prev) => prev.filter((p) => p.id !== id));
      else setError(res.error);
    });
  }

  if (pendientes.length === 0) return <p className="text-sm text-marmol-500">No tienes candidatos pendientes de evaluar.</p>;

  return (
    <div className="space-y-3">
      {pendientes.map((p) => (
        <div key={p.id} className="card p-4 space-y-2">
          <p className="font-medium text-marmol-800">{p.candidato}</p>
          <p className="text-xs text-marmol-400">Vacante: {p.vacante}</p>
          <textarea
            value={textos[p.id] ?? ''}
            onChange={(e) => setTextos((prev) => ({ ...prev, [p.id]: e.target.value }))}
            rows={3}
            placeholder="Tus apreciaciones: experiencia, competencias y recomendación"
            className="w-full rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm"
          />
          <button
            type="button"
            onClick={() => devolver(p.id)}
            disabled={pending || (textos[p.id] ?? '').trim().length < 5}
            className="rounded-lg bg-flow-500 hover:bg-flow-600 disabled:opacity-40 text-white text-sm font-medium px-3 py-1.5"
          >
            Devolver a Talento Humano
          </button>
        </div>
      ))}
      {error && <p className="text-xs text-bajo">{error}</p>}
    </div>
  );
}
