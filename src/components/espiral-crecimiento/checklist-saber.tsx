'use client';

import { useState, useTransition } from 'react';
import {
  agregarVerificacionSaber,
  actualizarVerificacionSaber,
  eliminarVerificacionSaber,
} from '@/app/(dashboard)/espiral-crecimiento/colaboradores/[id]/saber/actions';
import { cn } from '@/lib/utils';
import { Plus, Trash2 } from 'lucide-react';
import type { BloqueSaber, EstadoVerificacionSaber, VerificacionSaber } from '@/types/colaborador';

const ETIQUETA_ESTADO: Record<EstadoVerificacionSaber, string> = {
  cumple: 'Cumple',
  cumple_parcial: 'Parcial',
  no_cumple_pendiente: 'No cumple',
};

const CLASE_ESTADO: Record<EstadoVerificacionSaber, string> = {
  cumple: 'badge-alto',
  cumple_parcial: 'badge-medio',
  no_cumple_pendiente: 'badge-bajo',
};

const ESTADOS: EstadoVerificacionSaber[] = ['cumple', 'cumple_parcial', 'no_cumple_pendiente'];

type Item = Pick<VerificacionSaber, 'id' | 'item_evaluado' | 'estado' | 'evidencia_url' | 'observaciones'>;

export function ChecklistSaber({
  colaboradorId,
  bloque,
  itemsIniciales,
  puedeEditar,
}: {
  colaboradorId: string;
  bloque: BloqueSaber;
  itemsIniciales: Item[];
  puedeEditar: boolean;
}) {
  const [items, setItems] = useState(itemsIniciales);
  const [nuevoItem, setNuevoItem] = useState('');
  const [, startTransition] = useTransition();

  function agregar() {
    const texto = nuevoItem.trim();
    if (!texto) return;
    startTransition(async () => {
      const res = await agregarVerificacionSaber({ colaboradorId, bloque, itemEvaluado: texto });
      if (res.ok && res.item) {
        setItems((prev) => [...prev, res.item as Item]);
        setNuevoItem('');
      }
    });
  }

  function actualizar(id: string, cambios: Partial<Item>) {
    const actual = items.find((i) => i.id === id);
    if (!actual) return;
    const siguiente = { ...actual, ...cambios };
    setItems((prev) => prev.map((i) => (i.id === id ? siguiente : i)));
    startTransition(() => {
      actualizarVerificacionSaber({
        id,
        colaboradorId,
        estado: siguiente.estado,
        evidenciaUrl: siguiente.evidencia_url ?? undefined,
        observaciones: siguiente.observaciones ?? undefined,
      });
    });
  }

  function eliminar(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
    startTransition(() => {
      eliminarVerificacionSaber({ id, colaboradorId });
    });
  }

  return (
    <div className="space-y-3">
      {items.length === 0 && <p className="text-sm text-marmol-400">Sin ítems verificados en este bloque.</p>}

      {items.map((item) => (
        <div key={item.id} className="rounded-lg border border-marmol-200 p-3 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-medium text-marmol-800">{item.item_evaluado}</p>
            {puedeEditar && (
              <button
                type="button"
                onClick={() => eliminar(item.id)}
                className="text-marmol-300 hover:text-bajo transition shrink-0"
                aria-label="Quitar ítem"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>

          {puedeEditar ? (
            <div className="flex gap-1.5">
              {ESTADOS.map((estado) => (
                <button
                  key={estado}
                  type="button"
                  onClick={() => actualizar(item.id, { estado })}
                  className={cn(
                    'rounded-full px-2.5 py-0.5 text-xs font-medium border transition',
                    item.estado === estado
                      ? CLASE_ESTADO[estado]
                      : 'border-marmol-200 text-marmol-400 hover:border-marmol-300'
                  )}
                >
                  {ETIQUETA_ESTADO[estado]}
                </button>
              ))}
            </div>
          ) : (
            <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', CLASE_ESTADO[item.estado])}>
              {ETIQUETA_ESTADO[item.estado]}
            </span>
          )}

          {puedeEditar && (
            <>
              <input
                type="text"
                placeholder="Enlace a evidencia (opcional)…"
                defaultValue={item.evidencia_url ?? ''}
                onBlur={(e) => actualizar(item.id, { evidencia_url: e.target.value })}
                className="w-full rounded-lg border border-marmol-200 px-2.5 py-1.5 text-xs"
              />
              <textarea
                placeholder="Observación (opcional)…"
                defaultValue={item.observaciones ?? ''}
                onBlur={(e) => actualizar(item.id, { observaciones: e.target.value })}
                rows={2}
                className="w-full rounded-lg border border-marmol-200 px-2.5 py-1.5 text-xs"
              />
            </>
          )}
          {!puedeEditar && item.observaciones && (
            <p className="text-xs text-marmol-500">{item.observaciones}</p>
          )}
        </div>
      ))}

      {puedeEditar && (
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Agregar ítem a verificar…"
            value={nuevoItem}
            onChange={(e) => setNuevoItem(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && agregar()}
            className="flex-1 rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm"
          />
          <button
            type="button"
            onClick={agregar}
            className="rounded-lg border border-marmol-200 hover:border-flow-300 px-2.5 text-marmol-500 transition"
            aria-label="Agregar ítem"
          >
            <Plus size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
