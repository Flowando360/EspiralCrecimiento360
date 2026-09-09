'use client';

import { useState, useTransition } from 'react';
import { Heart, Lock } from 'lucide-react';
import { actualizarFechasPersonales } from '@/app/(dashboard)/mi-perfil/actions';

interface FechasPersonales {
  fecha_matrimonio: string | null;
  fecha_baby_shower: string | null;
  en_embarazo: boolean;
  fecha_probable_parto: string | null;
}

export function FechasPersonalesForm({ datosIniciales }: { datosIniciales: FechasPersonales | null }) {
  const [fechaMatrimonio, setFechaMatrimonio] = useState(datosIniciales?.fecha_matrimonio ?? '');
  const [fechaBabyShower, setFechaBabyShower] = useState(datosIniciales?.fecha_baby_shower ?? '');
  const [enEmbarazo, setEnEmbarazo] = useState(datosIniciales?.en_embarazo ?? false);
  const [fechaProbableParto, setFechaProbableParto] = useState(datosIniciales?.fecha_probable_parto ?? '');
  const [guardado, setGuardado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function guardar() {
    setError(null);
    setGuardado(false);
    startTransition(async () => {
      const res = await actualizarFechasPersonales({
        fechaMatrimonio,
        fechaBabyShower,
        enEmbarazo,
        fechaProbableParto,
      });
      if (res.ok) {
        setGuardado(true);
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <div className="card p-5">
      <h3 className="font-display font-semibold text-secundario mb-1">Mis fechas personales</h3>
      <p className="text-xs text-marmol-400 mb-4">
        Solo tú puedes ver y editar esta información. El aniversario de bodas y el baby shower le avisan a tu
        líder para celebrar contigo; el embarazo es privado, solo lo ve Talento Humano.
      </p>

      <div className="grid sm:grid-cols-2 gap-3 mb-4">
        <div>
          <label className="text-xs text-marmol-500 mb-1 block">Fecha de matrimonio</label>
          <input
            type="date"
            value={fechaMatrimonio}
            onChange={(e) => setFechaMatrimonio(e.target.value)}
            className="w-full rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-marmol-500 mb-1 block">Fecha de baby shower</label>
          <input
            type="date"
            value={fechaBabyShower}
            onChange={(e) => setFechaBabyShower(e.target.value)}
            className="w-full rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm"
          />
        </div>
      </div>

      <div className="border-t border-marmol-100 pt-3">
        <p className="text-xs font-medium text-marmol-600 mb-2 inline-flex items-center gap-1">
          <Lock size={11} /> Dato privado — solo tú y Talento Humano
        </p>
        <label className="flex items-center gap-2 text-sm text-marmol-700 mb-2">
          <input type="checkbox" checked={enEmbarazo} onChange={(e) => setEnEmbarazo(e.target.checked)} />
          Estoy en embarazo
        </label>
        {enEmbarazo && (
          <div>
            <label className="text-xs text-marmol-500 mb-1 block">Fecha probable de parto</label>
            <input
              type="date"
              value={fechaProbableParto}
              onChange={(e) => setFechaProbableParto(e.target.value)}
              className="w-full max-w-xs rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm"
            />
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 mt-4">
        <button
          onClick={guardar}
          disabled={pending}
          className="inline-flex items-center gap-1.5 rounded-lg bg-flow-500 hover:bg-flow-600 disabled:opacity-40 text-white text-sm font-medium px-3.5 py-1.5"
        >
          <Heart size={14} /> Guardar
        </button>
        {guardado && <span className="text-xs text-alto">Guardado</span>}
        {error && <span className="text-xs text-bajo">{error}</span>}
      </div>
    </div>
  );
}
