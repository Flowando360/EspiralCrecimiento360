'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { crearItemContexto, actualizarItemContexto, eliminarItemContexto } from '@/app/(dashboard)/procesos-gestion/contexto/actions';
import { Plus, Trash2, Pencil, Check, X, ListChecks, GitPullRequestArrow } from 'lucide-react';
import { cn } from '@/lib/utils';

type TipoContexto = 'debilidad' | 'oportunidad' | 'fortaleza' | 'amenaza';

interface ItemContexto {
  id: string;
  tipo: TipoContexto;
  descripcion: string;
  orden: number;
}

const COLUMNAS: { tipo: TipoContexto; titulo: string; badge: string }[] = [
  { tipo: 'debilidad', titulo: 'Debilidades', badge: 'badge-bajo' },
  { tipo: 'oportunidad', titulo: 'Oportunidades', badge: 'badge-alto' },
  { tipo: 'fortaleza', titulo: 'Fortalezas', badge: 'badge-alto' },
  { tipo: 'amenaza', titulo: 'Amenazas', badge: 'badge-bajo' },
];

export function DetalleContexto({
  analisisId,
  itemsIniciales,
  conteoAcpmPorItem,
  puedeEditar,
}: {
  analisisId: string;
  itemsIniciales: ItemContexto[];
  conteoAcpmPorItem: Record<string, number>;
  puedeEditar: boolean;
}) {
  const [items, setItems] = useState(itemsIniciales);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [nuevoTexto, setNuevoTexto] = useState<Record<TipoContexto, string>>({ debilidad: '', oportunidad: '', fortaleza: '', amenaza: '' });
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [edTexto, setEdTexto] = useState('');

  function agregar(tipo: TipoContexto) {
    const descripcion = nuevoTexto[tipo].trim();
    if (!descripcion) return;
    setError(null);
    startTransition(async () => {
      const res = await crearItemContexto({ analisisId, tipo, descripcion });
      if (res.ok) {
        setItems((prev) => [...prev, { id: res.id, tipo, descripcion, orden: prev.length }]);
        setNuevoTexto((prev) => ({ ...prev, [tipo]: '' }));
      } else {
        setError(res.error);
      }
    });
  }

  function guardarEdicion(id: string) {
    const descripcion = edTexto.trim();
    if (!descripcion) return;
    startTransition(async () => {
      const res = await actualizarItemContexto({ id, descripcion });
      if (res.ok) {
        setItems((prev) => prev.map((i) => (i.id === id ? { ...i, descripcion } : i)));
        setEditandoId(null);
      } else {
        setError(res.error);
      }
    });
  }

  function eliminar(id: string) {
    if (!confirm('¿Eliminar este ítem?')) return;
    startTransition(async () => {
      const res = await eliminarItemContexto(id);
      if (res.ok) setItems((prev) => prev.filter((i) => i.id !== id));
      else setError(res.error);
    });
  }

  return (
    <div className="space-y-3">
      {error && <p className="text-xs text-bajo">{error}</p>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {COLUMNAS.map(({ tipo, titulo, badge }) => {
          const itemsColumna = items.filter((i) => i.tipo === tipo);
          return (
            <div key={tipo} className="card p-4 space-y-3">
              <div className="flex items-center gap-2">
                <span className={cn('text-xs rounded-full px-2 py-0.5 font-medium', badge)}>{itemsColumna.length}</span>
                <h2 className="font-display font-semibold text-secundario">{titulo}</h2>
              </div>

              <div className="space-y-2">
                {itemsColumna.length === 0 && <p className="text-xs text-marmol-400">Sin registros todavía.</p>}
                {itemsColumna.map((item) => (
                  <div key={item.id} id={`contexto-item-${item.id}`} className="rounded-lg border border-marmol-200 p-2.5 space-y-1.5">
                    {editandoId === item.id ? (
                      <div className="flex items-center gap-1.5">
                        <input
                          value={edTexto}
                          onChange={(e) => setEdTexto(e.target.value)}
                          className="flex-1 rounded-lg border border-marmol-200 px-2 py-1 text-sm"
                          autoFocus
                        />
                        <button onClick={() => guardarEdicion(item.id)} disabled={pending} className="text-alto">
                          <Check size={15} />
                        </button>
                        <button onClick={() => setEditandoId(null)} className="text-marmol-400">
                          <X size={15} />
                        </button>
                      </div>
                    ) : (
                      <p className="text-sm text-marmol-800">{item.descripcion}</p>
                    )}
                    <div className="flex items-center justify-between flex-wrap gap-x-3 gap-y-1">
                      <div className="flex items-center gap-3">
                        <Link
                          href={`/procesos-gestion/acpm?origenContexto=${item.id}&descripcion=${encodeURIComponent(item.descripcion)}`}
                          className="inline-flex items-center gap-1 text-xs text-flow-600 hover:underline"
                        >
                          <ListChecks size={12} />
                          Crear acción
                          {(conteoAcpmPorItem[item.id] ?? 0) > 0 && <span className="text-marmol-400">· {conteoAcpmPorItem[item.id]} ya creada(s)</span>}
                        </Link>
                        <Link
                          href={`/procesos-gestion/cambios?origenContexto=${item.id}&descripcion=${encodeURIComponent(item.descripcion)}`}
                          className="inline-flex items-center gap-1 text-xs text-marmol-400 hover:text-flow-600"
                          title="Crear gestión de cambio desde este ítem"
                        >
                          <GitPullRequestArrow size={12} />
                        </Link>
                      </div>
                      {puedeEditar && editandoId !== item.id && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setEditandoId(item.id);
                              setEdTexto(item.descripcion);
                            }}
                            className="text-marmol-300 hover:text-flow-600"
                          >
                            <Pencil size={12} />
                          </button>
                          <button onClick={() => eliminar(item.id)} className="text-marmol-300 hover:text-bajo">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {puedeEditar && (
                <div className="flex items-center gap-1.5 pt-1">
                  <input
                    value={nuevoTexto[tipo]}
                    onChange={(e) => setNuevoTexto((prev) => ({ ...prev, [tipo]: e.target.value }))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') agregar(tipo);
                    }}
                    placeholder={`Nueva ${titulo.toLowerCase().slice(0, -1)}...`}
                    className="flex-1 rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm"
                  />
                  <button onClick={() => agregar(tipo)} disabled={pending} className="text-flow-600 hover:text-flow-800">
                    <Plus size={16} />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
