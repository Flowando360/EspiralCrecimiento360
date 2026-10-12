'use client';

import { useState, useTransition } from 'react';
import { enviarAEvaluacionLider } from '@/app/(dashboard)/reclutamiento/actions';
import { Send } from 'lucide-react';

/** Paso 2 del flujo: Talento Humano elige el líder que evaluará al candidato y por cuánto tiempo lo verá. */
export function EnviarALider({ postulacionId, lideres }: { postulacionId: string; lideres: { id: string; nombre_completo: string }[] }) {
  const [liderId, setLiderId] = useState('');
  const [dias, setDias] = useState('30');
  const [error, setError] = useState<string | null>(null);
  const [enviado, setEnviado] = useState(false);
  const [pending, startTransition] = useTransition();

  function enviar() {
    setError(null);
    startTransition(async () => {
      const res = await enviarAEvaluacionLider(postulacionId, liderId, Number(dias) || 30);
      if (res.ok) setEnviado(true);
      else setError(res.error);
    });
  }

  if (enviado) return <p className="text-xs text-alto">Enviado al líder para evaluación.</p>;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select value={liderId} onChange={(e) => setLiderId(e.target.value)} className="rounded-lg border border-marmol-200 px-2 py-1 text-xs">
        <option value="">Líder evaluador…</option>
        {lideres.map((l) => (
          <option key={l.id} value={l.id}>
            {l.nombre_completo}
          </option>
        ))}
      </select>
      <label className="text-xs text-marmol-500 flex items-center gap-1">
        Ver por
        <input type="number" min={1} max={60} value={dias} onChange={(e) => setDias(e.target.value)} className="w-14 rounded-lg border border-marmol-200 px-2 py-1 text-xs" />
        días
      </label>
      <button
        type="button"
        onClick={enviar}
        disabled={pending || !liderId}
        className="inline-flex items-center gap-1 rounded-lg bg-flow-500 hover:bg-flow-600 disabled:opacity-40 text-white text-xs font-medium px-2.5 py-1"
      >
        <Send size={12} /> Enviar al líder
      </button>
      {error && <p className="w-full text-xs text-bajo">{error}</p>}
    </div>
  );
}
