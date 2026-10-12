'use client';

import { useState, useTransition } from 'react';
import { guardarParametroLegal } from '@/app/(dashboard)/administracion/parametros-legales/actions';

const campo = 'rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm';

export function FormularioParametrosLegales({ inicial }: { inicial: { anio: number; smlmv: number }[] }) {
  const [filas, setFilas] = useState(inicial);
  const [anio, setAnio] = useState(String(new Date().getFullYear()));
  const [smlmv, setSmlmv] = useState('');
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  function guardar() {
    setError(null);
    setOk(false);
    startTransition(async () => {
      const res = await guardarParametroLegal({ anio: Number(anio), smlmv: Number(smlmv) });
      if (!res.ok) return setError(res.error);
      const valor = Number(smlmv);
      setFilas((prev) => [{ anio: Number(anio), smlmv: valor }, ...prev.filter((f) => f.anio !== Number(anio))].sort((a, b) => b.anio - a.anio));
      setSmlmv('');
      setOk(true);
    });
  }

  return (
    <div className="space-y-4">
      <div className="card p-4 space-y-3 max-w-xl">
        <h2 className="text-sm font-medium text-marmol-700">Registrar o actualizar el SMLMV de un año</h2>
        <div className="flex flex-wrap items-end gap-2">
          <div>
            <label className="block text-xs text-marmol-500 mb-1">Año</label>
            <input className={`${campo} w-24`} type="number" min={2000} max={2100} value={anio} onChange={(e) => setAnio(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs text-marmol-500 mb-1">SMLMV (COP)</label>
            <input className={`${campo} w-44`} type="number" min={1} value={smlmv} onChange={(e) => setSmlmv(e.target.value)} placeholder="Valor oficial del año" />
          </div>
          <button
            type="button"
            onClick={guardar}
            disabled={pending || !anio || !smlmv}
            className="rounded-lg bg-flow-500 hover:bg-flow-600 disabled:opacity-50 text-white text-sm font-medium px-3 py-2"
          >
            {pending ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
        {error && <p className="text-xs text-bajo">{error}</p>}
        {ok && <p className="text-xs text-alto">Guardado.</p>}
      </div>

      <div className="card divide-y divide-marmol-100 max-w-xl">
        {filas.length === 0 ? (
          <p className="p-4 text-sm text-marmol-500">Aún no hay SMLMV registrado. Sin este valor, la elegibilidad de dotación no puede calcularse.</p>
        ) : (
          filas.map((f) => (
            <div key={f.anio} className="flex items-center justify-between px-4 py-2.5 text-sm">
              <span className="font-medium text-marmol-800">{f.anio}</span>
              <span className="text-marmol-600">$ {Number(f.smlmv).toLocaleString('es-CO')}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
