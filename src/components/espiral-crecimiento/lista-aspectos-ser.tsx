'use client';

import { useState, useTransition } from 'react';
import {
  guardarPuntajeSer,
  guardarComentarioColaborador,
} from '@/app/(dashboard)/espiral-crecimiento/colaboradores/[id]/guia-flow/actions';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

export interface AspectoConDatos {
  id: string;
  nombre: string;
  puntaje: number | null;
  nota: string | null;
  comentario: string | null;
}

export function ListaAspectosSer({
  colaboradorId,
  guiaDelFlowId,
  aspectos,
  puedeEditarPuntaje,
  puedeComentar,
}: {
  colaboradorId: string;
  guiaDelFlowId: string;
  aspectos: AspectoConDatos[];
  puedeEditarPuntaje: boolean;
  puedeComentar: boolean;
}) {
  const [items, setItems] = useState(aspectos);
  const [guardados, setGuardados] = useState<Record<string, boolean>>({});
  const [, startTransition] = useTransition();

  function guardarPuntaje(aspectoId: string, puntaje: number, notaActual?: string) {
    setItems((prev) => prev.map((a) => (a.id === aspectoId ? { ...a, puntaje } : a)));
    startTransition(async () => {
      await guardarPuntajeSer({ colaboradorId, guiaDelFlowId, aspectoId, puntaje, nota: notaActual });
    });
  }

  function guardarNota(aspectoId: string, puntajeActual: number | null, nota: string) {
    if (!puntajeActual) return; // la nota se guarda junto con el puntaje; sin puntaje aún no hay nada que asociar
    setItems((prev) => prev.map((a) => (a.id === aspectoId ? { ...a, nota } : a)));
    startTransition(async () => {
      await guardarPuntajeSer({ colaboradorId, guiaDelFlowId, aspectoId, puntaje: puntajeActual, nota });
    });
  }

  function guardarComentario(aspectoId: string, comentario: string) {
    if (!comentario.trim()) return;
    startTransition(async () => {
      const res = await guardarComentarioColaborador({ colaboradorId, guiaDelFlowId, aspectoId, comentario });
      if (res.ok) setGuardados((prev) => ({ ...prev, [aspectoId]: true }));
    });
  }

  return (
    <div className="space-y-3">
      {items.map((a) => (
        <div key={a.id} className="rounded-lg border border-marmol-200 p-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-marmol-800">{a.nombre}</p>

            {puedeEditarPuntaje ? (
              <div className="flex gap-1 shrink-0">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => guardarPuntaje(a.id, n)}
                    className={cn(
                      'h-7 w-7 rounded-md border text-xs font-medium transition',
                      a.puntaje === n
                        ? 'border-ser bg-ser text-white'
                        : 'border-marmol-200 text-marmol-500 hover:border-ser'
                    )}
                  >
                    {n}
                  </button>
                ))}
              </div>
            ) : (
              <span
                className={cn(
                  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium shrink-0',
                  a.puntaje != null ? 'badge-alto' : 'bg-marmol-100 text-marmol-400 border border-marmol-200'
                )}
              >
                {a.puntaje ?? 'Sin puntaje'}
              </span>
            )}
          </div>

          {puedeEditarPuntaje && (
            <input
              type="text"
              placeholder="Nota corta del resultado (opcional, mejora el informe generado)…"
              defaultValue={a.nota ?? ''}
              onBlur={(e) => guardarNota(a.id, a.puntaje, e.target.value)}
              maxLength={300}
              className="mt-2 w-full rounded-lg border border-marmol-200 px-2.5 py-1.5 text-xs"
            />
          )}

          {puedeComentar && (
            <div className="mt-2">
              <textarea
                placeholder="Tu reflexión sobre este aspecto (opcional)…"
                defaultValue={a.comentario ?? ''}
                onBlur={(e) => guardarComentario(a.id, e.target.value)}
                rows={2}
                className="w-full rounded-lg border border-marmol-200 px-2.5 py-1.5 text-xs"
              />
              {guardados[a.id] && (
                <p className="text-[11px] text-alto flex items-center gap-1 mt-1">
                  <Check size={10} /> Guardado
                </p>
              )}
            </div>
          )}

          {!puedeComentar && a.comentario && (
            <p className="text-xs text-marmol-500 mt-2 italic">"{a.comentario}"</p>
          )}
        </div>
      ))}
    </div>
  );
}
