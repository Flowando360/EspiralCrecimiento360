'use client';

import { useState, useTransition } from 'react';
import {
  crearArticuloCatalogo,
  eliminarArticuloCatalogo,
  actualizarActivoArticuloCatalogo,
  agregarTallaCatalogo,
  actualizarStockMinimo,
  eliminarTallaCatalogo,
  recibirEnBodega,
} from '@/app/(dashboard)/dotacion/actions';
import { Plus, Trash2, AlertTriangle, PackagePlus, EyeOff, Eye } from 'lucide-react';

interface Talla {
  id: string;
  talla: string;
  stock_disponible: number;
  stock_minimo: number;
}

interface Articulo {
  id: string;
  categoria: string;
  nombre: string;
  requiere_talla: boolean;
  activo: boolean;
  tallas: Talla[];
}

const campo = 'rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm';

export function CatalogoDotacion({ articulosIniciales }: { articulosIniciales: Articulo[] }) {
  const [articulos, setArticulos] = useState(articulosIniciales);
  const [pending, startTransition] = useTransition();

  const [categoria, setCategoria] = useState('');
  const [nombre, setNombre] = useState('');
  const [requiereTalla, setRequiereTalla] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function agregarArticulo() {
    setError(null);
    startTransition(async () => {
      const res = await crearArticuloCatalogo({ categoria, nombre, requiereTalla });
      if (res.ok) {
        setArticulos((prev) => [...prev, { id: res.id, categoria, nombre, requiere_talla: requiereTalla, activo: true, tallas: [] }]);
        setCategoria('');
        setNombre('');
      } else {
        setError(res.error);
      }
    });
  }

  function eliminarArticulo(id: string) {
    startTransition(async () => {
      const res = await eliminarArticuloCatalogo(id);
      if (res.ok) setArticulos((prev) => prev.filter((a) => a.id !== id));
      else setError(res.error);
    });
  }

  function alternarActivo(id: string, activo: boolean) {
    setArticulos((prev) => prev.map((a) => (a.id === id ? { ...a, activo } : a)));
    startTransition(() => { actualizarActivoArticuloCatalogo(id, activo); });
  }

  const porCategoria = articulos.reduce<Record<string, Articulo[]>>((acc, a) => {
    (acc[a.categoria] ??= []).push(a);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <div className="card p-4 space-y-2">
        <h2 className="text-sm font-medium text-marmol-700">Agregar artículo al catálogo</h2>
        <div className="flex flex-wrap items-center gap-2">
          <input className={campo} value={categoria} onChange={(e) => setCategoria(e.target.value)} placeholder="Categoría (ej. Calzado, Camisas, Cascos)" />
          <input className={campo} value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre del artículo" />
          <label className="flex items-center gap-1.5 text-sm text-marmol-600">
            <input type="checkbox" checked={requiereTalla} onChange={(e) => setRequiereTalla(e.target.checked)} /> Maneja tallas
          </label>
          <button
            type="button"
            onClick={agregarArticulo}
            disabled={pending || !categoria.trim() || !nombre.trim()}
            className="inline-flex items-center gap-1 rounded-lg bg-flow-500 hover:bg-flow-600 disabled:opacity-40 text-white text-sm font-medium px-3 py-1.5"
          >
            <Plus size={14} /> Agregar
          </button>
        </div>
        {error && <p className="text-xs text-bajo">{error}</p>}
      </div>

      {Object.keys(porCategoria).length === 0 ? (
        <div className="card p-6 text-sm text-marmol-500">Todavía no hay artículos en el catálogo.</div>
      ) : (
        Object.entries(porCategoria).map(([cat, items]) => (
          <div key={cat} className="card p-4 space-y-3">
            <h3 className="font-display font-semibold text-secundario text-sm">{cat}</h3>
            <div className="space-y-3">
              {items.map((a) => (
                <FilaArticulo key={a.id} articulo={a} onEliminar={eliminarArticulo} onAlternarActivo={alternarActivo} />
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function FilaArticulo({
  articulo,
  onEliminar,
  onAlternarActivo,
}: {
  articulo: Articulo;
  onEliminar: (id: string) => void;
  onAlternarActivo: (id: string, activo: boolean) => void;
}) {
  const [tallas, setTallas] = useState(articulo.tallas);
  const [mostrarAgregarTalla, setMostrarAgregarTalla] = useState(false);
  const [talla, setTalla] = useState('');
  const [stockInicial, setStockInicial] = useState('0');
  const [stockMinimo, setStockMinimo] = useState('0');
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function agregarTalla() {
    setError(null);
    startTransition(async () => {
      const res = await agregarTallaCatalogo({
        articuloId: articulo.id,
        talla: talla || 'Única',
        stockInicial: Number(stockInicial) || 0,
        stockMinimo: Number(stockMinimo) || 0,
      });
      if (res.ok) {
        setTallas((prev) => [...prev, { id: crypto.randomUUID(), talla: talla || 'Única', stock_disponible: Number(stockInicial) || 0, stock_minimo: Number(stockMinimo) || 0 }]);
        setTalla('');
        setStockInicial('0');
        setStockMinimo('0');
        setMostrarAgregarTalla(false);
      } else {
        setError(res.error);
      }
    });
  }

  function eliminarTalla(id: string) {
    setTallas((prev) => prev.filter((t) => t.id !== id));
    startTransition(() => { eliminarTallaCatalogo(id); });
  }

  function recibir(id: string) {
    const cantidadStr = window.prompt('¿Cuántas unidades llegaron a bodega?');
    const cantidad = Number(cantidadStr);
    if (!cantidadStr || !Number.isFinite(cantidad) || cantidad <= 0) return;
    setTallas((prev) => prev.map((t) => (t.id === id ? { ...t, stock_disponible: t.stock_disponible + cantidad } : t)));
    startTransition(() => { recibirEnBodega(id, cantidad); });
  }

  function cambiarStockMinimo(id: string, valor: string) {
    const num = Number(valor) || 0;
    setTallas((prev) => prev.map((t) => (t.id === id ? { ...t, stock_minimo: num } : t)));
    startTransition(() => { actualizarStockMinimo(id, num); });
  }

  return (
    <div className={articulo.activo ? '' : 'opacity-50'}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-marmol-800">
          {articulo.nombre} {!articulo.requiere_talla && <span className="text-xs text-marmol-400">(sin tallas)</span>}
        </p>
        <div className="flex items-center gap-2 shrink-0">
          <button type="button" onClick={() => onAlternarActivo(articulo.id, !articulo.activo)} title={articulo.activo ? 'Desactivar' : 'Reactivar'} className="text-marmol-300 hover:text-flow-600">
            {articulo.activo ? <Eye size={14} /> : <EyeOff size={14} />}
          </button>
          <button type="button" onClick={() => onEliminar(articulo.id)} className="text-marmol-300 hover:text-bajo">
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap gap-2">
        {tallas.map((t) => {
          const bajo = t.stock_disponible <= t.stock_minimo;
          return (
            <div key={t.id} className={`flex items-center gap-1.5 rounded-lg border px-2 py-1 text-xs ${bajo ? 'border-bajo/40 bg-bajo/10' : 'border-marmol-200 bg-marmol-50'}`}>
              {bajo && <AlertTriangle size={11} className="text-bajo" />}
              <span className="font-medium">{t.talla}</span>
              <span className={bajo ? 'text-bajo font-semibold' : 'text-marmol-600'}>{t.stock_disponible} disp.</span>
              <input
                type="number"
                min={0}
                value={t.stock_minimo}
                onChange={(e) => cambiarStockMinimo(t.id, e.target.value)}
                title="Stock mínimo antes de avisar"
                className="w-10 rounded border border-marmol-200 px-1 py-0.5 text-[11px]"
              />
              <button type="button" onClick={() => recibir(t.id)} title="Registrar entrada de bodega" className="text-flow-600 hover:text-flow-700">
                <PackagePlus size={13} />
              </button>
              <button type="button" onClick={() => eliminarTalla(t.id)} className="text-marmol-300 hover:text-bajo">
                <Trash2 size={11} />
              </button>
            </div>
          );
        })}

        {mostrarAgregarTalla ? (
          <div className="flex items-center gap-1.5">
            <input className="w-16 rounded-lg border border-marmol-200 px-2 py-1 text-xs" placeholder="Talla" value={talla} onChange={(e) => setTalla(e.target.value)} />
            <input className="w-16 rounded-lg border border-marmol-200 px-2 py-1 text-xs" type="number" placeholder="Stock" value={stockInicial} onChange={(e) => setStockInicial(e.target.value)} />
            <input className="w-16 rounded-lg border border-marmol-200 px-2 py-1 text-xs" type="number" placeholder="Mínimo" value={stockMinimo} onChange={(e) => setStockMinimo(e.target.value)} />
            <button type="button" onClick={agregarTalla} disabled={pending} className="rounded-lg bg-flow-500 hover:bg-flow-600 text-white text-xs font-medium px-2 py-1">
              Guardar
            </button>
            <button type="button" onClick={() => setMostrarAgregarTalla(false)} className="text-xs text-marmol-400">
              Cancelar
            </button>
          </div>
        ) : (
          <button type="button" onClick={() => setMostrarAgregarTalla(true)} className="inline-flex items-center gap-1 text-xs text-flow-600 hover:text-flow-700 font-medium">
            <Plus size={12} /> Agregar talla
          </button>
        )}
      </div>
      {error && <p className="text-xs text-bajo mt-1">{error}</p>}
    </div>
  );
}
