'use client';

import { useState, useTransition } from 'react';
import { marcarItemInduccion } from '@/app/(dashboard)/espiral-crecimiento/colaboradores/[id]/induccion/actions';
import { formatearFecha } from '@/lib/utils';
import { Check } from 'lucide-react';

type Categoria = 'proposito_organizacional' | 'funciones' | 'riesgos_sst' | 'epp' | 'examenes_medicos' | 'formacion' | 'otro';

const CATEGORIA_LABEL: Record<Categoria, string> = {
  proposito_organizacional: 'Propósito organizacional',
  funciones: 'Funciones',
  riesgos_sst: 'Riesgos SST',
  epp: 'EPP',
  examenes_medicos: 'Exámenes médicos',
  formacion: 'Formación',
  otro: 'Otro',
};

export interface ItemAsignado {
  id: string;
  completado: boolean;
  completado_en: string | null;
  completado_por_nombre: string | null;
  categoria: Categoria;
  titulo: string;
  descripcion: string | null;
}

export function ChecklistInduccion({
  colaboradorId,
  itemsIniciales,
  puedeEditar,
}: {
  colaboradorId: string;
  itemsIniciales: ItemAsignado[];
  puedeEditar: boolean;
}) {
  const [items, setItems] = useState(itemsIniciales);
  const [, startTransition] = useTransition();

  function toggle(item: ItemAsignado) {
    const nuevoEstado = !item.completado;
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, completado: nuevoEstado } : i)));
    startTransition(async () => {
      await marcarItemInduccion(colaboradorId, item.id, nuevoEstado);
    });
  }

  const total = items.length;
  const completados = items.filter((i) => i.completado).length;
  const pct = total > 0 ? Math.round((completados / total) * 100) : 0;

  const grupos = (Object.keys(CATEGORIA_LABEL) as Categoria[])
    .map((cat) => ({ cat, items: items.filter((i) => i.categoria === cat) }))
    .filter((g) => g.items.length > 0);

  return (
    <div className="space-y-4">
      <div className="card p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-marmol-700">Avance de inducción</p>
          <p className="text-sm font-semibold text-secundario">{pct}%</p>
        </div>
        <div className="h-2 rounded-full bg-marmol-100 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-flow-500 to-acento rounded-full" style={{ width: `${pct}%` }} />
        </div>
        <p className="text-xs text-marmol-400 mt-1.5">
          {completados} de {total} puntos cumplidos
        </p>
      </div>

      {total === 0 ? (
        <p className="text-sm text-marmol-400">Sin plan de inducción asignado todavía.</p>
      ) : (
        grupos.map(({ cat, items: itemsGrupo }) => (
          <div key={cat} className="card p-4">
            <p className="text-xs font-medium text-marmol-500 mb-2">{CATEGORIA_LABEL[cat]}</p>
            <div className="space-y-2">
              {itemsGrupo.map((item) => (
                <div key={item.id} className="flex items-start gap-2.5 border-b border-marmol-100 pb-2 last:border-0">
                  <button
                    type="button"
                    disabled={!puedeEditar}
                    onClick={() => toggle(item)}
                    className={`mt-0.5 h-4 w-4 rounded shrink-0 flex items-center justify-center border transition ${
                      item.completado
                        ? 'bg-flow-500 border-flow-500 text-white'
                        : 'border-marmol-300 bg-white'
                    } ${!puedeEditar ? 'opacity-60' : 'hover:border-flow-400'}`}
                  >
                    {item.completado && <Check size={12} />}
                  </button>
                  <div className="min-w-0">
                    <p className={`text-sm ${item.completado ? 'text-marmol-500 line-through' : 'text-marmol-800'}`}>
                      {item.titulo}
                    </p>
                    {item.descripcion && <p className="text-xs text-marmol-400">{item.descripcion}</p>}
                    {item.completado && item.completado_en && (
                      <p className="text-xs text-alto mt-0.5">
                        Cumplido por {item.completado_por_nombre ?? '—'} el {formatearFecha(item.completado_en)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
