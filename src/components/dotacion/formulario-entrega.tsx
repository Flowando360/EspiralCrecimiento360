'use client';

import { useState, useTransition } from 'react';
import { crearEntrega, crearEntregaDesdeCatalogo } from '@/app/(dashboard)/dotacion/actions';
import { Plus } from 'lucide-react';

interface TallaCatalogo {
  id: string;
  talla: string;
  stock_disponible: number;
}
interface ArticuloCatalogo {
  id: string;
  categoria: string;
  nombre: string;
  requiere_talla: boolean;
  tallas: TallaCatalogo[];
}

// Periodicidad sugerida al entregar desde el catálogo — cada 4 meses es la
// referencia legal usual para EPP/uniformes en Colombia; queda editable, no
// forzada, porque varía según el tipo de elemento.
function fechaVencimientoSugerida(fechaEntrega: string): string {
  if (!fechaEntrega) return '';
  const d = new Date(fechaEntrega + 'T00:00:00');
  d.setMonth(d.getMonth() + 4);
  return d.toISOString().slice(0, 10);
}

export function FormularioEntrega({
  colaboradores,
  articulosCatalogo,
}: {
  colaboradores: { id: string; nombre_completo: string }[];
  articulosCatalogo: ArticuloCatalogo[];
}) {
  const [abierto, setAbierto] = useState(false);
  const [modo, setModo] = useState<'catalogo' | 'libre'>(articulosCatalogo.length > 0 ? 'catalogo' : 'libre');
  const [colaboradorId, setColaboradorId] = useState('');
  const [categoria, setCategoria] = useState<'elemento_personal' | 'equipo_trabajo'>('elemento_personal');
  const [cantidad, setCantidad] = useState('1');
  const [fechaEntrega, setFechaEntrega] = useState(() => new Date().toISOString().slice(0, 10));
  const [fechaVencimiento, setFechaVencimiento] = useState('');
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Modo catálogo
  const [articuloId, setArticuloId] = useState('');
  const [tallaId, setTallaId] = useState('');
  const articuloSeleccionado = articulosCatalogo.find((a) => a.id === articuloId);
  const tallaSeleccionada = articuloSeleccionado?.tallas.find((t) => t.id === tallaId);

  // Modo libre (texto)
  const [nombreElemento, setNombreElemento] = useState('');
  const [talla, setTalla] = useState('');

  function limpiar() {
    setColaboradorId('');
    setArticuloId('');
    setTallaId('');
    setNombreElemento('');
    setTalla('');
    setCantidad('1');
    setFechaVencimiento('');
    setAbierto(false);
  }

  function guardar() {
    setError(null);
    startTransition(async () => {
      if (modo === 'catalogo') {
        if (!tallaSeleccionada) {
          setError('Selecciona un artículo y talla del catálogo');
          return;
        }
        const res = await crearEntregaDesdeCatalogo({
          articuloTallaId: tallaSeleccionada.id,
          colaboradorId,
          categoria,
          cantidad: Number(cantidad) || 1,
          fechaEntrega,
          fechaVencimiento,
        });
        if (res.ok) limpiar();
        else setError(res.error);
      } else {
        const res = await crearEntrega({
          colaboradorId,
          categoria,
          nombreElemento,
          talla,
          cantidad: Number(cantidad) || 1,
          fechaEntrega,
          fechaVencimiento,
        });
        if (res.ok) limpiar();
        else setError(res.error);
      }
    });
  }

  const campo = 'w-full rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm';
  const label = 'block text-xs text-marmol-500 mb-1';

  const cantidadExcedeStock = modo === 'catalogo' && tallaSeleccionada != null && Number(cantidad) > tallaSeleccionada.stock_disponible;

  if (!abierto) {
    return (
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="inline-flex items-center gap-1.5 rounded-lg bg-flow-500 hover:bg-flow-600 text-white text-sm font-medium px-3 py-2 transition"
      >
        <Plus size={15} /> Registrar entrega
      </button>
    );
  }

  return (
    <div className="card p-4 space-y-3">
      {articulosCatalogo.length > 0 && (
        <div className="flex text-xs rounded-lg border border-marmol-200 overflow-hidden w-fit">
          <button type="button" onClick={() => setModo('catalogo')} className={`px-2.5 py-1 ${modo === 'catalogo' ? 'bg-flow-500 text-white' : 'text-marmol-500'}`}>
            Del catálogo
          </button>
          <button type="button" onClick={() => setModo('libre')} className={`px-2.5 py-1 ${modo === 'libre' ? 'bg-flow-500 text-white' : 'text-marmol-500'}`}>
            Texto libre
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={label}>Colaborador</label>
          <select className={campo} value={colaboradorId} onChange={(e) => setColaboradorId(e.target.value)}>
            <option value="">Selecciona…</option>
            {colaboradores.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre_completo}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={label}>Categoría</label>
          <select className={campo} value={categoria} onChange={(e) => setCategoria(e.target.value as any)}>
            <option value="elemento_personal">Elemento personal (uniforme, botas, EPP)</option>
            <option value="equipo_trabajo">Equipo de trabajo (herramienta, cómputo, celular)</option>
          </select>
        </div>
      </div>

      {modo === 'catalogo' ? (
        <div className="grid grid-cols-4 gap-3">
          <div className="col-span-2">
            <label className={label}>Artículo</label>
            <select
              className={campo}
              value={articuloId}
              onChange={(e) => {
                setArticuloId(e.target.value);
                setTallaId('');
              }}
            >
              <option value="">Selecciona…</option>
              {articulosCatalogo.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.categoria} — {a.nombre}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={label}>Talla</label>
            <select className={campo} value={tallaId} onChange={(e) => setTallaId(e.target.value)} disabled={!articuloSeleccionado}>
              <option value="">—</option>
              {articuloSeleccionado?.tallas.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.talla} ({t.stock_disponible} disp.)
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={label}>Cantidad</label>
            <input className={campo} type="number" min={1} value={cantidad} onChange={(e) => setCantidad(e.target.value)} />
          </div>
          {cantidadExcedeStock && <p className="col-span-4 text-xs text-bajo">No hay suficiente stock disponible ({tallaSeleccionada?.stock_disponible} en bodega).</p>}
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-3">
          <div className="col-span-2">
            <label className={label}>Elemento</label>
            <input className={campo} value={nombreElemento} onChange={(e) => setNombreElemento(e.target.value)} placeholder="Ej. Botas de seguridad" />
          </div>
          <div>
            <label className={label}>Talla (si aplica)</label>
            <input className={campo} value={talla} onChange={(e) => setTalla(e.target.value)} />
          </div>
          <div>
            <label className={label}>Cantidad</label>
            <input className={campo} type="number" min={1} value={cantidad} onChange={(e) => setCantidad(e.target.value)} />
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={label}>Fecha de entrega</label>
          <input
            className={campo}
            type="date"
            value={fechaEntrega}
            onChange={(e) => {
              setFechaEntrega(e.target.value);
              if (!fechaVencimiento) setFechaVencimiento(fechaVencimientoSugerida(e.target.value));
            }}
          />
        </div>
        <div>
          <label className={label}>Vencimiento / renovación</label>
          <input className={campo} type="date" value={fechaVencimiento} onChange={(e) => setFechaVencimiento(e.target.value)} />
          <p className="text-[11px] text-marmol-400 mt-0.5">Sugerido a 4 meses (referencia legal de EPP/uniformes) — corrígelo si aplica otro plazo.</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={guardar}
          disabled={pending || !colaboradorId || (modo === 'catalogo' ? !tallaSeleccionada || cantidadExcedeStock : !nombreElemento.trim())}
          className="rounded-lg bg-flow-500 hover:bg-flow-600 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 transition"
        >
          {pending ? 'Guardando…' : 'Guardar entrega'}
        </button>
        <button type="button" onClick={() => setAbierto(false)} className="text-sm text-marmol-400 hover:text-marmol-600">
          Cancelar
        </button>
      </div>
      {error && <p className="text-xs text-bajo">{error}</p>}
    </div>
  );
}
