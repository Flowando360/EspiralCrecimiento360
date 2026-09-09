'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { asignarCursoACargo, asignarCursoAColaborador } from '@/app/(dashboard)/nexa/formacion/actions';

type Cargo = { id: string; nombre: string };
type Colaborador = { id: string; nombre_completo: string };

export function AsignarCurso({
  cursoId,
  cargos,
  colaboradores,
}: {
  cursoId: string;
  cargos: Cargo[];
  colaboradores: Colaborador[];
}) {
  const router = useRouter();
  const [mostrar, setMostrar] = useState(false);
  const [modo, setModo] = useState<'cargo' | 'colaborador'>('cargo');
  const [cargoId, setCargoId] = useState(cargos[0]?.id ?? '');
  const [nivelRiesgo, setNivelRiesgo] = useState<'alto' | 'medio' | 'bajo'>('medio');
  const [obligatorio, setObligatorio] = useState(true);
  const [colaboradorId, setColaboradorId] = useState(colaboradores[0]?.id ?? '');
  const [fechaLimite, setFechaLimite] = useState('');
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  function asignar() {
    setError(null);
    setOk(false);
    startTransition(async () => {
      const res =
        modo === 'cargo'
          ? await asignarCursoACargo({ cursoId, cargoId, nivelRiesgo, obligatorio })
          : await asignarCursoAColaborador({ cursoId, colaboradorId, fechaLimite: fechaLimite || undefined });

      if (res.ok) {
        setOk(true);
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  }

  if (!mostrar) {
    return (
      <button
        type="button"
        onClick={() => setMostrar(true)}
        className="text-xs font-medium text-flow-600 hover:text-flow-700"
      >
        Asignar
      </button>
    );
  }

  return (
    <div className="text-left bg-marmol-50 border border-marmol-200 rounded-lg p-3 space-y-2 mt-2">
      <div className="flex gap-3 text-xs">
        <label className="flex items-center gap-1">
          <input type="radio" checked={modo === 'cargo'} onChange={() => setModo('cargo')} /> Por cargo
        </label>
        <label className="flex items-center gap-1">
          <input type="radio" checked={modo === 'colaborador'} onChange={() => setModo('colaborador')} /> Por persona
        </label>
      </div>

      {modo === 'cargo' ? (
        <div className="space-y-2">
          <select
            value={cargoId}
            onChange={(e) => setCargoId(e.target.value)}
            className="w-full rounded-lg border border-marmol-200 px-2 py-1.5 text-xs"
          >
            {cargos.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
          <div className="flex gap-2">
            <select
              value={nivelRiesgo}
              onChange={(e) => setNivelRiesgo(e.target.value as typeof nivelRiesgo)}
              className="rounded-lg border border-marmol-200 px-2 py-1.5 text-xs"
            >
              <option value="alto">Riesgo alto</option>
              <option value="medio">Riesgo medio</option>
              <option value="bajo">Riesgo bajo</option>
            </select>
            <label className="flex items-center gap-1 text-xs text-marmol-600">
              <input type="checkbox" checked={obligatorio} onChange={(e) => setObligatorio(e.target.checked)} />
              Obligatorio
            </label>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <select
            value={colaboradorId}
            onChange={(e) => setColaboradorId(e.target.value)}
            className="w-full rounded-lg border border-marmol-200 px-2 py-1.5 text-xs"
          >
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
            className="w-full rounded-lg border border-marmol-200 px-2 py-1.5 text-xs"
          />
        </div>
      )}

      {error && <p className="text-xs text-bajo">{error}</p>}
      {ok && <p className="text-xs text-alto">Asignado.</p>}
      <div className="flex gap-2">
        <button
          type="button"
          disabled={pending || (modo === 'cargo' ? !cargoId : !colaboradorId)}
          onClick={asignar}
          className="rounded-lg bg-flow-500 hover:bg-flow-600 disabled:opacity-40 text-white text-xs font-medium px-3 py-1.5 transition"
        >
          {pending ? 'Asignando…' : 'Confirmar'}
        </button>
        <button
          type="button"
          onClick={() => setMostrar(false)}
          className="rounded-lg border border-marmol-200 text-marmol-500 text-xs font-medium px-3 py-1.5 transition"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}
