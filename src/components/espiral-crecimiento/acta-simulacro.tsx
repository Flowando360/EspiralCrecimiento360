'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { guardarActaSimulacro } from '@/app/(dashboard)/nexa/simulacros/acta-actions';
import { ClipboardList, Check, X, Pencil } from 'lucide-react';

export const TIPOS_SIMULACRO: { value: string; label: string }[] = [
  { value: 'incendio', label: 'Incendio' },
  { value: 'sismo', label: 'Sismo' },
  { value: 'evacuacion', label: 'Evacuación' },
  { value: 'derrame', label: 'Derrame' },
  { value: 'otro', label: 'Otro' },
];

export interface DatosActa {
  tipo: string;
  sede: string;
  escenario: string;
  duracionMinutos: string;
  tiempoEvacuacionEsperadoMin: string;
  tiempoEvacuacionRealMin: string;
  brigadistasParticipantes: string;
  observacionesBrigada: string;
}

const num = (v: string) => (v.trim() ? Number(v) : undefined);

function Dato({ etiqueta, valor }: { etiqueta: string; valor: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-marmol-400">{etiqueta}</dt>
      <dd className="text-sm text-marmol-800">{valor || '—'}</dd>
    </div>
  );
}

/** Acta del simulacro: tipo, sede, escenario, tiempos de evacuación, brigadistas y observaciones. */
export function ActaSimulacro({ simulacroId, datos, editable }: { simulacroId: string; datos: DatosActa; editable: boolean }) {
  const router = useRouter();
  const [editando, setEditando] = useState(false);
  const [f, setF] = useState<DatosActa>(datos);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const set = (k: keyof DatosActa) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setF((prev) => ({ ...prev, [k]: e.target.value }));

  function guardar() {
    setError(null);
    startTransition(async () => {
      const res = await guardarActaSimulacro({
        simulacroId,
        tipo: f.tipo as any,
        sede: f.sede,
        escenario: f.escenario,
        duracionMinutos: num(f.duracionMinutos),
        tiempoEvacuacionEsperadoMin: num(f.tiempoEvacuacionEsperadoMin),
        tiempoEvacuacionRealMin: num(f.tiempoEvacuacionRealMin),
        brigadistasParticipantes: num(f.brigadistasParticipantes),
        observacionesBrigada: f.observacionesBrigada,
      });
      if (res.ok) {
        setEditando(false);
        router.refresh();
      } else setError(res.error);
    });
  }

  const real = num(datos.tiempoEvacuacionRealMin);
  const esperado = num(datos.tiempoEvacuacionEsperadoMin);
  const dentro = real != null && esperado != null ? real <= esperado : null;
  const campo = 'w-full rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm';
  const etiqueta = 'block text-xs text-marmol-500 mb-1';

  return (
    <div className="card p-5 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-display font-semibold text-secundario flex items-center gap-2">
          <ClipboardList size={16} /> Acta del simulacro
        </h2>
        {editable && !editando && (
          <button type="button" onClick={() => setEditando(true)} className="inline-flex items-center gap-1 text-xs text-marmol-500 hover:text-flow-600">
            <Pencil size={12} /> Editar acta
          </button>
        )}
      </div>

      {!editando ? (
        <dl className="grid sm:grid-cols-3 gap-x-4 gap-y-3">
          <Dato etiqueta="Tipo" valor={TIPOS_SIMULACRO.find((t) => t.value === datos.tipo)?.label} />
          <Dato etiqueta="Sede" valor={datos.sede} />
          <Dato etiqueta="Duración total" valor={datos.duracionMinutos ? `${datos.duracionMinutos} min` : ''} />
          <Dato etiqueta="Tiempo de evacuación esperado" valor={datos.tiempoEvacuacionEsperadoMin ? `${datos.tiempoEvacuacionEsperadoMin} min` : ''} />
          <Dato
            etiqueta="Tiempo de evacuación real"
            valor={
              datos.tiempoEvacuacionRealMin ? (
                <span className="inline-flex items-center gap-2">
                  {datos.tiempoEvacuacionRealMin} min
                  {dentro != null && (
                    <span className={dentro ? 'badge-alto text-xs rounded-full px-2 py-0.5' : 'badge-bajo text-xs rounded-full px-2 py-0.5'}>
                      {dentro ? 'Dentro de lo esperado' : 'Por encima de lo esperado'}
                    </span>
                  )}
                </span>
              ) : (
                ''
              )
            }
          />
          <Dato etiqueta="Brigadistas participantes" valor={datos.brigadistasParticipantes} />
          <div className="sm:col-span-3">
            <Dato etiqueta="Escenario simulado" valor={datos.escenario} />
          </div>
          <div className="sm:col-span-3">
            <Dato etiqueta="Observaciones sobre el desempeño de la brigada" valor={datos.observacionesBrigada} />
          </div>
        </dl>
      ) : (
        <div className="space-y-3">
          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <label className={etiqueta}>Tipo de simulacro</label>
              <select value={f.tipo} onChange={set('tipo')} className={campo}>
                <option value="">—</option>
                {TIPOS_SIMULACRO.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={etiqueta}>Sede</label>
              <input value={f.sede} onChange={set('sede')} className={campo} />
            </div>
            <div>
              <label className={etiqueta}>Duración total (min)</label>
              <input type="number" min={0} step="0.5" value={f.duracionMinutos} onChange={set('duracionMinutos')} className={campo} />
            </div>
            <div>
              <label className={etiqueta}>Evacuación esperada (min)</label>
              <input type="number" min={0} step="0.5" value={f.tiempoEvacuacionEsperadoMin} onChange={set('tiempoEvacuacionEsperadoMin')} className={campo} />
            </div>
            <div>
              <label className={etiqueta}>Evacuación real (min)</label>
              <input type="number" min={0} step="0.5" value={f.tiempoEvacuacionRealMin} onChange={set('tiempoEvacuacionRealMin')} className={campo} />
            </div>
            <div>
              <label className={etiqueta}>Brigadistas participantes</label>
              <input type="number" min={0} value={f.brigadistasParticipantes} onChange={set('brigadistasParticipantes')} className={campo} />
            </div>
          </div>
          <div>
            <label className={etiqueta}>Escenario simulado</label>
            <textarea rows={2} value={f.escenario} onChange={set('escenario')} placeholder="Qué situación se simuló y cómo se desarrolló" className={campo} />
          </div>
          <div>
            <label className={etiqueta}>Observaciones sobre el desempeño de la brigada</label>
            <textarea rows={3} value={f.observacionesBrigada} onChange={set('observacionesBrigada')} className={campo} />
          </div>
          {error && <p className="text-xs text-bajo">{error}</p>}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={guardar}
              disabled={pending}
              className="inline-flex items-center gap-1 rounded-lg bg-flow-500 hover:bg-flow-600 disabled:opacity-40 text-white text-xs font-medium px-2.5 py-1.5"
            >
              <Check size={12} /> {pending ? 'Guardando…' : 'Guardar acta'}
            </button>
            <button
              type="button"
              onClick={() => {
                setF(datos);
                setError(null);
                setEditando(false);
              }}
              disabled={pending}
              className="inline-flex items-center gap-1 rounded-lg border border-marmol-200 text-marmol-600 hover:bg-marmol-100 text-xs font-medium px-2.5 py-1.5"
            >
              <X size={12} /> Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
