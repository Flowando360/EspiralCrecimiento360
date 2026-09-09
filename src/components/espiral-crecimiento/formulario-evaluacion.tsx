'use client';

import { useMemo, useState, useTransition } from 'react';
import { guardarRespuesta } from '@/app/(dashboard)/espiral-crecimiento/evaluar/actions';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface Criterio {
  nivel: number;
  criterio: string;
}

type Bloque =
  | 'competencias_organizacionales'
  | 'competencias_funcionales'
  | 'competencias_liderazgo'
  | 'roles_y_funciones'
  | 'cultura';

export interface ItemEvaluacion {
  id: string; // evaluacion_item id
  bloque: Bloque;
  titulo: string;
  descripcion: string | null;
  criterios?: Criterio[]; // solo si el ítem viene de una competencia con guía de valoración
}

const ETIQUETA_BLOQUE: Record<Bloque, { titulo: string; color: string }> = {
  competencias_organizacionales: { titulo: 'Competencias Organizacionales', color: 'text-flow-600' },
  competencias_funcionales: { titulo: 'Competencias Funcionales del Cargo', color: 'text-hacer' },
  competencias_liderazgo: { titulo: 'Competencias de Liderazgo', color: 'text-deber' },
  roles_y_funciones: { titulo: 'Roles y Funciones', color: 'text-saber' },
  cultura: { titulo: 'Cultura', color: 'text-ser' },
};

const ORDEN_BLOQUES = [
  'competencias_organizacionales',
  'competencias_funcionales',
  'competencias_liderazgo',
  'roles_y_funciones',
  'cultura',
] as const;

function promedio(valores: number[]): number | null {
  if (valores.length === 0) return null;
  return Math.round((valores.reduce((a, b) => a + b, 0) / valores.length) * 10) / 10;
}

export function FormularioEvaluacion({
  evaluacionTareaId,
  items,
  respuestasIniciales,
}: {
  evaluacionTareaId: string;
  items: ItemEvaluacion[];
  respuestasIniciales: Record<string, { nota: number; observacion?: string; resultadoReal?: string }>;
}) {
  const [notas, setNotas] = useState<Record<string, number>>(
    Object.fromEntries(Object.entries(respuestasIniciales).map(([k, v]) => [k, v.nota]))
  );
  const [observaciones, setObservaciones] = useState<Record<string, string>>(
    Object.fromEntries(Object.entries(respuestasIniciales).map(([k, v]) => [k, v.observacion ?? '']))
  );
  const [resultadosReales, setResultadosReales] = useState<Record<string, string>>(
    Object.fromEntries(Object.entries(respuestasIniciales).map(([k, v]) => [k, v.resultadoReal ?? '']))
  );
  const [, startTransition] = useTransition();
  const [guardados, setGuardados] = useState<Record<string, boolean>>({});
  const [expandido, setExpandido] = useState<string | null>(null);

  function guardar(itemId: string, nota: number) {
    setNotas((prev) => ({ ...prev, [itemId]: nota }));
    startTransition(async () => {
      const res = await guardarRespuesta({
        evaluacionTareaId,
        evaluacionItemId: itemId,
        nota,
        observacion: observaciones[itemId],
        resultadoReal: resultadosReales[itemId],
      });
      if (res.ok) setGuardados((prev) => ({ ...prev, [itemId]: true }));
    });
  }

  const itemsPorBloque = ORDEN_BLOQUES.map((bloque) => ({
    bloque,
    items: items.filter((i) => i.bloque === bloque),
  })).filter((g) => g.items.length > 0);

  const subtotalesPorBloque = useMemo(
    () =>
      Object.fromEntries(
        itemsPorBloque.map(({ bloque, items: itemsBloque }) => [
          bloque,
          promedio(itemsBloque.map((i) => notas[i.id]).filter((n): n is number => typeof n === 'number')),
        ])
      ),
    [itemsPorBloque, notas]
  );

  const totalGeneral = useMemo(
    () => promedio(items.map((i) => notas[i.id]).filter((n): n is number => typeof n === 'number')),
    [items, notas]
  );
  const totalRespondidos = Object.keys(notas).filter((id) => items.some((i) => i.id === id)).length;

  return (
    <div className="space-y-6">
      {/* ── Barra de avance y total ── */}
      <div className="card p-4 sticky top-2 z-10 backdrop-blur bg-white/90 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-flow-50 flex items-center justify-center">
            <span className="font-display text-sm font-bold text-flow-700">{totalGeneral ?? '—'}</span>
          </div>
          <div>
            <p className="text-sm font-medium text-marmol-800">Promedio general</p>
            <p className="text-xs text-marmol-400">
              {totalRespondidos} de {items.length} ítems respondidos
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          {itemsPorBloque.map(({ bloque, items: itemsBloque }) => (
            <div key={bloque} className="text-right">
              <p className={cn('text-xs font-medium', ETIQUETA_BLOQUE[bloque].color)}>{ETIQUETA_BLOQUE[bloque].titulo}</p>
              <p className="text-sm font-display font-semibold text-marmol-800">
                {subtotalesPorBloque[bloque] ?? '—'}
                <span className="text-xs font-normal text-marmol-400"> /{itemsBloque.length}</span>
              </p>
            </div>
          ))}
        </div>
      </div>

      {itemsPorBloque.map(({ bloque, items: itemsBloque }) => (
        <div key={bloque}>
          <div className="flex items-center justify-between mb-3">
            <h2 className={cn('font-display text-sm font-bold uppercase tracking-wide', ETIQUETA_BLOQUE[bloque].color)}>
              {ETIQUETA_BLOQUE[bloque].titulo}
            </h2>
            <span className="text-xs text-marmol-400">
              Subtotal: <span className="font-semibold text-marmol-700">{subtotalesPorBloque[bloque] ?? '—'}</span>
            </span>
          </div>

          <div className="card divide-y divide-marmol-100 overflow-hidden">
            {itemsBloque.map((item) => {
              const nota = notas[item.id];
              const criterioSeleccionado = item.criterios?.find((c) => c.nivel === nota);
              const estaExpandido = expandido === item.id;

              return (
                <div key={item.id} className="p-4">
                  <div className="flex items-start justify-between gap-4 flex-wrap sm:flex-nowrap">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium text-marmol-900 text-sm">{item.titulo}</h3>
                      {item.descripcion && (
                        <p className="text-xs text-marmol-500 mt-0.5">
                          {bloque === 'roles_y_funciones' ? `Resultado esperado: ${item.descripcion}` : item.descripcion}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-1.5 shrink-0">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => {
                            guardar(item.id, n);
                            if (item.criterios) setExpandido(item.id);
                          }}
                          className={cn(
                            'h-8 w-8 rounded-lg border text-sm font-medium transition',
                            nota === n
                              ? 'border-flow-500 bg-flow-500 text-white'
                              : 'border-marmol-200 text-marmol-600 hover:border-flow-300'
                          )}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>

                  {bloque === 'roles_y_funciones' && (
                    <input
                      type="text"
                      placeholder="Resultado real observado…"
                      defaultValue={resultadosReales[item.id] ?? ''}
                      onChange={(e) => setResultadosReales((prev) => ({ ...prev, [item.id]: e.target.value }))}
                      onBlur={() => {
                        if (nota) guardar(item.id, nota);
                      }}
                      className="mt-2.5 w-full rounded-lg border border-marmol-200 px-3 py-1.5 text-sm"
                    />
                  )}

                  {/* Solo se muestra el criterio del nivel YA elegido — nunca los 5 a la vez */}
                  {criterioSeleccionado && (
                    <p className="mt-2.5 text-xs text-marmol-600 bg-flow-50 rounded-lg px-3 py-2">
                      <span className="font-medium text-flow-700">Nivel {criterioSeleccionado.nivel}: </span>
                      {criterioSeleccionado.criterio}
                    </p>
                  )}

                  <div className="mt-2.5 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setExpandido(estaExpandido ? null : item.id)}
                      className="text-xs text-marmol-400 hover:text-flow-600"
                    >
                      {estaExpandido ? 'Ocultar observación' : 'Agregar observación'}
                    </button>
                    {guardados[item.id] && (
                      <span className="text-xs text-alto flex items-center gap-1">
                        <Check size={11} /> Guardado
                      </span>
                    )}
                  </div>

                  {estaExpandido && (
                    <textarea
                      placeholder="Observación (opcional)…"
                      defaultValue={observaciones[item.id] ?? ''}
                      onChange={(e) => setObservaciones((prev) => ({ ...prev, [item.id]: e.target.value }))}
                      onBlur={() => {
                        if (nota) guardar(item.id, nota);
                      }}
                      className="mt-2 w-full rounded-lg border border-marmol-200 p-2.5 text-sm"
                      rows={2}
                      autoFocus
                    />
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
