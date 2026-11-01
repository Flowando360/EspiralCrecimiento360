'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { crearAccionPdi } from '@/app/(dashboard)/espiral-crecimiento/pdi/actions';

type Origen = 'hacer' | 'deber' | 'saber' | 'ser' | 'mixto';
export interface SugerenciaPdi {
  origen: Origen;
  brecha: string;
}

export function FormularioAccionPdi({
  colaboradorId,
  cicloId,
  sugerencias = [],
}: {
  colaboradorId: string;
  cicloId?: string | null;
  sugerencias?: SugerenciaPdi[];
}) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [origen, setOrigen] = useState<Origen>('hacer');
  const [brecha, setBrecha] = useState('');
  const [accion, setAccion] = useState('');
  const [fecha, setFecha] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function guardar() {
    setError(null);
    startTransition(async () => {
      const res = await crearAccionPdi({ colaboradorId, cicloId, origen, brechaDetectada: brecha, accion, fechaCompromiso: fecha });
      if (!res.ok) return setError(res.error);
      setBrecha('');
      setAccion('');
      setFecha('');
      setAbierto(false);
      router.refresh();
    });
  }

  const campo = 'w-full rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm';

  if (!abierto) {
    return (
      <div className="px-5 pb-5">
        <button
          type="button"
          onClick={() => setAbierto(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-flow-500 hover:bg-flow-600 text-white text-sm font-medium px-3 py-2"
        >
          <Plus size={14} /> Nueva acción de desarrollo
        </button>
      </div>
    );
  }

  return (
    <div className="px-5 pb-5 space-y-3 border-t border-marmol-100 pt-4">
      {sugerencias.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs text-marmol-500">Brechas detectadas en este Encuentro (toca una para usarla):</p>
          <div className="flex flex-wrap gap-2">
            {sugerencias.map((s, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setOrigen(s.origen);
                  setBrecha(s.brecha);
                }}
                className="text-xs rounded-full border border-flow-200 bg-flow-50 hover:bg-flow-100 text-flow-800 px-3 py-1 text-left"
              >
                {s.brecha}
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-marmol-500 mb-1">Dimensión de origen</label>
          <select value={origen} onChange={(e) => setOrigen(e.target.value as Origen)} className={campo}>
            <option value="hacer">Hacer</option>
            <option value="deber">Deber</option>
            <option value="saber">Saber</option>
            <option value="ser">Ser</option>
            <option value="mixto">Mixto</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-marmol-500 mb-1">Fecha compromiso</label>
          <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className={campo} />
        </div>
      </div>
      <div>
        <label className="block text-xs text-marmol-500 mb-1">Brecha detectada *</label>
        <input value={brecha} onChange={(e) => setBrecha(e.target.value)} className={campo} placeholder="¿Qué se observó? Ej: Liquidación de nómina con errores recurrentes" />
      </div>
      <div>
        <label className="block text-xs text-marmol-500 mb-1">Acción a realizar *</label>
        <textarea value={accion} onChange={(e) => setAccion(e.target.value)} rows={2} className={campo} placeholder="¿Qué se va a hacer para cerrar la brecha?" />
      </div>
      {error && <p className="text-sm text-bajo">{error}</p>}
      <div className="flex gap-2">
        <button type="button" onClick={guardar} disabled={pending} className="rounded-lg bg-flow-500 hover:bg-flow-600 text-white text-sm font-medium px-4 py-2 disabled:opacity-60">
          {pending ? 'Guardando…' : 'Guardar acción'}
        </button>
        <button type="button" onClick={() => setAbierto(false)} className="rounded-lg border border-marmol-200 text-marmol-600 text-sm px-4 py-2">
          Cancelar
        </button>
      </div>
    </div>
  );
}
