'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { completarConfiguracionBase } from '@/app/proveedor/(panel)/actions';
import { Settings2 } from 'lucide-react';

/** Copia la escala de niveles, las competencias y los parámetros legales base. No borra ni cambia lo que la empresa ya tiene. */
export function CompletarConfiguracion({ empresaId }: { empresaId: string }) {
  const router = useRouter();
  const [mensaje, setMensaje] = useState<{ ok: boolean; texto: string } | null>(null);
  const [pending, startTransition] = useTransition();

  function completar() {
    setMensaje(null);
    startTransition(async () => {
      const res = await completarConfiguracionBase(empresaId);
      setMensaje(res.ok ? { ok: true, texto: 'Configuración base revisada y completada.' } : { ok: false, texto: res.error });
      if (res.ok) router.refresh();
    });
  }

  return (
    <div className="card p-5 space-y-3">
      <h2 className="font-semibold text-marmol-800 flex items-center gap-2"><Settings2 size={16} className="text-flow-600" /> Configuración base</h2>
      <p className="text-xs text-marmol-500">
        Escala de niveles, competencias con sus criterios y parámetros legales. Se copian de la empresa plantilla solo lo que falte.
      </p>
      {mensaje && <p className={mensaje.ok ? 'text-sm text-flow-700' : 'text-sm text-bajo'}>{mensaje.texto}</p>}
      <button type="button" onClick={completar} disabled={pending} className="rounded-lg border border-marmol-200 hover:bg-marmol-50 text-marmol-700 text-sm font-medium px-4 py-2 disabled:opacity-60">
        {pending ? 'Revisando…' : 'Completar configuración base'}
      </button>
    </div>
  );
}
