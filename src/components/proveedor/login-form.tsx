'use client';

import { useState, useTransition } from 'react';
import { iniciarSesionProveedor } from '@/app/proveedor/login/actions';

export function ProveedorLoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function entrar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await iniciarSesionProveedor({ email, password });
      if (!res.ok) setError(res.error);
    });
  }

  return (
    <form onSubmit={entrar} className="space-y-3">
      <div>
        <label className="block text-xs text-marmol-500 mb-1">Correo</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full rounded-lg border border-marmol-200 px-2.5 py-2 text-sm" />
      </div>
      <div>
        <label className="block text-xs text-marmol-500 mb-1">Contraseña</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full rounded-lg border border-marmol-200 px-2.5 py-2 text-sm" />
      </div>
      {error && <p className="text-sm text-bajo">{error}</p>}
      <button type="submit" disabled={pending} className="w-full rounded-lg bg-flow-600 hover:bg-flow-700 text-white text-sm font-medium py-2 disabled:opacity-60">
        {pending ? 'Entrando…' : 'Entrar'}
      </button>
    </form>
  );
}
