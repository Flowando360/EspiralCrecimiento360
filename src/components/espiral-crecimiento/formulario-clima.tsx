'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { responderClima } from '@/app/(dashboard)/nexa/clima/actions';
import { cn } from '@/lib/utils';

type ClaveDimension = 'reconocimiento' | 'liderazgo' | 'desarrollo' | 'comunicacion' | 'condiciones' | 'pertenencia';

const DIMENSIONES_DEFECTO: { clave: ClaveDimension; label: string }[] = [
  { clave: 'reconocimiento', label: 'Me siento reconocido/a por mi trabajo' },
  { clave: 'liderazgo', label: 'Confío en el liderazgo de mi jefe directo' },
  { clave: 'desarrollo', label: 'Tengo oportunidades reales de crecer y aprender' },
  { clave: 'comunicacion', label: 'La comunicación en la empresa es clara y oportuna' },
  { clave: 'condiciones', label: 'Mis condiciones de trabajo son adecuadas' },
  { clave: 'pertenencia', label: 'Siento que pertenezco a esta empresa' },
];

export const ENPS_PREGUNTA_DEFECTO =
  '¿Qué tan probable es que recomiendes esta empresa como un buen lugar para trabajar? (0 = nada probable, 10 = muy probable)';

type Respuestas = Record<ClaveDimension, number | null>;

export interface PreguntasClimaPersonalizadas {
  enps?: string | null;
  reconocimiento?: string | null;
  liderazgo?: string | null;
  desarrollo?: string | null;
  comunicacion?: string | null;
  condiciones?: string | null;
  pertenencia?: string | null;
}

export function FormularioClima({
  rondaId,
  preguntas,
}: {
  rondaId: string;
  preguntas?: PreguntasClimaPersonalizadas;
}) {
  const preguntaEnps = preguntas?.enps || ENPS_PREGUNTA_DEFECTO;
  const DIMENSIONES = DIMENSIONES_DEFECTO.map((d) => ({
    ...d,
    label: preguntas?.[d.clave] || d.label,
  }));
  const router = useRouter();
  const [enps, setEnps] = useState<number | null>(null);
  const [respuestas, setRespuestas] = useState<Respuestas>({
    reconocimiento: null,
    liderazgo: null,
    desarrollo: null,
    comunicacion: null,
    condiciones: null,
    pertenencia: null,
  });
  const [comentario, setComentario] = useState('');
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [enviado, setEnviado] = useState(false);

  const completo = enps !== null && DIMENSIONES.every((d) => respuestas[d.clave] !== null);

  function enviar() {
    if (!completo || enps === null) return;
    setError(null);
    startTransition(async () => {
      const res = await responderClima({
        rondaId,
        enps,
        reconocimiento: respuestas.reconocimiento!,
        liderazgo: respuestas.liderazgo!,
        desarrollo: respuestas.desarrollo!,
        comunicacion: respuestas.comunicacion!,
        condiciones: respuestas.condiciones!,
        pertenencia: respuestas.pertenencia!,
        comentario: comentario || undefined,
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

      {DIMENSIONES.map((d) => (
        <div key={d.clave}>
          <p className="text-sm font-medium text-marmol-800 mb-2">{d.label}</p>
          <div className="flex gap-1.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRespuestas((r) => ({ ...r, [d.clave]: n }))}
                className={cn(
                  'h-9 w-9 rounded-lg text-sm font-medium border transition',
                  respuestas[d.clave] === n
                    ? 'bg-flow-500 border-flow-500 text-white'
                    : 'border-marmol-200 text-marmol-600 hover:border-flow-300'
                )}
              >
                {n}
              </button>
            ))}
          </div>
          <div className="flex justify-between text-[11px] text-marmol-400 mt-1 px-0.5">
            <span>Muy en desacuerdo</span>
            <span>Muy de acuerdo</span>
          </div>
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
        <p className="text-[11px] text-marmol-400 mt-1">
          Solo Talento Humano puede leer comentarios de texto libre — ni tu líder ni gerencia los ven.
        </p>
      </div>

      {error && <p className="text-sm text-bajo">{error}</p>}

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
