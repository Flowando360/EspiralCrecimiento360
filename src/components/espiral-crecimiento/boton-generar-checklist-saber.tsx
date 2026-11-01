'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { generarChecklistSaber } from '@/app/(dashboard)/espiral-crecimiento/colaboradores/[id]/saber/actions';

export function BotonGenerarChecklistSaber({ colaboradorId }: { colaboradorId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [mensaje, setMensaje] = useState<string | null>(null);

  function generar() {
    setMensaje(null);
    startTransition(async () => {
      const res = await generarChecklistSaber(colaboradorId);
      if (!res.ok) return setMensaje(res.error);
      setMensaje(res.creados === 0 ? 'No hay ítems nuevos: el checklist ya está al día.' : `Se agregaron ${res.creados} ítems al checklist.`);
      router.refresh();
    });
  }

  return (
    <div className="card p-4 flex items-center justify-between flex-wrap gap-3">
      <p className="text-sm text-marmol-600 max-w-md">
        Cruza lo que exige el cargo con lo que la persona ya acreditó en su hoja de vida (formación,
        certificaciones, experiencia) y arma el checklist por ti.
      </p>
      <div className="flex items-center gap-3">
        {mensaje && <span className="text-xs text-marmol-500">{mensaje}</span>}
        <button
          type="button"
          onClick={generar}
          disabled={pending}
          className="rounded-lg bg-flow-500 hover:bg-flow-600 text-white text-sm font-medium px-4 py-2 disabled:opacity-60"
        >
          {pending ? 'Generando…' : 'Generar checklist desde cargo y hoja de vida'}
        </button>
      </div>
    </div>
  );
}
