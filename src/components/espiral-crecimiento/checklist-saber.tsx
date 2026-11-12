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
import { FUENTES_EVIDENCIA, NIVELES_DOMINIO, NIVELES_REQUERIDOS, estadoSugerido } from '@/lib/saber/dominio';

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

type Item = Pick<VerificacionSaber, 'id' | 'item_evaluado' | 'estado' | 'evidencia_url' | 'observaciones' | 'nivel_dominio' | 'nivel_requerido' | 'fuente_evidencia' | 'fecha_evidencia'>;

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
    let siguiente = { ...actual, ...cambios };
    // Con nivel demostrado y nivel requerido, el estado se deriva (dominado / parcial / brecha).
    if ('nivel_dominio' in cambios || 'nivel_requerido' in cambios) {
      const sug = estadoSugerido(siguiente.nivel_dominio, siguiente.nivel_requerido);
      if (sug) siguiente = { ...siguiente, estado: sug };
    }
    setItems((prev) => prev.map((i) => (i.id === id ? siguiente : i)));
    startTransition(() => {
      actualizarVerificacionSaber({
        id,
        colaboradorId,
        estado: siguiente.estado,
        evidenciaUrl: siguiente.evidencia_url ?? undefined,
        observaciones: siguiente.observaciones ?? undefined,
        nivelDominio: siguiente.nivel_dominio ?? null,
        nivelRequerido: siguiente.nivel_requerido ?? null,
        fuenteEvidencia: (siguiente.fuente_evidencia as any) ?? null,
        fechaEvidencia: siguiente.fecha_evidencia ?? null,
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

          {/* Nivel de dominio, nivel que exige el cargo y fuente de la evidencia */}
          {puedeEditar ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <label className="text-[12px] text-marmol-500">
                Nivel que demuestra
                <select
                  value={item.nivel_dominio ?? ''}
                  onChange={(e) => actualizar(item.id, { nivel_dominio: e.target.value === '' ? null : Number(e.target.value) })}
                  className="mt-0.5 w-full rounded-lg border border-marmol-200 px-2 py-1 text-xs"
                >
                  <option value="">Sin definir</option>
                  {NIVELES_DOMINIO.map((n) => (
                    <option key={n.valor} value={n.valor}>{n.etiqueta}</option>
                  ))}
                </select>
              </label>
              <label className="text-[12px] text-marmol-500">
                Nivel que exige el cargo
                <select
                  value={item.nivel_requerido ?? ''}
                  onChange={(e) => actualizar(item.id, { nivel_requerido: e.target.value === '' ? null : Number(e.target.value) })}
                  className="mt-0.5 w-full rounded-lg border border-marmol-200 px-2 py-1 text-xs"
                >
                  <option value="">Sin definir</option>
                  {NIVELES_REQUERIDOS.map((n) => (
                    <option key={n.valor} value={n.valor}>{n.etiqueta}</option>
                  ))}
                </select>
              </label>
              <label className="text-[12px] text-marmol-500">
                Fuente de la evidencia
                <select
                  value={item.fuente_evidencia ?? ''}
                  onChange={(e) => actualizar(item.id, { fuente_evidencia: e.target.value === '' ? null : e.target.value, fecha_evidencia: e.target.value === '' ? null : item.fecha_evidencia ?? new Date().toISOString().slice(0, 10) })}
                  className="mt-0.5 w-full rounded-lg border border-marmol-200 px-2 py-1 text-xs"
                >
                  <option value="">Sin definir</option>
                  {FUENTES_EVIDENCIA.map((f) => (
                    <option key={f.valor} value={f.valor}>{f.etiqueta}</option>
                  ))}
                </select>
              </label>
            </div>
          ) : (
            (item.nivel_dominio != null || item.fuente_evidencia) && (
              <p className="text-xs text-marmol-500">
                {item.nivel_dominio != null && <>Nivel: {NIVELES_DOMINIO.find((n) => n.valor === item.nivel_dominio)?.etiqueta}{item.nivel_requerido != null ? ` (el cargo exige ${NIVELES_REQUERIDOS.find((n) => n.valor === item.nivel_requerido)?.etiqueta})` : ''}. </>}
                {item.fuente_evidencia && <>Evidencia: {FUENTES_EVIDENCIA.find((f) => f.valor === item.fuente_evidencia)?.etiqueta}.</>}
              </p>
            )
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
