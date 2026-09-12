'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { actualizarSimulacro, eliminarSimulacro } from '@/app/(dashboard)/nexa/simulacros/actions';
import { Pencil, Check, X, Trash2 } from 'lucide-react';

export function EditarSimulacro({
  simulacroId,
  datosIniciales,
}: {
  simulacroId: string;
  datosIniciales: { titulo: string; descripcion: string; fecha: string; participantesEsperados: string };
}) {
  const router = useRouter();
  const [editando, setEditando] = useState(false);
  const [titulo, setTitulo] = useState(datosIniciales.titulo);
  const [descripcion, setDescripcion] = useState(datosIniciales.descripcion);
  const [fecha, setFecha] = useState(datosIniciales.fecha);
  const [participantesEsperados, setParticipantesEsperados] = useState(datosIniciales.participantesEsperados);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function guardar() {
    setError(null);
    startTransition(async () => {
      const res = await actualizarSimulacro({
        simulacroId,
        titulo,
        descripcion,
        fecha,
        participantesEsperados: participantesEsperados.trim() ? Number(participantesEsperados) : undefined,
      });
      if (res.ok) setEditando(false);
      else setError(res.error);
    });
  }

  function cancelar() {
    setTitulo(datosIniciales.titulo);
    setDescripcion(datosIniciales.descripcion);
    setFecha(datosIniciales.fecha);
    setParticipantesEsperados(datosIniciales.participantesEsperados);
    setError(null);
    setEditando(false);
  }

  function eliminar() {
    if (!confirm(`¿Eliminar el simulacro "${datosIniciales.titulo}"? Se borra también la asistencia registrada.`)) return;
    startTransition(async () => {
      const res = await eliminarSimulacro(simulacroId);
      if (res.ok) router.push('/nexa/simulacros');
      else setError(res.error);
    });
  }

  const campo = 'w-full rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm';

  if (!editando) {
    return (
      <div className="flex items-center gap-3 mt-1">
        <button type="button" onClick={() => setEditando(true)} className="inline-flex items-center gap-1 text-xs text-marmol-400 hover:text-flow-600">
          <Pencil size={12} /> Editar
        </button>
        <button type="button" onClick={eliminar} disabled={pending} className="inline-flex items-center gap-1 text-xs text-marmol-400 hover:text-bajo disabled:opacity-40">
          <Trash2 size={12} /> Eliminar
        </button>
        {error && <p className="text-xs text-bajo">{error}</p>}
      </div>
    );
  }

  return (
    <div className="card p-4 space-y-2 max-w-lg mt-2">
      <input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Título" className={campo} />
      <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Descripción" rows={2} className={campo} />
      <div className="grid grid-cols-2 gap-2">
        <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className={campo} />
        <input type="number" min={0} value={participantesEsperados} onChange={(e) => setParticipantesEsperados(e.target.value)} placeholder="Participantes esperados" className={campo} />
      </div>
      {error && <p className="text-xs text-bajo">{error}</p>}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={guardar}
          disabled={pending || !titulo.trim()}
          className="inline-flex items-center gap-1 rounded-lg bg-flow-500 hover:bg-flow-600 disabled:opacity-40 text-white text-xs font-medium px-2.5 py-1.5"
        >
          <Check size={12} /> {pending ? 'Guardando…' : 'Guardar'}
        </button>
        <button type="button" onClick={cancelar} disabled={pending} className="inline-flex items-center gap-1 rounded-lg border border-marmol-200 text-marmol-600 hover:bg-marmol-100 text-xs font-medium px-2.5 py-1.5">
          <X size={12} /> Cancelar
        </button>
      </div>
    </div>
  );
}
