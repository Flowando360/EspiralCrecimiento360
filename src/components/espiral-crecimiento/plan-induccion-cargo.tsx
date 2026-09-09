'use client';

import { useState, useTransition } from 'react';
import { agregarItemInduccion, eliminarItemInduccion } from '@/app/(dashboard)/administracion/cargos/[id]/actions';
import { Trash2, Plus } from 'lucide-react';

type Categoria = 'proposito_organizacional' | 'funciones' | 'riesgos_sst' | 'epp' | 'examenes_medicos' | 'formacion' | 'otro';

interface Item {
  id: string;
  categoria: Categoria;
  titulo: string;
  descripcion: string | null;
}

const CATEGORIA_LABEL: Record<Categoria, string> = {
  proposito_organizacional: 'Propósito organizacional',
  funciones: 'Funciones',
  riesgos_sst: 'Riesgos SST',
  epp: 'EPP',
  examenes_medicos: 'Exámenes médicos',
  formacion: 'Formación',
  otro: 'Otro',
};

export function PlanInduccionCargo({ cargoId, itemsIniciales }: { cargoId: string; itemsIniciales: Item[] }) {
  const [items, setItems] = useState(itemsIniciales);
  const [categoria, setCategoria] = useState<Categoria>('otro');
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [, startTransition] = useTransition();

  function agregar() {
    if (!titulo.trim()) return;
    startTransition(async () => {
      const res = await agregarItemInduccion({ cargoId, categoria, titulo, descripcion });
      if (res.ok) {
        setItems((prev) => [...prev, { id: crypto.randomUUID(), categoria, titulo, descripcion: descripcion || null }]);
        setTitulo('');
        setDescripcion('');
      }
    });
  }

  function eliminar(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
    startTransition(async () => {
      await eliminarItemInduccion(id, cargoId);
    });
  }

  const grupos = (Object.keys(CATEGORIA_LABEL) as Categoria[])
    .map((cat) => ({ cat, items: items.filter((i) => i.categoria === cat) }))
    .filter((g) => g.items.length > 0);

  return (
    <div className="card p-5">
      <h2 className="font-display font-semibold text-secundario mb-1">Plan de inducción específico</h2>
      <p className="text-xs text-marmol-400 mb-3">
        Generado automáticamente a partir del perfil de este cargo. Puedes ajustar los puntos antes de que se usen.
      </p>

      <div className="space-y-4 mb-4">
        {grupos.map(({ cat, items: itemsGrupo }) => (
          <div key={cat}>
            <p className="text-xs font-medium text-marmol-500 mb-1.5">{CATEGORIA_LABEL[cat]}</p>
            <div className="space-y-1.5">
              {itemsGrupo.map((it) => (
                <div key={it.id} className="flex items-start justify-between gap-2 border-b border-marmol-100 pb-1.5">
                  <div>
                    <p className="text-sm text-marmol-800">{it.titulo}</p>
                    {it.descripcion && <p className="text-xs text-marmol-500">{it.descripcion}</p>}
                  </div>
                  <button onClick={() => eliminar(it.id)} className="text-marmol-300 hover:text-bajo shrink-0">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="text-sm text-marmol-400">Sin puntos de inducción todavía.</p>}
      </div>

      <div className="space-y-2 pt-3 border-t border-marmol-100">
        <div className="flex gap-2">
          <select
            value={categoria}
            onChange={(e) => setCategoria(e.target.value as Categoria)}
            className="rounded-lg border border-marmol-200 px-2 py-1.5 text-sm"
          >
            {(Object.keys(CATEGORIA_LABEL) as Categoria[]).map((cat) => (
              <option key={cat} value={cat}>
                {CATEGORIA_LABEL[cat]}
              </option>
            ))}
          </select>
          <input
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Punto de inducción…"
            className="flex-1 rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm"
          />
        </div>
        <div className="flex gap-2">
          <input
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Descripción (opcional)"
            className="flex-1 rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm"
          />
          <button onClick={agregar} className="rounded-lg bg-flow-500 hover:bg-flow-600 text-white px-3 py-1.5 shrink-0">
            <Plus size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
