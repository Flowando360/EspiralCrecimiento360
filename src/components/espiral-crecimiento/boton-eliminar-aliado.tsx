'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { eliminarAliado } from '@/app/(dashboard)/nexa/directorio/actions';
import { Trash2 } from 'lucide-react';

export function BotonEliminarAliado({ id }: { id: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function eliminar() {
    if (!confirm('¿Eliminar este aliado del directorio?')) return;
    startTransition(async () => {
      await eliminarAliado(id);
      router.refresh();
    });
  }

  return (
    <button type="button" onClick={eliminar} disabled={pending} className="text-marmol-400 hover:text-bajo disabled:opacity-40">
      <Trash2 size={14} />
    </button>
  );
}
