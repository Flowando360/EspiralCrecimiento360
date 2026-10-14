'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { cambiarEstadoRequerimiento } from '@/app/proveedor/(panel)/actions';

const ESTADOS = [
  { valor: 'nuevo', etiqueta: 'Nuevo' },
  { valor: 'en_revision', etiqueta: 'En revisión' },
  { valor: 'resuelto', etiqueta: 'Resuelto' },
  { valor: 'descartado', etiqueta: 'Descartado' },
];

export function CambiarEstadoRequerimiento({ requerimientoId, estado }: { requerimientoId: string; estado: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <select
      value={estado}
      disabled={pending}
      onChange={(e) =>
        startTransition(async () => {
          const res = await cambiarEstadoRequerimiento(requerimientoId, e.target.value);
          if (res.ok) router.refresh();
          else window.alert(res.error);
        })
      }
      className="rounded-lg border border-marmol-200 px-2 py-1 text-sm"
    >
      {ESTADOS.map((e) => (
        <option key={e.valor} value={e.valor}>{e.etiqueta}</option>
      ))}
    </select>
  );
}
