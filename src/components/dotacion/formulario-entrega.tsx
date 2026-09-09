'use client';

import { useState, useTransition } from 'react';
import { crearEntrega } from '@/app/(dashboard)/dotacion/actions';
import { Plus } from 'lucide-react';

export function FormularioEntrega({ colaboradores }: { colaboradores: { id: string; nombre_completo: string }[] }) {
  const [abierto, setAbierto] = useState(false);
  const [colaboradorId, setColaboradorId] = useState('');
  const [categoria, setCategoria] = useState<'elemento_personal' | 'equipo_trabajo'>('elemento_personal');
  const [nombreElemento, setNombreElemento] = useState('');
  const [talla, setTalla] = useState('');
  const [cantidad, setCantidad] = useState('1');
  const [fechaEntrega, setFechaEntrega] = useState(() => new Date().toISOString().slice(0, 10));
  const [fechaVencimiento, setFechaVencimiento] = useState('');
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function guardar() {
    setError(null);
    startTransition(async () => {
      const res = await crearEntrega({
        colaboradorId,
        categoria,
        nombreElemento,
        talla,
        cantidad: Number(cantidad) || 1,
        fechaEntrega,
        fechaVencimiento,
      });
      if (res.ok) {
        setColaboradorId('');
        setNombreElemento('');
        setTalla('');
        setCantidad('1');
        setFechaVencimiento('');
        setAbierto(false);
      } else {
        setError(res.error);
      }
    });
  }

  const campo = 'w-full rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm';
  const label = 'block text-xs text-marmol-500 mb-1';

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

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={label}>Fecha de entrega</label>
          <input className={campo} type="date" value={fechaEntrega} onChange={(e) => setFechaEntrega(e.target.value)} />
        </div>
        <div>
          <label className={label}>Vencimiento / renovación (opcional)</label>
          <input className={campo} type="date" value={fechaVencimiento} onChange={(e) => setFechaVencimiento(e.target.value)} />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={guardar}
          disabled={pending || !colaboradorId || !nombreElemento.trim()}
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
