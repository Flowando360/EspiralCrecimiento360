'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { crearProceso, eliminarProceso, actualizarProceso } from '@/app/(dashboard)/procesos-gestion/actions';
import { Trash2, Plus, KanbanSquare, Pencil, Check, X } from 'lucide-react';
import { formatearFecha } from '@/lib/utils';

interface Proceso {
  id: string;
  area_proceso: string;
  nombre: string;
  descripcion: string | null;
  version: string | null;
  fecha_actualizacion: string;
}

export function ListaProcesos({ procesosIniciales, puedeEditar }: { procesosIniciales: Proceso[]; puedeEditar: boolean }) {
  const [procesos, setProcesos] = useState(procesosIniciales);
  const [areaProceso, setAreaProceso] = useState('');
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [version, setVersion] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function agregar() {
    setError(null);
    startTransition(async () => {
      const res = await crearProceso({ areaProceso, nombre, descripcion, version });
      if (res.ok) {
        setProcesos((prev) => [
          ...prev,
          { id: res.id, area_proceso: areaProceso, nombre, descripcion: descripcion || null, version: version || null, fecha_actualizacion: new Date().toISOString().slice(0, 10) },
        ]);
        setAreaProceso('');
        setNombre('');
        setDescripcion('');
        setVersion('');
      } else {
        setError(res.error);
      }
    });
  }

  function eliminar(id: string) {
    setProcesos((prev) => prev.filter((p) => p.id !== id));
    startTransition(async () => {
      await eliminarProceso(id);
    });
  }

  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [edArea, setEdArea] = useState('');
  const [edNombre, setEdNombre] = useState('');
  const [edDescripcion, setEdDescripcion] = useState('');
  const [edVersion, setEdVersion] = useState('');

  function iniciarEdicion(p: Proceso) {
    setEditandoId(p.id);
    setEdArea(p.area_proceso);
    setEdNombre(p.nombre);
    setEdDescripcion(p.descripcion ?? '');
    setEdVersion(p.version ?? '');
  }

  function guardarEdicion(id: string) {
    setError(null);
    startTransition(async () => {
      const res = await actualizarProceso({ id, areaProceso: edArea, nombre: edNombre, descripcion: edDescripcion, version: edVersion });
      if (res.ok) {
        setProcesos((prev) =>
          prev.map((p) => (p.id === id ? { ...p, area_proceso: edArea, nombre: edNombre, descripcion: edDescripcion || null, version: edVersion || null } : p))
        );
        setEditandoId(null);
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <div className="card p-5">
      <h2 className="font-display font-semibold text-secundario mb-3">Procesos documentados</h2>

      <div className="space-y-2 mb-4">
        {procesos.map((p) =>
          editandoId === p.id ? (
            <div key={p.id} className="space-y-1.5 border-b border-marmol-100 pb-2 bg-flow-50/40 -mx-1 px-1 rounded">
              <div className="grid grid-cols-2 gap-2">
                <input value={edArea} onChange={(e) => setEdArea(e.target.value)} className="rounded-lg border border-marmol-200 px-2 py-1 text-sm" />
                <input value={edNombre} onChange={(e) => setEdNombre(e.target.value)} className="rounded-lg border border-marmol-200 px-2 py-1 text-sm" />
              </div>
              <input value={edDescripcion} onChange={(e) => setEdDescripcion(e.target.value)} placeholder="Descripción" className="w-full rounded-lg border border-marmol-200 px-2 py-1 text-sm" />
              <div className="flex items-center gap-2">
                <input value={edVersion} onChange={(e) => setEdVersion(e.target.value)} placeholder="Versión" className="w-24 rounded-lg border border-marmol-200 px-2 py-1 text-sm" />
                <button onClick={() => guardarEdicion(p.id)} disabled={pending || !edArea.trim() || !edNombre.trim()} className="inline-flex items-center gap-1 rounded-lg bg-flow-500 hover:bg-flow-600 disabled:opacity-40 text-white text-xs font-medium px-2.5 py-1.5">
                  <Check size={12} /> Guardar
                </button>
                <button onClick={() => setEditandoId(null)} disabled={pending} className="inline-flex items-center gap-1 rounded-lg border border-marmol-200 text-marmol-600 hover:bg-marmol-100 text-xs font-medium px-2.5 py-1.5">
                  <X size={12} /> Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div key={p.id} className="flex items-start justify-between gap-2 border-b border-marmol-100 pb-2">
              <div className="min-w-0">
                <p className="text-sm font-medium text-marmol-800">
                  {p.nombre} <span className="text-marmol-400 font-normal">· {p.area_proceso}</span>
                </p>
                {p.descripcion && <p className="text-xs text-marmol-500">{p.descripcion}</p>}
                <p className="text-xs text-marmol-400 mt-0.5">
                  {p.version && `v${p.version} · `}Actualizado {formatearFecha(p.fecha_actualizacion)}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Link
                  href={`/procesos-gestion/${p.id}/tablero`}
                  title="Ver tablero"
                  className="text-marmol-300 hover:text-flow-600"
                >
                  <KanbanSquare size={15} />
                </Link>
                {puedeEditar && (
                  <>
                    <button onClick={() => iniciarEdicion(p)} className="text-marmol-300 hover:text-flow-600">
                      <Pencil size={13} />
                    </button>
                    <button onClick={() => eliminar(p.id)} className="text-marmol-300 hover:text-bajo">
                      <Trash2 size={14} />
                    </button>
                  </>
                )}
              </div>
            </div>
          )
        )}
        {procesos.length === 0 && <p className="text-sm text-marmol-400">Sin procesos documentados todavía.</p>}
      </div>

      {puedeEditar && (
        <div className="space-y-2 border-t border-marmol-100 pt-3">
          <div className="grid grid-cols-2 gap-2">
            <input
              value={areaProceso}
              onChange={(e) => setAreaProceso(e.target.value)}
              placeholder="Área / proceso"
              className="rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm"
            />
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Nombre del proceso"
              className="rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm"
            />
          </div>
          <input
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Descripción (opcional)"
            className="w-full rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm"
          />
          <div className="flex gap-2">
            <input
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              placeholder="Versión (opcional)"
              className="w-32 rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm"
            />
            <button
              onClick={agregar}
              disabled={pending || !areaProceso.trim() || !nombre.trim()}
              className="inline-flex items-center gap-1 rounded-lg bg-flow-500 hover:bg-flow-600 disabled:opacity-40 text-white text-sm font-medium px-3 py-1.5"
            >
              <Plus size={14} /> Agregar
            </button>
          </div>
          {error && <p className="text-sm text-bajo">{error}</p>}
        </div>
      )}
    </div>
  );
}
