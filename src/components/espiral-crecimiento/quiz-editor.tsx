'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { crearPreguntaConOpciones, eliminarPregunta, actualizarUmbralQuiz } from '@/app/(dashboard)/nexa/formacion/actions';

interface Opcion {
  id: string;
  texto: string;
  correcta: boolean;
  orden: number;
}

interface Pregunta {
  id: string;
  enunciado: string;
  orden: number;
  opciones: Opcion[];
}

const MIN_OPCIONES = 4;

export function QuizEditor({
  cursoId,
  umbralInicial,
  preguntasIniciales,
}: {
  cursoId: string;
  umbralInicial: number;
  preguntasIniciales: Pregunta[];
}) {
  const router = useRouter();
  const [preguntas, setPreguntas] = useState(preguntasIniciales);
  const [umbral, setUmbral] = useState(umbralInicial);
  const [enunciado, setEnunciado] = useState('');
  const [opciones, setOpciones] = useState<string[]>(Array(MIN_OPCIONES).fill(''));
  const [correctaIdx, setCorrectaIdx] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function guardarUmbral() {
    startTransition(async () => {
      await actualizarUmbralQuiz(cursoId, umbral);
      router.refresh();
    });
  }

  function agregarPregunta() {
    setError(null);
    const opcionesValidas = opciones.map((t, i) => ({ texto: t.trim(), correcta: i === correctaIdx })).filter((o) => o.texto);

    if (!enunciado.trim()) {
      setError('La pregunta es requerida');
      return;
    }
    if (opcionesValidas.length < 2) {
      setError('Se necesitan al menos 2 opciones con texto');
      return;
    }
    if (!opcionesValidas.some((o) => o.correcta)) {
      setError('La opción marcada como correcta no puede estar vacía');
      return;
    }

    startTransition(async () => {
      const res = await crearPreguntaConOpciones({ cursoId, enunciado, opciones: opcionesValidas });
      if (res.ok) {
        setEnunciado('');
        setOpciones(Array(MIN_OPCIONES).fill(''));
        setCorrectaIdx(0);
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  }

  function borrarPregunta(preguntaId: string) {
    setPreguntas((prev) => prev.filter((p) => p.id !== preguntaId));
    startTransition(async () => {
      await eliminarPregunta(preguntaId, cursoId);
    });
  }

  return (
    <div className="space-y-6">
      <div className="card p-4 flex items-center gap-3">
        <label className="text-sm text-marmol-600 shrink-0">% mínimo para aprobar</label>
        <input
          type="number"
          min={1}
          max={100}
          value={umbral}
          onChange={(e) => setUmbral(Number(e.target.value))}
          className="w-20 rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm"
        />
        <button
          onClick={guardarUmbral}
          disabled={pending}
          className="rounded-lg border border-marmol-200 hover:border-flow-300 text-marmol-600 text-sm font-medium px-3 py-1.5"
        >
          Guardar
        </button>
      </div>

      <div className="card p-5">
        <h2 className="font-display font-semibold text-secundario mb-3">Preguntas ({preguntas.length})</h2>
        {preguntas.length === 0 ? (
          <p className="text-sm text-marmol-400">
            Sin preguntas todavía — el curso sigue usando el % de avance autorreportado hasta que agregues al
            menos una.
          </p>
        ) : (
          <div className="space-y-3">
            {preguntas.map((p, i) => (
              <div key={p.id} className="border-b border-marmol-100 pb-3 last:border-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-marmol-800">
                    {i + 1}. {p.enunciado}
                  </p>
                  <button onClick={() => borrarPregunta(p.id)} className="text-marmol-300 hover:text-bajo shrink-0">
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="mt-1.5 space-y-1">
                  {p.opciones.map((o) => (
                    <p key={o.id} className="text-xs text-marmol-500 flex items-center gap-1.5 pl-3">
                      {o.correcta ? <CheckCircle2 size={12} className="text-alto" /> : <span className="w-3" />}
                      {o.texto}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card p-5">
        <h2 className="font-display font-semibold text-secundario mb-3">Agregar pregunta</h2>
        <div className="space-y-2">
          <input
            value={enunciado}
            onChange={(e) => setEnunciado(e.target.value)}
            placeholder="Enunciado de la pregunta"
            className="w-full rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm"
          />
          {opciones.map((texto, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="radio"
                name="correcta"
                checked={correctaIdx === i}
                onChange={() => setCorrectaIdx(i)}
                title="Marcar como respuesta correcta"
              />
              <input
                value={texto}
                onChange={(e) => setOpciones((prev) => prev.map((o, idx) => (idx === i ? e.target.value : o)))}
                placeholder={`Opción ${i + 1}${i === correctaIdx ? ' (correcta)' : ''}`}
                className="flex-1 rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm"
              />
            </div>
          ))}
          {error && <p className="text-sm text-bajo">{error}</p>}
          <button
            onClick={agregarPregunta}
            disabled={pending}
            className="inline-flex items-center gap-1.5 rounded-lg bg-flow-500 hover:bg-flow-600 disabled:opacity-40 text-white text-sm font-medium px-3.5 py-1.5"
          >
            <Plus size={14} /> Agregar pregunta
          </button>
        </div>
      </div>
    </div>
  );
}
