'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { guardarPesosDimensiones, restablecerPesosDimensiones } from '@/app/(dashboard)/administracion/indice-integral/actions';
import { pesosValidos } from '@/lib/desempeno/indice-integral';
import { cn } from '@/lib/utils';

export interface FilaPesos {
  nivel: 'operativo' | 'tecnico_administrativo' | 'supervision' | 'directivo';
  etiqueta: string;
  ayuda: string;
  saber: number;
  hacer: number;
  deber: number;
  personalizado: boolean;
}

function Fila({ fila }: { fila: FilaPesos }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [listo, setListo] = useState(false);
  const [v, setV] = useState({ saber: String(fila.saber), hacer: String(fila.hacer), deber: String(fila.deber) });
  const nums = { saber: Number(v.saber), hacer: Number(v.hacer), deber: Number(v.deber) };
  const suma = Math.round((nums.saber + nums.hacer + nums.deber) * 100) / 100;
  const valido = pesosValidos(nums);
  const cambio = nums.saber !== fila.saber || nums.hacer !== fila.hacer || nums.deber !== fila.deber;

  const campo = 'w-20 rounded-lg border border-marmol-200 px-2 py-1.5 text-sm text-center';

  function guardar() {
    setError(null);
    setListo(false);
    startTransition(async () => {
      const res = await guardarPesosDimensiones({ nivel: fila.nivel, ...nums });
      if (!res.ok) setError(res.error);
      else {
        setListo(true);
        router.refresh();
      }
    });
  }

  function restablecer() {
    setError(null);
    startTransition(async () => {
      const res = await restablecerPesosDimensiones(fila.nivel);
      if (!res.ok) setError(res.error);
      else {
        setV({ saber: '25', hacer: '40', deber: '35' });
        router.refresh();
      }
    });
  }

  return (
    <tr className="border-b border-marmol-100 last:border-0 align-top">
      <td className="px-4 py-3">
        <p className="text-sm font-medium text-marmol-800">{fila.etiqueta}</p>
        <p className="text-xs text-marmol-400">{fila.ayuda}</p>
        {fila.personalizado ? <p className="text-xs text-flow-700 mt-0.5">Pesos propios</p> : <p className="text-xs text-marmol-400 mt-0.5">Pesos de partida</p>}
      </td>
      {(['saber', 'hacer', 'deber'] as const).map((d) => (
        <td key={d} className="px-3 py-3 text-center">
          <input type="number" min={0} max={100} step="1" value={v[d]} onChange={(e) => { setV((p) => ({ ...p, [d]: e.target.value })); setListo(false); }} aria-label={`Peso de ${d} para ${fila.etiqueta}`} className={campo} />
        </td>
      ))}
      <td className="px-3 py-3 text-center">
        <span className={cn('text-sm font-medium', valido ? 'text-alto' : 'text-bajo')}>{suma} %</span>
        {!valido && <p className="text-xs text-bajo">Debe sumar 100</p>}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2 flex-wrap">
          <button type="button" onClick={guardar} disabled={pending || !valido || !cambio} className="rounded-lg bg-flow-500 hover:bg-flow-600 disabled:opacity-40 text-white text-xs font-medium px-3 py-1.5">
            {pending ? 'Guardando…' : 'Guardar'}
          </button>
          {fila.personalizado && (
            <button type="button" onClick={restablecer} disabled={pending} className="text-xs text-marmol-500 hover:underline">
              Restablecer
            </button>
          )}
        </div>
        {listo && <p className="text-xs text-alto mt-1">Guardado</p>}
        {error && <p className="text-xs text-bajo mt-1">{error}</p>}
      </td>
    </tr>
  );
}

export function EditorPesosDimensiones({ filas }: { filas: FilaPesos[] }) {
  return (
    <div className="card overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-marmol-200 text-left text-xs uppercase tracking-wide text-marmol-400">
            <th className="px-4 py-2 font-medium">Nivel de cargo</th>
            <th className="px-3 py-2 font-medium text-center text-saber">Saber %</th>
            <th className="px-3 py-2 font-medium text-center text-hacer">Hacer %</th>
            <th className="px-3 py-2 font-medium text-center text-deber">Deber %</th>
            <th className="px-3 py-2 font-medium text-center">Suma</th>
            <th className="px-4 py-2 font-medium" />
          </tr>
        </thead>
        <tbody>
          {filas.map((f) => (
            <Fila key={f.nivel} fila={f} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
