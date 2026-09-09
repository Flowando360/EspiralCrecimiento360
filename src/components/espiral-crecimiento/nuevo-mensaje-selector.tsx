'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';

export function NuevoMensajeSelector({ personas }: { personas: { id: string; nombre_completo: string }[] }) {
  const [mostrar, setMostrar] = useState(false);
  const [destinatarioId, setDestinatarioId] = useState('');
  const router = useRouter();

  if (!mostrar) {
    return (
      <button
        type="button"
        onClick={() => setMostrar(true)}
        className="inline-flex items-center gap-1.5 rounded-lg bg-flow-500 hover:bg-flow-600 text-white text-sm font-medium px-3.5 py-2 transition"
      >
        <Plus size={16} /> Nuevo mensaje
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={destinatarioId}
        onChange={(e) => setDestinatarioId(e.target.value)}
        className="rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm"
      >
        <option value="">Selecciona una persona…</option>
        {personas.map((p) => (
          <option key={p.id} value={p.id}>
            {p.nombre_completo}
          </option>
        ))}
      </select>
      <button
        type="button"
        disabled={!destinatarioId}
        onClick={() => router.push(`/mensajes/${destinatarioId}`)}
        className="rounded-lg bg-flow-500 hover:bg-flow-600 disabled:opacity-40 text-white text-sm font-medium px-3.5 py-1.5 transition"
      >
        Escribir
      </button>
    </div>
  );
}
