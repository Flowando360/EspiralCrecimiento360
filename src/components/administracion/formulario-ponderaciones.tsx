'use client';

import { useState, useTransition } from 'react';
import { guardarPonderaciones } from '@/app/(dashboard)/administracion/configuracion/actions';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

export interface PesosIniciales {
  liderConEquipo: number;
  paresConEquipo: number;
  colaboradoresConEquipo: number;
  liderSinEquipo: number;
  paresSinEquipo: number;
}

export function FormularioPonderaciones({
  cicloId,
  pesosIniciales,
}: {
  cicloId: string;
  pesosIniciales: PesosIniciales;
}) {
  const [pesos, setPesos] = useState(pesosIniciales);
  const [pending, startTransition] = useTransition();
  const [resultado, setResultado] = useState<{ ok: boolean; error?: string } | null>(null);

  const sumaConEquipo = pesos.liderConEquipo + pesos.paresConEquipo + pesos.colaboradoresConEquipo;
  const sumaSinEquipo = pesos.liderSinEquipo + pesos.paresSinEquipo;
  const sumasValidas = sumaConEquipo === 100 && sumaSinEquipo === 100;

  function actualizar(campo: keyof PesosIniciales, valor: string) {
    const n = Number(valor);
    setPesos((prev) => ({ ...prev, [campo]: Number.isFinite(n) ? n : 0 }));
    setResultado(null);
  }

  function guardar() {
    startTransition(async () => {
      const res = await guardarPonderaciones({ cicloId, ...pesos });
      setResultado(res);
    });
  }

  return (
    <div className="card p-5 space-y-4">
      <div>
        <div className="flex items-center justify-between">
          <h2 className="font-display font-semibold text-secundario">Cargos con personal a cargo</h2>
          <span className={cn('text-xs font-medium', sumaConEquipo === 100 ? 'text-alto' : 'text-bajo')}>
            Suma: {sumaConEquipo}%
          </span>
        </div>
        <div className="grid grid-cols-3 gap-3 text-sm mt-2">
          <div>
            <label className="block text-xs text-marmol-500 mb-1">Líder</label>
            <input
              type="number"
              value={pesos.liderConEquipo}
              onChange={(e) => actualizar('liderConEquipo', e.target.value)}
              className="w-full rounded-lg border border-marmol-200 px-2 py-1.5"
            />
          </div>
          <div>
            <label className="block text-xs text-marmol-500 mb-1">Pares</label>
            <input
              type="number"
              value={pesos.paresConEquipo}
              onChange={(e) => actualizar('paresConEquipo', e.target.value)}
              className="w-full rounded-lg border border-marmol-200 px-2 py-1.5"
            />
          </div>
          <div>
            <label className="block text-xs text-marmol-500 mb-1">Colaboradores a cargo</label>
            <input
              type="number"
              value={pesos.colaboradoresConEquipo}
              onChange={(e) => actualizar('colaboradoresConEquipo', e.target.value)}
              className="w-full rounded-lg border border-marmol-200 px-2 py-1.5"
            />
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between pt-2">
          <h2 className="font-display font-semibold text-secundario">Cargos sin personal a cargo</h2>
          <span className={cn('text-xs font-medium', sumaSinEquipo === 100 ? 'text-alto' : 'text-bajo')}>
            Suma: {sumaSinEquipo}%
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm mt-2">
          <div>
            <label className="block text-xs text-marmol-500 mb-1">Líder</label>
            <input
              type="number"
              value={pesos.liderSinEquipo}
              onChange={(e) => actualizar('liderSinEquipo', e.target.value)}
              className="w-full rounded-lg border border-marmol-200 px-2 py-1.5"
            />
          </div>
          <div>
            <label className="block text-xs text-marmol-500 mb-1">Pares</label>
            <input
              type="number"
              value={pesos.paresSinEquipo}
              onChange={(e) => actualizar('paresSinEquipo', e.target.value)}
              className="w-full rounded-lg border border-marmol-200 px-2 py-1.5"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 pt-1">
        <button
          type="button"
          disabled={!sumasValidas || pending}
          onClick={guardar}
          className="rounded-lg bg-flow-500 hover:bg-flow-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2 transition"
        >
          {pending ? 'Guardando…' : 'Guardar cambios'}
        </button>

        {!sumasValidas && (
          <p className="text-xs text-bajo">Cada grupo debe sumar exactamente 100% antes de guardar.</p>
        )}
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
