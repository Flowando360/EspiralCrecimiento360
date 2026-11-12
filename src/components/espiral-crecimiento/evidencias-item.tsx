'use client';

import { useRef, useState, useTransition } from 'react';
import { Paperclip, Trash2 } from 'lucide-react';
import { subirEvidenciaItem, eliminarEvidenciaItem, type EvidenciaVista } from '@/app/(dashboard)/espiral-crecimiento/evaluar/evidencias-actions';

/** Evidencias que sustentan la nota de un ítem. Se pueden subir o quitar mientras la valoración siga en borrador. */
export function EvidenciasItem({
  tareaId,
  itemId,
  iniciales,
  bloqueado,
  tieneRespuesta,
}: {
  tareaId: string;
  itemId: string;
  iniciales: EvidenciaVista[];
  bloqueado: boolean;
  tieneRespuesta: boolean;
}) {
  const entrada = useRef<HTMLInputElement>(null);
  const [adjuntos, setAdjuntos] = useState<EvidenciaVista[]>(iniciales);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function subir() {
    const archivo = entrada.current?.files?.[0];
    if (!archivo) return;
    setError(null);
    const datos = new FormData();
    datos.set('tareaId', tareaId);
    datos.set('itemId', itemId);
    datos.set('archivo', archivo);
    startTransition(async () => {
      const res = await subirEvidenciaItem(datos);
      if (!res.ok) setError(res.error ?? 'No se pudo completar');
      else setAdjuntos(res.adjuntos);
      if (entrada.current) entrada.current.value = '';
    });
  }

  function quitar(ruta: string) {
    if (!confirm('¿Quitar esta evidencia?')) return;
    setError(null);
    startTransition(async () => {
      const res = await eliminarEvidenciaItem(tareaId, itemId, ruta);
      if (!res.ok) setError(res.error ?? 'No se pudo completar');
      else setAdjuntos(res.adjuntos);
    });
  }

  if (bloqueado && adjuntos.length === 0) return null;

  return (
    <div className="mt-2.5 space-y-1.5">
      {adjuntos.length > 0 && (
        <ul className="space-y-1">
          {adjuntos.map((a) => (
            <li key={a.ruta} className="flex items-center gap-2 text-xs">
              <Paperclip size={12} className="text-marmol-400 shrink-0" />
              {a.url ? (
                <a href={a.url} target="_blank" rel="noreferrer" className="text-flow-700 hover:underline truncate">
                  {a.nombre}
                </a>
              ) : (
                <span className="text-marmol-600 truncate">{a.nombre}</span>
              )}
              <span className="text-marmol-400 shrink-0">{Math.max(1, Math.round(a.tamano / 1024))} KB</span>
              {!bloqueado && (
                <button type="button" disabled={pending} onClick={() => quitar(a.ruta)} aria-label={`Quitar ${a.nombre}`} className="text-marmol-300 hover:text-bajo disabled:opacity-40">
                  <Trash2 size={12} />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      {!bloqueado && (
        <div className="flex items-center gap-2 flex-wrap">
          <input
            ref={entrada}
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf,.docx,.xlsx"
            disabled={pending || !tieneRespuesta}
            onChange={subir}
            className="text-xs max-w-[14rem] disabled:opacity-50"
            aria-label="Adjuntar evidencia"
          />
          <span className="text-[11px] text-marmol-400">
            {tieneRespuesta ? 'Adjunta una evidencia que sustente la nota (foto, PDF, Word o Excel, hasta 4 MB; máx. 5).' : 'Elige primero la nota para poder adjuntar evidencia.'}
          </span>
          {pending && <span className="text-xs text-marmol-400">Subiendo…</span>}
        </div>
      )}
      {error && <p className="text-xs text-bajo">{error}</p>}
    </div>
  );
}
