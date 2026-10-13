'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { concederSuperusuario, quitarSuperusuario } from '@/app/(dashboard)/meta-admin/actions';
import { ShieldCheck, UserMinus, UserPlus } from 'lucide-react';

export interface SuperusuarioFila {
  id: string;
  nombre_completo: string;
  usuario: string;
  email: string;
}

export function GestorSuperusuarios({ superusuarios, usuarioActualId }: { superusuarios: SuperusuarioFila[]; usuarioActualId: string }) {
  const router = useRouter();
  const [usuarioNuevo, setUsuarioNuevo] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function conceder() {
    setError(null);
    startTransition(async () => {
      const res = await concederSuperusuario(usuarioNuevo);
      if (!res.ok) return setError(res.error);
      setUsuarioNuevo('');
      router.refresh();
    });
  }

  function quitar(s: SuperusuarioFila) {
    if (!window.confirm(`¿Quitar el superusuario a ${s.nombre_completo}?`)) return;
    setError(null);
    startTransition(async () => {
      const res = await quitarSuperusuario(s.id);
      if (!res.ok) return setError(res.error);
      router.refresh();
    });
  }

  return (
    <div className="card p-5 space-y-4">
      <div>
        <h2 className="font-semibold text-marmol-800 flex items-center gap-2">
          <ShieldCheck size={18} className="text-flow-600" /> Superusuarios de la plataforma
        </h2>
        <p className="text-xs text-marmol-500 mt-1">
          Ven todas las empresas, crean empresas y descargan respaldos de cualquiera. Concede el acceso solo a cuentas
          de confianza de la alianza.
        </p>
      </div>

      <ul className="divide-y divide-marmol-100">
        {superusuarios.map((s) => (
          <li key={s.id} className="flex items-center justify-between gap-3 py-2.5">
            <div>
              <p className="text-sm text-marmol-800">
                {s.nombre_completo} {s.id === usuarioActualId && <span className="text-xs text-flow-600">(tú)</span>}
              </p>
              <p className="text-xs text-marmol-500 font-mono">
                {s.usuario} · {s.email}
              </p>
            </div>
            {s.id !== usuarioActualId && (
              <button
                type="button"
                onClick={() => quitar(s)}
                disabled={pending}
                className="inline-flex items-center gap-1 text-xs text-bajo hover:underline disabled:opacity-60"
              >
                <UserMinus size={13} /> Quitar
              </button>
            )}
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap items-center gap-2">
        <input
          value={usuarioNuevo}
          onChange={(e) => setUsuarioNuevo(e.target.value.toLowerCase())}
          placeholder="usuario de la cuenta (ej. juan.perez)"
          className="flex-1 min-w-[220px] rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm font-mono"
        />
        <button
          type="button"
          onClick={conceder}
          disabled={pending || !usuarioNuevo.trim()}
          className="inline-flex items-center gap-1.5 rounded-lg border border-marmol-200 hover:bg-marmol-50 text-marmol-700 text-sm font-medium px-3 py-1.5 disabled:opacity-60"
        >
          <UserPlus size={14} /> Conceder superusuario
        </button>
      </div>
      {error && <p className="text-sm text-bajo">{error}</p>}
    </div>
  );
}
