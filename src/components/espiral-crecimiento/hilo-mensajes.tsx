'use client';

import { useState, useTransition, useRef } from 'react';
import { enviarMensaje } from '@/app/(dashboard)/mensajes/actions';
import { formatearFecha } from '@/lib/utils';
import { Send } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface MensajeItem {
  id: string;
  contenido: string;
  created_at: string;
  esMio: boolean;
}

export function HiloMensajes({ destinatarioId, itemsIniciales }: { destinatarioId: string; itemsIniciales: MensajeItem[] }) {
  const [mensajes, setMensajes] = useState(itemsIniciales);
  const [texto, setTexto] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  function enviar() {
    const contenido = texto.trim();
    if (!contenido) return;

    const idTemporal = `temp-${Date.now()}`;
    const optimista: MensajeItem = {
      id: idTemporal,
      contenido,
      created_at: new Date().toISOString(),
      esMio: true,
    };
    setError(null);
    setMensajes((prev) => [...prev, optimista]);
    setTexto('');
    startTransition(async () => {
      const res = await enviarMensaje({ destinatarioId, contenido });
      if (!res.ok) {
        // Sin esto, un envío rechazado (ej. por permisos) se veía en pantalla
        // como "enviado" para quien lo escribió, aunque nunca le llegara al
        // destinatario — quita la burbuja optimista y avisa del error real.
        setMensajes((prev) => prev.filter((m) => m.id !== idTemporal));
        setError(res.error);
      }
    });
  }

  return (
    <div className="flex flex-col h-[60vh]">
      <div className="flex-1 overflow-y-auto space-y-2 p-4 card">
        {mensajes.length === 0 ? (
          <p className="text-sm text-marmol-400 text-center mt-8">Aún no hay mensajes. Escribe el primero.</p>
        ) : (
          mensajes.map((m) => (
            <div key={m.id} className={cn('flex', m.esMio ? 'justify-end' : 'justify-start')}>
              <div
                className={cn(
                  'max-w-[70%] rounded-2xl px-3.5 py-2 text-sm',
                  m.esMio ? 'bg-flow-500 text-white rounded-br-sm' : 'bg-marmol-100 text-marmol-800 rounded-bl-sm'
                )}
              >
                <p>{m.contenido}</p>
                <p className={cn('text-[10px] mt-1', m.esMio ? 'text-white/70' : 'text-marmol-400')}>
                  {formatearFecha(m.created_at)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {error && <p className="text-xs text-bajo mt-2">No se pudo enviar: {error}</p>}

      <div className="flex items-center gap-2 mt-3">
        <input
          ref={inputRef}
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') enviar();
          }}
          placeholder="Escribe un mensaje…"
          className="flex-1 rounded-lg border border-marmol-200 px-3 py-2 text-sm"
        />
        <button
          type="button"
          disabled={pending || !texto.trim()}
          onClick={enviar}
          className="rounded-lg bg-flow-500 hover:bg-flow-600 disabled:opacity-40 text-white p-2.5 transition"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
