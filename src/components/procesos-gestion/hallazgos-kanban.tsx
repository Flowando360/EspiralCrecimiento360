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
import { agregarHallazgo, actualizarEstadoHallazgo, eliminarHallazgo } from '@/app/(dashboard)/procesos-gestion/auditorias/actions';
import { cn, formatearFecha } from '@/lib/utils';
import { Plus, Trash2, User, Calendar } from 'lucide-react';

type TipoHallazgo = 'no_conformidad_mayor' | 'no_conformidad_menor' | 'observacion' | 'oportunidad_mejora';
type EstadoHallazgo = 'abierto' | 'analisis_causa' | 'plan_accion' | 'seguimiento' | 'cerrado';

export interface Hallazgo {
  id: string;
  codigo: string | null;
  proceso_id: string | null;
  tipo: TipoHallazgo;
  descripcion: string;
  requisito_incumplido: string | null;
  responsable_id: string | null;
  estado: EstadoHallazgo;
  fecha_deteccion: string;
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

const ETIQUETA_TIPO: Record<TipoHallazgo, string> = {
  no_conformidad_mayor: 'NC Mayor',
  no_conformidad_menor: 'NC Menor',
  observacion: 'Observación',
  oportunidad_mejora: 'Oportunidad de mejora',
};

const CLASE_TIPO: Record<TipoHallazgo, string> = {
  no_conformidad_mayor: 'badge-bajo',
  no_conformidad_menor: 'badge-medio',
  observacion: 'badge-flow',
  oportunidad_mejora: 'badge-alto',
};

const COLUMNAS: { valor: EstadoHallazgo; etiqueta: string }[] = [
  { valor: 'abierto', etiqueta: 'Abierto' },
  { valor: 'analisis_causa', etiqueta: 'Análisis de causa' },
  { valor: 'plan_accion', etiqueta: 'Plan de acción' },
  { valor: 'seguimiento', etiqueta: 'Seguimiento' },
  { valor: 'cerrado', etiqueta: 'Cerrado' },
];

export function HallazgosKanban({
  auditoriaId,
  hallazgosIniciales,
  procesosDeLaAuditoria,
  colaboradores,
  puedeEditar,
}: {
  auditoriaId: string;
  hallazgosIniciales: Hallazgo[];
  procesosDeLaAuditoria: ProcesoOpcion[];
  colaboradores: Colaborador[];
  puedeEditar: boolean;
}) {
  const [hallazgos, setHallazgos] = useState(hallazgosIniciales);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [, startTransition] = useTransition();

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const activeItem = hallazgos.find((h) => h.id === activeId) ?? null;
  const nombreColaborador = (id: string | null) => (id ? colaboradores.find((c) => c.id === id)?.nombre_completo : undefined);
  const nombreProceso = (id: string | null) => {
    const p = procesosDeLaAuditoria.find((p) => p.id === id);
    return p ? `${p.codigo ? p.codigo + ' · ' : ''}${p.nombre}` : undefined;
  };

  function onDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
  }

  function onDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;
    const nuevoEstado = String(over.id) as EstadoHallazgo;
    if (!COLUMNAS.some((c) => c.valor === nuevoEstado)) return;
    const h = hallazgos.find((x) => x.id === active.id);
    if (!h || h.estado === nuevoEstado) return;

    setHallazgos((prev) => prev.map((x) => (x.id === h.id ? { ...x, estado: nuevoEstado } : x)));
    startTransition(async () => {
      await actualizarEstadoHallazgo(auditoriaId, h.id, nuevoEstado);
    });
  }

  function eliminar(id: string) {
    setHallazgos((prev) => prev.filter((h) => h.id !== id));
    startTransition(async () => {
      await eliminarHallazgo(auditoriaId, id);
    });
  }

  const hallazgosPorColumna = useMemo(() => {
    const mapa = new Map<EstadoHallazgo, Hallazgo[]>();
    for (const c of COLUMNAS) mapa.set(c.valor, []);
    for (const h of hallazgos) mapa.get(h.estado)?.push(h);
    return mapa;
  }, [hallazgos]);

  return (
    <div>
      {puedeEditar && (
        <div className="flex justify-end mb-3">
          <button onClick={() => setMostrarForm((v) => !v)} className="inline-flex items-center gap-1.5 rounded-lg bg-flow-500 hover:bg-flow-600 text-white text-sm font-medium px-3 py-1.5">
            <Plus size={14} /> Agregar hallazgo
          </button>
        </div>
      )}

      {mostrarForm && (
        <FormularioHallazgo
          auditoriaId={auditoriaId}
          procesos={procesosDeLaAuditoria}
          onCreado={(h) => {
            setHallazgos((prev) => [...prev, h]);
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
              hallazgos={hallazgosPorColumna.get(columna.valor) ?? []}
              nombreColaborador={nombreColaborador}
              nombreProceso={nombreProceso}
              puedeEditar={puedeEditar}
              onEliminar={eliminar}
            />
          ))}
        </div>
        <DragOverlay>
          {activeItem && <TarjetaHallazgo hallazgo={activeItem} responsable={nombreColaborador(activeItem.responsable_id)} proceso={nombreProceso(activeItem.proceso_id)} puedeEditar={false} onEliminar={() => {}} />}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

function Columna({
  columna,
  hallazgos,
  nombreColaborador,
  nombreProceso,
  puedeEditar,
  onEliminar,
}: {
  columna: { valor: EstadoHallazgo; etiqueta: string };
  hallazgos: Hallazgo[];
  nombreColaborador: (id: string | null) => string | undefined;
  nombreProceso: (id: string | null) => string | undefined;
  puedeEditar: boolean;
  onEliminar: (id: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: columna.valor });
  return (
    <div className="flex-none w-64">
      <div className="flex items-center justify-between rounded-t-xl px-3 py-2 border badge-marmol">
        <span className="text-sm font-semibold truncate">{columna.etiqueta}</span>
        <span className="text-xs font-medium rounded-full bg-white/70 px-2 py-0.5">{hallazgos.length}</span>
      </div>
      <div ref={setNodeRef} className={cn('bg-marmol-50 border border-t-0 border-marmol-200 rounded-b-xl p-2 min-h-[120px] space-y-2 transition-colors', isOver && 'bg-flow-50')}>
        {hallazgos.map((h) => (
          <TarjetaArrastrable key={h.id} hallazgo={h} responsable={nombreColaborador(h.responsable_id)} proceso={nombreProceso(h.proceso_id)} puedeEditar={puedeEditar} onEliminar={onEliminar} />
        ))}
        {hallazgos.length === 0 && <p className="text-xs text-marmol-400 text-center py-4">Sin hallazgos</p>}
      </div>
    </div>
  );
}

function TarjetaArrastrable({
  hallazgo,
  responsable,
  proceso,
  puedeEditar,
  onEliminar,
}: {
  hallazgo: Hallazgo;
  responsable: string | undefined;
  proceso: string | undefined;
  puedeEditar: boolean;
  onEliminar: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: hallazgo.id, disabled: !puedeEditar });
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, opacity: isDragging ? 0.4 : 1, zIndex: isDragging ? 10 : undefined } : undefined;
  return (
    <div ref={setNodeRef} style={style} className={puedeEditar ? 'cursor-grab active:cursor-grabbing' : undefined} {...(puedeEditar ? { ...attributes, ...listeners } : {})}>
      <TarjetaHallazgo hallazgo={hallazgo} responsable={responsable} proceso={proceso} puedeEditar={puedeEditar} onEliminar={onEliminar} />
    </div>
  );
}

function TarjetaHallazgo({
  hallazgo,
  responsable,
  proceso,
  puedeEditar,
  onEliminar,
}: {
  hallazgo: Hallazgo;
  responsable: string | undefined;
  proceso: string | undefined;
  puedeEditar: boolean;
  onEliminar: (id: string) => void;
}) {
  return (
    <div className="card p-3 group">
      <div className="flex items-start justify-between gap-1.5">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            {hallazgo.codigo && <span className="text-[10px] font-semibold text-marmol-400">{hallazgo.codigo}</span>}
            <span className={cn('text-[10px] rounded-full px-1.5 py-0.5 font-medium', CLASE_TIPO[hallazgo.tipo])}>{ETIQUETA_TIPO[hallazgo.tipo]}</span>
          </div>
          <p className="text-sm font-medium text-marmol-800 mt-1 break-words">{hallazgo.descripcion}</p>
          {proceso && <p className="text-xs text-marmol-400 mt-1">{proceso}</p>}
          <div className="flex items-center gap-2 flex-wrap mt-1.5">
            <span className="text-[10px] text-marmol-400 inline-flex items-center gap-1">
              <Calendar size={10} /> {formatearFecha(hallazgo.fecha_deteccion)}
            </span>
            {responsable && (
              <span className="text-[10px] text-marmol-400 inline-flex items-center gap-1">
                <User size={10} /> {responsable}
              </span>
            )}
          </div>
        </div>
        {puedeEditar && (
          <button onClick={() => onEliminar(hallazgo.id)} onPointerDown={(e) => e.stopPropagation()} className="text-marmol-300 hover:text-bajo opacity-0 group-hover:opacity-100 shrink-0">
            <Trash2 size={13} />
          </button>
        )}
      </div>
    </div>
  );
}

function FormularioHallazgo({
  auditoriaId,
  procesos,
  onCreado,
}: {
  auditoriaId: string;
  procesos: ProcesoOpcion[];
  onCreado: (h: Hallazgo) => void;
}) {
  const [procesoId, setProcesoId] = useState('');
  const [tipo, setTipo] = useState<TipoHallazgo>('observacion');
  const [descripcion, setDescripcion] = useState('');
  const [requisitoIncumplido, setRequisitoIncumplido] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function crear() {
    if (!descripcion.trim()) {
      setError('La descripción es requerida');
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await agregarHallazgo({ auditoriaId, procesoId: procesoId || undefined, tipo, descripcion, requisitoIncumplido: requisitoIncumplido || undefined });
      if (res.ok) {
        onCreado({ id: res.id, codigo: res.codigo, proceso_id: procesoId || null, tipo, descripcion, requisito_incumplido: requisitoIncumplido || null, responsable_id: null, estado: 'abierto', fecha_deteccion: new Date().toISOString().slice(0, 10) });
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <div className="rounded-lg border border-marmol-200 p-3 mb-3 space-y-2">
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
        <select value={tipo} onChange={(e) => setTipo(e.target.value as TipoHallazgo)} className="rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm">
          {(Object.entries(ETIQUETA_TIPO) as [TipoHallazgo, string][]).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
      </div>
      <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Descripción del hallazgo" rows={2} className="w-full rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm" />
      <input value={requisitoIncumplido} onChange={(e) => setRequisitoIncumplido(e.target.value)} placeholder="Requisito/numeral incumplido (opcional)" className="w-full rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm" />
      <button onClick={crear} disabled={pending} className="inline-flex items-center gap-1 rounded-lg bg-flow-500 hover:bg-flow-600 disabled:opacity-40 text-white text-sm font-medium px-3 py-1.5">
        {pending ? 'Agregando…' : 'Agregar hallazgo'}
      </button>
      {error && <p className="text-sm text-bajo">{error}</p>}
    </div>
  );
}
