'use client';

import { useState, useTransition } from 'react';
import { guardarSeccionesManualesRevision } from '@/app/(dashboard)/informes/revision-direccion/actions';
import { Check, PenSquare } from 'lucide-react';

export function SeccionesManuales({
  periodoInicio,
  periodoFin,
  cambiosContextoInicial,
  decisionesInicial,
  puedeEditar,
}: {
  periodoInicio: string;
  periodoFin: string;
  cambiosContextoInicial: string | null;
  decisionesInicial: string | null;
  puedeEditar: boolean;
}) {
  const [cambiosContexto, setCambiosContexto] = useState(cambiosContextoInicial ?? '');
  const [decisiones, setDecisiones] = useState(decisionesInicial ?? '');
  const [pending, startTransition] = useTransition();
  const [guardado, setGuardado] = useState(false);

  function guardar() {
    setGuardado(false);
    startTransition(async () => {
      const res = await guardarSeccionesManualesRevision({ periodoInicio, periodoFin, cambiosContexto, decisiones });
      if (res.ok) setGuardado(true);
    });
  }

  return (
    <div className="card p-5">
      <h2 className="font-display font-semibold text-secundario mb-1 inline-flex items-center gap-2">
        <PenSquare size={16} className="text-flow-600" /> Cambios de contexto y decisiones
      </h2>
      <p className="text-xs text-marmol-400 mb-3">
        Las únicas dos secciones que requieren texto humano — el resto del informe se calculó solo.
      </p>

      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-marmol-600 mb-1">Cambios de contexto (internos y externos)</label>
          <textarea
            value={cambiosContexto}
            onChange={(e) => setCambiosContexto(e.target.value)}
            disabled={!puedeEditar}
            rows={3}
            placeholder="Ej. nuevos requisitos legales, cambios en el mercado, en la estructura organizacional…"
            className="w-full rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm disabled:bg-marmol-50"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-marmol-600 mb-1">Decisiones y acuerdos de la reunión</label>
          <textarea
            value={decisiones}
            onChange={(e) => setDecisiones(e.target.value)}
            disabled={!puedeEditar}
            rows={3}
            placeholder="Ej. recursos aprobados, cambios necesarios en el SGC, oportunidades de mejora priorizadas…"
            className="w-full rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm disabled:bg-marmol-50"
          />
        </div>
        {puedeEditar && (
          <div className="flex items-center gap-3">
            <button onClick={guardar} disabled={pending} className="rounded-lg bg-flow-500 hover:bg-flow-600 disabled:opacity-40 text-white text-sm font-medium px-4 py-2">
              {pending ? 'Guardando…' : 'Guardar'}
            </button>
            {guardado && (
              <p className="text-xs text-alto flex items-center gap-1">
                <Check size={12} /> Guardado
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
