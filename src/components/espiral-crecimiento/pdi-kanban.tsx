'use client';

import { useState, useTransition } from 'react';
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
import { Calendar } from 'lucide-react';
import { cn, formatearFecha } from '@/lib/utils';
import { actualizarEstadoPdi } from '@/app/(dashboard)/espiral-crecimiento/pdi/actions';

type EstadoPdi = 'pendiente' | 'en_curso' | 'cumplido' | 'vencido';

interface Plan {
  id: string;
  brecha_detectada: string;
  accion: string;
  origen: string;
  estado: EstadoPdi;
  fecha_compromiso: string | null;
  generado_automaticamente: boolean;
  colaborador: { nombre_completo: string } | null;
}

const COLUMNAS: { valor: EstadoPdi; etiqueta: string; clase: string }[] = [
  { valor: 'pendiente', etiqueta: 'Pendiente', clase: 'badge-marmol' },
  { valor: 'en_curso', etiqueta: 'En curso', clase: 'badge-flow' },
  { valor: 'cumplido', etiqueta: 'Cumplido', clase: 'badge-alto' },
  { valor: 'vencido', etiqueta: 'Vencido', clase: 'badge-bajo' },
];

const ORIGEN_COLOR: Record<string, string> = {
  hacer: 'bg-hacer/10 text-hacer',
  deber: 'bg-deber/10 text-deber',
  saber: 'bg-saber/10 text-saber',
  ser: 'bg-ser/10 text-ser',
  mixto: 'bg-marmol-200 text-marmol-600',
};

function hoy() {
  const h = new Date();
  h.setHours(0, 0, 0, 0);
  return h;
}

function estaVencido(plan: Plan): boolean {
  if (!plan.fecha_compromiso || plan.estado === 'cumplido') return false;
  return new Date(plan.fecha_compromiso) < hoy();
}

export function PdiKanban({ planesIniciales, puedeArrastrar }: { planesIniciales: Plan[]; puedeArrastrar: boolean }) {
  const [planes, setPlanes] = useState(planesIniciales);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const activePlan = planes.find((p) => p.id === activeId) ?? null;

  function onDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
  }

  function onDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;

    const nuevoEstado = String(over.id) as EstadoPdi;
    if (!COLUMNAS.some((c) => c.valor === nuevoEstado)) return;

    const plan = planes.find((p) => p.id === active.id);
    if (!plan || plan.estado === nuevoEstado) return;

    setPlanes((prev) => prev.map((p) => (p.id === plan.id ? { ...p, estado: nuevoEstado } : p)));
    startTransition(async () => {
      await actualizarEstadoPdi(plan.id, nuevoEstado);
    });
  }

  return (
    <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNAS.map((columna) => (
          <Columna
            key={columna.valor}
            columna={columna}
            planes={planes.filter((p) => p.estado === columna.valor)}
            puedeArrastrar={puedeArrastrar}
          />
        ))}
      </div>

      <DragOverlay>{activePlan && <TarjetaPdi plan={activePlan} />}</DragOverlay>
    </DndContext>
  );
}

function Columna({
  columna,
  planes,
  puedeArrastrar,
}: {
  columna: { valor: EstadoPdi; etiqueta: string; clase: string };
  planes: Plan[];
  puedeArrastrar: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: columna.valor });

  return (
    <div className="flex-none w-72">
      <div className={cn('flex items-center justify-between rounded-t-xl px-3 py-2 border', columna.clase)}>
        <span className="text-sm font-semibold truncate">{columna.etiqueta}</span>
        <span className="text-xs font-medium rounded-full bg-white/70 px-2 py-0.5">{planes.length}</span>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          'bg-marmol-50 border border-t-0 border-marmol-200 rounded-b-xl p-2 min-h-[120px] space-y-2 transition-colors',
          isOver && 'bg-flow-50'
        )}
      >
        {planes.map((plan) => (
          <TarjetaArrastrable key={plan.id} plan={plan} puedeArrastrar={puedeArrastrar} />
        ))}
        {planes.length === 0 && <p className="text-xs text-marmol-400 text-center py-4">Sin planes</p>}
      </div>
    </div>
  );
}

function TarjetaArrastrable({ plan, puedeArrastrar }: { plan: Plan; puedeArrastrar: boolean }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: plan.id,
    disabled: !puedeArrastrar,
  });
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, opacity: isDragging ? 0.4 : 1, zIndex: isDragging ? 10 : undefined }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={puedeArrastrar ? 'cursor-grab active:cursor-grabbing' : undefined}
      {...(puedeArrastrar ? { ...attributes, ...listeners } : {})}
    >
      <TarjetaPdi plan={plan} />
    </div>
  );
}

function TarjetaPdi({ plan }: { plan: Plan }) {
  const vencido = estaVencido(plan);

  return (
    <div className="card p-3">
      <div className="flex items-center gap-1.5 flex-wrap mb-1">
        <span className={cn('text-[10px] rounded-full px-1.5 py-0.5 font-medium capitalize', ORIGEN_COLOR[plan.origen])}>
          {plan.origen}
        </span>
        {plan.generado_automaticamente && (
          <span
            className="text-[10px] rounded-full px-1.5 py-0.5 font-medium bg-crecimiento/10 text-crecimiento"
            title="Generado automáticamente por el motor de brechas al cerrar la evaluación"
          >
            Automático
          </span>
        )}
      </div>
      <p className="text-sm font-medium text-marmol-800 break-words">{plan.accion}</p>
      <p className="text-xs text-marmol-500 mt-0.5 line-clamp-2">
        {plan.colaborador?.nombre_completo} · {plan.brecha_detectada}
      </p>
      {plan.fecha_compromiso && (
        <span
          className={cn(
            'mt-2 inline-flex items-center gap-1 text-[10px] rounded-full px-1.5 py-0.5 font-medium',
            vencido ? 'badge-bajo' : 'bg-marmol-100 text-marmol-500'
          )}
        >
          <Calendar size={10} /> {formatearFecha(plan.fecha_compromiso)}
        </span>
      )}
    </div>
  );
}
