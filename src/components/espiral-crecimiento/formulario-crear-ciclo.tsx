'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { crearCiclo } from '@/app/(dashboard)/espiral-crecimiento/ciclos/actions';
import { Plus } from 'lucide-react';

export function FormularioCrearCiclo() {
  const router = useRouter();
  const [mostrar, setMostrar] = useState(false);
  const [nombre, setNombre] = useState('');
  const [fechaApertura, setFechaApertura] = useState('');
  const [fechaCierre, setFechaCierre] = useState('');
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function crear() {
    setError(null);
    startTransition(async () => {
      const res = await crearCiclo({ nombre, fechaApertura, fechaCierreRespuestas: fechaCierre });
      if (res.ok) {
        router.push(`/espiral-crecimiento/ciclos/${res.cicloId}`);
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
        <Plus size={16} /> Abrir nuevo ciclo
      </button>
    );
  }

  return (
    <div className="card p-4 space-y-3 w-full max-w-sm">
      <h3 className="text-sm font-semibold text-marmol-900">Nuevo ciclo</h3>
      <input
        type="text"
        placeholder="Nombre (ej. 2026 - Semestre 2)"
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        className="w-full rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm"
      />
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs text-marmol-500 mb-1">Apertura</label>
          <input
            type="date"
            value={fechaApertura}
            onChange={(e) => setFechaApertura(e.target.value)}
            className="w-full rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-marmol-500 mb-1">Cierre de respuestas</label>
          <input
            type="date"
            value={fechaCierre}
            onChange={(e) => setFechaCierre(e.target.value)}
            className="w-full rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm"
          />
        </div>
      </div>

      {error && <p className="text-xs text-bajo">{error}</p>}

      <div className="flex gap-2">
        <button
          type="button"
          disabled={pending || !nombre || !fechaApertura || !fechaCierre}
          onClick={crear}
          className="rounded-lg bg-flow-500 hover:bg-flow-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium px-3.5 py-1.5 transition"
        >
          {pending ? 'Creando…' : 'Crear ciclo'}
        </button>
        <button
          type="button"
          onClick={() => setMostrar(false)}
          className="rounded-lg border border-marmol-200 text-marmol-500 text-sm font-medium px-3.5 py-1.5 transition"
        >
          Cancelar
        </button>
      </div>

      <p className="text-xs text-marmol-400">
        Se crea en estado "Planeado". Desde su detalle podrás ajustar las ponderaciones y generar los
        Encuentros de Crecimiento para abrirlo.
      </p>
    </div>
  );
}
