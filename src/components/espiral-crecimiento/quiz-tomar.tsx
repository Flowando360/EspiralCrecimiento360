'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ListChecks, X, CheckCircle2, XCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { enviarRespuestasQuiz } from '@/app/(dashboard)/nexa/formacion/actions';

interface Opcion {
  id: string;
  pregunta_id: string;
  texto: string;
  orden: number;
}

interface Pregunta {
  id: string;
  enunciado: string;
  orden: number;
}

export function QuizTomar({
  rutaId,
  cursoId,
  ultimoPuntaje,
  intentos,
  umbral,
}: {
  rutaId: string;
  cursoId: string;
  ultimoPuntaje: number | null;
  intentos: number;
  umbral: number;
}) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [preguntas, setPreguntas] = useState<Pregunta[]>([]);
  const [opciones, setOpciones] = useState<Opcion[]>([]);
  const [respuestas, setRespuestas] = useState<Record<string, string>>({});
  const [resultado, setResultado] = useState<{ puntajePct: number; aprobado: boolean } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function abrir() {
    setAbierto(true);
    setResultado(null);
    setError(null);
    setCargando(true);
    const supabase = createClient();
    const { data: preguntasData } = await supabase
      .from('nexa_curso_preguntas')
      .select('id, enunciado, orden')
      .eq('curso_id', cursoId)
      .order('orden');
    const ids = (preguntasData ?? []).map((p) => p.id);
    const { data: opcionesData } = ids.length
      ? await supabase.from('v_nexa_curso_opciones').select('id, pregunta_id, texto, orden').in('pregunta_id', ids).order('orden')
      : { data: [] };
    setPreguntas(preguntasData ?? []);
    setOpciones((opcionesData ?? []) as Opcion[]);
    setRespuestas({});
    setCargando(false);
  }

  function enviar() {
    setError(null);
    if (Object.keys(respuestas).length < preguntas.length) {
      setError('Responde todas las preguntas antes de enviar');
      return;
    }
    startTransition(async () => {
      const res = await enviarRespuestasQuiz(rutaId, respuestas);
      if (res.ok) {
        setResultado({ puntajePct: res.puntajePct, aprobado: res.aprobado });
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <div className="mt-3">
      <button
        onClick={abrir}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-flow-600 hover:text-flow-700"
      >
        <ListChecks size={13} /> {intentos > 0 ? 'Reintentar quiz' : 'Tomar el quiz'}
      </button>
      {intentos > 0 && ultimoPuntaje != null && (
        <p className="text-xs text-marmol-400 mt-1">
          Último intento: {ultimoPuntaje}% ({ultimoPuntaje >= umbral ? 'aprobado' : 'no aprobado'})
        </p>
      )}

      {abierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30" onClick={() => setAbierto(false)} />
          <div className="relative w-full max-w-lg bg-white rounded-xl shadow-xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-marmol-100">
              <h2 className="font-display font-semibold text-secundario">Quiz de verificación</h2>
              <button onClick={() => setAbierto(false)} className="text-marmol-400 hover:text-marmol-700">
                <X size={18} />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4">
              {cargando ? (
                <p className="text-sm text-marmol-400">Cargando preguntas…</p>
              ) : resultado ? (
                <div className="text-center py-6">
                  {resultado.aprobado ? (
                    <CheckCircle2 size={40} className="text-alto mx-auto mb-2" />
                  ) : (
                    <XCircle size={40} className="text-bajo mx-auto mb-2" />
                  )}
                  <p className="text-lg font-display font-semibold text-secundario">{resultado.puntajePct}%</p>
                  <p className="text-sm text-marmol-500 mt-1">
                    {resultado.aprobado ? 'Aprobado — curso marcado como completado.' : `No alcanzaste el ${umbral}% mínimo.`}
                  </p>
                  {!resultado.aprobado && (
                    <button
                      onClick={abrir}
                      className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-flow-500 hover:bg-flow-600 text-white text-sm font-medium px-3.5 py-1.5"
                    >
                      Reintentar
                    </button>
                  )}
                </div>
              ) : (
                preguntas.map((p, i) => (
                  <div key={p.id}>
                    <p className="text-sm font-medium text-marmol-800 mb-1.5">
                      {i + 1}. {p.enunciado}
                    </p>
                    <div className="space-y-1">
                      {opciones
                        .filter((o) => o.pregunta_id === p.id)
                        .map((o) => (
                          <label key={o.id} className="flex items-center gap-2 text-sm text-marmol-700 cursor-pointer">
                            <input
                              type="radio"
                              name={p.id}
                              checked={respuestas[p.id] === o.id}
                              onChange={() => setRespuestas((prev) => ({ ...prev, [p.id]: o.id }))}
                            />
                            {o.texto}
                          </label>
                        ))}
                    </div>
                  </div>
                ))
              )}
              {error && <p className="text-sm text-bajo">{error}</p>}
            </div>

            {!cargando && !resultado && (
              <div className="flex justify-end gap-2 px-5 py-4 border-t border-marmol-100">
                <button onClick={() => setAbierto(false)} className="rounded-lg px-3 py-1.5 text-sm text-marmol-600 hover:bg-marmol-50">
                  Cancelar
                </button>
                <button
                  onClick={enviar}
                  disabled={pending}
                  className="rounded-lg bg-flow-500 hover:bg-flow-600 disabled:opacity-40 text-white text-sm font-medium px-4 py-1.5"
                >
                  {pending ? 'Enviando…' : 'Enviar respuestas'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
