'use client';

import { useOptimistic, useTransition } from 'react';
import { CheckCircle2, Target } from 'lucide-react';
import { alternarItemEvaluacion, establecerBloqueEvaluacion } from '@/app/(dashboard)/administracion/cargos/[id]/items-evaluacion/actions';
import { cn } from '@/lib/utils';

export interface ItemSeleccionable {
  id: string;
  tipo: 'competencia' | 'funcion';
  nombre: string;
  detalle: string | null;
  incluido: boolean;
}

export interface GrupoItems {
  bloque: string;
  titulo: string;
  items: ItemSeleccionable[];
}

export function SeleccionItemsEvaluacion({
  cargoId,
  grupos,
  totalItems,
  totalIncluidos,
}: {
  cargoId: string;
  grupos: GrupoItems[];
  totalItems: number;
  totalIncluidos: number;
}) {
  const [gruposOptimistas, marcarOptimista] = useOptimistic(
    grupos,
    (estado, cambio: { itemId: string; incluido: boolean } | { bloque: string; incluido: boolean }) =>
      estado.map((g) => {
        if ('itemId' in cambio) {
          return { ...g, items: g.items.map((i) => (i.id === cambio.itemId ? { ...i, incluido: cambio.incluido } : i)) };
        }
        if (g.bloque !== cambio.bloque) return g;
        return { ...g, items: g.items.map((i) => ({ ...i, incluido: cambio.incluido })) };
      })
  );
  const [, startTransition] = useTransition();

  const totalIncluidosOptimista = gruposOptimistas.reduce((acc, g) => acc + g.items.filter((i) => i.incluido).length, 0);

  function alternar(item: ItemSeleccionable) {
    startTransition(async () => {
      marcarOptimista({ itemId: item.id, incluido: !item.incluido });
      await alternarItemEvaluacion({
        cargoId,
        competenciaId: item.tipo === 'competencia' ? item.id : undefined,
        cargoFuncionId: item.tipo === 'funcion' ? item.id : undefined,
        incluido: !item.incluido,
      });
    });
  }

  function marcarBloque(grupo: GrupoItems, incluir: boolean) {
    startTransition(async () => {
      marcarOptimista({ bloque: grupo.bloque, incluido: incluir });
      await establecerBloqueEvaluacion({
        cargoId,
        items: grupo.items.map((i) => ({
          competenciaId: i.tipo === 'competencia' ? i.id : undefined,
          cargoFuncionId: i.tipo === 'funcion' ? i.id : undefined,
        })),
        incluir,
      });
    });
  }

  return (
    <div className="space-y-4">
      <div className="card p-4 flex items-center gap-2.5">
        <Target size={18} className="text-flow-600 shrink-0" />
        <p className="text-sm text-marmol-700">
          <span className="font-display font-semibold text-secundario">{totalIncluidosOptimista} de {totalItems}</span>{' '}
          ítems incluidos actualmente.
        </p>
      </div>

      {gruposOptimistas.map((grupo) => {
        const incluidosEnGrupo = grupo.items.filter((i) => i.incluido).length;
        return (
          <div key={grupo.bloque} className="card p-5">
            <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
              <h2 className="font-display font-semibold text-secundario flex items-center gap-2">
                {grupo.titulo}
                <span className="text-xs font-normal text-marmol-400 rounded-full bg-marmol-100 px-2 py-0.5">
                  {incluidosEnGrupo}/{grupo.items.length}
                </span>
              </h2>
              <div className="flex items-center gap-3 text-xs">
                <button type="button" onClick={() => marcarBloque(grupo, true)} className="text-flow-600 hover:underline font-medium">
                  Marcar todo
                </button>
                <button type="button" onClick={() => marcarBloque(grupo, false)} className="text-marmol-400 hover:underline font-medium">
                  Quitar todo
                </button>
              </div>
            </div>

            <div className="divide-y divide-marmol-100">
              {grupo.items.map((item) => (
                <label key={item.id} className="flex items-start gap-3 py-2.5 cursor-pointer group">
                  <button
                    type="button"
                    onClick={() => alternar(item)}
                    className={cn(
                      'mt-0.5 h-5 w-5 rounded-md border shrink-0 flex items-center justify-center transition',
                      item.incluido ? 'bg-flow-500 border-flow-500' : 'border-marmol-300 group-hover:border-flow-300'
                    )}
                  >
                    {item.incluido && <CheckCircle2 size={14} className="text-white" />}
                  </button>
                  <div className="min-w-0">
                    <p className={cn('text-sm', item.incluido ? 'text-marmol-800' : 'text-marmol-400 line-through decoration-marmol-300')}>
                      {item.nombre}
                    </p>
                    {item.detalle && <p className="text-xs text-marmol-400 mt-0.5">{item.detalle}</p>}
                  </div>
                </label>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
