'use client';

import { useState, useTransition } from 'react';
import { guardarUmbralClima } from '@/app/(dashboard)/administracion/configuracion/actions';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

export interface UmbralClimaInicial {
  tipo: 'cantidad' | 'porcentaje';
  cantidad: number;
  porcentaje: number | null;
}

export function FormularioUmbralClima({ inicial }: { inicial: UmbralClimaInicial }) {
  const [tipo, setTipo] = useState<'cantidad' | 'porcentaje'>(inicial.tipo);
  const [cantidad, setCantidad] = useState(String(inicial.cantidad));
  const [porcentaje, setPorcentaje] = useState(inicial.porcentaje != null ? String(inicial.porcentaje) : '15');
  const [pending, startTransition] = useTransition();
  const [resultado, setResultado] = useState<{ ok: boolean; error?: string } | null>(null);

  function guardar() {
    setResultado(null);
    startTransition(async () => {
      const res = await guardarUmbralClima({
        tipo,
        cantidad: tipo === 'cantidad' ? Number(cantidad) : undefined,
        porcentaje: tipo === 'porcentaje' ? Number(porcentaje) : undefined,
      });
      setResultado(res);
    });
  }

  return (
    <div className="card p-5 space-y-4">
      <div>
        <h2 className="font-display font-semibold text-secundario">Umbral de anonimato de Clima Organizacional</h2>
        <p className="text-xs text-marmol-400 mt-0.5">
          Mínimo de respuestas que debe haber en un grupo (toda la empresa o un equipo) antes de
          mostrar cualquier resultado agregado — por defecto, 5 respuestas fijas. Puedes cambiarlo a
          un número distinto, o a un porcentaje de la planta activa de ese grupo, para que el umbral
          escale con el tamaño de la empresa.
        </p>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => {
            setTipo('cantidad');
            setResultado(null);
          }}
          className={cn(
            'rounded-lg border px-3.5 py-2 text-sm font-medium transition',
            tipo === 'cantidad' ? 'bg-flow-500 border-flow-500 text-white' : 'border-marmol-200 text-marmol-600'
          )}
        >
          Cantidad fija
        </button>
        <button
          type="button"
          onClick={() => {
            setTipo('porcentaje');
            setResultado(null);
          }}
          className={cn(
            'rounded-lg border px-3.5 py-2 text-sm font-medium transition',
            tipo === 'porcentaje' ? 'bg-flow-500 border-flow-500 text-white' : 'border-marmol-200 text-marmol-600'
          )}
        >
          Porcentaje de la planta
        </button>
      </div>

      {tipo === 'cantidad' ? (
        <div className="max-w-xs">
          <label className="block text-xs text-marmol-500 mb-1">Mínimo de respuestas</label>
          <input
            type="number"
            min={1}
            value={cantidad}
            onChange={(e) => {
              setCantidad(e.target.value);
              setResultado(null);
            }}
            className="w-full rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm"
          />
        </div>
      ) : (
        <div className="max-w-xs">
          <label className="block text-xs text-marmol-500 mb-1">% de la planta activa de cada grupo</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              max={100}
              step={0.5}
              value={porcentaje}
              onChange={(e) => {
                setPorcentaje(e.target.value);
                setResultado(null);
              }}
              className="w-full rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm"
            />
            <span className="text-sm text-marmol-500">%</span>
          </div>
          <p className="text-[11px] text-marmol-400 mt-1">
            Se redondea siempre hacia arriba y nunca baja de 1 respuesta.
          </p>
        </div>
      )}

      <div className="flex items-center gap-3 pt-1">
        <button
          type="button"
          disabled={pending}
          onClick={guardar}
          className="rounded-lg bg-flow-500 hover:bg-flow-600 disabled:opacity-40 text-white text-sm font-medium px-4 py-2 transition"
        >
          {pending ? 'Guardando…' : 'Guardar cambios'}
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
