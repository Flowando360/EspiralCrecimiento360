'use client';

import { useState, useTransition } from 'react';
import { procesarPendientesAhora } from '@/app/(dashboard)/reclutamiento/procesamiento-actions';
import { Bot } from 'lucide-react';

export function BotonProcesarPendientes({ pendientes }: { pendientes: number }) {
  const [pending, startTransition] = useTransition();
  const [mensaje, setMensaje] = useState<string | null>(null);

  if (pendientes === 0) return <p className="text-xs text-marmol-400">No hay hojas de vida en cola.</p>;

  const procesar = () => {
    setMensaje(null);
    startTransition(async () => {
      const r = await procesarPendientesAhora(5);
      setMensaje(r.ok ? `Se procesaron ${r.procesados} hoja(s) de vida.` : r.error);
    });
  };

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <button
        type="button"
        disabled={pending}
        onClick={procesar}
        className="inline-flex items-center gap-1.5 rounded-lg bg-flow-500 hover:bg-flow-600 text-white text-xs font-medium px-3 py-1.5 disabled:opacity-50"
      >
        <Bot size={13} /> {pending ? 'Leyendo hojas de vida…' : `Procesar hasta 5 pendientes`}
      </button>
      {mensaje && <span className="text-xs text-marmol-500">{mensaje}</span>}
    </div>
  );
}
