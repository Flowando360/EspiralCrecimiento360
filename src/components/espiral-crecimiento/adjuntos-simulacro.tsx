'use client';

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { subirAdjuntoSimulacro, eliminarAdjuntoSimulacro } from '@/app/(dashboard)/nexa/simulacros/acta-actions';
import { Paperclip, Trash2, FileText, Image as ImageIcon } from 'lucide-react';

export interface AdjuntoVista {
  nombre: string;
  ruta: string;
  tipo: string;
  tamano: number;
  /** Enlace temporal de lectura (se genera en el servidor). */
  url: string | null;
}

const TIPOS = [
  { value: 'foto', label: 'Fotografía' },
  { value: 'acta', label: 'Acta firmada' },
  { value: 'lista_asistencia', label: 'Lista de asistencia escaneada' },
  { value: 'otro', label: 'Otro' },
];

/** Evidencia del simulacro: fotos, acta firmada en PDF y listas de asistencia escaneadas. */
export function AdjuntosSimulacro({ simulacroId, adjuntos, editable }: { simulacroId: string; adjuntos: AdjuntoVista[]; editable: boolean }) {
  const router = useRouter();
  const entrada = useRef<HTMLInputElement>(null);
  const [tipo, setTipo] = useState('foto');
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function subir() {
    const archivo = entrada.current?.files?.[0];
    if (!archivo) {
      setError('Elige un archivo');
      return;
    }
    setError(null);
    const datos = new FormData();
    datos.set('simulacroId', simulacroId);
    datos.set('tipo', tipo);
    datos.set('archivo', archivo);
    startTransition(async () => {
      const res = await subirAdjuntoSimulacro(datos);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      if (entrada.current) entrada.current.value = '';
      router.refresh();
    });
  }

  function quitar(ruta: string) {
    if (!confirm('¿Quitar este archivo del simulacro?')) return;
    setError(null);
    startTransition(async () => {
      const res = await eliminarAdjuntoSimulacro(simulacroId, ruta);
      if (!res.ok) setError(res.error);
      else router.refresh();
    });
  }

  return (
    <div className="card p-5 space-y-3">
      <h2 className="font-display font-semibold text-secundario flex items-center gap-2">
        <Paperclip size={16} /> Evidencias
      </h2>
      {adjuntos.length === 0 ? (
        <p className="text-sm text-marmol-400">Aún no hay fotos ni documentos adjuntos.</p>
      ) : (
        <ul className="divide-y divide-marmol-100">
          {adjuntos.map((a) => (
            <li key={a.ruta} className="py-2 flex items-center gap-3">
              {a.nombre.toLowerCase().endsWith('.pdf') ? <FileText size={16} className="text-marmol-400" /> : <ImageIcon size={16} className="text-marmol-400" />}
              <div className="flex-1 min-w-0">
                {a.url ? (
                  <a href={a.url} target="_blank" rel="noreferrer" className="text-sm text-flow-700 hover:underline truncate block">
                    {a.nombre}
                  </a>
                ) : (
                  <span className="text-sm text-marmol-700 truncate block">{a.nombre}</span>
                )}
                <p className="text-xs text-marmol-400">
                  {TIPOS.find((t) => t.value === a.tipo)?.label ?? 'Otro'} · {Math.max(1, Math.round(a.tamano / 1024))} KB
                </p>
              </div>
              {editable && (
                <button type="button" disabled={pending} onClick={() => quitar(a.ruta)} aria-label={`Quitar ${a.nombre}`} className="text-marmol-300 hover:text-bajo disabled:opacity-40">
                  <Trash2 size={14} />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {editable && (
        <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-marmol-100">
          <select value={tipo} onChange={(e) => setTipo(e.target.value)} aria-label="Tipo de archivo" className="rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm">
            {TIPOS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          <input ref={entrada} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="text-sm max-w-[16rem]" />
          <button
            type="button"
            onClick={subir}
            disabled={pending}
            className="rounded-lg bg-flow-500 hover:bg-flow-600 disabled:opacity-40 text-white text-sm font-medium px-3.5 py-1.5 transition"
          >
            {pending ? 'Subiendo…' : 'Subir'}
          </button>
          <p className="text-xs text-marmol-400 w-full">JPG, PNG, WebP o PDF, de hasta 4 MB cada uno.</p>
        </div>
      )}
      {error && <p className="text-sm text-bajo">{error}</p>}
    </div>
  );
}
