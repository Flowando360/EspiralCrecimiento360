'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Sparkles, Trash2, Check, X, CalendarPlus, Plus } from 'lucide-react';
import {
  generarEstrategiasConIA,
  crearEstrategiaManual,
  actualizarEstadoEstrategia,
  eliminarEstrategia,
  crearActividadDesdeEstrategia,
} from '@/app/(dashboard)/procesos-gestion/contexto/foda-actions';

export interface EstrategiaVista {
  id: string;
  tipo: 'fo' | 'fa' | 'do' | 'da';
  descripcion: string;
  origen: 'manual' | 'ia';
  estado: 'propuesta' | 'aprobada' | 'descartada';
  actividad_id: string | null;
  factores: { tipo: string; descripcion: string }[];
}

export interface FactorSimple {
  id: string;
  tipo: string;
  descripcion: string;
}

const CUADRANTES: { tipo: EstrategiaVista['tipo']; titulo: string; ayuda: string; cruza: [string, string] }[] = [
  { tipo: 'fo', titulo: 'FO · Ofensivas', ayuda: 'Usar fortalezas para aprovechar oportunidades', cruza: ['fortaleza', 'oportunidad'] },
  { tipo: 'fa', titulo: 'FA · Defensivas', ayuda: 'Usar fortalezas para enfrentar amenazas', cruza: ['fortaleza', 'amenaza'] },
  { tipo: 'do', titulo: 'DO · De reorientación', ayuda: 'Superar debilidades aprovechando oportunidades', cruza: ['debilidad', 'oportunidad'] },
  { tipo: 'da', titulo: 'DA · De supervivencia', ayuda: 'Reducir debilidades y evitar amenazas', cruza: ['debilidad', 'amenaza'] },
];

const ETIQUETA_TIPO: Record<string, string> = { fortaleza: 'F', oportunidad: 'O', debilidad: 'D', amenaza: 'A' };
const CLASE_ESTADO: Record<string, string> = {
  propuesta: 'bg-medio/10 text-medio',
  aprobada: 'bg-green-100 text-alto',
  descartada: 'bg-marmol-100 text-marmol-400',
};

/** Estrategias cruzadas del FODA (matriz TOWS): propuestas por IA o escritas a mano, con aprobación humana. */
export function EstrategiasFoda({
  analisisId,
  estrategias,
  factores,
  puedeEditar,
}: {
  analisisId: string;
  estrategias: EstrategiaVista[];
  factores: FactorSimple[];
  puedeEditar: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [programando, setProgramando] = useState<string | null>(null);
  const [fecha, setFecha] = useState('');
  const [nuevo, setNuevo] = useState<{ tipo: EstrategiaVista['tipo'] | null; texto: string; ids: string[] }>({ tipo: null, texto: '', ids: [] });

  function correr(accion: () => Promise<{ ok: boolean; error?: string }>, exito?: () => void) {
    setError(null);
    setMensaje(null);
    startTransition(async () => {
      const res = await accion();
      if (!res.ok) {
        setError(res.error ?? 'No se pudo completar');
        return;
      }
      exito?.();
      router.refresh();
    });
  }

  const propuestas = estrategias.filter((e) => e.estado === 'propuesta').length;

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="font-display text-lg font-semibold text-secundario">Estrategias cruzadas (FO · FA · DO · DA)</h2>
          <p className="text-xs text-marmol-500 mt-1 max-w-2xl">
            El valor del FODA está en cruzar sus factores para decidir qué hacer. La IA propone estrategias con tus propios factores; nacen como «propuesta» y solo cuentan cuando las apruebas.
          </p>
        </div>
        {puedeEditar && (
          <button
            type="button"
            disabled={pending}
            onClick={() => correr(() => generarEstrategiasConIA(analisisId), () => setMensaje('La IA propuso estrategias. Revísalas: aprueba las que sirvan y descarta el resto.'))}
            className="inline-flex items-center gap-1.5 rounded-lg border border-flow-300 text-flow-700 hover:bg-flow-50 disabled:opacity-40 text-sm font-medium px-3 py-1.5 transition"
          >
            <Sparkles size={14} /> {pending ? 'Trabajando…' : 'Proponer estrategias con IA'}
          </button>
        )}
      </div>
      {error && <p className="text-sm text-bajo">{error}</p>}
      {mensaje && <p className="text-sm text-alto">{mensaje}</p>}
      {propuestas > 0 && puedeEditar && <p className="text-xs text-medio">Hay {propuestas} {propuestas === 1 ? 'propuesta pendiente' : 'propuestas pendientes'} de tu revisión.</p>}

      <div className="grid md:grid-cols-2 gap-4">
        {CUADRANTES.map((c) => {
          const lista = estrategias.filter((e) => e.tipo === c.tipo);
          const candidatos = factores.filter((f) => c.cruza.includes(f.tipo));
          return (
            <div key={c.tipo} className="card p-4 space-y-2">
              <div>
                <h3 className="font-display font-semibold text-secundario text-sm">{c.titulo}</h3>
                <p className="text-xs text-marmol-400">{c.ayuda}</p>
              </div>
              {lista.length === 0 && <p className="text-xs text-marmol-400">Sin estrategias todavía.</p>}
              {lista.map((e) => (
                <div key={e.id} className={`rounded-lg border border-marmol-200 p-2.5 space-y-1.5 ${e.estado === 'descartada' ? 'opacity-60' : ''}`}>
                  <p className="text-sm text-marmol-800">{e.descripcion}</p>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`text-xs rounded-full px-2 py-0.5 font-medium capitalize ${CLASE_ESTADO[e.estado]}`}>{e.estado}</span>
                    {e.origen === 'ia' && (
                      <span className="text-xs text-flow-700 inline-flex items-center gap-0.5">
                        <Sparkles size={11} /> Propuesta por IA
                      </span>
                    )}
                  </div>
                  {e.factores.length > 0 && (
                    <ul className="text-xs text-marmol-500 space-y-0.5">
                      {e.factores.map((f, i) => (
                        <li key={i}>
                          <strong>{ETIQUETA_TIPO[f.tipo] ?? '·'}</strong> · {f.descripcion}
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="flex items-center gap-3 flex-wrap text-xs">
                    {e.actividad_id && (
                      <Link href="/procesos-gestion/plan-trabajo" className="text-alto hover:underline">
                        Ya está en el plan de trabajo →
                      </Link>
                    )}
                    {puedeEditar && e.estado === 'propuesta' && (
                      <>
                        <button type="button" disabled={pending} onClick={() => correr(() => actualizarEstadoEstrategia(e.id, 'aprobada'))} className="inline-flex items-center gap-1 text-alto hover:underline">
                          <Check size={12} /> Aprobar
                        </button>
                        <button type="button" disabled={pending} onClick={() => correr(() => actualizarEstadoEstrategia(e.id, 'descartada'))} className="inline-flex items-center gap-1 text-marmol-500 hover:underline">
                          <X size={12} /> Descartar
                        </button>
                      </>
                    )}
                    {puedeEditar && e.estado === 'descartada' && (
                      <button type="button" disabled={pending} onClick={() => correr(() => actualizarEstadoEstrategia(e.id, 'propuesta'))} className="text-marmol-500 hover:underline">
                        Recuperar
                      </button>
                    )}
                    {puedeEditar && e.estado !== 'descartada' && !e.actividad_id && (
                      <button type="button" onClick={() => setProgramando(programando === e.id ? null : e.id)} className="inline-flex items-center gap-1 text-flow-600 hover:underline">
                        <CalendarPlus size={12} /> Llevar al plan de trabajo
                      </button>
                    )}
                    {puedeEditar && (
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => confirm('¿Eliminar esta estrategia?') && correr(() => eliminarEstrategia(e.id))}
                        aria-label="Eliminar estrategia"
                        className="ml-auto text-marmol-300 hover:text-bajo"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                  {programando === e.id && (
                    <div className="flex items-center gap-2 flex-wrap pt-1">
                      <input type="date" value={fecha} onChange={(ev) => setFecha(ev.target.value)} aria-label="Fecha programada" className="rounded-lg border border-marmol-200 px-2 py-1 text-sm" />
                      <button
                        type="button"
                        disabled={pending || !fecha}
                        onClick={() => correr(() => crearActividadDesdeEstrategia(e.id, fecha), () => setProgramando(null))}
                        className="rounded-lg bg-flow-500 hover:bg-flow-600 disabled:opacity-40 text-white text-xs font-medium px-3 py-1.5"
                      >
                        Programar
                      </button>
                    </div>
                  )}
                </div>
              ))}

              {puedeEditar &&
                (nuevo.tipo === c.tipo ? (
                  <div className="space-y-2 pt-1 border-t border-marmol-100">
                    <textarea rows={2} value={nuevo.texto} onChange={(e) => setNuevo((p) => ({ ...p, texto: e.target.value }))} placeholder="Describe la estrategia" className="w-full rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm" />
                    {candidatos.length > 0 && (
                      <div className="max-h-28 overflow-y-auto space-y-0.5">
                        <p className="text-xs text-marmol-400">Factores que cruza (opcional):</p>
                        {candidatos.map((f) => (
                          <label key={f.id} className="flex items-start gap-1.5 text-xs text-marmol-600">
                            <input
                              type="checkbox"
                              checked={nuevo.ids.includes(f.id)}
                              onChange={(e) => setNuevo((p) => ({ ...p, ids: e.target.checked ? [...p.ids, f.id] : p.ids.filter((x) => x !== f.id) }))}
                              className="mt-0.5"
                            />
                            <span>
                              <strong>{ETIQUETA_TIPO[f.tipo]}</strong> · {f.descripcion}
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={pending || !nuevo.texto.trim()}
                        onClick={() => correr(() => crearEstrategiaManual({ analisisId, tipo: c.tipo, descripcion: nuevo.texto, itemIds: nuevo.ids }), () => setNuevo({ tipo: null, texto: '', ids: [] }))}
                        className="rounded-lg bg-flow-500 hover:bg-flow-600 disabled:opacity-40 text-white text-xs font-medium px-3 py-1.5"
                      >
                        Agregar
                      </button>
                      <button type="button" onClick={() => setNuevo({ tipo: null, texto: '', ids: [] })} className="text-xs text-marmol-500 hover:underline">
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <button type="button" onClick={() => setNuevo({ tipo: c.tipo, texto: '', ids: [] })} className="inline-flex items-center gap-1 text-xs text-flow-600 hover:underline">
                    <Plus size={12} /> Agregar estrategia a mano
                  </button>
                ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
