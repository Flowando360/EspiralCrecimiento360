'use client';

import { useState, useTransition } from 'react';
import { crearNota, actualizarNota, eliminarNota } from '@/app/(dashboard)/nexa/notebook/actions';
import { formatearFecha } from '@/lib/utils';
import { Plus, Trash2, Save } from 'lucide-react';

export interface NotaItem {
  id: string;
  titulo: string;
  contenido: string | null;
  updated_at: string;
}

function TarjetaNota({ nota, onEliminar }: { nota: NotaItem; onEliminar: (id: string) => void }) {
  const [titulo, setTitulo] = useState(nota.titulo);
  const [contenido, setContenido] = useState(nota.contenido ?? '');
  const [cambiado, setCambiado] = useState(false);
  const [pending, startTransition] = useTransition();

  function guardar() {
    startTransition(async () => {
      await actualizarNota({ id: nota.id, titulo, contenido });
      setCambiado(false);
    });
  }

  return (
    <div className="card p-4 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <input
          value={titulo}
          onChange={(e) => {
            setTitulo(e.target.value);
            setCambiado(true);
          }}
          className="flex-1 font-display font-semibold text-secundario bg-transparent border-none p-0 focus:outline-none"
        />
        <button type="button" onClick={() => onEliminar(nota.id)} className="text-marmol-300 hover:text-bajo shrink-0">
          <Trash2 size={14} />
        </button>
      </div>
      <textarea
        value={contenido}
        onChange={(e) => {
          setContenido(e.target.value);
          setCambiado(true);
        }}
        rows={4}
        placeholder="Escribe tus apuntes…"
        className="w-full text-sm text-marmol-700 bg-transparent border-none p-0 resize-none focus:outline-none"
      />
      <div className="flex items-center justify-between pt-1 border-t border-marmol-100">
        <p className="text-xs text-marmol-400">Actualizado {formatearFecha(nota.updated_at)}</p>
        {cambiado && (
          <button
            type="button"
            onClick={guardar}
            disabled={pending}
            className="inline-flex items-center gap-1 text-xs text-flow-600 hover:underline disabled:opacity-50"
          >
            <Save size={12} /> {pending ? 'Guardando…' : 'Guardar'}
          </button>
        )}
      </div>
    </div>
  );
}

export function NotebookLista({ notasIniciales }: { notasIniciales: NotaItem[] }) {
  const [notas, setNotas] = useState(notasIniciales);
  const [, startTransition] = useTransition();

  function agregar() {
    startTransition(async () => {
      const res = await crearNota({ titulo: 'Nueva nota', contenido: '' });
      if (res.ok) {
        setNotas((prev) => [{ id: res.id, titulo: 'Nueva nota', contenido: '', updated_at: new Date().toISOString() }, ...prev]);
      }
    });
  }

  function eliminar(id: string) {
    setNotas((prev) => prev.filter((n) => n.id !== id));
    startTransition(async () => {
      await eliminarNota(id);
    });
  }

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={agregar}
        className="inline-flex items-center gap-1.5 rounded-lg bg-flow-500 hover:bg-flow-600 text-white text-sm font-medium px-3.5 py-2 transition"
      >
        <Plus size={16} /> Nueva nota
      </button>

      {notas.length === 0 ? (
        <p className="text-sm text-marmol-400">Aún no tienes notas — crea la primera.</p>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {notas.map((n) => (
            <TarjetaNota key={n.id} nota={n} onEliminar={eliminar} />
          ))}
        </div>
      )}
    </div>
  );
}
