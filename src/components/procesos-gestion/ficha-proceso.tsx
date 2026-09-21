'use client';

import { useState, useTransition } from 'react';
import { agregarElementoProceso, eliminarElementoProceso } from '@/app/(dashboard)/procesos-gestion/actions';
import { Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type TipoElemento = 'entrada' | 'actividad' | 'salida';

export interface ElementoProceso {
  id: string;
  tipo: TipoElemento;
  descripcion: string;
  proceso_relacionado_id: string | null;
  orden: number;
}

interface ProcesoOpcion {
  id: string;
  nombre: string;
  codigo: string | null;
}

const COLUMNAS: { tipo: TipoElemento; titulo: string; ayuda: string; placeholder: string }[] = [
  { tipo: 'entrada', titulo: 'Entradas', ayuda: 'Lo que el proceso necesita para funcionar', placeholder: 'Ej. Necesidades de formación identificadas' },
  { tipo: 'actividad', titulo: 'Actividades', ayuda: 'Lo que el proceso hace', placeholder: 'Ej. Levantar y documentar procesos' },
  { tipo: 'salida', titulo: 'Salidas', ayuda: 'Lo que el proceso entrega', placeholder: 'Ej. Plan de mejora continua' },
];

export function FichaProceso({
  procesoId,
  elementosIniciales,
  procesosDisponibles,
  puedeEditar,
}: {
  procesoId: string;
  elementosIniciales: ElementoProceso[];
  procesosDisponibles: ProcesoOpcion[];
  puedeEditar: boolean;
}) {
  const [elementos, setElementos] = useState(elementosIniciales);
  const [, startTransition] = useTransition();

  function agregar(tipo: TipoElemento, descripcion: string, procesoRelacionadoId: string) {
    if (!descripcion.trim()) return;
    startTransition(async () => {
      const res = await agregarElementoProceso({ procesoId, tipo, descripcion, procesoRelacionadoId: procesoRelacionadoId || undefined });
      if (res.ok) {
        setElementos((prev) => [...prev, { id: res.id, tipo, descripcion, proceso_relacionado_id: procesoRelacionadoId || null, orden: prev.filter((e) => e.tipo === tipo).length + 1 }]);
      }
    });
  }

  function eliminar(id: string) {
    setElementos((prev) => prev.filter((e) => e.id !== id));
    startTransition(async () => {
      await eliminarElementoProceso(procesoId, id);
    });
  }

  const nombreProceso = (id: string | null) => {
    if (!id) return null;
    const p = procesosDisponibles.find((p) => p.id === id);
    return p ? `${p.codigo ? p.codigo + ' · ' : ''}${p.nombre}` : null;
  };

  return (
    <div className="card p-5">
      <h2 className="font-display font-semibold text-secundario mb-1">Caracterización del proceso</h2>
      <p className="text-xs text-marmol-400 mb-4">
        Ficha SIPOC: entradas, actividades y salidas — mismo formato que la plantilla de caracterización que ya usas.
      </p>
      <div className="grid md:grid-cols-3 gap-4">
        {COLUMNAS.map((col) => (
          <ColumnaElementos
            key={col.tipo}
            columna={col}
            elementos={elementos.filter((e) => e.tipo === col.tipo).sort((a, b) => a.orden - b.orden)}
            procesosDisponibles={procesosDisponibles}
            nombreProceso={nombreProceso}
            puedeEditar={puedeEditar}
            onAgregar={(desc, rel) => agregar(col.tipo, desc, rel)}
            onEliminar={eliminar}
          />
        ))}
      </div>
    </div>
  );
}

function ColumnaElementos({
  columna,
  elementos,
  procesosDisponibles,
  nombreProceso,
  puedeEditar,
  onAgregar,
  onEliminar,
}: {
  columna: { tipo: TipoElemento; titulo: string; ayuda: string; placeholder: string };
  elementos: ElementoProceso[];
  procesosDisponibles: ProcesoOpcion[];
  nombreProceso: (id: string | null) => string | null;
  puedeEditar: boolean;
  onAgregar: (descripcion: string, procesoRelacionadoId: string) => void;
  onEliminar: (id: string) => void;
}) {
  const [descripcion, setDescripcion] = useState('');
  const [procesoRelacionadoId, setProcesoRelacionadoId] = useState('');

  return (
    <div>
      <p className="text-sm font-semibold text-marmol-700">{columna.titulo}</p>
      <p className="text-[11px] text-marmol-400 mb-2">{columna.ayuda}</p>
      <div className="space-y-1.5 min-h-[40px]">
        {elementos.map((e) => (
          <div key={e.id} className="card p-2.5 group">
            <div className="flex items-start justify-between gap-1.5">
              <div className="min-w-0">
                <p className="text-xs text-marmol-700 break-words">{e.descripcion}</p>
                {nombreProceso(e.proceso_relacionado_id) && (
                  <p className="text-[10px] text-marmol-400 mt-0.5">
                    {columna.tipo === 'salida' ? 'Va para: ' : 'Viene de: '}
                    {nombreProceso(e.proceso_relacionado_id)}
                  </p>
                )}
              </div>
              {puedeEditar && (
                <button onClick={() => onEliminar(e.id)} className="text-marmol-300 hover:text-bajo opacity-0 group-hover:opacity-100 shrink-0">
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          </div>
        ))}
        {elementos.length === 0 && <p className="text-xs text-marmol-300 italic">Sin {columna.titulo.toLowerCase()} registradas</p>}
      </div>

      {puedeEditar && (
        <div className="mt-2 space-y-1.5">
          <textarea
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder={columna.placeholder}
            rows={2}
            className="w-full rounded-lg border border-marmol-200 px-2 py-1.5 text-xs"
          />
          {columna.tipo !== 'actividad' && (
            <select value={procesoRelacionadoId} onChange={(e) => setProcesoRelacionadoId(e.target.value)} className="w-full rounded-lg border border-marmol-200 px-2 py-1 text-xs">
              <option value="">{columna.tipo === 'salida' ? 'Va para el proceso (opcional)' : 'Viene del proceso (opcional)'}</option>
              {procesosDisponibles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.codigo ? `${p.codigo} · ` : ''}
                  {p.nombre}
                </option>
              ))}
            </select>
          )}
          <button
            onClick={() => {
              onAgregar(descripcion, procesoRelacionadoId);
              setDescripcion('');
              setProcesoRelacionadoId('');
            }}
            disabled={!descripcion.trim()}
            className={cn('w-full inline-flex items-center justify-center gap-1 rounded-lg border border-dashed border-marmol-300 text-marmol-500 text-xs py-1.5 hover:text-flow-600 hover:bg-flow-50 disabled:opacity-40')}
          >
            <Plus size={12} /> Agregar
          </button>
        </div>
      )}
    </div>
  );
}
