'use client';

import { useState, useTransition } from 'react';
import { Check, Smile } from 'lucide-react';
import { actualizarNombrePreferido } from '@/app/(dashboard)/mi-perfil/actions';

export function NombrePreferidoForm({ nombrePreferidoInicial }: { nombrePreferidoInicial: string | null }) {
  const [nombrePreferido, setNombrePreferido] = useState(nombrePreferidoInicial ?? '');
  const [guardado, setGuardado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function guardar() {
    setError(null);
    setGuardado(false);
    startTransition(async () => {
      const res = await actualizarNombrePreferido({ nombrePreferido });
      if (res.ok) {
        setGuardado(true);
        setTimeout(() => setGuardado(false), 2000);
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <div className="card p-5">
      <h3 className="font-display font-semibold text-secundario mb-1 flex items-center gap-1.5">
        <Smile size={16} /> Cómo te gusta que te llamen
      </h3>
      <p className="text-sm text-marmol-500 mb-3">
        Si tienes un apodo o diminutivo, úsalo aquí — es el nombre que verás en tus saludos y en el
        encabezado del aplicativo, en vez de tu primer nombre.
      </p>
      <div className="flex items-center gap-2 max-w-sm">
        <input
          type="text"
          value={nombrePreferido}
          onChange={(e) => setNombrePreferido(e.target.value)}
          placeholder="ej. Vale, en vez de Valentina"
          maxLength={60}
          className="flex-1 rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm"
        />
        <button
          type="button"
          onClick={guardar}
          disabled={pending}
          className="inline-flex items-center gap-1 rounded-lg bg-flow-500 hover:bg-flow-600 disabled:opacity-40 text-white text-xs font-medium px-3 py-1.5 shrink-0"
        >
          {guardado ? <Check size={12} /> : null} {pending ? 'Guardando…' : guardado ? 'Guardado' : 'Guardar'}
        </button>
      </div>
      {error && <p className="mt-1.5 text-xs text-bajo">{error}</p>}
    </div>
  );
}
