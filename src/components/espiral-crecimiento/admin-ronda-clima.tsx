'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { abrirRondaClima, cerrarRondaClima } from '@/app/(dashboard)/nexa/clima/actions';

export function AdminRondaClima({ rondaAbierta }: { rondaAbierta: { id: string; nombre: string } | null }) {
  const router = useRouter();
  const [nombre, setNombre] = useState('');
  const [mostrarForm, setMostrarForm] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function abrir() {
    setError(null);
    startTransition(async () => {
      const res = await abrirRondaClima({ nombre });
      if (res.ok) {
        setNombre('');
        setMostrarForm(false);
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  }

  function cerrar() {
    if (!rondaAbierta) return;
    setError(null);
    startTransition(async () => {
      const res = await cerrarRondaClima(rondaAbierta.id);
      if (res.ok) {
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  }

  if (rondaAbierta) {
    return (
      <div className="card p-4 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="text-sm font-medium text-marmol-800">Ronda abierta: {rondaAbierta.nombre}</p>
          <p className="text-xs text-marmol-500">Ciérrala cuando quieras fijar los resultados de esta medición.</p>
        </div>
        <button
          type="button"
          disabled={pending}
          onClick={cerrar}
          className="rounded-lg border border-marmol-200 text-marmol-600 hover:border-bajo hover:text-bajo text-sm font-medium px-4 py-2 transition disabled:opacity-40"
        >
          {pending ? 'Cerrando…' : 'Cerrar ronda'}
        </button>
        {error && <p className="text-sm text-bajo w-full">{error}</p>}
      </div>
    );
  }

  if (!mostrarForm) {
    return (
      <button
        type="button"
        onClick={() => setMostrarForm(true)}
        className="inline-flex items-center gap-1.5 rounded-lg bg-flow-500 hover:bg-flow-600 text-white text-sm font-medium px-3.5 py-2 transition"
      >
        Abrir nueva ronda de clima
      </button>
    );
  }

  return (
    <div className="card p-4 space-y-3 max-w-md">
      <input
        type="text"
        placeholder='Nombre de la ronda, ej. "Clima 2do semestre 2026"'
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        className="w-full rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm"
      />
      {error && <p className="text-sm text-bajo">{error}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          disabled={pending || !nombre.trim()}
          onClick={abrir}
          className="rounded-lg bg-flow-500 hover:bg-flow-600 disabled:opacity-40 text-white text-sm font-medium px-4 py-2 transition"
        >
          {pending ? 'Abriendo…' : 'Abrir ronda'}
        </button>
        <button
          type="button"
          onClick={() => setMostrarForm(false)}
          className="rounded-lg border border-marmol-200 text-marmol-500 text-sm font-medium px-4 py-2 transition"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
