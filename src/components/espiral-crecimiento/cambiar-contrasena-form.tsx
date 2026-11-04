'use client';

import { useState, useTransition } from 'react';
import { Check, KeyRound } from 'lucide-react';
import { cambiarContrasena } from '@/app/(dashboard)/cambiar-contrasena/actions';

export function CambiarContrasenaForm() {
  const [actual, setActual] = useState('');
  const [nueva, setNueva] = useState('');
  const [repetir, setRepetir] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [listo, setListo] = useState(false);
  const [pending, startTransition] = useTransition();

  function guardar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setListo(false);
    if (nueva !== repetir) {
      setError('La contraseña nueva y su repetición no coinciden');
      return;
    }
    startTransition(async () => {
      const res = await cambiarContrasena({ actual, nueva });
      if (res.ok) {
        setListo(true);
        setActual('');
        setNueva('');
        setRepetir('');
      } else {
        setError(res.error);
      }
    });
  }

  const campo = 'w-full rounded-lg border border-marmol-200 px-3 py-2 text-sm';
  return (
    <form onSubmit={guardar} className="card p-5 space-y-4">
      <h3 className="font-display font-semibold text-secundario flex items-center gap-1.5">
        <KeyRound size={16} /> Tu contraseña
      </h3>
      <label className="block text-sm text-marmol-700">
        Contraseña actual
        <input type="password" autoComplete="current-password" value={actual} onChange={(e) => setActual(e.target.value)} className={`${campo} mt-1`} required />
      </label>
      <label className="block text-sm text-marmol-700">
        Contraseña nueva <span className="text-xs text-marmol-400">(mínimo 8 caracteres)</span>
        <input type="password" autoComplete="new-password" value={nueva} onChange={(e) => setNueva(e.target.value)} className={`${campo} mt-1`} minLength={8} required />
      </label>
      <label className="block text-sm text-marmol-700">
        Repite la contraseña nueva
        <input type="password" autoComplete="new-password" value={repetir} onChange={(e) => setRepetir(e.target.value)} className={`${campo} mt-1`} minLength={8} required />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center gap-1.5 rounded-lg bg-flow-500 hover:bg-flow-600 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 transition"
      >
        {pending ? 'Guardando…' : 'Cambiar contraseña'}
      </button>
      {error && <p role="alert" className="text-sm text-bajo">{error}</p>}
      {listo && (
        <p role="status" className="text-sm text-flow-700 flex items-center gap-1">
          <Check size={14} /> Listo, tu contraseña quedó cambiada. Úsala la próxima vez que entres.
        </p>
      )}
    </form>
  );
}
