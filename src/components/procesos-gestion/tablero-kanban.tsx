'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  closestCorners,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Plus, X, Settings2, Trash2, User, Calendar, GripVertical, Pencil } from 'lucide-react';
import { cn, formatearFecha } from '@/lib/utils';
import {
  crearEtapa,
  crearEtapasPorDefecto,
  actualizarEtapa,
  eliminarEtapa,
  reordenarEtapas,
  crearCaso,
  actualizarCaso,
  moverCaso,
  eliminarCaso,
} from '@/app/(dashboard)/procesos-gestion/[id]/tablero/actions';

type Color = 'flow' | 'saber' | 'hacer' | 'deber' | 'alto' | 'medio' | 'bajo' | 'marmol';

interface Etapa {
  id: string;
  nombre: string;
  color: Color;
  orden: number;
}

interface Caso {
  id: string;
  etapa_id: string;
  titulo: string;
  descripcion: string | null;
  responsable_id: string | null;
  prioridad: 'baja' | 'media' | 'alta';
  fecha_limite: string | null;
  orden: number;
}

interface Colaborador {
  id: string;
  nombre_completo: string;
}

const COLORES: Color[] = ['flow', 'saber', 'hacer', 'deber', 'alto', 'medio', 'bajo', 'marmol'];

const ETIQUETA_COLOR: Record<Color, string> = {
  flow: 'Violeta',
  saber: 'Verde azulado',
  hacer: 'Naranja',
  deber: 'Azul',
  alto: 'Verde',
  medio: 'Ámbar',
  bajo: 'Rojo',
  marmol: 'Gris',
};

const CLASE_BADGE_COLOR: Record<Color, string> = {
  flow: 'badge-flow',
  saber: 'badge-saber',
  hacer: 'badge-hacer',
  deber: 'badge-deber',
  alto: 'badge-alto',
  medio: 'badge-medio',
  bajo: 'badge-bajo',
  marmol: 'badge-marmol',
};

const CLASE_PRIORIDAD: Record<Caso['prioridad'], string> = {
  alta: 'badge-bajo',
  media: 'badge-medio',
  baja: 'badge-alto',
};

function estaVencido(fechaLimite: string | null): boolean {
  if (!fechaLimite) return false;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  return new Date(fechaLimite) < hoy;
}

export function TableroKanban({
  procesoId,
  etapasIniciales,
  casosIniciales,
  colaboradores,
  puedeEditar,
}: {
  procesoId: string;
  etapasIniciales: Etapa[];
  casosIniciales: Caso[];
  colaboradores: Colaborador[];
  puedeEditar: boolean;
}) {
  const [etapas, setEtapas] = useState(etapasIniciales);
  const [casos, setCasos] = useState(casosIniciales);
  const [activeCasoId, setActiveCasoId] = useState<string | null>(null);
  const [modalCaso, setModalCaso] = useState<{ etapaId: string; caso: Caso | null } | null>(null);
  const [panelEtapas, setPanelEtapas] = useState(false);
  const [, startTransition] = useTransition();
  const router = useRouter();

  const nombreColaborador = useMemo(() => {
    const mapa = new Map(colaboradores.map((c) => [c.id, c.nombre_completo]));
    return (id: string | null) => (id ? mapa.get(id) ?? '—' : null);
  }, [colaboradores]);

  const casosPorEtapa = useMemo(() => {
    const mapa = new Map<string, Caso[]>();
    for (const etapa of etapas) mapa.set(etapa.id, []);
    for (const caso of [...casos].sort((a, b) => a.orden - b.orden)) {
      mapa.get(caso.etapa_id)?.push(caso);
    }
    return mapa;
  }, [etapas, casos]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const activeCaso = casos.find((c) => c.id === activeCasoId) ?? null;

  function onDragStart(e: DragStartEvent) {
    setActiveCasoId(String(e.active.id));
  }

  function onDragEnd(e: DragEndEvent) {
    setActiveCasoId(null);
    const { active, over } = e;
    if (!over) return;

    const casoActivo = casos.find((c) => c.id === active.id);
    if (!casoActivo) return;

    // El destino puede ser una tarjeta (over.id = casoId) o una columna vacía (over.id = etapaId)
    const casoDestino = casos.find((c) => c.id === over.id);
    const etapaDestinoId = casoDestino ? casoDestino.etapa_id : String(over.id);
    if (!etapas.some((e2) => e2.id === etapaDestinoId)) return;

    const idsOrigen = (casosPorEtapa.get(casoActivo.etapa_id) ?? []).map((c) => c.id);
    const idsDestinoActual = (casosPorEtapa.get(etapaDestinoId) ?? []).map((c) => c.id);

    let idsDestinoNuevo: string[];
    if (casoActivo.etapa_id === etapaDestinoId) {
      const desde = idsDestinoActual.indexOf(casoActivo.id);
      const hasta = casoDestino ? idsDestinoActual.indexOf(casoDestino.id) : idsDestinoActual.length - 1;
      if (desde === -1 || desde === hasta) return;
      idsDestinoNuevo = arrayMove(idsDestinoActual, desde, hasta);
    } else {
      idsDestinoNuevo = idsDestinoActual.filter((id) => id !== casoActivo.id);
      const posicion = casoDestino ? idsDestinoNuevo.indexOf(casoDestino.id) : idsDestinoNuevo.length;
      idsDestinoNuevo.splice(posicion, 0, casoActivo.id);
    }

    setCasos((prev) => {
      const siguiente = prev.map((c) => (c.id === casoActivo.id ? { ...c, etapa_id: etapaDestinoId } : c));
      idsDestinoNuevo.forEach((id, orden) => {
        const c = siguiente.find((x) => x.id === id);
        if (c) c.orden = orden;
      });
      return siguiente;
    });

    startTransition(async () => {
      await moverCaso(procesoId, etapaDestinoId, idsDestinoNuevo);
      void idsOrigen;
    });
  }

  async function crearTableroPorDefecto() {
    const res = await crearEtapasPorDefecto(procesoId);
    if (res.ok) router.refresh();
  }

  function guardarCaso(datos: {
    titulo: string;
    descripcion: string;
    responsableId: string;
    prioridad: Caso['prioridad'];
    fechaLimite: string;
    etapaId: string;
  }) {
    if (!modalCaso) return;
    const editando = modalCaso.caso;

    if (editando) {
      setCasos((prev) =>
        prev.map((c) =>
          c.id === editando.id
            ? {
                ...c,
                titulo: datos.titulo,
                descripcion: datos.descripcion || null,
                responsable_id: datos.responsableId || null,
                prioridad: datos.prioridad,
                fecha_limite: datos.fechaLimite || null,
                etapa_id: datos.etapaId,
              }
            : c
        )
      );
      startTransition(async () => {
        await actualizarCaso(procesoId, editando.id, {
          etapaId: datos.etapaId,
          titulo: datos.titulo,
          descripcion: datos.descripcion,
          responsableId: datos.responsableId,
          prioridad: datos.prioridad,
          fechaLimite: datos.fechaLimite,
        });
      });
    } else {
      startTransition(async () => {
        const res = await crearCaso(procesoId, {
          etapaId: datos.etapaId,
          titulo: datos.titulo,
          descripcion: datos.descripcion,
          responsableId: datos.responsableId,
          prioridad: datos.prioridad,
          fechaLimite: datos.fechaLimite,
        });
        if (res.ok) {
          setCasos((prev) => [
            ...prev,
            {
              id: res.id,
              etapa_id: datos.etapaId,
              titulo: datos.titulo,
              descripcion: datos.descripcion || null,
              responsable_id: datos.responsableId || null,
              prioridad: datos.prioridad,
              fecha_limite: datos.fechaLimite || null,
              orden: (casosPorEtapa.get(datos.etapaId)?.length ?? 0) + 1,
            },
          ]);
        }
      });
    }
    setModalCaso(null);
  }

  function borrarCaso(casoId: string) {
    setCasos((prev) => prev.filter((c) => c.id !== casoId));
    startTransition(async () => {
      await eliminarCaso(procesoId, casoId);
    });
  }

  if (etapas.length === 0) {
    return (
      <div className="card flex flex-col items-center justify-center gap-3 py-16 text-center">
        <p className="text-sm font-medium text-marmol-700">Este proceso todavía no tiene tablero.</p>
        <p className="text-xs text-marmol-400 max-w-sm">
          Crea las etapas (columnas) por las que se va a mover cada caso de este proceso. Puedes empezar con las
          etapas típicas y renombrarlas después.
        </p>
        {puedeEditar && (
          <button
            onClick={crearTableroPorDefecto}
            className="inline-flex items-center gap-1.5 rounded-lg bg-flow-500 hover:bg-flow-600 text-white text-sm font-medium px-4 py-2 mt-1"
          >
            <Plus size={15} /> Crear tablero con etapas por defecto
          </button>
        )}
      </div>
    );
  }

  return (
    <div>
      {puedeEditar && (
        <div className="flex justify-end mb-3">
          <button
            onClick={() => setPanelEtapas(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-marmol-200 hover:bg-marmol-50 text-marmol-600 text-sm font-medium px-3 py-1.5"
          >
            <Settings2 size={14} /> Configurar etapas
          </button>
        </div>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {[...etapas]
            .sort((a, b) => a.orden - b.orden)
            .map((etapa) => (
              <Columna
                key={etapa.id}
                etapa={etapa}
                casos={casosPorEtapa.get(etapa.id) ?? []}
                nombreColaborador={nombreColaborador}
                puedeEditar={puedeEditar}
                onAgregar={() => setModalCaso({ etapaId: etapa.id, caso: null })}
                onEditar={(caso) => setModalCaso({ etapaId: caso.etapa_id, caso })}
                onEliminar={borrarCaso}
              />
            ))}
        </div>

        <DragOverlay>
          {activeCaso && (
            <TarjetaCaso
              caso={activeCaso}
              responsable={nombreColaborador(activeCaso.responsable_id)}
              puedeEditar={false}
              onEditar={() => {}}
              onEliminar={() => {}}
            />
          )}
        </DragOverlay>
      </DndContext>

      {modalCaso && (
        <ModalCaso
          etapas={etapas}
          colaboradores={colaboradores}
          etapaId={modalCaso.etapaId}
          caso={modalCaso.caso}
          onCerrar={() => setModalCaso(null)}
          onGuardar={guardarCaso}
        />
      )}

      {panelEtapas && (
        <PanelEtapas procesoId={procesoId} etapas={etapas} setEtapas={setEtapas} onCerrar={() => setPanelEtapas(false)} />
      )}
    </div>
  );
}

function Columna({
  etapa,
  casos,
  nombreColaborador,
  puedeEditar,
  onAgregar,
  onEditar,
  onEliminar,
}: {
  etapa: Etapa;
  casos: Caso[];
  nombreColaborador: (id: string | null) => string | null | undefined;
  puedeEditar: boolean;
  onAgregar: () => void;
  onEditar: (caso: Caso) => void;
  onEliminar: (id: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: etapa.id });

  return (
    <div className="flex-none w-72">
      <div className={cn('flex items-center justify-between rounded-t-xl px-3 py-2 border', CLASE_BADGE_COLOR[etapa.color])}>
        <span className="text-sm font-semibold truncate">{etapa.nombre}</span>
        <span className="text-xs font-medium rounded-full bg-white/70 px-2 py-0.5">{casos.length}</span>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          'bg-marmol-50 border border-t-0 border-marmol-200 rounded-b-xl p-2 min-h-[120px] space-y-2 transition-colors',
          isOver && 'bg-flow-50'
        )}
      >
        <SortableContext items={casos.map((c) => c.id)} strategy={verticalListSortingStrategy}>
          {casos.map((caso) => (
            <TarjetaCasoOrdenable
              key={caso.id}
              caso={caso}
              responsable={nombreColaborador(caso.responsable_id)}
              puedeEditar={puedeEditar}
              onEditar={() => onEditar(caso)}
              onEliminar={() => onEliminar(caso.id)}
            />
          ))}
        </SortableContext>
        {casos.length === 0 && <p className="text-xs text-marmol-400 text-center py-4">Sin tarjetas</p>}
        {puedeEditar && (
          <button
            onClick={onAgregar}
            className="w-full flex items-center justify-center gap-1 text-xs text-marmol-500 hover:text-flow-600 hover:bg-white rounded-lg py-2 border border-dashed border-marmol-300"
          >
            <Plus size={13} /> Agregar tarjeta
          </button>
        )}
      </div>
    </div>
  );
}

function TarjetaCasoOrdenable({
  caso,
  responsable,
  puedeEditar,
  onEditar,
  onEliminar,
}: {
  caso: Caso;
  responsable: string | null | undefined;
  puedeEditar: boolean;
  onEditar: () => void;
  onEliminar: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: caso.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 };

  return (
    <div ref={setNodeRef} style={style}>
      <TarjetaCaso
        caso={caso}
        responsable={responsable}
        puedeEditar={puedeEditar}
        onEditar={onEditar}
        onEliminar={onEliminar}
        dragHandleProps={puedeEditar ? { ...attributes, ...listeners } : undefined}
      />
    </div>
  );
}

function TarjetaCaso({
  caso,
  responsable,
  puedeEditar,
  onEditar,
  onEliminar,
  dragHandleProps,
}: {
  caso: Caso;
  responsable: string | null | undefined;
  puedeEditar: boolean;
  onEditar: () => void;
  onEliminar: () => void;
  dragHandleProps?: Record<string, any>;
}) {
  const vencido = estaVencido(caso.fecha_limite);

  return (
    <div className="card p-3 group">
      <div className="flex items-start gap-1.5">
        {puedeEditar && dragHandleProps && (
          <button {...dragHandleProps} className="mt-0.5 text-marmol-300 hover:text-marmol-500 cursor-grab active:cursor-grabbing">
            <GripVertical size={14} />
          </button>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-marmol-800 break-words">{caso.titulo}</p>
          {caso.descripcion && <p className="text-xs text-marmol-500 mt-0.5 line-clamp-2">{caso.descripcion}</p>}

          <div className="flex items-center gap-1.5 flex-wrap mt-2">
            <span className={cn('text-[10px] rounded-full px-1.5 py-0.5 font-medium', CLASE_PRIORIDAD[caso.prioridad])}>
              {caso.prioridad}
            </span>
            {caso.fecha_limite && (
              <span
                className={cn(
                  'text-[10px] rounded-full px-1.5 py-0.5 font-medium inline-flex items-center gap-1',
                  vencido ? 'badge-bajo' : 'bg-marmol-100 text-marmol-500'
                )}
              >
                <Calendar size={10} /> {formatearFecha(caso.fecha_limite)}
              </span>
            )}
          </div>

          {responsable && (
            <p className="text-xs text-marmol-500 mt-1.5 inline-flex items-center gap-1">
              <User size={11} /> {responsable}
            </p>
          )}
        </div>

        {puedeEditar && (
          <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={onEditar} className="text-marmol-300 hover:text-flow-600">
              <Pencil size={13} />
            </button>
            <button onClick={onEliminar} className="text-marmol-300 hover:text-bajo">
              <Trash2 size={13} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function ModalCaso({
  etapas,
  colaboradores,
  etapaId,
  caso,
  onCerrar,
  onGuardar,
}: {
  etapas: Etapa[];
  colaboradores: Colaborador[];
  etapaId: string;
  caso: Caso | null;
  onCerrar: () => void;
  onGuardar: (datos: {
    titulo: string;
    descripcion: string;
    responsableId: string;
    prioridad: Caso['prioridad'];
    fechaLimite: string;
    etapaId: string;
  }) => void;
}) {
  const [titulo, setTitulo] = useState(caso?.titulo ?? '');
  const [descripcion, setDescripcion] = useState(caso?.descripcion ?? '');
  const [responsableId, setResponsableId] = useState(caso?.responsable_id ?? '');
  const [prioridad, setPrioridad] = useState<Caso['prioridad']>(caso?.prioridad ?? 'media');
  const [fechaLimite, setFechaLimite] = useState(caso?.fecha_limite ?? '');
  const [etapaSeleccionada, setEtapaSeleccionada] = useState(etapaId);
  const [error, setError] = useState<string | null>(null);

  function guardar() {
    if (!titulo.trim()) {
      setError('El título es requerido');
      return;
    }
    onGuardar({ titulo, descripcion, responsableId, prioridad, fechaLimite, etapaId: etapaSeleccionada });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30" onClick={onCerrar} />
      <div className="relative w-full max-w-md bg-white rounded-xl shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-marmol-100">
          <h2 className="font-display font-semibold text-secundario">{caso ? 'Editar tarjeta' : 'Nueva tarjeta'}</h2>
          <button onClick={onCerrar} className="text-marmol-400 hover:text-marmol-700">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-3">
          <input
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Título del caso"
            className="w-full rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm"
            autoFocus
          />
          <textarea
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Descripción (opcional)"
            rows={2}
            className="w-full rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm"
          />
          <div className="grid grid-cols-2 gap-2">
            <select
              value={etapaSeleccionada}
              onChange={(e) => setEtapaSeleccionada(e.target.value)}
              className="rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm"
            >
              {[...etapas]
                .sort((a, b) => a.orden - b.orden)
                .map((et) => (
                  <option key={et.id} value={et.id}>
                    {et.nombre}
                  </option>
                ))}
            </select>
            <select
              value={prioridad}
              onChange={(e) => setPrioridad(e.target.value as Caso['prioridad'])}
              className="rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm"
            >
              <option value="baja">Prioridad baja</option>
              <option value="media">Prioridad media</option>
              <option value="alta">Prioridad alta</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <select
              value={responsableId}
              onChange={(e) => setResponsableId(e.target.value)}
              className="rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm"
            >
              <option value="">Sin responsable</option>
              {colaboradores.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre_completo}
                </option>
              ))}
            </select>
            <input
              type="date"
              value={fechaLimite}
              onChange={(e) => setFechaLimite(e.target.value)}
              className="rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm"
            />
          </div>
          {error && <p className="text-sm text-bajo">{error}</p>}
        </div>

        <div className="flex justify-end gap-2 px-5 py-4 border-t border-marmol-100">
          <button onClick={onCerrar} className="rounded-lg px-3 py-1.5 text-sm text-marmol-600 hover:bg-marmol-50">
            Cancelar
          </button>
          <button
            onClick={guardar}
            className="rounded-lg bg-flow-500 hover:bg-flow-600 text-white text-sm font-medium px-4 py-1.5"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}

function PanelEtapas({
  procesoId,
  etapas,
  setEtapas,
  onCerrar,
}: {
  procesoId: string;
  etapas: Etapa[];
  setEtapas: React.Dispatch<React.SetStateAction<Etapa[]>>;
  onCerrar: () => void;
}) {
  const [nombreNuevo, setNombreNuevo] = useState('');
  const [colorNuevo, setColorNuevo] = useState<Color>('flow');
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const ordenadas = [...etapas].sort((a, b) => a.orden - b.orden);

  function agregar() {
    if (!nombreNuevo.trim()) return;
    setError(null);
    startTransition(async () => {
      const res = await crearEtapa(procesoId, ordenadas.length, { nombre: nombreNuevo, color: colorNuevo });
      if (res.ok) {
        setEtapas((prev) => [...prev, { id: res.id, nombre: nombreNuevo, color: colorNuevo, orden: ordenadas.length }]);
        setNombreNuevo('');
      } else {
        setError(res.error);
      }
    });
  }

  function renombrar(etapa: Etapa, nombre: string, color: Color) {
    setEtapas((prev) => prev.map((e) => (e.id === etapa.id ? { ...e, nombre, color } : e)));
    startTransition(async () => {
      await actualizarEtapa(procesoId, etapa.id, { nombre, color });
    });
  }

  function mover(etapa: Etapa, direccion: -1 | 1) {
    const idx = ordenadas.findIndex((e) => e.id === etapa.id);
    const destino = idx + direccion;
    if (destino < 0 || destino >= ordenadas.length) return;
    const nuevas = [...ordenadas];
    const temp = nuevas[idx]!;
    nuevas[idx] = nuevas[destino]!;
    nuevas[destino] = temp;
    const conOrden = nuevas.map((e, i) => ({ ...e, orden: i }));
    setEtapas(conOrden);
    startTransition(async () => {
      await reordenarEtapas(procesoId, conOrden.map((e) => e.id));
    });
  }

  function borrar(etapa: Etapa) {
    setError(null);
    startTransition(async () => {
      const res = await eliminarEtapa(procesoId, etapa.id);
      if (res.ok) {
        setEtapas((prev) => prev.filter((e) => e.id !== etapa.id));
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30" onClick={onCerrar} />
      <div className="relative w-full max-w-lg bg-white rounded-xl shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-marmol-100">
          <h2 className="font-display font-semibold text-secundario">Configurar etapas del tablero</h2>
          <button onClick={onCerrar} className="text-marmol-400 hover:text-marmol-700">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-2 max-h-[60vh] overflow-y-auto">
          {ordenadas.map((etapa, i) => (
            <div key={etapa.id} className="flex items-center gap-2 border-b border-marmol-100 pb-2">
              <div className="flex flex-col">
                <button
                  onClick={() => mover(etapa, -1)}
                  disabled={i === 0}
                  className="text-marmol-300 hover:text-flow-600 disabled:opacity-20 text-xs leading-none"
                >
                  ▲
                </button>
                <button
                  onClick={() => mover(etapa, 1)}
                  disabled={i === ordenadas.length - 1}
                  className="text-marmol-300 hover:text-flow-600 disabled:opacity-20 text-xs leading-none"
                >
                  ▼
                </button>
              </div>
              <input
                value={etapa.nombre}
                onChange={(e) => renombrar(etapa, e.target.value, etapa.color)}
                className="flex-1 rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm"
              />
              <select
                value={etapa.color}
                onChange={(e) => renombrar(etapa, etapa.nombre, e.target.value as Color)}
                className="rounded-lg border border-marmol-200 px-2 py-1.5 text-xs"
              >
                {COLORES.map((c) => (
                  <option key={c} value={c}>
                    {ETIQUETA_COLOR[c]}
                  </option>
                ))}
              </select>
              <button onClick={() => borrar(etapa)} className="text-marmol-300 hover:text-bajo">
                <Trash2 size={14} />
              </button>
            </div>
          ))}

          <div className="flex gap-2 pt-2">
            <input
              value={nombreNuevo}
              onChange={(e) => setNombreNuevo(e.target.value)}
              placeholder="Nueva etapa"
              className="flex-1 rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm"
            />
            <select
              value={colorNuevo}
              onChange={(e) => setColorNuevo(e.target.value as Color)}
              className="rounded-lg border border-marmol-200 px-2 py-1.5 text-xs"
            >
              {COLORES.map((c) => (
                <option key={c} value={c}>
                  {ETIQUETA_COLOR[c]}
                </option>
              ))}
            </select>
            <button
              onClick={agregar}
              disabled={!nombreNuevo.trim()}
              className="inline-flex items-center gap-1 rounded-lg bg-flow-500 hover:bg-flow-600 disabled:opacity-40 text-white text-sm font-medium px-3 py-1.5"
            >
              <Plus size={14} />
            </button>
          </div>
          {error && <p className="text-sm text-bajo">{error}</p>}
        </div>

        <div className="flex justify-end px-5 py-4 border-t border-marmol-100">
          <button onClick={onCerrar} className="rounded-lg bg-flow-500 hover:bg-flow-600 text-white text-sm font-medium px-4 py-1.5">
            Listo
          </button>
        </div>
      </div>
    </div>
  );
}
