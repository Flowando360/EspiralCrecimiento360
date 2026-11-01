'use client';

import { useState, useTransition } from 'react';
import { crearCargoNuevo } from '@/app/(dashboard)/administracion/cargos/actions';

export function FormularioNuevoCargo() {
  const [nombre, setNombre] = useState('');
  const [procesoArea, setProcesoArea] = useState('');
  const [personalACargo, setPersonalACargo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function crear() {
    setError(null);
    startTransition(async () => {
      const res = await crearCargoNuevo({ nombre, procesoArea, tienePersonalACargo: personalACargo });
      // Si sale bien, la acción redirige a la edición del cargo.
      if (res && !res.ok) setError(res.error);
    });
  }

  const campo = 'w-full rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm';
  return (
    <div className="card p-6 space-y-4 max-w-xl">
      <div>
        <label className="block text-xs text-marmol-500 mb-1">Nombre del cargo *</label>
        <input value={nombre} onChange={(e) => setNombre(e.target.value)} className={campo} placeholder="Ej: Analista de Nómina" />
      </div>
      <div>
        <label className="block text-xs text-marmol-500 mb-1">Proceso o área</label>
        <input value={procesoArea} onChange={(e) => setProcesoArea(e.target.value)} className={campo} placeholder="Ej: Administrativo" />
      </div>
      <label className="flex items-center gap-2 text-sm text-marmol-700">
        <input type="checkbox" checked={personalACargo} onChange={(e) => setPersonalACargo(e.target.checked)} />
        Tiene personal a cargo
      </label>
      {error && <p className="text-sm text-bajo">{error}</p>}
      <button
        type="button"
        onClick={crear}
        disabled={pending}
        className="rounded-lg bg-flow-500 hover:bg-flow-600 text-white text-sm font-medium px-4 py-2 disabled:opacity-60"
      >
        {pending ? 'Creando…' : 'Crear cargo y continuar'}
      </button>
    </div>
  );
}
