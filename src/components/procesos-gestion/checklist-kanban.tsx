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
import {
  crearChecklistItem,
  eliminarChecklistItem,
  actualizarEstadoChecklist,
} from '@/app/(dashboard)/procesos-gestion/actions';
import { createClient } from '@/lib/supabase/client';
import { Trash2, Plus, Paperclip } from 'lucide-react';
import { cn } from '@/lib/utils';

type MarcoNormativo = 'iso_9001' | 'sarlaft_sagrilaft' | 'ptee';
type EstadoChecklist = 'cumple' | 'cumple_parcial' | 'no_cumple' | 'no_aplica';

const ETIQUETA_MARCO: Record<MarcoNormativo, string> = {
  iso_9001: 'ISO 9001',
  sarlaft_sagrilaft: 'SARLAFT/SAGRILAFT',
  ptee: 'PTEE',
};

const COLUMNAS: { valor: EstadoChecklist; etiqueta: string; clase: string }[] = [
  { valor: 'no_cumple', etiqueta: 'No cumple', clase: 'badge-bajo' },
  { valor: 'cumple_parcial', etiqueta: 'Cumple parcial', clase: 'badge-medio' },
  { valor: 'cumple', etiqueta: 'Cumple', clase: 'badge-alto' },
  { valor: 'no_aplica', etiqueta: 'No aplica', clase: 'badge-marmol' },
];

interface ChecklistItem {
  id: string;
  marco_normativo: MarcoNormativo;
  item: string;
  descripcion: string | null;
  estado: EstadoChecklist;
  evidencia_url: string | null;
}

export function ChecklistKanban({
  itemsIniciales,
  puedeEditar,
  empresaId,
}: {
  itemsIniciales: ChecklistItem[];
  puedeEditar: boolean;
  empresaId: string;
}) {
  const [items, setItems] = useState(itemsIniciales);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [filtroMarco, setFiltroMarco] = useState<'todos' | MarcoNormativo>('todos');

  const [marcoNormativo, setMarcoNormativo] = useState<MarcoNormativo>('iso_9001');
  const [item, setItem] = useState('');
  const [subiendo, setSubiendo] = useState(false);
  const [evidenciaUrl, setEvidenciaUrl] = useState<string | null>(null);
  const [evidenciaNombre, setEvidenciaNombre] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const itemsFiltrados = useMemo(
    () => (filtroMarco === 'todos' ? items : items.filter((i) => i.marco_normativo === filtroMarco)),
    [items, filtroMarco]
  );

  const activeItem = items.find((i) => i.id === activeId) ?? null;

  function onDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
  }

  function onDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;

    const nuevoEstado = String(over.id) as EstadoChecklist;
    if (!COLUMNAS.some((c) => c.valor === nuevoEstado)) return;

    const it = items.find((i) => i.id === active.id);
    if (!it || it.estado === nuevoEstado) return;

    setItems((prev) => prev.map((i) => (i.id === it.id ? { ...i, estado: nuevoEstado } : i)));
    startTransition(async () => {
      await actualizarEstadoChecklist(it.id, nuevoEstado);
    });
  }

  async function subirEvidencia(e: React.ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    setSubiendo(true);
    setError(null);
    const ruta = `${empresaId}/${Date.now()}-${archivo.name}`;
    const supabase = createClient();
    const { error: uploadError } = await supabase.storage.from('evidencia-procesos').upload(ruta, archivo);
    setSubiendo(false);
    if (uploadError) {
      setError(`Error subiendo evidencia: ${uploadError.message}`);
      return;
    }
    setEvidenciaUrl(ruta);
    setEvidenciaNombre(archivo.name);
  }

  function agregar() {
    setError(null);
    startTransition(async () => {
      const res = await crearChecklistItem({
        marcoNormativo,
        item,
        estado: 'no_cumple',
        evidenciaUrl: evidenciaUrl ?? undefined,
      });
      if (res.ok) {
        setItems((prev) => [
          ...prev,
          { id: res.id, marco_normativo: marcoNormativo, item, descripcion: null, estado: 'no_cumple', evidencia_url: evidenciaUrl },
        ]);
        setItem('');
        setEvidenciaUrl(null);
        setEvidenciaNombre(null);
      } else {
        setError(res.error);
      }
    });
  }

  function eliminar(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
    startTransition(async () => {
      await eliminarChecklistItem(id);
    });
  }

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
        <div>
          <h2 className="font-display font-semibold text-secundario mb-1">Checklist de cumplimiento</h2>
          <p className="text-xs text-marmol-400">
            Base directa del paquete de evidencia de auditoría (ISO 9001, SARLAFT/SAGRILAFT, PTEE).
          </p>
        </div>
        <select
          value={filtroMarco}
          onChange={(e) => setFiltroMarco(e.target.value as typeof filtroMarco)}
          className="rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm"
        >
          <option value="todos">Todos los marcos</option>
          {Object.entries(ETIQUETA_MARCO).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
      </div>

      <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {COLUMNAS.map((columna) => (
            <Columna
              key={columna.valor}
              columna={columna}
              items={itemsFiltrados.filter((i) => i.estado === columna.valor)}
              puedeEditar={puedeEditar}
              onEliminar={eliminar}
            />
          ))}
        </div>

        <DragOverlay>{activeItem && <TarjetaChecklist item={activeItem} puedeEditar={false} onEliminar={() => {}} />}</DragOverlay>
      </DndContext>

      {puedeEditar && (
        <div className="space-y-2 border-t border-marmol-100 pt-3 mt-3">
          <div className="flex gap-2">
            <select
              value={marcoNormativo}
              onChange={(e) => setMarcoNormativo(e.target.value as MarcoNormativo)}
              className="rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm"
            >
              {Object.entries(ETIQUETA_MARCO).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
            <input
              value={item}
              onChange={(e) => setItem(e.target.value)}
              placeholder="Ítem del checklist"
              className="flex-1 rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm"
            />
          </div>
          <div>
            <input type="file" onChange={subirEvidencia} disabled={subiendo} className="text-xs text-marmol-500" />
            {subiendo && <p className="text-xs text-marmol-400 mt-1">Subiendo…</p>}
            {evidenciaNombre && <p className="text-xs text-marmol-600 mt-1">Adjunto: {evidenciaNombre}</p>}
          </div>
          <button
            onClick={agregar}
            disabled={!item.trim() || subiendo}
            className="inline-flex items-center gap-1 rounded-lg bg-flow-500 hover:bg-flow-600 disabled:opacity-40 text-white text-sm font-medium px-3 py-1.5"
          >
            <Plus size={14} /> Agregar
          </button>
          {error && <p className="text-sm text-bajo">{error}</p>}
        </div>
      )}
    </div>
  );
}

function Columna({
  columna,
  items,
  puedeEditar,
  onEliminar,
}: {
  columna: { valor: EstadoChecklist; etiqueta: string; clase: string };
  items: ChecklistItem[];
  puedeEditar: boolean;
  onEliminar: (id: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: columna.valor });

  return (
    <div className="flex-none w-64">
      <div className={cn('flex items-center justify-between rounded-t-xl px-3 py-2 border', columna.clase)}>
        <span className="text-sm font-semibold truncate">{columna.etiqueta}</span>
        <span className="text-xs font-medium rounded-full bg-white/70 px-2 py-0.5">{items.length}</span>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          'bg-marmol-50 border border-t-0 border-marmol-200 rounded-b-xl p-2 min-h-[120px] space-y-2 transition-colors',
          isOver && 'bg-flow-50'
        )}
      >
        {items.map((i) => (
          <TarjetaArrastrable key={i.id} item={i} puedeEditar={puedeEditar} onEliminar={onEliminar} />
        ))}
        {items.length === 0 && <p className="text-xs text-marmol-400 text-center py-4">Sin ítems</p>}
      </div>
    </div>
  );
}

function TarjetaArrastrable({
  item,
  puedeEditar,
  onEliminar,
}: {
  item: ChecklistItem;
  puedeEditar: boolean;
  onEliminar: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: item.id,
    disabled: !puedeEditar,
  });
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, opacity: isDragging ? 0.4 : 1, zIndex: isDragging ? 10 : undefined }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={puedeEditar ? 'cursor-grab active:cursor-grabbing' : undefined}
      {...(puedeEditar ? { ...attributes, ...listeners } : {})}
    >
      <TarjetaChecklist item={item} puedeEditar={puedeEditar} onEliminar={onEliminar} />
    </div>
  );
}

function TarjetaChecklist({
  item,
  puedeEditar,
  onEliminar,
}: {
  item: ChecklistItem;
  puedeEditar: boolean;
  onEliminar: (id: string) => void;
}) {
  return (
    <div className="card p-3 group">
      <div className="flex items-start justify-between gap-1.5">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] rounded-full bg-flow-50 text-flow-700 px-1.5 py-0.5 font-medium">
              {ETIQUETA_MARCO[item.marco_normativo]}
            </span>
            {item.evidencia_url && (
              <span className="text-[10px] text-marmol-400 inline-flex items-center gap-1">
                <Paperclip size={10} /> Evidencia
              </span>
            )}
          </div>
          <p className="text-sm font-medium text-marmol-800 mt-1 break-words">{item.item}</p>
        </div>
        {puedeEditar && (
          <button
            onClick={() => onEliminar(item.id)}
            className="shrink-0 text-marmol-300 hover:text-bajo opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>
    </div>
  );
}
