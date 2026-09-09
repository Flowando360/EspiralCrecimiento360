'use client';

import { useState, useTransition } from 'react';
import { iniciarSesion } from './actions';

export default function LoginPage() {
  const [identificador, setIdentificador] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await iniciarSesion({ identificador, password });
      if (res && !res.ok) setError(res.error);
    });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-marmol-50 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-crecimiento text-white font-display text-xl font-bold mb-3">
            CC
          </div>
          <h1 className="font-display text-xl font-semibold text-secundario">
            Espiral de Crecimiento 360°
          </h1>
          <p className="text-sm text-marmol-500 mt-1">Flow, Nexus y Visión · by FlowAndo</p>
        </div>

        <form onSubmit={handleSubmit} className="card p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-marmol-700 mb-1">Usuario o correo</label>
            <input
              type="text"
              required
              autoComplete="username"
              value={identificador}
              onChange={(e) => setIdentificador(e.target.value)}
              className="w-full rounded-lg border border-marmol-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-flow-400"
              placeholder="ej: juan.perez o tu correo"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-marmol-700 mb-1">Contraseña</label>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-marmol-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-flow-400"
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-sm text-bajo">{error}</p>}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-lg bg-flow-500 hover:bg-flow-600 text-white text-sm font-medium py-2.5 transition disabled:opacity-60"
          >
            {pending ? 'Ingresando…' : 'Ingresar'}
          </button>

          <p className="text-xs text-marmol-400 text-center pt-2">
            El acceso se crea por invitación de Talento Humano. Si no tienes cuenta, contacta a tu líder.
          </p>
        </form>
      </div>
    </div>
  );
}
