'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { otorgarReconocimiento } from '@/app/(dashboard)/nexa/reconocimientos/actions';
import { Award } from 'lucide-react';

type Colaborador = { id: string; nombre_completo: string };

export function FormularioOtorgarReconocimiento({ colaboradores }: { colaboradores: Colaborador[] }) {
  const router = useRouter();
  const [mostrar, setMostrar] = useState(false);
  const [colaboradorId, setColaboradorId] = useState(colaboradores[0]?.id ?? '');
  const [motivo, setMotivo] = useState('');
  const [puntos, setPuntos] = useState('10');
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function otorgar() {
    setError(null);
    startTransition(async () => {
      const res = await otorgarReconocimiento({
        colaboradorId,
        motivo,
        puntos: Number(puntos) || 0,
      });
      if (res.ok) {
        setMotivo('');
        setPuntos('10');
        setMostrar(false);
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  }

  if (colaboradores.length === 0) return null;

  if (!mostrar) {
    return (
      <button
        type="button"
        onClick={() => setMostrar(true)}
        className="inline-flex items-center gap-1.5 rounded-lg bg-flow-500 hover:bg-flow-600 text-white text-sm font-medium px-3.5 py-2 transition"
      >
        <Award size={16} /> Otorgar reconocimiento
      </button>
    );
  }

  return (
    <div className="card p-4 space-y-3 max-w-md">
      <select
        value={colaboradorId}
        onChange={(e) => setColaboradorId(e.target.value)}
        className="w-full rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm"
      >
        {colaboradores.map((c) => (
          <option key={c.id} value={c.id}>
            {c.nombre_completo}
          </option>
        ))}
      </select>
      <input
        type="text"
        placeholder="Motivo"
        value={motivo}
        onChange={(e) => setMotivo(e.target.value)}
        className="w-full rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm"
      />
      <input
        type="number"
        min={0}
        placeholder="Puntos"
        value={puntos}
        onChange={(e) => setPuntos(e.target.value)}
        className="w-full rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm"
      />
      {error && <p className="text-sm text-bajo">{error}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          disabled={pending || !motivo || !colaboradorId}
          onClick={otorgar}
          className="rounded-lg bg-flow-500 hover:bg-flow-600 disabled:opacity-40 text-white text-sm font-medium px-4 py-2 transition"
        >
          {pending ? 'Otorgando…' : 'Otorgar'}
        </button>
        <button
          type="button"
          onClick={() => setMostrar(false)}
          className="rounded-lg border border-marmol-200 text-marmol-500 text-sm font-medium px-4 py-2 transition"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
