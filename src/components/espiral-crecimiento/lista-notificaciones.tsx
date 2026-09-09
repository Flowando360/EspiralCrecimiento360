'use client';

import { useState, useTransition } from 'react';
import { marcarNotificacionLeida, marcarTodasLeidas } from '@/app/(dashboard)/notificaciones/actions';
import { formatearFecha } from '@/lib/utils';
import { Check, CheckCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface NotificacionItem {
  id: string;
  asunto: string | null;
  cuerpo: string | null;
  leido: boolean;
  created_at: string;
}

export function ListaNotificaciones({ itemsIniciales }: { itemsIniciales: NotificacionItem[] }) {
  const [items, setItems] = useState(itemsIniciales);
  const [, startTransition] = useTransition();

  const noLeidas = items.filter((i) => !i.leido).length;

  function marcarUna(id: string) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, leido: true } : i)));
    startTransition(async () => {
      await marcarNotificacionLeida(id);
    });
  }

  function marcarTodas() {
    setItems((prev) => prev.map((i) => ({ ...i, leido: true })));
    startTransition(async () => {
      await marcarTodasLeidas();
    });
  }

  return (
    <div className="space-y-3">
      {noLeidas > 0 && (
        <button
          type="button"
          onClick={marcarTodas}
          className="inline-flex items-center gap-1.5 text-xs text-flow-600 hover:underline"
        >
          <CheckCheck size={14} /> Marcar todas como leídas ({noLeidas})
        </button>
      )}

      <div className="space-y-2">
        {items.map((n) => (
          <div
            key={n.id}
            className={cn(
              'card p-4 flex items-start justify-between gap-3',
              !n.leido && 'border-flow-200 bg-flow-50/40'
            )}
          >
            <div>
              <p className={cn('text-sm', n.leido ? 'text-marmol-700' : 'font-medium text-marmol-900')}>{n.asunto}</p>
              {n.cuerpo && <p className="text-xs text-marmol-500 mt-0.5">{n.cuerpo}</p>}
              <p className="text-xs text-marmol-400 mt-1">{formatearFecha(n.created_at)}</p>
            </div>
            {!n.leido && (
              <button
                type="button"
                onClick={() => marcarUna(n.id)}
                className="shrink-0 rounded-lg p-1.5 text-marmol-400 hover:bg-marmol-100 hover:text-flow-600 transition"
                title="Marcar como leída"
              >
                <Check size={14} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
