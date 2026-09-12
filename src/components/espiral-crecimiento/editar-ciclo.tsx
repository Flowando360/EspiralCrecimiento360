'use client';

import { useState, useTransition } from 'react';
import { Pencil, Check, X } from 'lucide-react';
import { actualizarCiclo } from '@/app/(dashboard)/espiral-crecimiento/ciclos/actions';

export function EditarCiclo({
  cicloId,
  datosIniciales,
}: {
  cicloId: string;
  datosIniciales: { nombre: string; fechaApertura: string; fechaCierreRespuestas: string };
}) {
  const [editando, setEditando] = useState(false);
  const [nombre, setNombre] = useState(datosIniciales.nombre);
  const [fechaApertura, setFechaApertura] = useState(datosIniciales.fechaApertura);
  const [fechaCierreRespuestas, setFechaCierreRespuestas] = useState(datosIniciales.fechaCierreRespuestas);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function guardar() {
    setError(null);
    startTransition(async () => {
      const res = await actualizarCiclo({ cicloId, nombre, fechaApertura, fechaCierreRespuestas });
      if (res.ok) setEditando(false);
      else setError(res.error);
    });
  }

  function cancelar() {
    setNombre(datosIniciales.nombre);
    setFechaApertura(datosIniciales.fechaApertura);
    setFechaCierreRespuestas(datosIniciales.fechaCierreRespuestas);
    setError(null);
    setEditando(false);
  }

  if (!editando) {
    return (
      <button type="button" onClick={() => setEditando(true)} className="inline-flex items-center gap-1 text-xs text-marmol-400 hover:text-flow-600">
        <Pencil size={12} /> Editar nombre/fechas
      </button>
    );
  }

  return (
    <div className="card p-4 space-y-2 max-w-md">
      <div>
        <label className="block text-xs text-marmol-500 mb-1">Nombre</label>
        <input value={nombre} onChange={(e) => setNombre(e.target.value)} className="w-full rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs text-marmol-500 mb-1">Apertura</label>
          <input type="date" value={fechaApertura} onChange={(e) => setFechaApertura(e.target.value)} className="w-full rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm" />
        </div>
        <div>
          <label className="block text-xs text-marmol-500 mb-1">Cierre de respuestas</label>
          <input type="date" value={fechaCierreRespuestas} onChange={(e) => setFechaCierreRespuestas(e.target.value)} className="w-full rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm" />
        </div>
      </div>
      {error && <p className="text-xs text-bajo">{error}</p>}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={guardar}
          disabled={pending || !nombre.trim()}
          className="inline-flex items-center gap-1 rounded-lg bg-flow-500 hover:bg-flow-600 disabled:opacity-40 text-white text-xs font-medium px-2.5 py-1.5"
        >
          <Check size={12} /> {pending ? 'Guardando…' : 'Guardar'}
        </button>
        <button type="button" onClick={cancelar} disabled={pending} className="inline-flex items-center gap-1 rounded-lg border border-marmol-200 text-marmol-600 hover:bg-marmol-100 text-xs font-medium px-2.5 py-1.5">
          <X size={12} /> Cancelar
        </button>
      </div>
    </div>
  );
}
