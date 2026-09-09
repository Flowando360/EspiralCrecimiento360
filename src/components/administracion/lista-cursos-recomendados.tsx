'use client';

import { useState, useTransition } from 'react';
import { agregarCursoRecomendado, eliminarCursoRecomendado } from '@/app/(dashboard)/administracion/configuracion/actions';
import { Trash2, Plus } from 'lucide-react';

interface Asignacion {
  id: string;
  curso_id: string;
  curso_titulo: string;
}

export function ListaCursosRecomendados({
  dimension,
  titulo,
  asignacionesIniciales,
  cursosDisponibles,
}: {
  dimension: 'hacer' | 'deber';
  titulo: string;
  asignacionesIniciales: Asignacion[];
  cursosDisponibles: { id: string; titulo: string }[];
}) {
  const [asignaciones, setAsignaciones] = useState(asignacionesIniciales);
  const [cursoId, setCursoId] = useState('');
  const [, startTransition] = useTransition();

  function agregar() {
    if (!cursoId) return;
    const curso = cursosDisponibles.find((c) => c.id === cursoId);
    if (!curso) return;
    startTransition(async () => {
      const res = await agregarCursoRecomendado(dimension, cursoId);
      if (res.ok) {
        setAsignaciones((prev) => [...prev, { id: crypto.randomUUID(), curso_id: curso.id, curso_titulo: curso.titulo }]);
        setCursoId('');
      }
    });
  }

  function eliminar(id: string) {
    setAsignaciones((prev) => prev.filter((a) => a.id !== id));
    startTransition(async () => {
      await eliminarCursoRecomendado(id);
    });
  }

  const yaAsignadosIds = new Set(asignaciones.map((a) => a.curso_id));
  const opciones = cursosDisponibles.filter((c) => !yaAsignadosIds.has(c.id));

  return (
    <div className="card p-5">
      <h3 className="font-display font-semibold text-secundario mb-1">{titulo}</h3>
      <p className="text-xs text-marmol-400 mb-3">
        Cuando el semáforo de {dimension === 'hacer' ? 'Hacer' : 'Deber'} quede bajo al cerrar un Encuentro
        de Crecimiento, se asignan automáticamente estos cursos.
      </p>

      <div className="space-y-2 mb-4">
        {asignaciones.map((a) => (
          <div key={a.id} className="flex items-center justify-between gap-2 border-b border-marmol-100 pb-2">
            <p className="text-sm font-medium text-marmol-800">{a.curso_titulo}</p>
            <button onClick={() => eliminar(a.id)} className="text-marmol-300 hover:text-bajo shrink-0">
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        {asignaciones.length === 0 && <p className="text-sm text-marmol-400">Sin cursos configurados todavía.</p>}
      </div>

      <div className="flex gap-2">
        <select
          value={cursoId}
          onChange={(e) => setCursoId(e.target.value)}
          className="flex-1 rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm"
        >
          <option value="">Selecciona un curso…</option>
          {opciones.map((c) => (
            <option key={c.id} value={c.id}>
              {c.titulo}
            </option>
          ))}
        </select>
        <button onClick={agregar} className="rounded-lg bg-flow-500 hover:bg-flow-600 text-white px-3 py-1.5">
          <Plus size={16} />
        </button>
      </div>
    </div>
  );
}
