'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { cambiarEstadoEmpresa } from '@/app/proveedor/(panel)/actions';
import { Power } from 'lucide-react';

/** Activa o desactiva la empresa. Si está inactiva, ningún usuario suyo puede entrar. */
export function CambiarEstadoEmpresa({ empresaId, activo }: { empresaId: string; activo: boolean }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function cambiar() {
    const aviso = activo
      ? 'Al desactivar la empresa, ninguno de sus usuarios podrá entrar hasta que la actives de nuevo. ¿Continuar?'
      : '¿Activar la empresa? Sus usuarios podrán volver a entrar.';
    if (!window.confirm(aviso)) return;
    setError(null);
    startTransition(async () => {
      const res = await cambiarEstadoEmpresa(empresaId, !activo);
      if (!res.ok) setError(res.error);
      else router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-end">
      <button
        type="button"
        onClick={cambiar}
        disabled={pending}
        className={
          activo
            ? 'inline-flex items-center gap-1.5 rounded-lg border border-bajo/30 text-bajo hover:bg-bajo/5 text-sm font-medium px-3 py-2 disabled:opacity-60'
            : 'inline-flex items-center gap-1.5 rounded-lg bg-flow-600 hover:bg-flow-700 text-white text-sm font-medium px-3 py-2 disabled:opacity-60'
        }
      >
        <Power size={15} /> {activo ? 'Desactivar empresa' : 'Activar empresa'}
      </button>
      {error && <p className="text-xs text-bajo mt-1">{error}</p>}
    </div>
  );
}
