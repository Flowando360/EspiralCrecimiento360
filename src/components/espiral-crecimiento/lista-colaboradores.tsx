'use client';

import { useMemo, useState } from 'react';
import { Search, Crown } from 'lucide-react';
import { FilaColaborador, type ColaboradorFila } from './fila-colaborador';

export interface ColaboradorLista extends ColaboradorFila {
  esLider: boolean;
}

function sinTildes(t: string) {
  return t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

export function ListaColaboradores({
  colaboradores,
  puedeEliminar,
}: {
  colaboradores: ColaboradorLista[];
  puedeEliminar: boolean;
}) {
  const [texto, setTexto] = useState('');
  const [cargo, setCargo] = useState('');
  const [soloLideres, setSoloLideres] = useState(false);

  const cargos = useMemo(
    () => Array.from(new Set(colaboradores.map((c) => c.cargo?.nombre).filter(Boolean) as string[])).sort((a, b) => a.localeCompare(b, 'es')),
    [colaboradores]
  );

  const visibles = colaboradores.filter((c) => {
    if (texto && !sinTildes(c.nombre_completo).includes(sinTildes(texto.trim()))) return false;
    if (cargo && c.cargo?.nombre !== cargo) return false;
    if (soloLideres && !c.esLider) return false;
    return true;
  });
  const hayFiltro = Boolean(texto || cargo || soloLideres);

  return (
    <div className="space-y-3">
      <div className="card p-3 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[12rem]">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-marmol-400" />
          <input
            type="search"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Buscar por nombre…"
            aria-label="Buscar por nombre"
            className="w-full rounded-lg border border-marmol-200 pl-8 pr-3 py-2 text-sm"
          />
        </div>
        <select
          value={cargo}
          onChange={(e) => setCargo(e.target.value)}
          aria-label="Filtrar por cargo"
          className="rounded-lg border border-marmol-200 px-3 py-2 text-sm min-w-[12rem]"
        >
          <option value="">Todos los cargos</option>
          {cargos.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <label className="inline-flex items-center gap-2 text-sm text-marmol-700 cursor-pointer">
          <input type="checkbox" checked={soloLideres} onChange={(e) => setSoloLideres(e.target.checked)} />
          <Crown size={14} className="text-flow-600" /> Solo líderes de área
        </label>
        {hayFiltro && (
          <button
            type="button"
            onClick={() => { setTexto(''); setCargo(''); setSoloLideres(false); }}
            className="text-xs text-flow-600 hover:text-flow-700"
          >
            Limpiar filtros
          </button>
        )}
      </div>
      <p className="text-xs text-marmol-500">
        Mostrando {visibles.length} de {colaboradores.length} {colaboradores.length === 1 ? 'persona' : 'personas'}.
      </p>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-marmol-200 text-left text-xs uppercase tracking-wide text-marmol-400">
              <th className="px-4 py-3 font-medium">Nombre</th>
              <th className="px-4 py-3 font-medium">Cargo</th>
              <th className="px-4 py-3 font-medium">Área</th>
              <th className="px-4 py-3 font-medium">Ingreso</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              {puedeEliminar && <th className="px-4 py-3 font-medium">Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {visibles.length === 0 ? (
              <tr>
                <td colSpan={puedeEliminar ? 6 : 5} className="px-4 py-8 text-center text-sm text-marmol-500">
                  Ninguna persona coincide con estos filtros.
                </td>
              </tr>
            ) : (
              visibles.map((c) => <FilaColaborador key={c.id} colaborador={c} puedeEliminar={puedeEliminar} />)
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
