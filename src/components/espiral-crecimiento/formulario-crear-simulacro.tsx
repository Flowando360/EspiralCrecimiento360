'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { crearSimulacro } from '@/app/(dashboard)/nexa/simulacros/actions';
import { Plus } from 'lucide-react';

export function FormularioCrearSimulacro() {
  const router = useRouter();
  const [mostrar, setMostrar] = useState(false);
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [fecha, setFecha] = useState('');
  const [participantesEsperados, setParticipantesEsperados] = useState('');
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function crear() {
    setError(null);
    startTransition(async () => {
      const res = await crearSimulacro({
        titulo,
        descripcion: descripcion || undefined,
        fecha: fecha || undefined,
        participantesEsperados: participantesEsperados ? Number(participantesEsperados) : undefined,
      });
      if (res.ok) {
        setTitulo('');
        setDescripcion('');
        setFecha('');
        setParticipantesEsperados('');
        setMostrar(false);
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  }

  if (!mostrar) {
    return (
      <button
        type="button"
        onClick={() => setMostrar(true)}
        className="inline-flex items-center gap-1.5 rounded-lg bg-flow-500 hover:bg-flow-600 text-white text-sm font-medium px-3.5 py-2 transition"
      >
        <Plus size={16} /> Nuevo simulacro
      </button>
    );
  }

  return (
    <div className="card p-4 space-y-3 max-w-md">
      <input
        type="text"
        placeholder="Título"
        value={titulo}
        onChange={(e) => setTitulo(e.target.value)}
        className="w-full rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm"
      />
      <textarea
        placeholder="Descripción (opcional)…"
        value={descripcion}
        onChange={(e) => setDescripcion(e.target.value)}
        rows={2}
        className="w-full rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm"
      />
      <div className="grid grid-cols-2 gap-2">
        <input
          type="date"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          className="w-full rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm"
        />
        <input
          type="number"
          min={0}
          placeholder="Participantes esperados"
          value={participantesEsperados}
          onChange={(e) => setParticipantesEsperados(e.target.value)}
          className="w-full rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm"
        />
      </div>
      {error && <p className="text-sm text-bajo">{error}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          disabled={pending || !titulo}
          onClick={crear}
          className="rounded-lg bg-flow-500 hover:bg-flow-600 disabled:opacity-40 text-white text-sm font-medium px-4 py-2 transition"
        >
          {pending ? 'Creando…' : 'Crear simulacro'}
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
