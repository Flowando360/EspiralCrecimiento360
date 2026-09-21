'use client';

import { useState, useTransition } from 'react';
import { crearSolicitudCambio, evaluarSolicitudCambio, resolverSolicitudCambio, marcarCambioImplementado } from '@/app/(dashboard)/procesos-gestion/cambios/actions';
import { cn, formatearFecha } from '@/lib/utils';
import { Plus, Check, X, Rocket } from 'lucide-react';

type TipoCambio = 'proceso' | 'documento' | 'sistema' | 'estructura' | 'otro';
type EstadoCambio = 'solicitado' | 'en_evaluacion' | 'aprobado' | 'rechazado' | 'implementado';
type Impacto = 'bajo' | 'medio' | 'alto';

export interface SolicitudCambio {
  id: string;
  codigo: string | null;
  titulo: string;
  descripcion: string;
  tipo_cambio: TipoCambio;
  motivo: string | null;
  impacto: Impacto | null;
  evaluacion: string | null;
  estado: EstadoCambio;
  fecha_solicitud: string;
  proceso_nombre: string;
  proceso_codigo: string | null;
}

interface ProcesoOpcion {
  id: string;
  nombre: string;
  codigo: string | null;
}

const ETIQUETA_TIPO: Record<TipoCambio, string> = { proceso: 'Proceso', documento: 'Documento', sistema: 'Sistema', estructura: 'Estructura', otro: 'Otro' };
const ETIQUETA_ESTADO: Record<EstadoCambio, { texto: string; clase: string }> = {
  solicitado: { texto: 'Solicitado', clase: 'badge-marmol' },
  en_evaluacion: { texto: 'En evaluación', clase: 'badge-medio' },
  aprobado: { texto: 'Aprobado', clase: 'badge-alto' },
  rechazado: { texto: 'Rechazado', clase: 'badge-bajo' },
  implementado: { texto: 'Implementado', clase: 'badge-flow' },
};
const CLASE_IMPACTO: Record<Impacto, string> = { alto: 'badge-bajo', medio: 'badge-medio', bajo: 'badge-alto' };

export function ListaCambios({
  solicitudesIniciales,
  procesos,
  puedeAprobar,
  puedeSolicitar,
}: {
  solicitudesIniciales: SolicitudCambio[];
  procesos: ProcesoOpcion[];
  puedeAprobar: boolean;
  puedeSolicitar: boolean;
}) {
  const [solicitudes, setSolicitudes] = useState(solicitudesIniciales);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [, startTransition] = useTransition();

  function actualizarLocal(id: string, cambios: Partial<SolicitudCambio>) {
    setSolicitudes((prev) => prev.map((s) => (s.id === id ? { ...s, ...cambios } : s)));
  }

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="font-display font-semibold text-secundario">Gestión de cambio</h2>
          <p className="text-xs text-marmol-400 mt-0.5">Evalúa el impacto de un cambio antes de aprobarlo e implementarlo (ISO 9001 numeral 6.3).</p>
        </div>
        {puedeSolicitar && (
          <button onClick={() => setMostrarForm((v) => !v)} className="inline-flex items-center gap-1 rounded-lg bg-flow-500 hover:bg-flow-600 text-white text-sm font-medium px-3 py-1.5">
            <Plus size={14} /> Nueva solicitud
          </button>
        )}
      </div>

      {mostrarForm && (
        <FormularioCambio
          procesos={procesos}
          onCreada={(s) => {
            setSolicitudes((prev) => [s, ...prev]);
            setMostrarForm(false);
          }}
        />
      )}

      <div className="space-y-2">
        {solicitudes.map((s) => (
          <div key={s.id} className="border-b border-marmol-100 pb-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              {s.codigo && <span className="text-xs font-semibold text-marmol-400">{s.codigo}</span>}
              <span className={cn('text-[11px] rounded-full px-2 py-0.5 font-medium', ETIQUETA_ESTADO[s.estado].clase)}>{ETIQUETA_ESTADO[s.estado].texto}</span>
              <span className="text-[11px] rounded-full badge-marmol px-2 py-0.5 font-medium">{ETIQUETA_TIPO[s.tipo_cambio]}</span>
              {s.impacto && <span className={cn('text-[11px] rounded-full px-2 py-0.5 font-medium', CLASE_IMPACTO[s.impacto])}>Impacto {s.impacto}</span>}
            </div>
            <p className="text-sm font-medium text-marmol-800 mt-1">{s.titulo}</p>
            <p className="text-xs text-marmol-500 mt-0.5">{s.descripcion}</p>
            <p className="text-xs text-marmol-400 mt-0.5">
              {s.proceso_codigo ? `${s.proceso_codigo} · ` : ''}
              {s.proceso_nombre} · {formatearFecha(s.fecha_solicitud)}
            </p>
            {s.evaluacion && <p className="text-xs text-marmol-600 mt-1 italic">Evaluación: {s.evaluacion}</p>}

            {puedeAprobar && (s.estado === 'solicitado' || s.estado === 'en_evaluacion') && (
              <AccionesAprobacion id={s.id} onCambiar={(c) => actualizarLocal(s.id, c)} />
            )}
            {puedeAprobar && s.estado === 'aprobado' && (
              <button
                onClick={() => {
                  actualizarLocal(s.id, { estado: 'implementado' });
                  startTransition(async () => {
                    await marcarCambioImplementado(s.id);
                  });
                }}
                className="mt-1.5 inline-flex items-center gap-1 rounded-lg bg-flow-500 hover:bg-flow-600 text-white text-xs font-medium px-2.5 py-1.5"
              >
                <Rocket size={12} /> Marcar implementado
              </button>
            )}
          </div>
        ))}
        {solicitudes.length === 0 && <p className="text-sm text-marmol-400">Sin solicitudes de cambio todavía.</p>}
      </div>
    </div>
  );
}

function AccionesAprobacion({ id, onCambiar }: { id: string; onCambiar: (cambios: Partial<SolicitudCambio>) => void }) {
  const [evaluacion, setEvaluacion] = useState('');
  const [impacto, setImpacto] = useState<Impacto>('medio');
  const [, startTransition] = useTransition();

  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-2">
        <input value={evaluacion} onChange={(e) => setEvaluacion(e.target.value)} placeholder="Evaluación del impacto" className="flex-1 rounded-lg border border-marmol-200 px-2 py-1 text-xs" />
        <select value={impacto} onChange={(e) => setImpacto(e.target.value as Impacto)} className="rounded-lg border border-marmol-200 px-2 py-1 text-xs">
          <option value="bajo">Impacto bajo</option>
          <option value="medio">Impacto medio</option>
          <option value="alto">Impacto alto</option>
        </select>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => {
            onCambiar({ evaluacion, impacto, estado: 'en_evaluacion' });
            startTransition(async () => {
              await evaluarSolicitudCambio(id, evaluacion, impacto);
            });
          }}
          className="text-xs text-marmol-500 hover:text-flow-600"
        >
          Guardar evaluación
        </button>
        <button
          onClick={() => {
            onCambiar({ estado: 'aprobado', evaluacion });
            startTransition(async () => {
              await resolverSolicitudCambio(id, true, evaluacion);
            });
          }}
          className="inline-flex items-center gap-1 rounded-lg bg-flow-500 hover:bg-flow-600 text-white text-xs font-medium px-2.5 py-1.5"
        >
          <Check size={12} /> Aprobar
        </button>
        <button
          onClick={() => {
            onCambiar({ estado: 'rechazado', evaluacion });
            startTransition(async () => {
              await resolverSolicitudCambio(id, false, evaluacion);
            });
          }}
          className="inline-flex items-center gap-1 rounded-lg border border-marmol-200 text-marmol-600 hover:bg-marmol-100 text-xs font-medium px-2.5 py-1.5"
        >
          <X size={12} /> Rechazar
        </button>
      </div>
    </div>
  );
}

function FormularioCambio({ procesos, onCreada }: { procesos: ProcesoOpcion[]; onCreada: (s: SolicitudCambio) => void }) {
  const [procesoId, setProcesoId] = useState(procesos[0]?.id ?? '');
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [tipoCambio, setTipoCambio] = useState<TipoCambio>('proceso');
  const [motivo, setMotivo] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function enviar() {
    if (!titulo.trim() || !descripcion.trim()) {
      setError('Título y descripción son requeridos');
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await crearSolicitudCambio({ procesoId, titulo, descripcion, tipoCambio, motivo: motivo || undefined });
      if (res.ok) {
        const proceso = procesos.find((p) => p.id === procesoId);
        onCreada({
          id: res.id,
          codigo: res.codigo,
          titulo,
          descripcion,
          tipo_cambio: tipoCambio,
          motivo: motivo || null,
          impacto: null,
          evaluacion: null,
          estado: 'solicitado',
          fecha_solicitud: new Date().toISOString(),
          proceso_nombre: proceso?.nombre ?? '—',
          proceso_codigo: proceso?.codigo ?? null,
        });
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <div className="rounded-lg border border-marmol-200 p-3 mb-3 space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <select value={procesoId} onChange={(e) => setProcesoId(e.target.value)} className="rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm">
          {procesos.map((p) => (
            <option key={p.id} value={p.id}>
              {p.codigo ? `${p.codigo} · ` : ''}
              {p.nombre}
            </option>
          ))}
        </select>
        <select value={tipoCambio} onChange={(e) => setTipoCambio(e.target.value as TipoCambio)} className="rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm">
          {(Object.entries(ETIQUETA_TIPO) as [TipoCambio, string][]).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
      </div>
      <input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Título del cambio" className="w-full rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm" />
      <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Descripción del cambio" rows={2} className="w-full rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm" />
      <input value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Motivo (opcional)" className="w-full rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm" />
      <button onClick={enviar} disabled={pending} className="inline-flex items-center gap-1 rounded-lg bg-flow-500 hover:bg-flow-600 disabled:opacity-40 text-white text-sm font-medium px-3 py-1.5">
        {pending ? 'Enviando…' : 'Enviar solicitud'}
      </button>
      {error && <p className="text-sm text-bajo">{error}</p>}
    </div>
  );
}
