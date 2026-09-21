'use client';

import { useState, useTransition } from 'react';
import { guardarUmbralDifusion } from '@/app/(dashboard)/administracion/configuracion/actions';
import { Check } from 'lucide-react';

export function FormularioUmbralDifusion({ inicial }: { inicial: number }) {
  const [porcentaje, setPorcentaje] = useState(String(inicial));
  const [pending, startTransition] = useTransition();
  const [resultado, setResultado] = useState<{ ok: boolean; error?: string } | null>(null);

  function guardar() {
    setResultado(null);
    startTransition(async () => {
      const res = await guardarUmbralDifusion({ porcentaje: Number(porcentaje) });
      setResultado(res);
    });
  }

  return (
    <div className="card p-5 space-y-3">
      <div>
        <h2 className="font-display font-semibold text-secundario">Umbral de difusión documental</h2>
        <p className="text-xs text-marmol-400 mt-0.5">
          % de confirmaciones de lectura necesarias para que un documento del módulo de Procesos se
          considere "difusión completa" (Procesos y Sistemas de Gestión → Gestión documental).
        </p>
      </div>
      <div className="flex items-center gap-3">
        <div className="max-w-[140px] flex items-center gap-2">
          <input
            type="number"
            min={1}
            max={100}
            value={porcentaje}
            onChange={(e) => {
              setPorcentaje(e.target.value);
              setResultado(null);
            }}
            className="w-full rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm"
          />
          <span className="text-sm text-marmol-500">%</span>
        </div>
        <button
          type="button"
          disabled={pending}
          onClick={guardar}
          className="rounded-lg bg-flow-500 hover:bg-flow-600 disabled:opacity-40 text-white text-sm font-medium px-4 py-2 transition"
        >
          {pending ? 'Guardando…' : 'Guardar'}
        </button>
        {resultado?.ok && (
          <p className="text-xs text-alto flex items-center gap-1">
            <Check size={12} /> Guardado
          </p>
        )}
        {resultado && !resultado.ok && <p className="text-xs text-bajo">{resultado.error}</p>}
      </div>
    </div>
  );
}
