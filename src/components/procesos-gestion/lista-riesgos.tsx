'use client';

import { useState, useTransition } from 'react';
import { crearRiesgo, eliminarRiesgo, actualizarRiesgo } from '@/app/(dashboard)/procesos-gestion/actions';
import { Trash2, Plus, Pencil, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const ETIQUETA_MARCO: Record<string, string> = {
  iso_9001: 'ISO 9001',
  sarlaft_sagrilaft: 'SARLAFT/SAGRILAFT',
  ptee: 'PTEE',
  interno: 'Interno',
};

const CLASE_IMPACTO: Record<string, string> = {
  alto: 'badge-bajo',
  medio: 'badge-medio',
  bajo: 'badge-alto',
};

interface Riesgo {
  id: string;
  marco_normativo: string;
  riesgo: string;
  categoria_riesgo: string | null;
  probabilidad: string | null;
  impacto: string | null;
  control: string | null;
}

export function ListaRiesgos({ riesgosIniciales, puedeEditar }: { riesgosIniciales: Riesgo[]; puedeEditar: boolean }) {
  const [riesgos, setRiesgos] = useState(riesgosIniciales);
  const [marcoNormativo, setMarcoNormativo] = useState<'iso_9001' | 'sarlaft_sagrilaft' | 'ptee' | 'interno'>('iso_9001');
  const [riesgo, setRiesgo] = useState('');
  const [probabilidad, setProbabilidad] = useState<'baja' | 'media' | 'alta'>('media');
  const [impacto, setImpacto] = useState<'bajo' | 'medio' | 'alto'>('medio');
  const [control, setControl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function agregar() {
    setError(null);
    startTransition(async () => {
      const res = await crearRiesgo({ marcoNormativo, riesgo, probabilidad, impacto, control });
      if (res.ok) {
        setRiesgos((prev) => [
          ...prev,
          { id: res.id, marco_normativo: marcoNormativo, riesgo, categoria_riesgo: null, probabilidad, impacto, control: control || null },
        ]);
        setRiesgo('');
        setControl('');
      } else {
        setError(res.error);
      }
    });
  }

  function eliminar(id: string) {
    setRiesgos((prev) => prev.filter((r) => r.id !== id));
    startTransition(async () => {
      await eliminarRiesgo(id);
    });
  }

  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [edMarco, setEdMarco] = useState<'iso_9001' | 'sarlaft_sagrilaft' | 'ptee' | 'interno'>('iso_9001');
  const [edRiesgo, setEdRiesgo] = useState('');
  const [edProbabilidad, setEdProbabilidad] = useState<'baja' | 'media' | 'alta'>('media');
  const [edImpacto, setEdImpacto] = useState<'bajo' | 'medio' | 'alto'>('medio');
  const [edControl, setEdControl] = useState('');

  function iniciarEdicion(r: Riesgo) {
    setEditandoId(r.id);
    setEdMarco(r.marco_normativo as typeof edMarco);
    setEdRiesgo(r.riesgo);
    setEdProbabilidad((r.probabilidad as typeof edProbabilidad) ?? 'media');
    setEdImpacto((r.impacto as typeof edImpacto) ?? 'medio');
    setEdControl(r.control ?? '');
  }

  function guardarEdicion(id: string) {
    setError(null);
    startTransition(async () => {
      const res = await actualizarRiesgo({ id, marcoNormativo: edMarco, riesgo: edRiesgo, probabilidad: edProbabilidad, impacto: edImpacto, control: edControl });
      if (res.ok) {
        setRiesgos((prev) =>
          prev.map((r) =>
            r.id === id ? { ...r, marco_normativo: edMarco, riesgo: edRiesgo, probabilidad: edProbabilidad, impacto: edImpacto, control: edControl || null } : r
          )
        );
        setEditandoId(null);
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <div className="card p-5">
      <h2 className="font-display font-semibold text-secundario mb-3">Matriz de riesgos y controles</h2>

      <div className="space-y-2 mb-4">
        {riesgos.map((r) =>
          editandoId === r.id ? (
            <div key={r.id} className="space-y-1.5 border-b border-marmol-100 pb-2 bg-flow-50/40 -mx-1 px-1 rounded">
              <div className="grid grid-cols-3 gap-2">
                <select value={edMarco} onChange={(e) => setEdMarco(e.target.value as typeof edMarco)} className="rounded-lg border border-marmol-200 px-2 py-1 text-sm">
                  {Object.entries(ETIQUETA_MARCO).map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </select>
                <select value={edProbabilidad} onChange={(e) => setEdProbabilidad(e.target.value as typeof edProbabilidad)} className="rounded-lg border border-marmol-200 px-2 py-1 text-sm">
                  <option value="baja">Prob. baja</option>
                  <option value="media">Prob. media</option>
                  <option value="alta">Prob. alta</option>
                </select>
                <select value={edImpacto} onChange={(e) => setEdImpacto(e.target.value as typeof edImpacto)} className="rounded-lg border border-marmol-200 px-2 py-1 text-sm">
                  <option value="bajo">Impacto bajo</option>
                  <option value="medio">Impacto medio</option>
                  <option value="alto">Impacto alto</option>
                </select>
              </div>
              <input value={edRiesgo} onChange={(e) => setEdRiesgo(e.target.value)} className="w-full rounded-lg border border-marmol-200 px-2 py-1 text-sm" />
              <div className="flex items-center gap-2">
                <input value={edControl} onChange={(e) => setEdControl(e.target.value)} placeholder="Control" className="flex-1 rounded-lg border border-marmol-200 px-2 py-1 text-sm" />
                <button onClick={() => guardarEdicion(r.id)} disabled={pending || !edRiesgo.trim()} className="inline-flex items-center gap-1 rounded-lg bg-flow-500 hover:bg-flow-600 disabled:opacity-40 text-white text-xs font-medium px-2.5 py-1.5">
                  <Check size={12} /> Guardar
                </button>
                <button onClick={() => setEditandoId(null)} disabled={pending} className="inline-flex items-center gap-1 rounded-lg border border-marmol-200 text-marmol-600 hover:bg-marmol-100 text-xs font-medium px-2.5 py-1.5">
                  <X size={12} /> Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div key={r.id} className="flex items-start justify-between gap-2 border-b border-marmol-100 pb-2">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs rounded-full bg-flow-50 text-flow-700 px-2 py-0.5 font-medium">
                    {ETIQUETA_MARCO[r.marco_normativo]}
                  </span>
                  {r.impacto && (
                    <span className={cn('text-xs rounded-full px-2 py-0.5 font-medium', CLASE_IMPACTO[r.impacto])}>
                      Impacto {r.impacto}
                    </span>
                  )}
                </div>
                <p className="text-sm font-medium text-marmol-800 mt-1">{r.riesgo}</p>
                {r.control && <p className="text-xs text-marmol-500">Control: {r.control}</p>}
              </div>
              {puedeEditar && (
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => iniciarEdicion(r)} className="text-marmol-300 hover:text-flow-600">
                    <Pencil size={13} />
                  </button>
                  <button onClick={() => eliminar(r.id)} className="text-marmol-300 hover:text-bajo">
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>
          )
        )}
        {riesgos.length === 0 && <p className="text-sm text-marmol-400">Sin riesgos registrados todavía.</p>}
      </div>

      {puedeEditar && (
        <div className="space-y-2 border-t border-marmol-100 pt-3">
          <div className="grid grid-cols-3 gap-2">
            <select
              value={marcoNormativo}
              onChange={(e) => setMarcoNormativo(e.target.value as typeof marcoNormativo)}
              className="rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm"
            >
              {Object.entries(ETIQUETA_MARCO).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
            <select
              value={probabilidad}
              onChange={(e) => setProbabilidad(e.target.value as typeof probabilidad)}
              className="rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm"
            >
              <option value="baja">Prob. baja</option>
              <option value="media">Prob. media</option>
              <option value="alta">Prob. alta</option>
            </select>
            <select
              value={impacto}
              onChange={(e) => setImpacto(e.target.value as typeof impacto)}
              className="rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm"
            >
              <option value="bajo">Impacto bajo</option>
              <option value="medio">Impacto medio</option>
              <option value="alto">Impacto alto</option>
            </select>
          </div>
          <input
            value={riesgo}
            onChange={(e) => setRiesgo(e.target.value)}
            placeholder="Descripción del riesgo"
            className="w-full rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm"
          />
          <div className="flex gap-2">
            <input
              value={control}
              onChange={(e) => setControl(e.target.value)}
              placeholder="Control asociado (opcional)"
              className="flex-1 rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm"
            />
            <button
              onClick={agregar}
              disabled={pending || !riesgo.trim()}
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
