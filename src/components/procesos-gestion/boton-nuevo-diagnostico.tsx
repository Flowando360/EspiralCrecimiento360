'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { crearDiagnostico } from '@/app/(dashboard)/procesos-gestion/diagnostico-iso9001/actions';
import { Plus } from 'lucide-react';

export function BotonNuevoDiagnostico() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function crear() {
    setError(null);
    startTransition(async () => {
      const res = await crearDiagnostico();
      if (res.ok) router.push(`/procesos-gestion/diagnostico-iso9001/${res.id}`);
      else setError(res.error);
    });
  }

  return (
    <div>
      <button
        type="button"
        onClick={crear}
        disabled={pending}
        className="inline-flex items-center gap-1.5 rounded-lg bg-flow-500 hover:bg-flow-600 disabled:opacity-50 text-white text-sm font-medium px-3.5 py-2 transition"
      >
        <Plus size={16} /> {pending ? 'Creando…' : 'Nuevo diagnóstico'}
      </button>
      {error && <p className="text-xs text-bajo mt-1">{error}</p>}
    </div>
  );
}
