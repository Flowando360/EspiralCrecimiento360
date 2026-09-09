'use client';

import { useMemo, useState, useTransition } from 'react';
import { Send, Copy, Check } from 'lucide-react';
import { crearInvitacionesMasivas, type LinkGenerado } from './actions';

export interface FilaColaborador {
  id: string;
  nombre: string;
  correo: string | null;
  estado: 'sin_invitar' | 'invitacion_pendiente' | 'guia_generada';
}

const ETIQUETA_ESTADO: Record<FilaColaborador['estado'], { texto: string; clase: string }> = {
  sin_invitar: { texto: 'Sin invitar', clase: 'bg-marmol-100 text-marmol-500 border border-marmol-200' },
  invitacion_pendiente: { texto: 'Invitación pendiente', clase: 'badge-medio' },
  guia_generada: { texto: 'Guía generada', clase: 'badge-alto' },
};

export function ListaInvitaciones({ colaboradores }: { colaboradores: FilaColaborador[] }) {
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set());
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [links, setLinks] = useState<LinkGenerado[] | null>(null);
  const [copiadoTodos, setCopiadoTodos] = useState(false);
  const [copiadoId, setCopiadoId] = useState<string | null>(null);

  const todosSeleccionados = colaboradores.length > 0 && seleccionados.size === colaboradores.length;

  function alternarTodos() {
    setSeleccionados(todosSeleccionados ? new Set() : new Set(colaboradores.map((c) => c.id)));
  }

  function alternarUno(id: string) {
    setSeleccionados((prev) => {
      const siguiente = new Set(prev);
      if (siguiente.has(id)) siguiente.delete(id);
      else siguiente.add(id);
      return siguiente;
    });
  }

  function seleccionarSinGuia() {
    setSeleccionados(new Set(colaboradores.filter((c) => c.estado !== 'guia_generada').map((c) => c.id)));
  }

  function generar() {
    setError(null);
    setLinks(null);
    setCopiadoTodos(false);
    startTransition(async () => {
      const res = await crearInvitacionesMasivas({ colaboradorIds: [...seleccionados] });
      if (res.ok) {
        setLinks(res.links ?? []);
        setSeleccionados(new Set());
      } else {
        setError(res.error ?? 'No se pudieron generar los links.');
      }
    });
  }

  const textoParaCopiar = useMemo(
    () => (links ?? []).map((l) => `${l.nombre}: ${l.link}`).join('\n'),
    [links]
  );

  function copiarTodos() {
    if (!links || links.length === 0) return;
    navigator.clipboard.writeText(textoParaCopiar).then(() => {
      setCopiadoTodos(true);
      setTimeout(() => setCopiadoTodos(false), 2000);
    });
  }

  function copiarUno(link: LinkGenerado) {
    navigator.clipboard.writeText(link.link).then(() => {
      setCopiadoId(link.colaboradorId);
      setTimeout(() => setCopiadoId(null), 2000);
    });
  }

  if (colaboradores.length === 0) {
    return (
      <p className="text-sm text-marmol-400 p-5">
        No hay colaboradores activos cargados todavía en tu empresa.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={seleccionarSinGuia}
          className="inline-flex items-center gap-1.5 rounded-lg border border-marmol-200 hover:border-flow-300 text-marmol-600 text-xs font-medium px-2.5 py-1.5 transition"
        >
          Seleccionar quienes no tienen Guía
        </button>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-marmol-500 border-b border-marmol-100">
              <th className="p-3 font-medium w-8">
                <input
                  type="checkbox"
                  checked={todosSeleccionados}
                  onChange={alternarTodos}
                  aria-label="Seleccionar todos"
                />
              </th>
              <th className="p-3 font-medium">Nombre</th>
              <th className="p-3 font-medium">Correo</th>
              <th className="p-3 font-medium">Estado</th>
            </tr>
          </thead>
          <tbody>
            {colaboradores.map((c) => {
              const cfg = ETIQUETA_ESTADO[c.estado];
              return (
                <tr
                  key={c.id}
                  className="border-b border-marmol-50 last:border-0 hover:bg-marmol-50 cursor-pointer"
                  onClick={() => alternarUno(c.id)}
                >
                  <td className="p-3" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={seleccionados.has(c.id)}
                      onChange={() => alternarUno(c.id)}
                      aria-label={`Seleccionar a ${c.nombre}`}
                    />
                  </td>
                  <td className="p-3 text-marmol-800 font-medium">{c.nombre}</td>
                  <td className="p-3 text-marmol-600">{c.correo ?? <span className="text-marmol-400">Sin correo</span>}</td>
                  <td className="p-3">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.clase}`}>
                      {cfg.texto}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <button
          type="button"
          disabled={pending || seleccionados.size === 0}
          onClick={generar}
          className="inline-flex items-center gap-1.5 rounded-lg bg-flow-500 hover:bg-flow-600 disabled:opacity-50 text-white text-sm font-medium px-3.5 py-2 transition"
        >
          <Send size={16} />
          {pending
            ? 'Generando…'
            : seleccionados.size === 0
              ? 'Generar links'
              : `Generar ${seleccionados.size} link${seleccionados.size === 1 ? '' : 's'}`}
        </button>
        {error && <p className="text-xs text-alto">{error}</p>}
      </div>

      {links && links.length > 0 && (
        <div className="card p-4 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h3 className="text-sm font-medium text-marmol-800">
              {links.length === 1 ? '1 link generado' : `${links.length} links generados`}
            </h3>
            <button
              type="button"
              onClick={copiarTodos}
              className="inline-flex items-center gap-1.5 rounded-lg border border-marmol-200 hover:border-flow-300 text-marmol-600 text-xs font-medium px-2.5 py-1.5 transition"
            >
              {copiadoTodos ? <Check size={12} /> : <Copy size={12} />} {copiadoTodos ? 'Copiado' : 'Copiar todos'}
            </button>
          </div>
          <ul className="space-y-2">
            {links.map((l) => (
              <li key={l.colaboradorId} className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-medium text-marmol-700 w-40 shrink-0 truncate" title={l.nombre}>
                  {l.nombre}
                </span>
                <input
                  readOnly
                  value={l.link}
                  onFocus={(e) => e.target.select()}
                  className="flex-1 min-w-[220px] rounded-lg border border-marmol-200 px-2.5 py-1.5 text-xs text-marmol-600"
                />
                <button
                  type="button"
                  onClick={() => copiarUno(l)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-marmol-200 hover:border-flow-300 text-marmol-600 text-xs font-medium px-2.5 py-1.5 transition"
                >
                  {copiadoId === l.colaboradorId ? <Check size={12} /> : <Copy size={12} />}
                  {copiadoId === l.colaboradorId ? 'Copiado' : 'Copiar'}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
