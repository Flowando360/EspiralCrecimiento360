'use client';

import { useState, useTransition } from 'react';
import { guardarEstructuraCodigoDocumental } from '@/app/(dashboard)/administracion/configuracion/actions';
import { Check } from 'lucide-react';

interface Prefijos {
  procedimiento: string;
  politica: string;
  formato: string;
  instructivo: string;
  registro: string;
}

const ETIQUETA_TIPO: Record<keyof Prefijos, string> = {
  procedimiento: 'Procedimiento',
  politica: 'Política',
  formato: 'Formato',
  instructivo: 'Instructivo',
  registro: 'Registro',
};

const campo = 'w-16 rounded-lg border border-marmol-200 px-2 py-1.5 text-sm text-center';

export function FormularioEstructuraCodigoDocumental({
  inicial,
}: {
  inicial: { prefijos: Prefijos; separador: string; digitosConsecutivo: number };
}) {
  const [prefijos, setPrefijos] = useState<Prefijos>(inicial.prefijos);
  const [separador, setSeparador] = useState(inicial.separador);
  const [digitos, setDigitos] = useState(String(inicial.digitosConsecutivo));
  const [pending, startTransition] = useTransition();
  const [resultado, setResultado] = useState<{ ok: boolean; error?: string } | null>(null);

  function guardar() {
    setResultado(null);
    startTransition(async () => {
      const res = await guardarEstructuraCodigoDocumental({
        prefijos,
        separador,
        digitosConsecutivo: Number(digitos),
      });
      setResultado(res);
    });
  }

  const ejemplo = `PROC-01${separador}${prefijos.procedimiento || '??'}${separador}${'1'.padStart(Number(digitos) || 3, '0')}`;

  return (
    <div className="card p-5 space-y-3">
      <div>
        <h2 className="font-display font-semibold text-secundario">Estructura de código documental</h2>
        <p className="text-xs text-marmol-400 mt-0.5">
          Prefijo por tipo de documento, separador y dígitos del consecutivo que arma el código
          automático de cada documento (Procesos y Sistemas de Gestión → Gestión documental).
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {(Object.keys(ETIQUETA_TIPO) as (keyof Prefijos)[]).map((tipo) => (
          <div key={tipo} className="flex items-center gap-2">
            <label className="text-sm text-marmol-600 flex-1">{ETIQUETA_TIPO[tipo]}</label>
            <input
              value={prefijos[tipo]}
              onChange={(e) => {
                setPrefijos((prev) => ({ ...prev, [tipo]: e.target.value.toUpperCase() }));
                setResultado(null);
              }}
              maxLength={6}
              className={campo}
            />
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-4 pt-1 border-t border-marmol-100">
        <div className="flex items-center gap-2">
          <label className="text-sm text-marmol-600">Separador</label>
          <input
            value={separador}
            onChange={(e) => {
              setSeparador(e.target.value);
              setResultado(null);
            }}
            maxLength={3}
            className={campo}
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-marmol-600">Dígitos del consecutivo</label>
          <input
            type="number"
            min={1}
            max={6}
            value={digitos}
            onChange={(e) => {
              setDigitos(e.target.value);
              setResultado(null);
            }}
            className={campo}
          />
        </div>
      </div>

      <p className="text-xs text-marmol-400">
        Ejemplo con estos valores: <span className="font-mono text-marmol-600">{ejemplo}</span>
      </p>

      <div className="flex items-center gap-3">
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
