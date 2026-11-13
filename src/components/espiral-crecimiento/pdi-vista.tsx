'use client';

import { useMemo, useState } from 'react';
import { List, LayoutGrid, Search } from 'lucide-react';
import { PdiKanban } from '@/components/espiral-crecimiento/pdi-kanban';
import { cn, formatearFecha, normalizarBusqueda } from '@/lib/utils';

type Plan = {
  id: string;
  brecha_detectada: string;
  accion: string;
  origen: string;
  estado: 'pendiente' | 'en_curso' | 'cumplido' | 'vencido';
  fecha_compromiso: string | null;
  generado_automaticamente: boolean;
  colaborador: { nombre_completo: string } | null;
};

const ESTADOS = [
  { valor: 'pendiente', etiqueta: 'Pendiente' },
  { valor: 'en_curso', etiqueta: 'En curso' },
  { valor: 'cumplido', etiqueta: 'Cumplido' },
  { valor: 'vencido', etiqueta: 'Vencido' },
];
const ORIGENES = ['ser', 'saber', 'hacer', 'deber', 'mixto'];

/** Filtros (persona, dimensión, estado) y vista de tarjetas o lista para el PDI (informe de Luisa 4.15). */
export function PdiVista({ planes, puedeArrastrar }: { planes: Plan[]; puedeArrastrar: boolean }) {
  const [q, setQ] = useState('');
  const [origen, setOrigen] = useState('');
  const [estado, setEstado] = useState('');
  const [vista, setVista] = useState<'tarjetas' | 'lista'>(planes.length > 40 ? 'lista' : 'tarjetas');

  const filtrados = useMemo(() => {
    const nq = normalizarBusqueda(q);
    return planes.filter(
      (p) =>
        (!origen || p.origen === origen) &&
        (!estado || p.estado === estado) &&
        (!nq || normalizarBusqueda(`${p.colaborador?.nombre_completo ?? ''} ${p.brecha_detectada} ${p.accion}`).includes(nq))
    );
  }, [planes, q, origen, estado]);

  return (
    <div className="space-y-4">
      <div className="card p-3 flex flex-wrap items-end gap-3 text-sm">
        <label className="flex flex-col gap-1 text-xs text-marmol-500 grow min-w-[14rem]">
          Buscar
          <span className="relative">
            <Search size={14} className="absolute left-2.5 top-2.5 text-marmol-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Persona, brecha o acción…" className="w-full rounded-lg border border-marmol-200 pl-8 pr-2.5 py-1.5 text-sm" />
          </span>
        </label>
        <label className="flex flex-col gap-1 text-xs text-marmol-500">
          Dimensión
          <select value={origen} onChange={(e) => setOrigen(e.target.value)} className="rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm">
            <option value="">Todas</option>
            {ORIGENES.map((o) => (
              <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-marmol-500">
          Estado
          <select value={estado} onChange={(e) => setEstado(e.target.value)} className="rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm">
            <option value="">Todos</option>
            {ESTADOS.map((e) => (
              <option key={e.valor} value={e.valor}>{e.etiqueta}</option>
            ))}
          </select>
        </label>
        <div className="flex rounded-lg border border-marmol-200 overflow-hidden">
          {([['tarjetas', LayoutGrid, 'Tarjetas'], ['lista', List, 'Lista']] as const).map(([v, Icono, l]) => (
            <button
              key={v}
              type="button"
              onClick={() => setVista(v)}
              className={cn('inline-flex items-center gap-1 px-3 py-1.5 text-xs', vista === v ? 'bg-flow-500 text-white' : 'text-marmol-600 hover:bg-marmol-50')}
            >
              <Icono size={13} /> {l}
            </button>
          ))}
        </div>
        <p className="text-xs text-marmol-400 pb-2">{filtrados.length} de {planes.length} planes</p>
      </div>

      {filtrados.length === 0 ? (
        <p className="text-sm text-marmol-400">Ningún plan coincide con los filtros.</p>
      ) : vista === 'tarjetas' ? (
        <PdiKanban key={filtrados.map((p) => p.id).join(',')} planesIniciales={filtrados} puedeArrastrar={puedeArrastrar} />
      ) : (
        <div className="card overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-marmol-200 text-left text-xs uppercase tracking-wide text-marmol-400">
                <th className="px-4 py-3 font-medium">Persona</th>
                <th className="px-4 py-3 font-medium">Brecha</th>
                <th className="px-4 py-3 font-medium">Acción</th>
                <th className="px-4 py-3 font-medium">Dimensión</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Compromiso</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((p) => (
                <tr key={p.id} className="border-b border-marmol-100 last:border-0 align-top">
                  <td className="px-4 py-3 font-medium text-marmol-900">{p.colaborador?.nombre_completo ?? '—'}</td>
                  <td className="px-4 py-3 text-marmol-600">{p.brecha_detectada}</td>
                  <td className="px-4 py-3 text-marmol-600">{p.accion}</td>
                  <td className="px-4 py-3 text-marmol-600 capitalize">{p.origen}</td>
                  <td className="px-4 py-3 text-marmol-600">{ESTADOS.find((e) => e.valor === p.estado)?.etiqueta ?? p.estado}</td>
                  <td className="px-4 py-3 text-marmol-500">{p.fecha_compromiso ? formatearFecha(p.fecha_compromiso) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
