'use client';

import { useState, useTransition } from 'react';
import { agregarElementoIdentidad, eliminarElementoIdentidad } from '@/app/(dashboard)/administracion/identidad/actions';
import { Trash2, Plus } from 'lucide-react';

interface Elemento {
  id: string;
  nombre: string;
  descripcion: string | null;
}

export function ListaElementosIdentidad({
  tipo,
  titulo,
  elementosIniciales,
}: {
  tipo: 'principio' | 'valor';
  titulo: string;
  elementosIniciales: Elemento[];
}) {
  const [elementos, setElementos] = useState(elementosIniciales);
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [, startTransition] = useTransition();

  function agregar() {
    if (!nombre.trim()) return;
    startTransition(async () => {
      const res = await agregarElementoIdentidad(tipo, nombre, descripcion);
      if (res.ok) {
        setElementos((prev) => [...prev, { id: crypto.randomUUID(), nombre, descripcion }]);
        setNombre('');
        setDescripcion('');
      }
    });
  }

  function eliminar(id: string) {
    setElementos((prev) => prev.filter((e) => e.id !== id));
    startTransition(async () => {
      await eliminarElementoIdentidad(id);
    });
  }

  return (
    <div className="card p-5">
      <h3 className="font-display font-semibold text-secundario mb-3">{titulo}</h3>

      <div className="space-y-2 mb-4">
        {elementos.map((e) => (
          <div key={e.id} className="flex items-start justify-between gap-2 border-b border-marmol-100 pb-2">
            <div>
              <p className="text-sm font-medium text-marmol-800">{e.nombre}</p>
              {e.descripcion && <p className="text-xs text-marmol-500">{e.descripcion}</p>}
            </div>
            <button onClick={() => eliminar(e.id)} className="text-marmol-300 hover:text-bajo shrink-0">
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        {elementos.length === 0 && <p className="text-sm text-marmol-400">Sin elementos todavía.</p>}
      </div>

      <div className="flex gap-2">
        <input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder={tipo === 'principio' ? 'Nombre del principio…' : 'Nombre del valor…'}
          className="flex-1 rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm"
        />
        <input
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          placeholder="Descripción (opcional)"
          className="flex-1 rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm"
        />
        <button onClick={agregar} className="rounded-lg bg-flow-500 hover:bg-flow-600 text-white px-3 py-1.5">
          <Plus size={16} />
        </button>
      </div>
    </div>
  );
}
