'use client';

import { useState, useTransition } from 'react';
import { Check } from 'lucide-react';
import { guardarUmbralAnonimato } from '@/app/(dashboard)/administracion/configuracion/actions';

export function FormularioUmbralAnonimato({ inicial }: { inicial: number }) {
  const [valor, setValor] = useState(String(inicial));
  const [pending, startTransition] = useTransition();
  const [resultado, setResultado] = useState<{ ok: boolean; error?: string } | null>(null);

  function guardar() {
    setResultado(null);
    startTransition(async () => {
      setResultado(await guardarUmbralAnonimato({ minimo: Number(valor) }));
    });
  }

  return (
    <div className="card p-5 space-y-4">
      <div>
        <h2 className="font-display font-semibold text-secundario">Anonimato en informes de desempeño</h2>
        <p className="text-xs text-marmol-400 mt-0.5">
          Mínimo de personas con dato que debe tener un grupo (equipo, área o líder) para mostrar sus promedios en
          informes como Brechas, el Consolidado y el mapa de equipos de Indicadores. Si un grupo tiene menos, se
          indica «Menos de N personas» en lugar del promedio, para no exponer el resultado de alguien. Por defecto 5;
          lo recomendado es no bajar de ese valor. Clima Organizacional tiene su propio umbral, arriba.
        </p>
      </div>
      <div className="max-w-xs">
        <label className="block text-xs text-marmol-500 mb-1">Mínimo de personas (2 a 50)</label>
        <input
          type="number"
          min={2}
          max={50}
          value={valor}
          onChange={(e) => {
            setValor(e.target.value);
            setResultado(null);
          }}
          className="w-full rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm"
        />
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={pending}
          onClick={guardar}
          className="rounded-lg bg-flow-500 hover:bg-flow-600 disabled:opacity-40 text-white text-sm font-medium px-4 py-2 transition"
        >
          {pending ? 'Guardando…' : 'Guardar cambios'}
        </button>
        {resultado?.ok && (
          <span className="inline-flex items-center gap-1 text-sm text-alto">
            <Check size={14} /> Guardado
          </span>
        )}
        {resultado && !resultado.ok && <span className="text-sm text-red-600">{resultado.error}</span>}
      </div>
    </div>
  );
}
