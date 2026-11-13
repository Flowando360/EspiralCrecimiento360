'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { responderClima } from '@/app/(dashboard)/nexa/clima/actions';
import { cn } from '@/lib/utils';
import { DIMENSIONES_ITEMS, promedioDimension, type ClaveDimensionClima } from '@/lib/clima/items';

type ClaveDimension = ClaveDimensionClima;

export const ENPS_PREGUNTA_DEFECTO =
  '¿Qué tan probable es que recomiendes esta empresa como un buen lugar para trabajar? (0 = nada probable, 10 = muy probable)';

export interface PreguntasClimaPersonalizadas {
  enps?: string | null;
  reconocimiento?: string | null;
  liderazgo?: string | null;
  desarrollo?: string | null;
  comunicacion?: string | null;
  condiciones?: string | null;
  pertenencia?: string | null;
  relaciones_pares?: string | null;
  compensacion?: string | null;
  equidad?: string | null;
}

function BotonesEscala({ valor, onElegir }: { valor: number | undefined; onElegir: (n: number) => void }) {
  return (
    <>
      <div className="flex gap-1.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onElegir(n)}
            className={cn(
              'h-9 w-9 rounded-lg text-sm font-medium border transition',
              valor === n ? 'bg-flow-500 border-flow-500 text-white' : 'border-marmol-200 text-marmol-600 hover:border-flow-300'
            )}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="flex justify-between text-[13px] text-marmol-400 mt-1 px-0.5 max-w-[13rem]">
        <span>Muy en desacuerdo</span>
        <span>Muy de acuerdo</span>
      </div>
    </>
  );
}

export function FormularioClima({
  rondaId,
  preguntas,
  modalidad = 'pulso',
}: {
  rondaId: string;
  preguntas?: PreguntasClimaPersonalizadas;
  modalidad?: 'pulso' | 'completo';
}) {
  const esCompleto = modalidad === 'completo';
  const preguntaEnps = preguntas?.enps || ENPS_PREGUNTA_DEFECTO;
  // La empresa puede reescribir la primera afirmación de cada dimensión; las demás son el borrador estándar.
  const dimensiones = DIMENSIONES_ITEMS.map((d) => ({
    ...d,
    items: [preguntas?.[d.clave] || d.items[0], d.items[1], d.items[2]] as [string, string, string],
  }));

  const router = useRouter();
  const [enps, setEnps] = useState<number | null>(null);
  // pulso: una respuesta por dimensión (posición 0); completo: tres por dimensión.
  const [respuestas, setRespuestas] = useState<Record<string, (number | undefined)[]>>({});
  const [comentario, setComentario] = useState('');
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [enviado, setEnviado] = useState(false);

  const porDimension = esCompleto ? 3 : 1;
  const faltan = dimensiones.reduce((acc, d) => {
    const r = respuestas[d.clave] ?? [];
    let faltantes = 0;
    for (let i = 0; i < porDimension; i++) if (r[i] === undefined) faltantes++;
    return acc + faltantes;
  }, enps === null ? 1 : 0);
  const completo = faltan === 0;

  function elegir(clave: ClaveDimension, indice: number, valor: number) {
    setRespuestas((prev) => {
      const actual = [...(prev[clave] ?? [])];
      actual[indice] = valor;
      return { ...prev, [clave]: actual };
    });
  }

  function enviar() {
    if (!completo || enps === null) return;
    setError(null);
    const items: Record<string, number[]> = {};
    const escalares: Record<string, number> = {};
    for (const d of dimensiones) {
      const r = (respuestas[d.clave] ?? []).slice(0, porDimension) as number[];
      items[d.clave] = r;
      escalares[d.clave] = promedioDimension(r);
    }
    startTransition(async () => {
      const res = await responderClima({
        rondaId,
        enps,
        reconocimiento: escalares.reconocimiento!,
        liderazgo: escalares.liderazgo!,
        desarrollo: escalares.desarrollo!,
        comunicacion: escalares.comunicacion!,
        condiciones: escalares.condiciones!,
        pertenencia: escalares.pertenencia!,
        relaciones_pares: escalares.relaciones_pares!,
        compensacion: escalares.compensacion!,
        equidad: escalares.equidad!,
        comentario: comentario || undefined,
        items: esCompleto ? items : undefined,
      });
      if (res.ok) {
        setEnviado(true);
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  }

  if (enviado) {
    return (
      <div className="card p-5">
        <p className="text-sm font-medium text-marmol-800">¡Gracias por responder! 🙌</p>
        <p className="text-xs text-marmol-500 mt-1">
          Tu respuesta es anónima — no queda ligada a tu nombre en ningún reporte.
        </p>
      </div>
    );
  }

  return (
    <div className="card p-5 space-y-5 max-w-2xl">
      <p className="text-xs text-marmol-500">
        {esCompleto
          ? 'Diagnóstico completo: unas 28 preguntas, 6 a 8 minutos. Tu respuesta es anónima y nos ayuda a saber dónde mejorar.'
          : 'Pulso rápido: unas 10 preguntas, 2 minutos. Tu respuesta es anónima.'}
      </p>
      <div>
        <p className="text-sm font-medium text-marmol-800 mb-2">{preguntaEnps}</p>
        <div className="flex flex-wrap gap-1.5">
          {Array.from({ length: 11 }, (_, i) => i).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setEnps(n)}
              className={cn(
                'h-9 w-9 rounded-lg text-sm font-medium border transition',
                enps === n
                  ? 'bg-flow-500 border-flow-500 text-white'
                  : 'border-marmol-200 text-marmol-600 hover:border-flow-300'
              )}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {dimensiones.map((d) => (
        <div key={d.clave} className={esCompleto ? 'space-y-4 border-t border-marmol-100 pt-4' : ''}>
          {esCompleto && <p className="text-xs font-semibold uppercase tracking-wide text-flow-700">{d.titulo}</p>}
          {(esCompleto ? [0, 1, 2] : [0]).map((i) => (
            <div key={i}>
              <p className="text-sm font-medium text-marmol-800 mb-2">{d.items[i]}</p>
              <BotonesEscala valor={respuestas[d.clave]?.[i]} onElegir={(n) => elegir(d.clave, i, n)} />
            </div>
          ))}
        </div>
      ))}

      <div>
        <p className="text-sm font-medium text-marmol-800 mb-2">¿Algo que quieras contarnos? (opcional)</p>
        <textarea
          value={comentario}
          onChange={(e) => setComentario(e.target.value)}
          rows={3}
          placeholder="Tu comentario…"
          className="w-full rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm"
        />
        <p className="text-[13px] text-marmol-400 mt-1">
          Solo Talento Humano puede leer comentarios de texto libre — ni tu líder ni gerencia los ven.
        </p>
      </div>

      {error && <p className="text-sm text-bajo">{error}</p>}
      {!completo && <p className="text-xs text-marmol-400">Te faltan {faltan} respuestas para poder enviar.</p>}

      <button
        type="button"
        disabled={pending || !completo}
        onClick={enviar}
        className="rounded-lg bg-flow-500 hover:bg-flow-600 disabled:opacity-40 text-white text-sm font-medium px-4 py-2 transition"
      >
        {pending ? 'Enviando…' : 'Enviar respuesta'}
      </button>
    </div>
  );
}
