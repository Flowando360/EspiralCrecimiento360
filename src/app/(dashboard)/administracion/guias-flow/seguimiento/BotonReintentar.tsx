'use client';

import { useState, useTransition } from 'react';
import { RotateCcw } from 'lucide-react';
import { reintentarDocumentosGuiaFlow } from './actions';

/**
 * Botón de "Reintentar" para cuando a alguien nunca se le generaron sus
 * documentos de la Guía del Flow (o quedaron en error) — ver comentario en
 * actions.ts. Puede tardar uno o dos minutos porque vuelve a llamar a
 * Claude y a generar los PDF desde cero.
 */
export function BotonReintentar({ usuarioFlowId }: { usuarioFlowId: string }) {
  const [pendiente, iniciar] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [listo, setListo] = useState(false);

  if (listo) {
    return <span className="text-xs font-semibold text-green-600">¡Reintentado!</span>;
  }

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        disabled={pendiente}
        onClick={() => {
          setError(null);
          iniciar(async () => {
            const resultado = await reintentarDocumentosGuiaFlow(usuarioFlowId);
            if (resultado.ok) {
              setListo(true);
            } else {
              setError(resultado.error ?? 'No se pudo reintentar.');
            }
          });
        }}
        className="inline-flex items-center gap-1 rounded-full border border-marmol-300 bg-white px-2.5 py-0.5 text-xs font-medium text-marmol-700 transition hover:border-marmol-500 disabled:opacity-60"
      >
        <RotateCcw size={11} className={pendiente ? 'animate-spin' : undefined} />
        {pendiente ? 'Reintentando…' : 'Reintentar'}
      </button>
      {error && <span className="max-w-[220px] text-xs font-semibold text-red-600">{error}</span>}
    </span>
  );
}
