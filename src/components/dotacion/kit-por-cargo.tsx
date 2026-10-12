'use client';

import { useState, useTransition } from 'react';
import { agregarKitCargo, eliminarKitCargo } from '@/app/(dashboard)/dotacion/actions';
import { Plus, Trash2 } from 'lucide-react';

interface Cargo {
  id: string;
  nombre: string;
}
interface Articulo {
  id: string;
  nombre: string;
  categoria: string;
  referencia: string | null;
}
interface Kit {
  id: string;
  cargo_id: string;
  articulo_id: string;
  cantidad: number;
}

const campo = 'rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm';

/** Kit de dotación por cargo: qué artículos le corresponden a cada cargo y en qué cantidad. */
export function KitPorCargo({ cargos, articulos, kitsIniciales }: { cargos: Cargo[]; articulos: Articulo[]; kitsIniciales: Kit[] }) {
  const [kits, setKits] = useState(kitsIniciales);
  const [cargoId, setCargoId] = useState('');
  const [articuloId, setArticuloId] = useState('');
  const [cantidad, setCantidad] = useState('1');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const articulosPorId = new Map(articulos.map((a) => [a.id, a]));
  const cargoNombre = new Map(cargos.map((c) => [c.id, c.nombre]));
  const kitDelCargo = kits.filter((k) => k.cargo_id === cargoId);

  function agregar() {
    setError(null);
    startTransition(async () => {
      const res = await agregarKitCargo({ cargoId, articuloId, cantidad: Number(cantidad) || 1 });
      if (res.ok) {
        setKits((prev) => [...prev, { id: res.id, cargo_id: cargoId, articulo_id: articuloId, cantidad: Number(cantidad) || 1 }]);
        setArticuloId('');
        setCantidad('1');
      } else {
        setError(res.error);
      }
    });
  }

  function quitar(id: string) {
    startTransition(async () => {
      const res = await eliminarKitCargo(id);
      if (res.ok) setKits((prev) => prev.filter((k) => k.id !== id));
      else setError(res.error);
    });
  }

  return (
    <div className="card p-4 space-y-4">
      <div>
        <h2 className="font-display font-semibold text-secundario text-sm">Kit de dotación por cargo</h2>
        <p className="text-xs text-marmol-400 mt-0.5">
          Define qué artículos le corresponden a cada cargo. El área define el kit; las fechas de entrega siguen siendo las de ley.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <select className={campo} value={cargoId} onChange={(e) => setCargoId(e.target.value)}>
          <option value="">Selecciona un cargo…</option>
          {cargos.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </select>
        {cargoId && (
          <>
            <select className={campo} value={articuloId} onChange={(e) => setArticuloId(e.target.value)}>
              <option value="">Artículo…</option>
              {articulos.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.categoria} — {a.nombre}
                  {a.referencia ? ` (Ref. ${a.referencia})` : ''}
                </option>
              ))}
            </select>
            <input className={`${campo} w-20`} type="number" min={1} value={cantidad} onChange={(e) => setCantidad(e.target.value)} />
            <button
              type="button"
              onClick={agregar}
              disabled={pending || !articuloId}
              className="inline-flex items-center gap-1 rounded-lg bg-flow-500 hover:bg-flow-600 disabled:opacity-40 text-white text-sm font-medium px-3 py-1.5"
            >
              <Plus size={14} /> Agregar al kit
            </button>
          </>
        )}
      </div>

      {error && <p className="text-xs text-bajo">{error}</p>}

      {cargoId && (
        <div className="divide-y divide-marmol-100 rounded-lg border border-marmol-100">
          {kitDelCargo.length === 0 ? (
            <p className="p-3 text-sm text-marmol-500">
              {cargoNombre.get(cargoId)} aún no tiene kit definido.
            </p>
          ) : (
            kitDelCargo.map((k) => {
              const a = articulosPorId.get(k.articulo_id);
              return (
                <div key={k.id} className="flex items-center justify-between px-3 py-2 text-sm">
                  <span>
                    {a?.nombre ?? 'Artículo'} {a?.referencia ? <span className="text-xs text-marmol-400">· Ref. {a.referencia}</span> : null}
                  </span>
                  <span className="flex items-center gap-3">
                    <span className="text-marmol-600">× {k.cantidad}</span>
                    <button type="button" onClick={() => quitar(k.id)} className="text-marmol-300 hover:text-bajo" title="Quitar del kit">
                      <Trash2 size={14} />
                    </button>
                  </span>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
