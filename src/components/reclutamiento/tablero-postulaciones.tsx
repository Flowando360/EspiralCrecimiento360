'use client';

import { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
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
  actualizarEtapaPostulacion,
  moverPostulacion,
  actualizarCalificacionPostulacion,
  crearEntrevista,
  actualizarEntrevista,
  crearCandidato,
  postularCandidatoExistente,
} from '@/app/(dashboard)/reclutamiento/actions';
import { CalificacionEstrellas } from '@/components/reclutamiento/calificacion-estrellas';
import { UserPlus, CalendarPlus, ExternalLink, UserCheck, UserX } from 'lucide-react';
import { cn } from '@/lib/utils';

type Entrevista = {
  id: string;
  fecha_hora: string;
  modalidad: string;
  estado: string;
  notas: string | null;
  entrevistador: { id: string; nombre_completo: string } | null;
};

type Postulacion = {
  id: string;
  etapa: string;
  calificacion: number | null;
  notas: string | null;
  descartado_motivo: string | null;
  candidato: { id: string; nombre_completo: string; correo: string | null; telefono: string | null; hoja_vida_url: string | null };
  entrevistas: Entrevista[];
};

// Las 5 columnas visibles del tablero, en el orden pedido. "Contratado" y
// "Descartado" son estados finales del proceso: se manejan con botones
// dentro de la tarjeta (no como columnas aparte) y se listan compactos
// debajo del tablero para no perder el historial.
const COLUMNAS: { etapa: string; titulo: string }[] = [
  { etapa: 'recibido', titulo: 'Postulados' },
  { etapa: 'preseleccionado', titulo: 'Filtrados / Preseleccionados' },
  { etapa: 'entrevista', titulo: 'En Entrevista' },
  { etapa: 'prueba', titulo: 'En Pruebas' },
  { etapa: 'oferta', titulo: 'Oferta' },
];

const campo = 'w-full rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm';

export function TableroPostulaciones({
  vacanteId,
  cargoId,
  postulaciones: postulacionesIniciales,
  colaboradores,
  candidatosDisponibles,
  puedeAdministrar,
  miColaboradorId,
}: {
  vacanteId: string;
  cargoId: string;
  postulaciones: Postulacion[];
  colaboradores: { id: string; nombre_completo: string }[];
  candidatosDisponibles: { id: string; nombre_completo: string; correo: string | null }[];
  puedeAdministrar: boolean;
  miColaboradorId: string | null;
}) {
  const [postulaciones, setPostulaciones] = useState(postulacionesIniciales);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  // AgregarCandidato (y cualquier otro cambio que no pase por un callback
  // local de este componente, como postular uno nuevo) solo actualiza la
  // base de datos y pide un revalidatePath — sin este efecto, el estado
  // local (useState) seguiría mostrando la lista vieja para siempre, porque
  // React no vuelve a leer postulacionesIniciales después del montaje.
  useEffect(() => {
    setPostulaciones(postulacionesIniciales);
  }, [postulacionesIniciales]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const enColumnas = COLUMNAS.map((c) => ({ ...c, items: postulaciones.filter((p) => p.etapa === c.etapa) }));
  const finales = postulaciones.filter((p) => p.etapa === 'contratado' || p.etapa === 'descartado');
  const activo = postulaciones.find((p) => p.id === activeId) ?? null;

  function onDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
  }

  function onDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;

    const etapaDestino = String(over.id);
    if (!COLUMNAS.some((c) => c.etapa === etapaDestino)) return;

    const p = postulaciones.find((x) => x.id === active.id);
    if (!p || p.etapa === etapaDestino) return;

    const nuevas = postulaciones.map((x) => (x.id === p.id ? { ...x, etapa: etapaDestino } : x));
    setPostulaciones(nuevas);
    const idsDestino = nuevas.filter((x) => x.etapa === etapaDestino).map((x) => x.id);
    startTransition(() => {
      moverPostulacion(vacanteId, etapaDestino as any, idsDestino);
    });
  }

  function marcarFinal(id: string, etapa: 'contratado' | 'descartado', motivo?: string) {
    setPostulaciones((prev) => prev.map((p) => (p.id === id ? { ...p, etapa, descartado_motivo: motivo ?? p.descartado_motivo } : p)));
    startTransition(() => {
      actualizarEtapaPostulacion(id, etapa, vacanteId, motivo);
    });
  }

  function cambiarCalificacion(id: string, calificacion: number) {
    setPostulaciones((prev) => prev.map((p) => (p.id === id ? { ...p, calificacion } : p)));
    startTransition(() => {
      actualizarCalificacionPostulacion(id, calificacion, vacanteId);
    });
  }

  return (
    <div className="space-y-4">
      {puedeAdministrar && <AgregarCandidato vacanteId={vacanteId} candidatosDisponibles={candidatosDisponibles} />}

      {postulaciones.length === 0 ? (
        <div className="card p-6 text-sm text-marmol-500">
          Todavía no hay candidatos postulados a esta vacante. Comparte el enlace público de arriba o agrega uno manualmente.
        </div>
      ) : (
        <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
          <div className="flex gap-4 overflow-x-auto pb-4">
            {enColumnas.map((columna) => (
              <Columna
                key={columna.etapa}
                columna={columna}
                vacanteId={vacanteId}
                cargoId={cargoId}
                colaboradores={colaboradores}
                puedeAdministrar={puedeAdministrar}
                miColaboradorId={miColaboradorId}
                onMarcarFinal={marcarFinal}
                onCambiarCalificacion={cambiarCalificacion}
              />
            ))}
          </div>
          <DragOverlay>
            {activo && (
              <TarjetaPostulacion
                postulacion={activo}
                vacanteId={vacanteId}
                cargoId={cargoId}
                colaboradores={colaboradores}
                puedeAdministrar={false}
                miColaboradorId={miColaboradorId}
                onMarcarFinal={() => {}}
                onCambiarCalificacion={() => {}}
              />
            )}
          </DragOverlay>
        </DndContext>
      )}

      {finales.length > 0 && (
        <div className="card p-4">
          <h3 className="text-xs font-medium text-marmol-500 mb-2">Contratados y descartados ({finales.length})</h3>
          <div className="space-y-1.5">
            {finales.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-3 text-sm border-b border-marmol-100 pb-1.5 last:border-0">
                <Link href={`/reclutamiento/candidatos/${p.candidato.id}`} className="text-marmol-700 hover:text-flow-600">
                  {p.candidato.nombre_completo}
                </Link>
                <div className="flex items-center gap-2">
                  {p.etapa === 'contratado' ? (
                    <Link
                      href={`/espiral-crecimiento/colaboradores/nuevo?${new URLSearchParams({
                        nombre: p.candidato.nombre_completo,
                        correo: p.candidato.correo ?? '',
                        telefono: p.candidato.telefono ?? '',
                        cargoId,
                      }).toString()}`}
                      className="text-xs text-alto hover:underline"
                    >
                      Contratado — crear colaborador
                    </Link>
                  ) : (
                    <span className="text-xs text-bajo">Descartado{p.descartado_motivo ? `: ${p.descartado_motivo}` : ''}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Columna({
  columna,
  vacanteId,
  cargoId,
  colaboradores,
  puedeAdministrar,
  miColaboradorId,
  onMarcarFinal,
  onCambiarCalificacion,
}: {
  columna: { etapa: string; titulo: string; items: Postulacion[] };
  vacanteId: string;
  cargoId: string;
  colaboradores: { id: string; nombre_completo: string }[];
  puedeAdministrar: boolean;
  miColaboradorId: string | null;
  onMarcarFinal: (id: string, etapa: 'contratado' | 'descartado', motivo?: string) => void;
  onCambiarCalificacion: (id: string, calificacion: number) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: columna.etapa });

  return (
    <div className="flex-none w-72">
      <div className="flex items-center justify-between rounded-t-xl px-3 py-2 border bg-marmol-100 border-marmol-200">
        <span className="text-sm font-semibold truncate text-marmol-700">{columna.titulo}</span>
        <span className="text-xs font-medium rounded-full bg-white/70 px-2 py-0.5">{columna.items.length}</span>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          'bg-marmol-50 border border-t-0 border-marmol-200 rounded-b-xl p-2 min-h-[140px] space-y-2 transition-colors',
          isOver && 'bg-flow-50'
        )}
      >
        {columna.items.map((p) => (
          <TarjetaArrastrable
            key={p.id}
            postulacion={p}
            vacanteId={vacanteId}
            cargoId={cargoId}
            colaboradores={colaboradores}
            puedeAdministrar={puedeAdministrar}
            miColaboradorId={miColaboradorId}
            onMarcarFinal={onMarcarFinal}
            onCambiarCalificacion={onCambiarCalificacion}
          />
        ))}
        {columna.items.length === 0 && <p className="text-xs text-marmol-400 text-center py-4">Sin candidatos</p>}
      </div>
    </div>
  );
}

function TarjetaArrastrable({
  postulacion,
  puedeAdministrar,
  ...resto
}: {
  postulacion: Postulacion;
  vacanteId: string;
  cargoId: string;
  colaboradores: { id: string; nombre_completo: string }[];
  puedeAdministrar: boolean;
  miColaboradorId: string | null;
  onMarcarFinal: (id: string, etapa: 'contratado' | 'descartado', motivo?: string) => void;
  onCambiarCalificacion: (id: string, calificacion: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: postulacion.id,
    disabled: !puedeAdministrar,
  });
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, opacity: isDragging ? 0.4 : 1, zIndex: isDragging ? 10 : undefined }
    : undefined;

  return (
    <div ref={setNodeRef} style={style} className={puedeAdministrar ? 'cursor-grab active:cursor-grabbing' : undefined} {...(puedeAdministrar ? { ...attributes, ...listeners } : {})}>
      <TarjetaPostulacion postulacion={postulacion} puedeAdministrar={puedeAdministrar} {...resto} />
    </div>
  );
}

function TarjetaPostulacion({
  postulacion,
  vacanteId,
  cargoId,
  colaboradores,
  puedeAdministrar,
  miColaboradorId,
  onMarcarFinal,
  onCambiarCalificacion,
}: {
  postulacion: Postulacion;
  vacanteId: string;
  cargoId: string;
  colaboradores: { id: string; nombre_completo: string }[];
  puedeAdministrar: boolean;
  miColaboradorId: string | null;
  onMarcarFinal: (id: string, etapa: 'contratado' | 'descartado', motivo?: string) => void;
  onCambiarCalificacion: (id: string, calificacion: number) => void;
}) {
  const { candidato } = postulacion;
  const [mostrarEntrevista, setMostrarEntrevista] = useState(false);

  function descartar() {
    const motivo = window.prompt('Motivo del descarte (opcional):') ?? undefined;
    onMarcarFinal(postulacion.id, 'descartado', motivo);
  }

  return (
    <div className="card p-3 space-y-2">
      <div>
        <Link
          href={`/reclutamiento/candidatos/${candidato.id}`}
          onPointerDown={(e) => e.stopPropagation()}
          className="font-medium text-sm text-marmol-800 hover:text-flow-600 flex items-center gap-1"
        >
          {candidato.nombre_completo} <ExternalLink size={11} />
        </Link>
        <p className="text-xs text-marmol-400">{[candidato.correo, candidato.telefono].filter(Boolean).join(' · ') || 'Sin datos de contacto'}</p>
      </div>

      <CalificacionEstrellas
        valor={postulacion.calificacion}
        onCambiar={(v) => onCambiarCalificacion(postulacion.id, v)}
        soloLectura={!puedeAdministrar}
      />

      {postulacion.etapa === 'entrevista' && (
        <div className="pt-2 border-t border-marmol-100" onPointerDown={(e) => e.stopPropagation()}>
          {postulacion.entrevistas.length > 0 && (
            <ul className="space-y-1.5 mb-1.5">
              {postulacion.entrevistas.map((ent) => (
                <FilaEntrevista key={ent.id} entrevista={ent} vacanteId={vacanteId} puedeRegistrar={puedeAdministrar || ent.entrevistador?.id === miColaboradorId} />
              ))}
            </ul>
          )}
          {puedeAdministrar &&
            (mostrarEntrevista ? (
              <FormularioEntrevista postulacionId={postulacion.id} vacanteId={vacanteId} colaboradores={colaboradores} onListo={() => setMostrarEntrevista(false)} />
            ) : (
              <button type="button" onClick={() => setMostrarEntrevista(true)} className="inline-flex items-center gap-1 text-[11px] text-flow-600 hover:text-flow-700 font-medium">
                <CalendarPlus size={12} /> Agendar entrevista
              </button>
            ))}
        </div>
      )}

      {puedeAdministrar && (
        <div className="flex items-center gap-2 pt-2 border-t border-marmol-100" onPointerDown={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => onMarcarFinal(postulacion.id, 'contratado')}
            className="inline-flex items-center gap-1 text-[11px] text-alto hover:underline font-medium"
          >
            <UserCheck size={12} /> Contratar
          </button>
          <button type="button" onClick={descartar} className="inline-flex items-center gap-1 text-[11px] text-bajo hover:underline font-medium">
            <UserX size={12} /> Descartar
          </button>
        </div>
      )}
    </div>
  );
}

function AgregarCandidato({
  vacanteId,
  candidatosDisponibles,
}: {
  vacanteId: string;
  candidatosDisponibles: { id: string; nombre_completo: string; correo: string | null }[];
}) {
  const [modo, setModo] = useState<'existente' | 'nuevo'>(candidatosDisponibles.length > 0 ? 'existente' : 'nuevo');
  const [candidatoId, setCandidatoId] = useState('');
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [telefono, setTelefono] = useState('');
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function agregar() {
    setError(null);
    startTransition(async () => {
      const res =
        modo === 'existente'
          ? await postularCandidatoExistente(candidatoId, vacanteId)
          : await crearCandidato({ nombreCompleto: nombre, correo, telefono }, vacanteId);
      if (res.ok) {
        setCandidatoId('');
        setNombre('');
        setCorreo('');
        setTelefono('');
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <div className="card p-4">
      <div className="flex items-center gap-2 mb-3">
        <UserPlus size={16} className="text-flow-600" />
        <p className="text-sm font-medium text-marmol-700">Agregar candidato a esta vacante</p>
        <div className="ml-auto flex text-xs rounded-lg border border-marmol-200 overflow-hidden">
          <button type="button" onClick={() => setModo('existente')} className={`px-2.5 py-1 ${modo === 'existente' ? 'bg-flow-500 text-white' : 'text-marmol-500'}`}>
            Del banco
          </button>
          <button type="button" onClick={() => setModo('nuevo')} className={`px-2.5 py-1 ${modo === 'nuevo' ? 'bg-flow-500 text-white' : 'text-marmol-500'}`}>
            Nuevo candidato
          </button>
        </div>
      </div>

      {modo === 'existente' ? (
        <div className="flex gap-2">
          <select className={campo} value={candidatoId} onChange={(e) => setCandidatoId(e.target.value)}>
            <option value="">Selecciona un candidato del banco…</option>
            {candidatosDisponibles.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre_completo} {c.correo ? `— ${c.correo}` : ''}
              </option>
            ))}
          </select>
          <button type="button" onClick={agregar} disabled={pending || !candidatoId} className="shrink-0 rounded-lg bg-flow-500 hover:bg-flow-600 disabled:opacity-50 text-white text-sm font-medium px-3 py-1.5">
            Postular
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          <input className={campo} placeholder="Nombre completo" value={nombre} onChange={(e) => setNombre(e.target.value)} />
          <input className={campo} placeholder="Correo (opcional)" value={correo} onChange={(e) => setCorreo(e.target.value)} />
          <div className="flex gap-2">
            <input className={campo} placeholder="Teléfono (opcional)" value={telefono} onChange={(e) => setTelefono(e.target.value)} />
            <button type="button" onClick={agregar} disabled={pending || !nombre.trim()} className="shrink-0 rounded-lg bg-flow-500 hover:bg-flow-600 disabled:opacity-50 text-white text-sm font-medium px-3 py-1.5">
              Agregar
            </button>
          </div>
        </div>
      )}
      {error && <p className="text-xs text-bajo mt-2">{error}</p>}
    </div>
  );
}

function FilaEntrevista({ entrevista, vacanteId, puedeRegistrar }: { entrevista: Entrevista; vacanteId: string; puedeRegistrar: boolean }) {
  const [pending, startTransition] = useTransition();
  const [notas, setNotas] = useState(entrevista.notas ?? '');

  return (
    <li className="text-[11px] bg-marmol-50 rounded-lg px-2 py-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-marmol-600">
          {new Date(entrevista.fecha_hora).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })}
          {entrevista.entrevistador ? ` · ${entrevista.entrevistador.nombre_completo}` : ''}
        </span>
        {puedeRegistrar ? (
          <select
            className="rounded border border-marmol-200 px-1 py-0.5 text-[11px] bg-white"
            defaultValue={entrevista.estado}
            disabled={pending}
            onChange={(e) => startTransition(() => { actualizarEntrevista(entrevista.id, e.target.value as any, notas, vacanteId); })}
          >
            <option value="programada">Programada</option>
            <option value="realizada">Realizada</option>
            <option value="cancelada">Cancelada</option>
          </select>
        ) : (
          <span className="font-medium text-marmol-500 capitalize">{entrevista.estado}</span>
        )}
      </div>
      {puedeRegistrar && (
        <textarea
          className="w-full mt-1 rounded border border-marmol-200 px-1.5 py-1 text-[11px]"
          rows={2}
          placeholder="Notas de la entrevista…"
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          onBlur={() => startTransition(() => { actualizarEntrevista(entrevista.id, entrevista.estado as any, notas, vacanteId); })}
        />
      )}
    </li>
  );
}

function FormularioEntrevista({
  postulacionId,
  vacanteId,
  colaboradores,
  onListo,
}: {
  postulacionId: string;
  vacanteId: string;
  colaboradores: { id: string; nombre_completo: string }[];
  onListo: () => void;
}) {
  const [entrevistadorId, setEntrevistadorId] = useState('');
  const [fechaHora, setFechaHora] = useState('');
  const [modalidad, setModalidad] = useState<'presencial' | 'virtual' | 'telefonica'>('virtual');
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function agendar() {
    setError(null);
    startTransition(async () => {
      const res = await crearEntrevista({ postulacionId, entrevistadorId: entrevistadorId || undefined, fechaHora, modalidad }, vacanteId);
      if (res.ok) onListo();
      else setError(res.error);
    });
  }

  return (
    <div className="space-y-1.5">
      <select className="w-full rounded-lg border border-marmol-200 px-2 py-1 text-[11px]" value={entrevistadorId} onChange={(e) => setEntrevistadorId(e.target.value)}>
        <option value="">Entrevistador…</option>
        {colaboradores.map((c) => (
          <option key={c.id} value={c.id}>
            {c.nombre_completo}
          </option>
        ))}
      </select>
      <input type="datetime-local" className="w-full rounded-lg border border-marmol-200 px-2 py-1 text-[11px]" value={fechaHora} onChange={(e) => setFechaHora(e.target.value)} />
      <select className="w-full rounded-lg border border-marmol-200 px-2 py-1 text-[11px]" value={modalidad} onChange={(e) => setModalidad(e.target.value as any)}>
        <option value="virtual">Virtual</option>
        <option value="presencial">Presencial</option>
        <option value="telefonica">Telefónica</option>
      </select>
      <div className="flex items-center gap-2">
        <button type="button" onClick={agendar} disabled={pending || !fechaHora} className="rounded-lg bg-flow-500 hover:bg-flow-600 disabled:opacity-50 text-white text-[11px] font-medium px-2.5 py-1">
          Agendar
        </button>
        <button type="button" onClick={onListo} className="text-[11px] text-marmol-400 hover:text-marmol-600">
          Cancelar
        </button>
      </div>
      {error && <p className="text-[11px] text-bajo">{error}</p>}
    </div>
  );
}
