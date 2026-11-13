'use client';

import { useState, useTransition } from 'react';
import { guardarQuizInduccion } from '@/app/(dashboard)/administracion/cargos/[id]/actions';

/** Pregunta de comprensión de un punto de inducción. La respuesta correcta solo la ve Talento Humano. */
export function EditorQuizInduccion({
  itemId,
  cargoId,
  preguntaInicial,
  opcionesIniciales,
}: {
  itemId: string;
  cargoId: string;
  preguntaInicial: string | null;
  opcionesIniciales: string[] | null;
}) {
  const [abierto, setAbierto] = useState(false);
  const [pregunta, setPregunta] = useState(preguntaInicial ?? '');
  const [opciones, setOpciones] = useState<string[]>(opcionesIniciales?.length ? opcionesIniciales : ['', '', '']);
  const [correcta, setCorrecta] = useState(0);
  const [tiene, setTiene] = useState(!!preguntaInicial);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function guardar(quitar = false) {
    setError(null);
    start(async () => {
      const limpias = opciones.map((o) => o.trim()).filter(Boolean);
      const res = await guardarQuizInduccion({ itemId, cargoId, pregunta: quitar ? '' : pregunta, opciones: limpias, correcta: Math.min(correcta, Math.max(0, limpias.length - 1)) });
      if (res.ok) {
        setTiene(!quitar && !!pregunta.trim());
        if (quitar) setPregunta('');
        setAbierto(false);
      } else setError(res.error);
    });
  }

  return (
    <div className="mt-1">
      <button type="button" onClick={() => setAbierto((a) => !a)} className="text-xs text-flow-600 hover:underline">
        {tiene ? 'Editar pregunta de comprensión ✓' : 'Agregar pregunta de comprensión'}
      </button>
      {abierto && (
        <div className="mt-2 space-y-2 rounded-lg border border-marmol-200 p-3">
          <input value={pregunta} onChange={(e) => setPregunta(e.target.value)} placeholder="Pregunta" className="w-full rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm" />
          {opciones.map((o, i) => (
            <label key={i} className="flex items-center gap-2 text-sm">
              <input type="radio" name={`ok-${itemId}`} checked={correcta === i} onChange={() => setCorrecta(i)} title="Respuesta correcta" />
              <input
                value={o}
                onChange={(e) => setOpciones((p) => p.map((x, j) => (j === i ? e.target.value : x)))}
                placeholder={`Opción ${i + 1}`}
                className="flex-1 rounded-lg border border-marmol-200 px-2.5 py-1 text-sm"
              />
            </label>
          ))}
          <p className="text-xs text-marmol-400">Marca con el círculo la respuesta correcta. Quien responda no la ve; solo se confirma el punto si acierta.</p>
          {error && <p className="text-xs text-bajo">{error}</p>}
          <div className="flex gap-2">
            <button type="button" disabled={pending || !pregunta.trim()} onClick={() => guardar(false)} className="rounded-lg bg-flow-500 hover:bg-flow-600 disabled:opacity-40 text-white text-xs font-medium px-3 py-1.5">
              Guardar pregunta
            </button>
            {tiene && (
              <button type="button" disabled={pending} onClick={() => guardar(true)} className="rounded-lg border border-marmol-200 text-marmol-500 text-xs px-3 py-1.5">
                Quitar pregunta
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
