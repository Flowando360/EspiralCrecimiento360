'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { crearItemContexto, actualizarItemContexto, eliminarItemContexto } from '@/app/(dashboard)/procesos-gestion/contexto/actions';
import { guardarPriorizacionItem, priorizarConIA, convertirItemEnRiesgo } from '@/app/(dashboard)/procesos-gestion/contexto/foda-actions';
import { Plus, Trash2, Pencil, Check, X, ListChecks, GitPullRequestArrow, Sparkles, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';

type TipoContexto = 'debilidad' | 'oportunidad' | 'fortaleza' | 'amenaza';

export interface ItemContexto {
  id: string;
  tipo: TipoContexto;
  descripcion: string;
  orden: number;
  impacto: number | null;
  probabilidad: number | null;
  sugerencia_ia: string | null;
  riesgo_id: string | null;
}

const COLUMNAS: { tipo: TipoContexto; titulo: string; badge: string }[] = [
  { tipo: 'debilidad', titulo: 'Debilidades', badge: 'badge-bajo' },
  { tipo: 'oportunidad', titulo: 'Oportunidades', badge: 'badge-alto' },
  { tipo: 'fortaleza', titulo: 'Fortalezas', badge: 'badge-alto' },
  { tipo: 'amenaza', titulo: 'Amenazas', badge: 'badge-bajo' },
];

const NIVELES = [
  { v: 1, l: 'Bajo' },
  { v: 2, l: 'Medio' },
  { v: 3, l: 'Alto' },
];

const puntaje = (i: ItemContexto) => (i.impacto && i.probabilidad ? i.impacto * i.probabilidad : null);
const claseTono = (p: number | null) => (p == null ? 'bg-marmol-100 text-marmol-400' : p >= 6 ? 'bg-red-100 text-bajo' : p >= 3 ? 'bg-medio/10 text-medio' : 'bg-green-100 text-alto');

export function DetalleContexto({
  analisisId,
  itemsIniciales,
  conteoAcpmPorItem,
  puedeEditar,
}: {
  analisisId: string;
  itemsIniciales: ItemContexto[];
  conteoAcpmPorItem: Record<string, number>;
  puedeEditar: boolean;
}) {
  const router = useRouter();
  const [items, setItems] = useState(itemsIniciales);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [nuevoTexto, setNuevoTexto] = useState<Record<TipoContexto, string>>({ debilidad: '', oportunidad: '', fortaleza: '', amenaza: '' });
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [edTexto, setEdTexto] = useState('');

  // Cuando el servidor trae datos nuevos (p. ej. tras priorizar con IA), se reflejan aquí.
  useEffect(() => setItems(itemsIniciales), [itemsIniciales]);

  function agregar(tipo: TipoContexto) {
    const descripcion = nuevoTexto[tipo].trim();
    if (!descripcion) return;
    setError(null);
    startTransition(async () => {
      const res = await crearItemContexto({ analisisId, tipo, descripcion });
      if (res.ok) {
        setItems((prev) => [...prev, { id: res.id, tipo, descripcion, orden: prev.length, impacto: null, probabilidad: null, sugerencia_ia: null, riesgo_id: null }]);
        setNuevoTexto((prev) => ({ ...prev, [tipo]: '' }));
      } else {
        setError(res.error);
      }
    });
  }

  function guardarEdicion(id: string) {
    const descripcion = edTexto.trim();
    if (!descripcion) return;
    startTransition(async () => {
      const res = await actualizarItemContexto({ id, descripcion });
      if (res.ok) {
        setItems((prev) => prev.map((i) => (i.id === id ? { ...i, descripcion } : i)));
        setEditandoId(null);
      } else {
        setError(res.error);
      }
    });
  }

  function eliminar(id: string) {
    if (!confirm('¿Eliminar este ítem?')) return;
    startTransition(async () => {
      const res = await eliminarItemContexto(id);
      if (res.ok) setItems((prev) => prev.filter((i) => i.id !== id));
      else setError(res.error);
    });
  }

  function priorizar(id: string, campo: 'impacto' | 'probabilidad', valor: number | null) {
    const actual = items.find((i) => i.id === id);
    if (!actual) return;
    const nuevo = { impacto: actual.impacto, probabilidad: actual.probabilidad, [campo]: valor };
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...nuevo } : i)));
    startTransition(async () => {
      const res = await guardarPriorizacionItem({ id, impacto: nuevo.impacto, probabilidad: nuevo.probabilidad });
      if (!res.ok) setError(res.error);
    });
  }

  function priorizarIA() {
    setError(null);
    setMensaje(null);
    startTransition(async () => {
      const res = await priorizarConIA(analisisId);
      if (!res.ok) setError(res.error);
      else {
        setMensaje(`La IA propuso la priorización de ${res.priorizados} factores. Revísala y ajústala: la decisión es tuya.`);
        router.refresh();
      }
    });
  }

  function aRiesgo(id: string) {
    setError(null);
    setMensaje(null);
    startTransition(async () => {
      const res = await convertirItemEnRiesgo(id);
      if (!res.ok) setError(res.error);
      else {
        setMensaje('Se creó en Riesgos y oportunidades. Allí puedes definir el control y las acciones.');
        router.refresh();
      }
    });
  }

  const selector = 'rounded border border-marmol-200 px-1 py-0.5 text-xs bg-white';

  return (
    <div className="space-y-3">
      {puedeEditar && (
        <div className="card p-3 flex items-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={priorizarIA}
            disabled={pending || items.length < 2}
            className="inline-flex items-center gap-1.5 rounded-lg border border-flow-300 text-flow-700 hover:bg-flow-50 disabled:opacity-40 text-sm font-medium px-3 py-1.5 transition"
          >
            <Sparkles size={14} /> {pending ? 'Trabajando…' : 'Priorizar con IA'}
          </button>
          <p className="text-xs text-marmol-500 flex-1 min-w-[16rem]">
            La IA propone impacto y probabilidad (de 1 a 3) y qué hacer con cada factor. El texto del análisis se envía al servicio de IA. Es solo una propuesta: tú ajustas los valores.
          </p>
        </div>
      )}
      {error && <p className="text-xs text-bajo">{error}</p>}
      {mensaje && <p className="text-xs text-alto">{mensaje}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {COLUMNAS.map(({ tipo, titulo, badge }) => {
          const itemsColumna = items
            .filter((i) => i.tipo === tipo)
            .sort((a, b) => (puntaje(b) ?? 0) - (puntaje(a) ?? 0) || a.orden - b.orden);
          return (
            <div key={tipo} className="card p-4 space-y-3">
              <div className="flex items-center gap-2">
                <span className={cn('text-xs rounded-full px-2 py-0.5 font-medium', badge)}>{itemsColumna.length}</span>
                <h2 className="font-display font-semibold text-secundario">{titulo}</h2>
              </div>

              <div className="space-y-2">
                {itemsColumna.length === 0 && <p className="text-xs text-marmol-400">Sin registros todavía.</p>}
                {itemsColumna.map((item) => {
                  const p = puntaje(item);
                  return (
                    <div key={item.id} id={`contexto-item-${item.id}`} className="rounded-lg border border-marmol-200 p-2.5 space-y-1.5">
                      {editandoId === item.id ? (
                        <div className="flex items-center gap-1.5">
                          <input value={edTexto} onChange={(e) => setEdTexto(e.target.value)} className="flex-1 rounded-lg border border-marmol-200 px-2 py-1 text-sm" autoFocus />
                          <button onClick={() => guardarEdicion(item.id)} disabled={pending} className="text-alto">
                            <Check size={15} />
                          </button>
                          <button onClick={() => setEditandoId(null)} className="text-marmol-400">
                            <X size={15} />
                          </button>
                        </div>
                      ) : (
                        <p className="text-sm text-marmol-800">{item.descripcion}</p>
                      )}

                      <div className="flex items-center gap-2 flex-wrap text-xs text-marmol-500">
                        <span className={cn('rounded-full px-2 py-0.5 font-medium', claseTono(p))} title="Impacto × probabilidad (1 a 9)">
                          Prioridad {p ?? '—'}
                        </span>
                        {puedeEditar ? (
                          <>
                            <label className="inline-flex items-center gap-1">
                              Impacto
                              <select value={item.impacto ?? ''} onChange={(e) => priorizar(item.id, 'impacto', e.target.value ? Number(e.target.value) : null)} className={selector}>
                                <option value="">—</option>
                                {NIVELES.map((n) => (
                                  <option key={n.v} value={n.v}>
                                    {n.l}
                                  </option>
                                ))}
                              </select>
                            </label>
                            <label className="inline-flex items-center gap-1">
                              Probabilidad
                              <select value={item.probabilidad ?? ''} onChange={(e) => priorizar(item.id, 'probabilidad', e.target.value ? Number(e.target.value) : null)} className={selector}>
                                <option value="">—</option>
                                {NIVELES.map((n) => (
                                  <option key={n.v} value={n.v}>
                                    {n.l}
                                  </option>
                                ))}
                              </select>
                            </label>
                          </>
                        ) : (
                          <span>
                            Impacto {NIVELES.find((n) => n.v === item.impacto)?.l ?? '—'} · Probabilidad {NIVELES.find((n) => n.v === item.probabilidad)?.l ?? '—'}
                          </span>
                        )}
                      </div>
                      {item.sugerencia_ia && (
                        <p className="text-xs text-flow-700 bg-flow-50 rounded px-2 py-1 flex gap-1">
                          <Sparkles size={12} className="mt-0.5 shrink-0" /> {item.sugerencia_ia}
                        </p>
                      )}

                      <div className="flex items-center justify-between flex-wrap gap-x-3 gap-y-1">
                        <div className="flex items-center gap-3 flex-wrap">
                          <Link
                            href={`/procesos-gestion/acpm?origenContexto=${item.id}&descripcion=${encodeURIComponent(item.descripcion)}`}
                            className="inline-flex items-center gap-1 text-xs text-flow-600 hover:underline"
                          >
                            <ListChecks size={12} />
                            Crear acción
                            {(conteoAcpmPorItem[item.id] ?? 0) > 0 && <span className="text-marmol-400">· {conteoAcpmPorItem[item.id]} ya creada(s)</span>}
                          </Link>
                          <Link
                            href={`/procesos-gestion/cambios?origenContexto=${item.id}&descripcion=${encodeURIComponent(item.descripcion)}`}
                            className="inline-flex items-center gap-1 text-xs text-marmol-400 hover:text-flow-600"
                            title="Crear gestión de cambio desde este ítem"
                          >
                            <GitPullRequestArrow size={12} />
                          </Link>
                          {item.tipo !== 'fortaleza' &&
                            (item.riesgo_id ? (
                              <Link href="/procesos-gestion/riesgos" className="inline-flex items-center gap-1 text-xs text-alto hover:underline">
                                <ShieldAlert size={12} /> Ya está en Riesgos
                              </Link>
                            ) : (
                              puedeEditar && (
                                <button type="button" onClick={() => aRiesgo(item.id)} disabled={pending} className="inline-flex items-center gap-1 text-xs text-flow-600 hover:underline disabled:opacity-40">
                                  <ShieldAlert size={12} /> {item.tipo === 'oportunidad' ? 'Pasar a oportunidades' : 'Convertir en riesgo'}
                                </button>
                              )
                            ))}
                        </div>
                        {puedeEditar && editandoId !== item.id && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setEditandoId(item.id);
                                setEdTexto(item.descripcion);
                              }}
                              className="text-marmol-300 hover:text-flow-600"
                            >
                              <Pencil size={12} />
                            </button>
                            <button onClick={() => eliminar(item.id)} className="text-marmol-300 hover:text-bajo">
                              <Trash2 size={13} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {puedeEditar && (
                <div className="flex items-center gap-1.5 pt-1">
                  <input
                    value={nuevoTexto[tipo]}
                    onChange={(e) => setNuevoTexto((prev) => ({ ...prev, [tipo]: e.target.value }))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') agregar(tipo);
                    }}
                    placeholder={`Nueva ${titulo.toLowerCase().slice(0, -1)}...`}
                    className="flex-1 rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm"
                  />
                  <button onClick={() => agregar(tipo)} disabled={pending} className="text-flow-600 hover:text-flow-800">
                    <Plus size={16} />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
