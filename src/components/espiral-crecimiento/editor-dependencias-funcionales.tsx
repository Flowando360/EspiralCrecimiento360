'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { agregarDependenciaFuncional, quitarDependenciaFuncional } from '@/app/(dashboard)/administracion/organigrama/actions';

export interface DependenciaItem {
  id: string;
  colaboradorNombre: string;
  liderNombre: string;
  tipo: string;
  detalle: string | null;
}

const TIPOS: Record<string, string> = { funcional: 'Funcional', proyecto: 'Proyecto', otro: 'Otro' };

/** Líderes funcionales o de proyecto de una persona: organigrama matricial (línea punteada). */
export function EditorDependenciasFuncionales({
  personas,
  dependencias,
}: {
  personas: { id: string; nombre: string }[];
  dependencias: DependenciaItem[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [persona, setPersona] = useState('');
  const [lider, setLider] = useState('');
  const [tipo, setTipo] = useState<'funcional' | 'proyecto' | 'otro'>('funcional');
  const [detalle, setDetalle] = useState('');
  const campo = 'rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm';

  function agregar() {
    setError(null);
    start(async () => {
      const res = await agregarDependenciaFuncional({ colaboradorId: persona, liderFuncionalId: lider, tipo, detalle });
      if (res.ok) {
        setPersona('');
        setLider('');
        setDetalle('');
        router.refresh();
      } else setError(res.error);
    });
  }

  function quitar(id: string) {
    start(async () => {
      const res = await quitarDependenciaFuncional(id);
      if (res.ok) router.refresh();
      else setError(res.error);
    });
  }

  return (
    <div className="space-y-4">
      {dependencias.length === 0 ? (
        <p className="text-sm text-marmol-400">Nadie tiene líderes funcionales o de proyecto registrados.</p>
      ) : (
        <ul className="divide-y divide-marmol-100 text-sm">
          {dependencias.map((d) => (
            <li key={d.id} className="py-2 flex items-center justify-between gap-3">
              <span className="text-marmol-800">
                <strong>{d.colaboradorNombre}</strong> también reporta a <strong>{d.liderNombre}</strong>{' '}
                <span className="text-xs text-marmol-400">
                  ({TIPOS[d.tipo] ?? d.tipo}
                  {d.detalle ? ` · ${d.detalle}` : ''})
                </span>
              </span>
              <button type="button" disabled={pending} onClick={() => quitar(d.id)} className="text-marmol-300 hover:text-bajo shrink-0" aria-label="Quitar dependencia">
                <Trash2 size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="grid gap-2 sm:grid-cols-2 pt-3 border-t border-marmol-100">
        <label className="text-xs text-marmol-500 flex flex-col gap-1">
          Persona
          <select value={persona} onChange={(e) => setPersona(e.target.value)} className={campo}>
            <option value="">Elige…</option>
            {personas.map((p) => (
              <option key={p.id} value={p.id}>{p.nombre}</option>
            ))}
          </select>
        </label>
        <label className="text-xs text-marmol-500 flex flex-col gap-1">
          Su líder funcional o de proyecto
          <select value={lider} onChange={(e) => setLider(e.target.value)} className={campo}>
            <option value="">Elige…</option>
            {personas.filter((p) => p.id !== persona).map((p) => (
              <option key={p.id} value={p.id}>{p.nombre}</option>
            ))}
          </select>
        </label>
        <label className="text-xs text-marmol-500 flex flex-col gap-1">
          Tipo
          <select value={tipo} onChange={(e) => setTipo(e.target.value as typeof tipo)} className={campo}>
            {Object.entries(TIPOS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </label>
        <label className="text-xs text-marmol-500 flex flex-col gap-1">
          Detalle (opcional, por ejemplo el proyecto)
          <input value={detalle} onChange={(e) => setDetalle(e.target.value)} className={campo} />
        </label>
      </div>
      {error && <p className="text-sm text-bajo">{error}</p>}
      <button type="button" disabled={pending || !persona || !lider} onClick={agregar} className="rounded-lg bg-flow-500 hover:bg-flow-600 disabled:opacity-40 text-white text-sm font-medium px-4 py-2">
        Agregar líder funcional
      </button>
    </div>
  );
}
