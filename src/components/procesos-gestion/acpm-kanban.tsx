'use client';

import { useMemo, useState, useTransition } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { crearAcpm, actualizarEstadoAcpm, cerrarAcpm, agregarTarea, actualizarTarea, eliminarAcpm } from '@/app/(dashboard)/procesos-gestion/acpm/actions';
import { cn, formatearFecha } from '@/lib/utils';
import { Plus, Trash2, User, Calendar, X, Check, ShieldQuestion } from 'lucide-react';

type OrigenTipo = 'hallazgo_auditoria' | 'riesgo' | 'indicador' | 'pqrs' | 'mejora_propia';
type TipoAccion = 'correctiva' | 'preventiva' | 'mejora';
type MetodologiaCausa = 'cinco_porques' | 'ishikawa' | 'libre';
type EstadoAcpm = 'registrada' | 'analisis_causa' | 'plan_accion' | 'seguimiento' | 'validacion_eficacia' | 'cerrada_efectiva' | 'reabierta';

export interface Tarea {
  id: string;
  descripcion: string;
  responsable_id: string | null;
  fecha_limite: string | null;
  completada: boolean;
}

export interface Acpm {
  id: string;
  codigo: string | null;
  proceso_id: string | null;
  origen_tipo: OrigenTipo;
  origen_detalle: string | null;
  tipo_accion: TipoAccion;
  descripcion: string;
  metodologia_causa: MetodologiaCausa | null;
  analisis_causa: string | null;
  responsable_id: string | null;
  estado: EstadoAcpm;
  fecha_compromiso: string | null;
  eficaz: boolean | null;
  tareas: Tarea[];
}

interface ProcesoOpcion {
  id: string;
  nombre: string;
  codigo: string | null;
}

interface Colaborador {
  id: string;
  nombre_completo: string;
}

const ETIQUETA_ORIGEN: Record<OrigenTipo, string> = {
  hallazgo_auditoria: 'Hallazgo de auditoría',
  riesgo: 'Riesgo',
  indicador: 'Indicador',
  pqrs: 'PQRS',
  mejora_propia: 'Mejora propia',
};

const ETIQUETA_TIPO_ACCION: Record<TipoAccion, string> = { correctiva: 'Correctiva', preventiva: 'Preventiva', mejora: 'Mejora' };
const CLASE_TIPO_ACCION: Record<TipoAccion, string> = { correctiva: 'badge-bajo', preventiva: 'badge-medio', mejora: 'badge-alto' };

const COLUMNAS: { valor: EstadoAcpm; etiqueta: string }[] = [
  { valor: 'registrada', etiqueta: 'Registrada' },
  { valor: 'analisis_causa', etiqueta: 'Análisis de causa' },
  { valor: 'plan_accion', etiqueta: 'Plan de acción' },
  { valor: 'seguimiento', etiqueta: 'Seguimiento' },
  { valor: 'validacion_eficacia', etiqueta: 'Validación de eficacia' },
  { valor: 'cerrada_efectiva', etiqueta: 'Cerrada efectiva' },
  { valor: 'reabierta', etiqueta: 'Reabierta' },
];

export interface PrefillAcpm {
  origenTipo: 'hallazgo_auditoria' | 'riesgo' | 'mejora_propia';
  origenHallazgoId?: string;
  origenRiesgoId?: string;
  procesoId?: string;
  origenDetalle?: string;
  descripcion?: string;
}

export function AcpmKanban({
  acpmIniciales,
  procesos,
  colaboradores,
  puedeEditar,
  prefill,
}: {
  acpmIniciales: Acpm[];
  procesos: ProcesoOpcion[];
  colaboradores: Colaborador[];
  puedeEditar: boolean;
  prefill?: PrefillAcpm;
}) {
  const [items, setItems] = useState(acpmIniciales);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [mostrarForm, setMostrarForm] = useState(!!prefill && puedeEditar);
  const [detalleId, setDetalleId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const activeItem = items.find((i) => i.id === activeId) ?? null;
  const detalleItem = items.find((i) => i.id === detalleId) ?? null;

  const nombreProceso = (id: string | null) => {
    const p = procesos.find((p) => p.id === id);
    return p ? `${p.codigo ? p.codigo + ' · ' : ''}${p.nombre}` : undefined;
  };
  const nombreColaborador = (id: string | null) => (id ? colaboradores.find((c) => c.id === id)?.nombre_completo : undefined);

  function onDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
  }

  function onDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;
    const nuevoEstado = String(over.id) as EstadoAcpm;
    if (!COLUMNAS.some((c) => c.valor === nuevoEstado)) return;
    const item = items.find((x) => x.id === active.id);
    if (!item || item.estado === nuevoEstado) return;

    setItems((prev) => prev.map((x) => (x.id === item.id ? { ...x, estado: nuevoEstado } : x)));
    startTransition(async () => {
      await actualizarEstadoAcpm(item.id, nuevoEstado);
    });
  }

  function eliminar(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
    setDetalleId(null);
    startTransition(async () => {
      await eliminarAcpm(id);
    });
  }

  const itemsPorColumna = useMemo(() => {
    const mapa = new Map<EstadoAcpm, Acpm[]>();
    for (const c of COLUMNAS) mapa.set(c.valor, []);
    for (const i of items) mapa.get(i.estado)?.push(i);
    return mapa;
  }, [items]);

  return (
    <div>
      {puedeEditar && (
        <div className="flex justify-end mb-3">
          <button onClick={() => setMostrarForm((v) => !v)} className="inline-flex items-center gap-1.5 rounded-lg bg-flow-500 hover:bg-flow-600 text-white text-sm font-medium px-3 py-1.5">
            <Plus size={14} /> Nueva ACPM
          </button>
        </div>
      )}

      {mostrarForm && (
        <FormularioAcpm
          procesos={procesos}
          prefill={prefill}
          onCreada={(a) => {
            setItems((prev) => [...prev, a]);
            setMostrarForm(false);
          }}
        />
      )}

      <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {COLUMNAS.map((columna) => (
            <Columna
              key={columna.valor}
              columna={columna}
              items={itemsPorColumna.get(columna.valor) ?? []}
              nombreProceso={nombreProceso}
              nombreColaborador={nombreColaborador}
              puedeEditar={puedeEditar}
              onAbrir={setDetalleId}
            />
          ))}
        </div>
        <DragOverlay>{activeItem && <TarjetaAcpm item={activeItem} proceso={nombreProceso(activeItem.proceso_id)} responsable={nombreColaborador(activeItem.responsable_id)} onAbrir={() => {}} />}</DragOverlay>
      </DndContext>

      {detalleItem && (
        <ModalDetalleAcpm
          item={detalleItem}
          proceso={nombreProceso(detalleItem.proceso_id)}
          colaboradores={colaboradores}
          puedeEditar={puedeEditar}
          onCerrar={() => setDetalleId(null)}
          onEliminar={() => eliminar(detalleItem.id)}
          onCambiar={(cambios) => setItems((prev) => prev.map((i) => (i.id === detalleItem.id ? { ...i, ...cambios } : i)))}
        />
      )}
    </div>
  );
}

function Columna({
  columna,
  items,
  nombreProceso,
  nombreColaborador,
  puedeEditar,
  onAbrir,
}: {
  columna: { valor: EstadoAcpm; etiqueta: string };
  items: Acpm[];
  nombreProceso: (id: string | null) => string | undefined;
  nombreColaborador: (id: string | null) => string | undefined;
  puedeEditar: boolean;
  onAbrir: (id: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: columna.valor });
  return (
    <div className="flex-none w-64">
      <div className="flex items-center justify-between rounded-t-xl px-3 py-2 border badge-marmol">
        <span className="text-sm font-semibold truncate">{columna.etiqueta}</span>
        <span className="text-xs font-medium rounded-full bg-white/70 px-2 py-0.5">{items.length}</span>
      </div>
      <div ref={setNodeRef} className={cn('bg-marmol-50 border border-t-0 border-marmol-200 rounded-b-xl p-2 min-h-[120px] space-y-2 transition-colors', isOver && 'bg-flow-50')}>
        {items.map((item) => (
          <TarjetaArrastrable key={item.id} item={item} proceso={nombreProceso(item.proceso_id)} responsable={nombreColaborador(item.responsable_id)} puedeEditar={puedeEditar} onAbrir={onAbrir} />
        ))}
        {items.length === 0 && <p className="text-xs text-marmol-400 text-center py-4">Sin ACPM</p>}
      </div>
    </div>
  );
}

function TarjetaArrastrable({ item, proceso, responsable, puedeEditar, onAbrir }: { item: Acpm; proceso: string | undefined; responsable: string | undefined; puedeEditar: boolean; onAbrir: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: item.id, disabled: !puedeEditar });
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, opacity: isDragging ? 0.4 : 1, zIndex: isDragging ? 10 : undefined } : undefined;
  return (
    <div ref={setNodeRef} style={style} onClick={() => onAbrir(item.id)} className={cn('cursor-pointer', puedeEditar && 'active:cursor-grabbing')} {...(puedeEditar ? { ...attributes, ...listeners } : {})}>
      <TarjetaAcpm item={item} proceso={proceso} responsable={responsable} onAbrir={onAbrir} />
    </div>
  );
}

function TarjetaAcpm({ item, proceso, responsable, onAbrir }: { item: Acpm; proceso: string | undefined; responsable: string | undefined; onAbrir: (id: string) => void }) {
  const completadas = item.tareas.filter((t) => t.completada).length;
  return (
    <div className="card p-3">
      <div className="flex items-center gap-1.5 flex-wrap">
        {item.codigo && <span className="text-[10px] font-semibold text-marmol-400">{item.codigo}</span>}
        <span className={cn('text-[10px] rounded-full px-1.5 py-0.5 font-medium', CLASE_TIPO_ACCION[item.tipo_accion])}>{ETIQUETA_TIPO_ACCION[item.tipo_accion]}</span>
      </div>
      <p className="text-sm font-medium text-marmol-800 mt-1 break-words">{item.descripcion}</p>
      {proceso && <p className="text-xs text-marmol-400 mt-1">{proceso}</p>}
      <div className="flex items-center gap-2 flex-wrap mt-1.5">
        {item.fecha_compromiso && (
          <span className="text-[10px] text-marmol-400 inline-flex items-center gap-1">
            <Calendar size={10} /> {formatearFecha(item.fecha_compromiso)}
          </span>
        )}
        {responsable && (
          <span className="text-[10px] text-marmol-400 inline-flex items-center gap-1">
            <User size={10} /> {responsable}
          </span>
        )}
        {item.tareas.length > 0 && <span className="text-[10px] text-marmol-400">{completadas}/{item.tareas.length} tareas</span>}
      </div>
    </div>
  );
}

function FormularioAcpm({ procesos, prefill, onCreada }: { procesos: ProcesoOpcion[]; prefill?: PrefillAcpm; onCreada: (a: Acpm) => void }) {
  const [procesoId, setProcesoId] = useState(prefill?.procesoId ?? '');
  const [origenTipo, setOrigenTipo] = useState<OrigenTipo>(prefill?.origenTipo ?? 'mejora_propia');
  const [origenDetalle, setOrigenDetalle] = useState(prefill?.origenDetalle ?? '');
  const [tipoAccion, setTipoAccion] = useState<TipoAccion>('correctiva');
  const [descripcion, setDescripcion] = useState(prefill?.descripcion ?? '');
  const [metodologiaCausa, setMetodologiaCausa] = useState<MetodologiaCausa | ''>('');
  const [fechaCompromiso, setFechaCompromiso] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function crear() {
    if (!descripcion.trim()) {
      setError('La descripción es requerida');
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await crearAcpm({
        procesoId: procesoId || undefined,
        origenTipo,
        origenHallazgoId: prefill?.origenHallazgoId,
        origenRiesgoId: prefill?.origenRiesgoId,
        origenDetalle: origenDetalle || undefined,
        tipoAccion,
        descripcion,
        metodologiaCausa: metodologiaCausa || undefined,
        fechaCompromiso: fechaCompromiso || undefined,
      });
      if (res.ok) {
        onCreada({
          id: res.id,
          codigo: res.codigo,
          proceso_id: procesoId || null,
          origen_tipo: origenTipo,
          origen_detalle: origenDetalle || null,
          tipo_accion: tipoAccion,
          descripcion,
          metodologia_causa: metodologiaCausa || null,
          analisis_causa: null,
          responsable_id: null,
          estado: 'registrada',
          fecha_compromiso: fechaCompromiso || null,
          eficaz: null,
          tareas: [],
        });
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <div className="rounded-lg border border-marmol-200 p-3 mb-3 space-y-2">
      {prefill && (
        <p className="text-xs text-flow-700 bg-flow-50 rounded-lg px-2.5 py-1.5">
          Origen: {ETIQUETA_ORIGEN[prefill.origenTipo]}
          {prefill.origenTipo !== 'mejora_propia' && ' — se vincula automáticamente al guardar.'}
        </p>
      )}
      <div className="grid grid-cols-2 gap-2">
        <select value={procesoId} onChange={(e) => setProcesoId(e.target.value)} className="rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm">
          <option value="">Proceso (opcional)</option>
          {procesos.map((p) => (
            <option key={p.id} value={p.id}>
              {p.codigo ? `${p.codigo} · ` : ''}
              {p.nombre}
            </option>
          ))}
        </select>
        <select value={tipoAccion} onChange={(e) => setTipoAccion(e.target.value as TipoAccion)} className="rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm">
          {(Object.entries(ETIQUETA_TIPO_ACCION) as [TipoAccion, string][]).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {!prefill && (
          <select value={origenTipo} onChange={(e) => setOrigenTipo(e.target.value as OrigenTipo)} className="rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm">
            {(Object.entries(ETIQUETA_ORIGEN) as [OrigenTipo, string][]).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        )}
        <select value={metodologiaCausa} onChange={(e) => setMetodologiaCausa(e.target.value as MetodologiaCausa)} className={cn('rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm', prefill && 'col-span-2')}>
          <option value="">Metodología de causa (opcional)</option>
          <option value="cinco_porques">5 porqués</option>
          <option value="ishikawa">Ishikawa</option>
          <option value="libre">Libre</option>
        </select>
      </div>
      {(!prefill || prefill.origenTipo === 'mejora_propia') && origenTipo !== 'hallazgo_auditoria' && origenTipo !== 'riesgo' && (
        <input value={origenDetalle} onChange={(e) => setOrigenDetalle(e.target.value)} placeholder="Detalle del origen (opcional)" className="w-full rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm" />
      )}
      <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Descripción de la ACPM" rows={2} className="w-full rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm" />
      <input type="date" value={fechaCompromiso} onChange={(e) => setFechaCompromiso(e.target.value)} className="rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm" />
      <button onClick={crear} disabled={pending} className="inline-flex items-center gap-1 rounded-lg bg-flow-500 hover:bg-flow-600 disabled:opacity-40 text-white text-sm font-medium px-3 py-1.5">
        {pending ? 'Creando…' : 'Crear ACPM'}
      </button>
      {error && <p className="text-sm text-bajo">{error}</p>}
    </div>
  );
}

function ModalDetalleAcpm({
  item,
  proceso,
  colaboradores,
  puedeEditar,
  onCerrar,
  onEliminar,
  onCambiar,
}: {
  item: Acpm;
  proceso: string | undefined;
  colaboradores: Colaborador[];
  puedeEditar: boolean;
  onCerrar: () => void;
  onEliminar: () => void;
  onCambiar: (cambios: Partial<Acpm>) => void;
}) {
  const [nuevaTarea, setNuevaTarea] = useState('');
  const [pending, startTransition] = useTransition();
  const [mostrarCierre, setMostrarCierre] = useState(false);
  const [evidenciaUrl, setEvidenciaUrl] = useState('');

  function agregarTareaLocal() {
    if (!nuevaTarea.trim()) return;
    startTransition(async () => {
      const res = await agregarTarea({ acpmId: item.id, descripcion: nuevaTarea });
      if (res.ok) {
        onCambiar({ tareas: [...item.tareas, { id: res.id, descripcion: nuevaTarea, responsable_id: null, fecha_limite: null, completada: false }] });
        setNuevaTarea('');
      }
    });
  }

  function toggleTarea(tareaId: string, completada: boolean) {
    onCambiar({ tareas: item.tareas.map((t) => (t.id === tareaId ? { ...t, completada } : t)) });
    startTransition(async () => {
      await actualizarTarea(tareaId, completada);
    });
  }

  function cerrar(eficaz: boolean) {
    startTransition(async () => {
      const res = await cerrarAcpm({ id: item.id, eficaz, evidenciaUrl: evidenciaUrl || undefined });
      if (res.ok) {
        onCambiar({ eficaz, estado: eficaz ? 'cerrada_efectiva' : 'reabierta' });
        onCerrar();
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30" onClick={onCerrar} />
      <div className="relative w-full max-w-lg bg-white rounded-xl shadow-xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-marmol-100">
          <div>
            <h2 className="font-display font-semibold text-secundario">{item.codigo}</h2>
            <p className="text-xs text-marmol-400">{ETIQUETA_ORIGEN[item.origen_tipo]}{proceso && ` · ${proceso}`}</p>
          </div>
          <button onClick={onCerrar} className="text-marmol-400 hover:text-marmol-700">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto">
          <p className="text-sm text-marmol-800">{item.descripcion}</p>
          {item.origen_detalle && <p className="text-xs text-marmol-500">Origen: {item.origen_detalle}</p>}

          <div>
            <p className="text-xs font-medium text-marmol-600 mb-1.5">Plan de acción</p>
            <div className="space-y-1.5">
              {item.tareas.map((t) => (
                <label key={t.id} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={t.completada} onChange={(e) => toggleTarea(t.id, e.target.checked)} disabled={!puedeEditar} className="accent-flow-600" />
                  <span className={cn(t.completada && 'line-through text-marmol-400')}>{t.descripcion}</span>
                </label>
              ))}
              {item.tareas.length === 0 && <p className="text-xs text-marmol-400">Sin tareas todavía.</p>}
            </div>
            {puedeEditar && (
              <div className="flex gap-2 mt-2">
                <input value={nuevaTarea} onChange={(e) => setNuevaTarea(e.target.value)} placeholder="Nueva tarea" className="flex-1 rounded-lg border border-marmol-200 px-2 py-1 text-xs" />
                <button onClick={agregarTareaLocal} disabled={pending} className="rounded-lg bg-flow-500 hover:bg-flow-600 text-white text-xs font-medium px-2.5 py-1">
                  <Plus size={12} />
                </button>
              </div>
            )}
          </div>

          {item.estado === 'validacion_eficacia' && puedeEditar && (
            <div className="rounded-lg border border-medio/30 bg-amber-50/60 p-3">
              <p className="text-xs font-medium text-marmol-700 mb-2 inline-flex items-center gap-1">
                <ShieldQuestion size={13} /> ¿La acción eliminó la causa raíz?
              </p>
              {!mostrarCierre ? (
                <button onClick={() => setMostrarCierre(true)} className="text-xs text-flow-600 hover:text-flow-700 font-medium">
                  Validar eficacia
                </button>
              ) : (
                <div className="space-y-2">
                  <input value={evidenciaUrl} onChange={(e) => setEvidenciaUrl(e.target.value)} placeholder="Evidencia (opcional, link o referencia)" className="w-full rounded-lg border border-marmol-200 px-2 py-1 text-xs" />
                  <div className="flex gap-2">
                    <button onClick={() => cerrar(true)} disabled={pending} className="inline-flex items-center gap-1 rounded-lg bg-flow-500 hover:bg-flow-600 text-white text-xs font-medium px-2.5 py-1.5">
                      <Check size={12} /> Sí, fue eficaz — cerrar
                    </button>
                    <button onClick={() => cerrar(false)} disabled={pending} className="inline-flex items-center gap-1 rounded-lg border border-marmol-200 text-marmol-600 hover:bg-marmol-100 text-xs font-medium px-2.5 py-1.5">
                      No fue eficaz — reabrir
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {item.eficaz !== null && (
            <p className={cn('text-xs font-medium', item.eficaz ? 'text-alto' : 'text-bajo')}>{item.eficaz ? 'Cerrada como eficaz' : 'Reabierta — la causa no se eliminó'}</p>
          )}
        </div>

        {puedeEditar && (
          <div className="flex justify-end px-5 py-4 border-t border-marmol-100">
            <button onClick={onEliminar} className="inline-flex items-center gap-1 text-xs text-bajo hover:underline">
              <Trash2 size={12} /> Eliminar ACPM
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
