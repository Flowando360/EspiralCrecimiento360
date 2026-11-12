'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { quitarClienteInterno } from '@/app/(dashboard)/espiral-crecimiento/evaluaciones/[evaluacionId]/valoraciones/actions';

export function QuitarClienteInterno({ evaluacionId, tareaId }: { evaluacionId: string; tareaId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  return (
    <span className="text-xs">
      <button
        type="button"
        disabled={pending}
        className="text-marmol-400 hover:text-bajo"
        onClick={() =>
          window.confirm('¿Quitar esta invitación?') &&
          startTransition(async () => {
            setError(null);
            const res = await quitarClienteInterno({ evaluacionId, tareaId });
            if (!res.ok) return setError(res.error);
            router.refresh();
          })
        }
      >
        Quitar invitación
      </button>
      {error && <span className="ml-2 text-red-600">{error}</span>}
    </span>
  );
}
