'use client';

import { useState, useTransition } from 'react';
import {
  agregarFechaEspecial,
  eliminarFechaEspecial,
} from '@/app/(dashboard)/espiral-crecimiento/colaboradores/[id]/fechas-especiales/actions';
import { formatearFecha } from '@/lib/utils';
import { Plus, Trash2 } from 'lucide-react';

export interface FechaEspecialItem {
  id: string;
  descripcion: string;
  fecha: string;
}

export function ListaFechasEspeciales({
  colaboradorId,
  itemsIniciales,
}: {
  colaboradorId: string;
  itemsIniciales: FechaEspecialItem[];
}) {
  const [items, setItems] = useState(itemsIniciales);
  const [descripcion, setDescripcion] = useState('');
  const [fecha, setFecha] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function agregar() {
    setError(null);
    startTransition(async () => {
      const res = await agregarFechaEspecial({ colaboradorId, descripcion, fecha });
      if (res.ok) {
        setItems((prev) => [...prev, res.fechaEspecial].sort((a, b) => a.fecha.localeCompare(b.fecha)));
        setDescripcion('');
        setFecha('');
      } else {
        setError(res.error);
      }
    });
  }

  function eliminar(id: string) {
    if (!confirm('¿Quitar esta fecha especial?')) return;
    setError(null);
    startTransition(async () => {
      const res = await eliminarFechaEspecial({ colaboradorId, id });
      if (res.ok) {
        setItems((prev) => prev.filter((i) => i.id !== id));
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <div>
      {items.length === 0 ? (
        <p className="text-sm text-marmol-400 mb-3">Sin fechas especiales registradas todavía.</p>
      ) : (
        <ul className="space-y-2 mb-3">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between border-b border-marmol-100 pb-2 last:border-0"
            >
              <div>
                <p className="text-sm font-medium text-marmol-800">{item.descripcion}</p>
                <p className="text-xs text-marmol-400">{formatearFecha(item.fecha)}</p>
              </div>
              <button
                type="button"
                onClick={() => eliminar(item.id)}
                disabled={pending}
                className="text-marmol-400 hover:text-bajo disabled:opacity-40"
              >
                <Trash2 size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          placeholder="ej. Cumpleaños, día de la profesión…"
          maxLength={120}
          className="flex-1 min-w-[200px] rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm"
        />
        <input
          type="date"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          className="rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm"
        />
        <button
          type="button"
          onClick={agregar}
          disabled={pending || !descripcion.trim() || !fecha}
          className="inline-flex items-center gap-1 rounded-lg bg-flow-500 hover:bg-flow-600 disabled:opacity-40 text-white text-xs font-medium px-3 py-1.5"
        >
          <Plus size={12} /> {pending ? 'Agregando…' : 'Agregar'}
        </button>
      </div>
      {error && <p className="mt-1.5 text-xs text-bajo">{error}</p>}
    </div>
  );
}
