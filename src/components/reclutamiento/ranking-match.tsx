'use client';

import { Fragment, useState, useTransition } from 'react';
import { calcularCorrespondenciaVacante } from '@/app/(dashboard)/reclutamiento/match-actions';
import { ETIQUETA_CATEGORIA, ORDEN_CATEGORIAS, type CategoriaCriterio, type ResultadoCriterio } from '@/lib/reclutamiento/match';
import { ChevronDown, ChevronRight, Calculator, AlertTriangle } from 'lucide-react';

export type DetalleFila = {
  descripcion: string;
  categoria: CategoriaCriterio;
  tipo: string;
  resultado: ResultadoCriterio;
  puntaje: number | null;
  evidencia: string | null;
  motivo: string;
};

export type EvaluacionFila = {
  postulacion_id: string;
  candidato: string;
  etapa: string;
  puntaje: number | null;
  cobertura: number;
  clasificacion: 'alta' | 'buena' | 'parcial' | 'baja' | 'sin_evaluar';
  provisional: boolean;
  obligatorios_estado: 'cumple' | 'pendiente' | 'no_cumple' | 'sin_criterios';
  fortalezas: string[];
  brechas: string[];
  version_reglas: string;
  detalles: DetalleFila[];
};

export type SinEvaluacion = { postulacion_id: string; candidato: string };

const CLASIFICACION: Record<EvaluacionFila['clasificacion'], { texto: string; clase: string }> = {
  alta: { texto: 'Alta', clase: 'bg-alto/10 text-alto' },
  buena: { texto: 'Buena', clase: 'bg-flow-50 text-flow-700' },
  parcial: { texto: 'Parcial', clase: 'bg-medio/10 text-medio' },
  baja: { texto: 'Baja', clase: 'bg-bajo/10 text-bajo' },
  sin_evaluar: { texto: 'Sin evaluar', clase: 'bg-marmol-200 text-marmol-500' },
};

const OBLIGATORIOS: Record<EvaluacionFila['obligatorios_estado'], string> = {
  cumple: 'Cumple',
  pendiente: 'Pendiente de validar',
  no_cumple: 'No cumple',
  sin_criterios: 'Sin obligatorios',
};

const RESULTADO: Record<ResultadoCriterio, string> = {
  cumple: 'Cumple',
  cumple_parcialmente: 'Cumple parcialmente',
  no_cumple: 'No cumple',
  no_informado: 'No informado',
  contradictorio: 'Contradictorio',
  pendiente_validacion: 'Pendiente de validación',
};

const formatoNumero = (n: number) => n.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

export function RankingMatch({
  vacanteId,
  evaluaciones,
  sinEvaluacion,
  puedeCalcular,
}: {
  vacanteId: string;
  evaluaciones: EvaluacionFila[];
  sinEvaluacion: SinEvaluacion[];
  puedeCalcular: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [abierto, setAbierto] = useState<string | null>(null);

  const ordenadas = [...evaluaciones].sort((a, b) => (b.puntaje ?? -1) - (a.puntaje ?? -1));

  const calcular = () => {
    setError(null);
    startTransition(async () => {
      const r = await calcularCorrespondenciaVacante(vacanteId);
      if (!r.ok) setError(r.error);
    });
  };

  return (
    <section className="card p-4 space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="font-display font-semibold text-secundario text-sm">Ranking de correspondencia</h2>
          <p className="text-xs text-marmol-400 mt-0.5 max-w-xl">
            Orden orientativo para priorizar la revisión, no una decisión. Un puntaje con poca evidencia aparece como provisional.
            Las brechas sin información son «pendiente de validación», no «no cumple».
          </p>
        </div>
        {puedeCalcular && (
          <button
            type="button"
            disabled={pending}
            onClick={calcular}
            className="inline-flex items-center gap-1.5 rounded-lg bg-flow-500 hover:bg-flow-600 text-white text-xs font-medium px-3 py-1.5 disabled:opacity-50"
          >
            <Calculator size={13} /> {pending ? 'Calculando…' : evaluaciones.length > 0 ? 'Recalcular correspondencia' : 'Calcular correspondencia'}
          </button>
        )}
      </div>

      {error && <p className="text-xs text-bajo">{error}</p>}

      {ordenadas.length === 0 && sinEvaluacion.length === 0 && (
        <p className="text-sm text-marmol-500">Todavía no hay candidatos para evaluar en esta vacante.</p>
      )}

      {ordenadas.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-marmol-400 border-b border-marmol-100">
                <th className="py-2 pr-3 font-medium">Candidato</th>
                <th className="py-2 pr-3 font-medium text-right">Puntaje</th>
                <th className="py-2 pr-3 font-medium text-right">Cobertura</th>
                <th className="py-2 pr-3 font-medium">Clasificación</th>
                <th className="py-2 pr-3 font-medium">Obligatorios</th>
                <th className="py-2 font-medium" />
              </tr>
            </thead>
            <tbody>
              {ordenadas.map((e) => {
                const expandida = abierto === e.postulacion_id;
                return (
                  <Fragment key={e.postulacion_id}>
                    <tr className="border-b border-marmol-50 hover:bg-marmol-50/60 cursor-pointer" onClick={() => setAbierto(expandida ? null : e.postulacion_id)}>
                      <td className="py-2 pr-3">
                        <p className="font-medium text-marmol-800">{e.candidato}</p>
                        <p className="text-[11px] text-marmol-400">{e.etapa}</p>
                      </td>
                      <td className="py-2 pr-3 text-right font-semibold text-marmol-800">
                        {e.puntaje === null ? '—' : `${formatoNumero(e.puntaje)} / 100`}
                      </td>
                      <td className="py-2 pr-3 text-right text-marmol-600">{formatoNumero(e.cobertura)} %</td>
                      <td className="py-2 pr-3">
                        <span className={`inline-flex items-center gap-1 text-xs font-medium rounded-full px-2 py-0.5 ${CLASIFICACION[e.clasificacion].clase}`}>
                          {CLASIFICACION[e.clasificacion].texto}
                          {e.provisional && <AlertTriangle size={11} aria-label="Provisional" />}
                        </span>
                      </td>
                      <td className={`py-2 pr-3 text-xs ${e.obligatorios_estado === 'no_cumple' ? 'text-bajo font-medium' : 'text-marmol-600'}`}>
                        {OBLIGATORIOS[e.obligatorios_estado]}
                      </td>
                      <td className="py-2 text-marmol-400">{expandida ? <ChevronDown size={14} /> : <ChevronRight size={14} />}</td>
                    </tr>
                    {expandida && (
                      <tr className="border-b border-marmol-100">
                        <td colSpan={6} className="py-3 pr-3">
                          <DetalleMatch evaluacion={e} />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {sinEvaluacion.length > 0 && (
        <div className="text-xs text-marmol-500">
          <span className="font-medium">Sin evaluación vigente:</span> {sinEvaluacion.map((s) => s.candidato).join(', ')}. Recalcula para incluirlos.
        </div>
      )}
    </section>
  );
}

function DetalleMatch({ evaluacion }: { evaluacion: EvaluacionFila }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 text-xs">
        <div>
          <p className="font-medium text-alto mb-1">Fortalezas identificadas</p>
          {evaluacion.fortalezas.length === 0 ? <p className="text-marmol-400">Ninguna con evidencia suficiente.</p> : (
            <ul className="list-disc pl-4 space-y-0.5 text-marmol-600">{evaluacion.fortalezas.map((f, i) => <li key={i}>{f}</li>)}</ul>
          )}
        </div>
        <div>
          <p className="font-medium text-medio mb-1">Brechas y datos pendientes</p>
          {evaluacion.brechas.length === 0 ? <p className="text-marmol-400">Sin brechas registradas.</p> : (
            <ul className="list-disc pl-4 space-y-0.5 text-marmol-600">{evaluacion.brechas.map((b, i) => <li key={i}>{b}</li>)}</ul>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {ORDEN_CATEGORIAS.map((cat) => {
          const items = evaluacion.detalles.filter((d) => d.categoria === cat);
          if (items.length === 0) return null;
          return (
            <div key={cat}>
              <p className="text-[11px] uppercase tracking-wide text-marmol-400 mb-1">{ETIQUETA_CATEGORIA[cat]}</p>
              <ul className="space-y-1.5">
                {items.map((d, i) => (
                  <li key={i} className="rounded-lg bg-white border border-marmol-100 px-3 py-2 text-xs">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <span className="font-medium text-marmol-800">{d.descripcion}</span>
                      <span className="text-marmol-500">
                        {RESULTADO[d.resultado]}
                        {d.puntaje !== null && ` · ${d.puntaje}/100`}
                        {d.tipo === 'informativo' && ' · informativo'}
                      </span>
                    </div>
                    <p className="text-marmol-500 mt-0.5">{d.motivo}</p>
                    {d.evidencia && <p className="text-marmol-400 italic mt-0.5">Evidencia: {d.evidencia}</p>}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      <p className="text-[11px] text-marmol-400">Reglas de evaluación: {evaluacion.version_reglas}. Cada resultado es reproducible con los mismos datos y criterios.</p>
    </div>
  );
}
