'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { guardarContrasenaNueva } from './actions';

export default function RestablecerContrasenaPage() {
  const [password, setPassword] = useState('');
  const [confirmacion, setConfirmacion] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function guardar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirmacion) return setError('Las dos contraseñas no coinciden.');
    startTransition(async () => {
      const res = await guardarContrasenaNueva({ password });
      if (res && !res.ok) setError(res.error);
    });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-marmol-50 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Image src="/marca/EspiralLogoCompleto.png" alt="Espiral de Crecimiento 360°" width={340} height={143} className="mx-auto h-auto w-full max-w-[280px]" priority />
        </div>

        <form onSubmit={guardar} className="card p-6 space-y-4">
          <div>
            <h1 className="font-display text-lg font-semibold text-secundario">Define tu contraseña nueva</h1>
            <p className="text-xs text-marmol-500 mt-1">Mínimo 8 caracteres.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-marmol-700 mb-1">Contraseña nueva</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="new-password" className="w-full rounded-lg border border-marmol-200 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-marmol-700 mb-1">Repite la contraseña</label>
            <input type="password" value={confirmacion} onChange={(e) => setConfirmacion(e.target.value)} required autoComplete="new-password" className="w-full rounded-lg border border-marmol-200 px-3 py-2 text-sm" />
          </div>
          {error && <p className="text-sm text-bajo">{error}</p>}
          <button type="submit" disabled={pending} className="w-full rounded-lg bg-flow-600 hover:bg-flow-700 text-white text-sm font-medium py-2 disabled:opacity-60">
            {pending ? 'Guardando…' : 'Guardar contraseña'}
          </button>
          <p className="text-center text-xs text-marmol-500">
            ¿El enlace no funciona? <Link href="/recuperar-contrasena" className="text-flow-700 hover:underline">Pide uno nuevo</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
