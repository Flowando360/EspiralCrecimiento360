'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { registrarParticipante } from '@/app/(dashboard)/nexa/simulacros/actions';
import { Check } from 'lucide-react';

type Colaborador = { id: string; nombre_completo: string };
type ParticipanteActual = { colaboradorId: string; asistio: boolean; calificacionDesempeno: number | null };

function FilaParticipante({
  simulacroId,
  colaborador,
  inicial,
}: {
  simulacroId: string;
  colaborador: Colaborador;
  inicial?: ParticipanteActual;
}) {
  const router = useRouter();
  const [asistio, setAsistio] = useState(inicial?.asistio ?? false);
  const [calificacion, setCalificacion] = useState<string>(
    inicial?.calificacionDesempeno ? String(inicial.calificacionDesempeno) : ''
  );
  const [pending, startTransition] = useTransition();
  const [guardado, setGuardado] = useState(false);

  function guardar() {
    setGuardado(false);
    startTransition(async () => {
      const res = await registrarParticipante({
        simulacroId,
        colaboradorId: colaborador.id,
        asistio,
        calificacionDesempeno: calificacion ? Number(calificacion) : undefined,
      });
      if (res.ok) {
        setGuardado(true);
        router.refresh();
      }
    });
  }

  return (
    <tr className="border-b border-marmol-100 last:border-0">
      <td className="px-4 py-2.5 text-marmol-800">{colaborador.nombre_completo}</td>
      <td className="px-4 py-2.5">
        <input type="checkbox" checked={asistio} onChange={(e) => setAsistio(e.target.checked)} />
      </td>
      <td className="px-4 py-2.5">
        <select
          value={calificacion}
          onChange={(e) => setCalificacion(e.target.value)}
          className="rounded-lg border border-marmol-200 px-2 py-1 text-sm"
        >
          <option value="">—</option>
          {[1, 2, 3, 4, 5].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </td>
      <td className="px-4 py-2.5">
        <button
          type="button"
          onClick={guardar}
          disabled={pending}
          className="inline-flex items-center gap-1 rounded-lg border border-marmol-200 text-xs font-medium text-marmol-600 px-2.5 py-1.5 hover:bg-marmol-50 disabled:opacity-40"
        >
          {guardado ? <Check size={12} className="text-alto" /> : null}
          {pending ? 'Guardando…' : guardado ? 'Guardado' : 'Guardar'}
        </button>
      </td>
    </tr>
  );
}

export function PanelParticipantesSimulacro({
  simulacroId,
  colaboradores,
  participantesActuales,
}: {
  simulacroId: string;
  colaboradores: Colaborador[];
  participantesActuales: ParticipanteActual[];
}) {
  const mapaActuales = new Map(participantesActuales.map((p) => [p.colaboradorId, p]));

  return (
    <div className="card overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-marmol-200 text-left text-xs uppercase tracking-wide text-marmol-400">
            <th className="px-4 py-3 font-medium">Colaborador</th>
            <th className="px-4 py-3 font-medium">Asistió</th>
            <th className="px-4 py-3 font-medium">Valoración</th>
            <th className="px-4 py-3 font-medium"></th>
          </tr>
        </thead>
        <tbody>
          {colaboradores.map((c) => (
            <FilaParticipante key={c.id} simulacroId={simulacroId} colaborador={c} inicial={mapaActuales.get(c.id)} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
