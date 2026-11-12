'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Unlock } from 'lucide-react';
import { reabrirValoracion } from '@/app/(dashboard)/espiral-crecimiento/evaluar/actions';

/** Botón para que Talento Humano reabra una valoración enviada. Exige un motivo, que queda en la auditoría. */
export function ReabrirValoracion({ tareaId, evaluador }: { tareaId: string; evaluador: string }) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [motivo, setMotivo] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function confirmar() {
    setError(null);
    startTransition(async () => {
      const res = await reabrirValoracion({ evaluacionTareaId: tareaId, motivo });
      if (!res.ok) return setError(res.error);
      setAbierto(false);
      setMotivo('');
      router.refresh();
    });
  }

  if (!abierto) {
    return (
      <button type="button" onClick={() => setAbierto(true)} className="inline-flex items-center gap-1 text-xs text-flow-600 hover:text-flow-700">
        <Unlock size={12} /> Reabrir
      </button>
    );
  }

  return (
    <div className="space-y-2 rounded-lg border border-marmol-200 bg-marmol-50 p-3 max-w-sm">
      <p className="text-xs text-marmol-600">
        {evaluador} podrá corregir su valoración. Mientras esté abierta <strong>no cuenta en los resultados</strong> y vuelve a aparecer como pendiente en su Inicio.
      </p>
      <textarea
        value={motivo}
        onChange={(e) => setMotivo(e.target.value)}
        rows={2}
        placeholder="Motivo de la reapertura (obligatorio, queda en la auditoría)"
        className="w-full rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm"
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button type="button" onClick={confirmar} disabled={pending} className="btn-primary text-xs">
          {pending ? 'Reabriendo…' : 'Reabrir valoración'}
        </button>
        <button type="button" onClick={() => setAbierto(false)} className="text-xs text-marmol-500">
          Cancelar
        </button>
      </div>
    </div>
  );
}
