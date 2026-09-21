'use client';

import { useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { guardarRespuestaDiagnostico, marcarDiagnosticoCompletado } from '@/app/(dashboard)/procesos-gestion/diagnostico-iso9001/actions';
import { calcularDiagnosticoIso9001, tituloClausula, type NivelDiagnostico, type ItemDiagnostico, type RespuestaDiagnostico } from '@/lib/calculos/diagnostico-iso9001';
import { ListChecks, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const OPCIONES: { valor: NivelDiagnostico; etiqueta: string; clase: string }[] = [
  { valor: 'no_cumple', etiqueta: 'No cumple', clase: 'badge-bajo' },
  { valor: 'cumple_parcial', etiqueta: 'Cumple parcial', clase: 'badge-medio' },
  { valor: 'cumple', etiqueta: 'Cumple', clase: 'badge-alto' },
  { valor: 'no_aplica', etiqueta: 'No aplica', clase: 'badge-marmol' },
];

function colorPuntaje(puntaje: number | null): string {
  if (puntaje === null) return 'text-marmol-400';
  if (puntaje >= 80) return 'text-alto';
  if (puntaje >= 50) return 'text-medio';
  return 'text-bajo';
}

export function DiagnosticoIso9001Form({
  diagnosticoId,
  items,
  respuestasIniciales,
  estado,
  puedeEditar,
}: {
  diagnosticoId: string;
  items: ItemDiagnostico[];
  respuestasIniciales: (RespuestaDiagnostico & { observacion: string | null })[];
  estado: 'en_progreso' | 'completado';
  puedeEditar: boolean;
}) {
  const [respuestas, setRespuestas] = useState<Map<string, { nivel: NivelDiagnostico | null; observacion: string }>>(
    () => new Map(respuestasIniciales.map((r) => [r.item_id, { nivel: r.nivel, observacion: r.observacion ?? '' }]))
  );
  const [pendingItem, startTransitionItem] = useTransition();
  const [pendingCompletar, startTransitionCompletar] = useTransition();
  const [completado, setCompletado] = useState(estado === 'completado');

  const resultado = useMemo(
    () =>
      calcularDiagnosticoIso9001(
        items,
        [...respuestas.entries()].map(([item_id, v]) => ({ item_id, nivel: v.nivel }))
      ),
    [items, respuestas]
  );

  function cambiarNivel(itemId: string, nivel: NivelDiagnostico) {
    const actual = respuestas.get(itemId) ?? { nivel: null, observacion: '' };
    const siguiente = actual.nivel === nivel ? null : nivel; // clic de nuevo sobre la misma opción la deselecciona
    setRespuestas((prev) => new Map(prev).set(itemId, { ...actual, nivel: siguiente }));
    startTransitionItem(() => {
      guardarRespuestaDiagnostico({ diagnosticoId, itemId, nivel: siguiente, observacion: actual.observacion });
    });
  }

  function cambiarObservacion(itemId: string, observacion: string) {
    const actual = respuestas.get(itemId) ?? { nivel: null, observacion: '' };
    setRespuestas((prev) => new Map(prev).set(itemId, { ...actual, observacion }));
  }

  function guardarObservacion(itemId: string) {
    const actual = respuestas.get(itemId);
    if (!actual) return;
    startTransitionItem(() => {
      guardarRespuestaDiagnostico({ diagnosticoId, itemId, nivel: actual.nivel, observacion: actual.observacion });
    });
  }

  function alternarCompletado() {
    const nuevo = !completado;
    setCompletado(nuevo);
    startTransitionCompletar(() => {
      marcarDiagnosticoCompletado(diagnosticoId, nuevo);
    });
  }

  const clausulas = [...new Set(items.map((i) => i.clausula))].sort((a, b) => a - b);

  return (
    <div className="space-y-4">
      <div className="card p-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-xs text-marmol-500">Puntaje general</p>
            <p className={cn('font-display text-3xl font-semibold', colorPuntaje(resultado.puntajeGeneral))}>
              {resultado.puntajeGeneral !== null ? `${resultado.puntajeGeneral}%` : '—'}
            </p>
            <p className="text-xs text-marmol-400 mt-0.5">
              {resultado.itemsRespondidos} de {resultado.itemsTotal} numerales respondidos
            </p>
          </div>
          {puedeEditar && (
            <button
              type="button"
              onClick={alternarCompletado}
              disabled={pendingCompletar}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-lg text-sm font-medium px-3.5 py-2 transition disabled:opacity-50',
                completado ? 'border border-marmol-200 text-marmol-600 hover:bg-marmol-50' : 'bg-flow-500 hover:bg-flow-600 text-white'
              )}
            >
              <Check size={15} /> {completado ? 'Marcado como completado' : 'Marcar como completado'}
            </button>
          )}
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2.5 mt-4">
          {resultado.porClausula.map((c) => (
            <div key={c.clausula} className="rounded-lg border border-marmol-100 px-3 py-2">
              <p className="text-xs text-marmol-500 truncate">
                {c.clausula}. {tituloClausula(c.clausula)}
              </p>
              <p className={cn('font-display text-lg font-semibold', colorPuntaje(c.puntaje))}>{c.puntaje !== null ? `${c.puntaje}%` : '—'}</p>
            </div>
          ))}
        </div>
      </div>

      {clausulas.map((clausula) => (
        <div key={clausula} className="card p-5">
          <h2 className="font-display font-semibold text-secundario mb-3">
            {clausula}. {tituloClausula(clausula)}
          </h2>
          <div className="space-y-4">
            {items
              .filter((i) => i.clausula === clausula)
              .map((item) => {
                const r = respuestas.get(item.id) ?? { nivel: null, observacion: '' };
                const esDebil = r.nivel === 'no_cumple' || r.nivel === 'cumple_parcial';
                const descripcionAcpm = `Diagnóstico ISO 9001 — numeral ${item.numeral}: ${item.titulo}`;
                return (
                  <div key={item.id} className="border-b border-marmol-100 last:border-0 pb-4 last:pb-0">
                    <p className="text-sm font-medium text-marmol-800">
                      {item.numeral} — {item.titulo}
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {OPCIONES.map((op) => (
                        <button
                          key={op.valor}
                          type="button"
                          disabled={!puedeEditar || pendingItem}
                          onClick={() => cambiarNivel(item.id, op.valor)}
                          className={cn(
                            'text-xs font-medium rounded-full px-2.5 py-1 border transition',
                            r.nivel === op.valor ? op.clase : 'border-marmol-200 text-marmol-400 hover:border-marmol-300',
                            !puedeEditar && 'cursor-default'
                          )}
                        >
                          {op.etiqueta}
                        </button>
                      ))}
                    </div>
                    {puedeEditar && (
                      <input
                        className="w-full mt-2 rounded-lg border border-marmol-200 px-2.5 py-1.5 text-xs"
                        placeholder="Observación / evidencia (opcional)"
                        value={r.observacion}
                        onChange={(e) => cambiarObservacion(item.id, e.target.value)}
                        onBlur={() => guardarObservacion(item.id)}
                      />
                    )}
                    {puedeEditar && esDebil && (
                      <Link
                        href={`/procesos-gestion/acpm?origenDetalle=${encodeURIComponent(descripcionAcpm)}&descripcion=${encodeURIComponent(`Cerrar la brecha detectada en el numeral ${item.numeral} (${item.titulo}) del diagnóstico ISO 9001.`)}`}
                        className="inline-flex items-center gap-1 text-[11px] text-flow-600 hover:text-flow-700 font-medium mt-1.5"
                      >
                        <ListChecks size={12} /> Crear ACPM para esta brecha
                      </Link>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      ))}
    </div>
  );
}
