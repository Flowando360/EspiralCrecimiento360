'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { UserPlus } from 'lucide-react';
import { invitarClienteInterno } from '@/app/(dashboard)/espiral-crecimiento/evaluaciones/[evaluacionId]/valoraciones/actions';

/** Talento Humano invita a un cliente interno (persona que recibe el servicio) a valorar a quien se evalúa. */
export function InvitarClienteInterno({ evaluacionId, opciones }: { evaluacionId: string; opciones: { id: string; nombre: string }[] }) {
  const router = useRouter();
  const [elegido, setElegido] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function invitar() {
    if (!elegido) return;
    setError(null);
    startTransition(async () => {
      const res = await invitarClienteInterno({ evaluacionId, evaluadorId: elegido });
      if (!res.ok) return setError(res.error);
      setElegido('');
      router.refresh();
    });
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <select value={elegido} onChange={(e) => setElegido(e.target.value)} className="rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm min-w-[15rem]">
          <option value="">Elige a quién invitar…</option>
          {opciones.map((o) => (
            <option key={o.id} value={o.id}>{o.nombre}</option>
          ))}
        </select>
        <button type="button" onClick={invitar} disabled={pending || !elegido} className="btn-primary text-xs inline-flex items-center gap-1 disabled:opacity-40">
          <UserPlus size={12} /> {pending ? 'Invitando…' : 'Invitar a valorar'}
        </button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
