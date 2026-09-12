'use client';

import { useState, useTransition } from 'react';
import { agregarElementoIdentidad, actualizarElementoIdentidad, eliminarElementoIdentidad } from '@/app/(dashboard)/administracion/identidad/actions';
import { Trash2, Plus, Pencil, Check, X } from 'lucide-react';

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

  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [edNombre, setEdNombre] = useState('');
  const [edDescripcion, setEdDescripcion] = useState('');

  function iniciarEdicion(e: Elemento) {
    setEditandoId(e.id);
    setEdNombre(e.nombre);
    setEdDescripcion(e.descripcion ?? '');
  }

  function guardarEdicion(id: string) {
    if (!edNombre.trim()) return;
    startTransition(async () => {
      const res = await actualizarElementoIdentidad(id, edNombre, edDescripcion);
      if (res.ok) {
        setElementos((prev) => prev.map((e) => (e.id === id ? { ...e, nombre: edNombre, descripcion: edDescripcion || null } : e)));
        setEditandoId(null);
      }
    });
  }

  return (
    <div className="card p-5">
      <h3 className="font-display font-semibold text-secundario mb-3">{titulo}</h3>

      <div className="space-y-2 mb-4">
        {elementos.map((e) =>
          editandoId === e.id ? (
            <div key={e.id} className="space-y-1.5 border-b border-marmol-100 pb-2 bg-flow-50/40 -mx-1 px-1 rounded">
              <input value={edNombre} onChange={(ev) => setEdNombre(ev.target.value)} className="w-full rounded-lg border border-marmol-200 px-2 py-1 text-sm" />
              <input value={edDescripcion} onChange={(ev) => setEdDescripcion(ev.target.value)} placeholder="Descripción" className="w-full rounded-lg border border-marmol-200 px-2 py-1 text-xs" />
              <div className="flex items-center gap-2">
                <button onClick={() => guardarEdicion(e.id)} className="inline-flex items-center gap-1 rounded-lg bg-flow-500 hover:bg-flow-600 text-white text-xs font-medium px-2.5 py-1">
                  <Check size={11} /> Guardar
                </button>
                <button onClick={() => setEditandoId(null)} className="inline-flex items-center gap-1 rounded-lg border border-marmol-200 text-marmol-600 hover:bg-marmol-100 text-xs font-medium px-2.5 py-1">
                  <X size={11} /> Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div key={e.id} className="flex items-start justify-between gap-2 border-b border-marmol-100 pb-2">
              <div>
                <p className="text-sm font-medium text-marmol-800">{e.nombre}</p>
                {e.descripcion && <p className="text-xs text-marmol-500">{e.descripcion}</p>}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => iniciarEdicion(e)} className="text-marmol-300 hover:text-flow-600">
                  <Pencil size={13} />
                </button>
                <button onClick={() => eliminar(e.id)} className="text-marmol-300 hover:text-bajo">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          )
        )}
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
