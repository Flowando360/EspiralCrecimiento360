'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { eliminarCiclo } from '@/app/(dashboard)/espiral-crecimiento/ciclos/actions';

/**
 * Elimina un ciclo creado por error o de pruebas. Pide escribir ELIMINAR para
 * confirmar y avisa cuánto se pierde (evaluaciones y cuántas ya tienen avance).
 */
export function BotonEliminarCiclo({
  cicloId,
  nombre,
  totalEvaluaciones,
  conAvance,
  irALista = false,
}: {
  cicloId: string;
  nombre: string;
  totalEvaluaciones: number;
  conAvance: number;
  irALista?: boolean;
}) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [texto, setTexto] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function confirmar() {
    setError(null);
    startTransition(async () => {
      const res = await eliminarCiclo(cicloId);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      if (irALista) router.push('/espiral-crecimiento/ciclos');
      else router.refresh();
    });
  }

  if (!abierto) {
    return (
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="inline-flex items-center gap-1 text-xs text-marmol-400 hover:text-bajo"
      >
        <Trash2 size={12} /> Eliminar ciclo
      </button>
    );
  }

  return (
    <div className="rounded-lg border border-bajo/30 bg-bajo/5 p-3 space-y-2 text-xs text-marmol-700">
      <p className="font-medium text-bajo">¿Eliminar el ciclo «{nombre}»?</p>
      <p>
        {totalEvaluaciones === 0
          ? 'Este ciclo no tiene evaluaciones generadas.'
          : `Se borrarán sus ${totalEvaluaciones} evaluación(es) con todas las valoraciones, briefs y acuerdos${
              conAvance > 0 ? ` (${conAvance} ya tienen avance o respuestas)` : ''
            }.`}{' '}
        Esta acción no se puede deshacer. Los planes de desarrollo que nacieron de este ciclo se conservan.
      </p>
      <label className="block">
        Para confirmar escribe <strong>ELIMINAR</strong>
        <input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          className="mt-1 w-full rounded-lg border border-marmol-200 bg-white px-2.5 py-1.5 text-sm"
          autoComplete="off"
        />
      </label>
      {error && <p className="text-bajo">{error}</p>}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={confirmar}
          disabled={pending || texto.trim().toUpperCase() !== 'ELIMINAR'}
          className="rounded-lg bg-bajo hover:opacity-90 disabled:opacity-40 text-white font-medium px-2.5 py-1.5"
        >
          {pending ? 'Eliminando…' : 'Eliminar definitivamente'}
        </button>
        <button
          type="button"
          onClick={() => {
            setAbierto(false);
            setTexto('');
            setError(null);
          }}
          disabled={pending}
          className="rounded-lg border border-marmol-200 bg-white text-marmol-600 hover:bg-marmol-100 font-medium px-2.5 py-1.5"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
