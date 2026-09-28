'use client';

import { useState, useTransition } from 'react';
import { guardarEscalaRiesgos } from '@/app/(dashboard)/administracion/configuracion/actions';
import { Check } from 'lucide-react';
import type { EscalaRiesgosConfig } from '@/lib/calculos/matriz-riesgos';

const campo = 'w-full rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm';
const campoCorto = 'w-16 rounded-lg border border-marmol-200 px-2 py-1.5 text-sm text-center';

export function FormularioEscalaRiesgos({ inicial }: { inicial: EscalaRiesgosConfig }) {
  const [escala, setEscala] = useState<EscalaRiesgosConfig>(inicial);
  const [pending, startTransition] = useTransition();
  const [resultado, setResultado] = useState<{ ok: boolean; error?: string } | null>(null);

  function setEtiqueta(
    campo: 'etiquetasImpacto' | 'etiquetasProbabilidad',
    tipo: 'riesgo' | 'oportunidad',
    indice: 0 | 1 | 2,
    valor: string
  ) {
    setEscala((prev) => {
      const siguiente = [...prev[campo][tipo]] as [string, string, string];
      siguiente[indice] = valor;
      return { ...prev, [campo]: { ...prev[campo], [tipo]: siguiente } };
    });
    setResultado(null);
  }

  function guardar() {
    setResultado(null);
    startTransition(async () => {
      const res = await guardarEscalaRiesgos(escala);
      setResultado(res);
    });
  }

  function FilaEscala({ tipo }: { tipo: 'riesgo' | 'oportunidad' }) {
    return (
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-marmol-400">{tipo === 'riesgo' ? 'Riesgo' : 'Oportunidad'}</p>
        <div className="grid grid-cols-3 gap-2">
          {([0, 1, 2] as const).map((i) => (
            <input
              key={i}
              value={escala.etiquetasProbabilidad[tipo][i]}
              onChange={(e) => setEtiqueta('etiquetasProbabilidad', tipo, i, e.target.value)}
              placeholder={`Probabilidad ${i + 1}`}
              className={campo}
            />
          ))}
        </div>
        <div className="grid grid-cols-3 gap-2">
          {([0, 1, 2] as const).map((i) => (
            <input
              key={i}
              value={escala.etiquetasImpacto[tipo][i]}
              onChange={(e) => setEtiqueta('etiquetasImpacto', tipo, i, e.target.value)}
              placeholder={`Impacto ${i + 1}`}
              className={campo}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="card p-5 space-y-4">
      <div>
        <h2 className="font-display font-semibold text-secundario">Escala de valoración de Riesgos</h2>
        <p className="text-xs text-marmol-400 mt-0.5">
          Etiquetas de los 3 grados de probabilidad e impacto (Procesos y Sistemas de Gestión → Riesgos
          y oportunidades). La valoración sigue siendo grado 1-3 × grado 1-3 = 1 a 9; solo cambian los
          nombres que ve el usuario y dónde caen los cortes de bajo/medio/alto.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <FilaEscala tipo="riesgo" />
        <FilaEscala tipo="oportunidad" />
      </div>

      <div className="flex flex-wrap items-center gap-4 pt-1 border-t border-marmol-100">
        <div className="flex items-center gap-2">
          <label className="text-sm text-marmol-600">"Bajo" hasta</label>
          <input
            type="number"
            min={1}
            max={8}
            value={escala.umbralBajo}
            onChange={(e) => {
              setEscala((prev) => ({ ...prev, umbralBajo: Number(e.target.value) }));
              setResultado(null);
            }}
            className={campoCorto}
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-marmol-600">"Medio/Alto" hasta</label>
          <input
            type="number"
            min={2}
            max={9}
            value={escala.umbralMedio}
            onChange={(e) => {
              setEscala((prev) => ({ ...prev, umbralMedio: Number(e.target.value) }));
              setResultado(null);
            }}
            className={campoCorto}
          />
        </div>
        <p className="text-xs text-marmol-400">Por encima de este segundo corte, el nivel es "Alto" (riesgo) o "Clave" (oportunidad).</p>
      </div>

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
