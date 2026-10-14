'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { solicitarRecuperacion } from './actions';

export default function RecuperarContrasenaPage() {
  const [correo, setCorreo] = useState('');
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await solicitarRecuperacion({ correo });
      if (!res.ok) return setError(res.error);
      setEnviado(true);
    });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-marmol-50 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Image src="/marca/EspiralLogoCompleto.png" alt="Espiral de Crecimiento 360°" width={340} height={143} className="mx-auto h-auto w-full max-w-[280px]" priority />
        </div>

        <div className="card p-6 space-y-4">
          <div>
            <h1 className="font-display text-lg font-semibold text-secundario">Recuperar contraseña</h1>
            <p className="text-xs text-marmol-500 mt-1">
              Escribe el correo de tu cuenta. Si existe, te enviaremos un enlace para definir una contraseña nueva.
            </p>
          </div>

          {enviado ? (
            <p className="text-sm text-marmol-700">
              Si el correo está registrado, en unos minutos recibirás el enlace. Revisa también la carpeta de spam.
            </p>
          ) : (
            <form onSubmit={enviar} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-marmol-700 mb-1">Correo</label>
                <input
                  type="email"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  required
                  autoComplete="email"
                  className="w-full rounded-lg border border-marmol-200 px-3 py-2 text-sm"
                />
              </div>
              {error && <p className="text-sm text-bajo">{error}</p>}
              <button type="submit" disabled={pending} className="w-full rounded-lg bg-flow-600 hover:bg-flow-700 text-white text-sm font-medium py-2 disabled:opacity-60">
                {pending ? 'Enviando…' : 'Enviar enlace'}
              </button>
            </form>
          )}

          <p className="text-center text-xs text-marmol-500">
            <Link href="/login" className="text-flow-700 hover:underline">Volver a iniciar sesión</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
