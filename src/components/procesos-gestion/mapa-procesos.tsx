'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { eliminarProceso, cambiarEstadoProceso } from '@/app/(dashboard)/procesos-gestion/actions';
import { FormularioProceso } from '@/components/procesos-gestion/formulario-proceso';
import { cn, formatearFecha } from '@/lib/utils';
import { LayoutGrid, Table2, GitBranch, Plus, Pencil, Trash2, FileText, ArrowRight, ArrowLeft } from 'lucide-react';

export type TipoProceso = 'estrategico' | 'misional' | 'apoyo' | 'evaluacion';
export type MarcoNormativo = 'iso_9001' | 'sst' | 'sarlaft_sagrilaft' | 'ptee' | 'interno';
export type EstadoProceso = 'vigente' | 'en_definicion' | 'obsoleto';

export interface Proceso {
  id: string;
  area_proceso: string;
  nombre: string;
  descripcion: string | null;
  tipo: TipoProceso | null;
  codigo: string | null;
  objetivo: string | null;
  estado: EstadoProceso;
  responsable_id: string | null;
  version: string | null;
  fecha_actualizacion: string;
  marcos: MarcoNormativo[];
}

export interface Interaccion {
  id: string;
  proceso_origen_id: string;
  proceso_destino_id: string;
  tipo: 'entrada' | 'apoyo';
  descripcion: string | null;
}

interface Colaborador {
  id: string;
  nombre_completo: string;
}

export const ETIQUETA_MARCO: Record<MarcoNormativo, string> = {
  iso_9001: 'ISO 9001',
  sst: 'SST',
  sarlaft_sagrilaft: 'SARLAFT/SAGRILAFT',
  ptee: 'PTEE',
  interno: 'Interno',
};

const TIPO_INFO: Record<TipoProceso, { titulo: string; descripcion: string; badge: string }> = {
  estrategico: { titulo: 'Procesos Estratégicos', descripcion: 'Orientan, deciden y direccionan la organización', badge: 'badge-deber' },
  misional: { titulo: 'Procesos Misionales', descripcion: 'La razón de ser de la organización, donde se genera el valor', badge: 'badge-alto' },
  apoyo: { titulo: 'Procesos de Apoyo', descripcion: 'Habilitan la operación del resto de procesos', badge: 'badge-hacer' },
  evaluacion: { titulo: 'Procesos de Evaluación', descripcion: 'Miden, auditan y verifican el desempeño', badge: 'badge-flow' },
};

const ESTADO_INFO: Record<EstadoProceso, { etiqueta: string; clase: string }> = {
  vigente: { etiqueta: 'Vigente', clase: 'badge-alto' },
  en_definicion: { etiqueta: 'En definición', clase: 'badge-medio' },
  obsoleto: { etiqueta: 'Obsoleto', clase: 'badge-marmol' },
};

export function MapaProcesos({
  procesosIniciales,
  interaccionesIniciales,
  colaboradores,
  puedeEditar,
}: {
  procesosIniciales: Proceso[];
  interaccionesIniciales: Interaccion[];
  colaboradores: Colaborador[];
  puedeEditar: boolean;
}) {
  const [procesos, setProcesos] = useState(procesosIniciales);
  const [interacciones] = useState(interaccionesIniciales);
  const [vista, setVista] = useState<'mapa' | 'cuadro' | 'interacciones'>('mapa');
  const [filtroMarco, setFiltroMarco] = useState<'todos' | MarcoNormativo>('todos');
  const [modal, setModal] = useState<{ proceso: Proceso | null } | null>(null);
  const [ordenCol, setOrdenCol] = useState<'codigo' | 'nombre' | 'tipo' | 'estado' | 'actualizado'>('codigo');
  const [ordenAsc, setOrdenAsc] = useState(true);

  const nombreColaborador = useMemo(() => {
    const mapa = new Map(colaboradores.map((c) => [c.id, c.nombre_completo]));
    return (id: string | null) => (id ? mapa.get(id) : undefined);
  }, [colaboradores]);

  const nombreProceso = useMemo(() => {
    const mapa = new Map(procesos.map((p) => [p.id, `${p.codigo ? p.codigo + ' · ' : ''}${p.nombre}`]));
    return (id: string) => mapa.get(id) ?? '—';
  }, [procesos]);

  const procesosFiltrados = useMemo(
    () => (filtroMarco === 'todos' ? procesos : procesos.filter((p) => p.marcos.includes(filtroMarco))),
    [procesos, filtroMarco]
  );

  function alGuardar(proceso: Proceso, esNuevo: boolean) {
    setProcesos((prev) => (esNuevo ? [...prev, proceso] : prev.map((p) => (p.id === proceso.id ? proceso : p))));
    setModal(null);
  }

  function eliminar(id: string) {
    if (!confirm('¿Eliminar este proceso? También se eliminan su caracterización, interacciones y tablero.')) return;
    setProcesos((prev) => prev.filter((p) => p.id !== id));
    eliminarProceso(id);
  }

  function cambiarEstado(id: string, estado: EstadoProceso) {
    setProcesos((prev) => prev.map((p) => (p.id === id ? { ...p, estado } : p)));
    cambiarEstadoProceso(id, estado);
  }

  const columnas: { key: typeof ordenCol; label: string }[] = [
    { key: 'codigo', label: 'Código' },
    { key: 'nombre', label: 'Nombre' },
    { key: 'tipo', label: 'Tipo' },
    { key: 'estado', label: 'Estado' },
    { key: 'actualizado', label: 'Actualizado' },
  ];

  const procesosOrdenados = useMemo(() => {
    const valor = (p: Proceso) => {
      if (ordenCol === 'codigo') return p.codigo ?? '';
      if (ordenCol === 'nombre') return p.nombre;
      if (ordenCol === 'tipo') return p.tipo ?? '';
      if (ordenCol === 'estado') return p.estado;
      return p.fecha_actualizacion;
    };
    const arr = [...procesosFiltrados].sort((a, b) => valor(a).localeCompare(valor(b)));
    return ordenAsc ? arr : arr.reverse();
  }, [procesosFiltrados, ordenCol, ordenAsc]);

  function alternarOrden(col: typeof ordenCol) {
    if (col === ordenCol) setOrdenAsc((a) => !a);
    else {
      setOrdenCol(col);
      setOrdenAsc(true);
    }
  }

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
        <div>
          <h2 className="font-display font-semibold text-secundario">Mapa de procesos</h2>
          <p className="text-xs text-marmol-400 mt-0.5">
            Estratégicos, misionales, de apoyo y de evaluación — organiza y clasifica los procesos documentados.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={filtroMarco}
            onChange={(e) => setFiltroMarco(e.target.value as typeof filtroMarco)}
            className="rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm"
          >
            <option value="todos">Todos los marcos</option>
            {Object.entries(ETIQUETA_MARCO).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
          <div className="flex rounded-lg border border-marmol-200 overflow-hidden">
            <button
              onClick={() => setVista('mapa')}
              className={cn('px-2.5 py-1.5 text-xs font-medium inline-flex items-center gap-1', vista === 'mapa' ? 'bg-flow-500 text-white' : 'text-marmol-500 hover:bg-marmol-50')}
            >
              <LayoutGrid size={13} /> Mapa
            </button>
            <button
              onClick={() => setVista('cuadro')}
              className={cn('px-2.5 py-1.5 text-xs font-medium inline-flex items-center gap-1 border-l border-marmol-200', vista === 'cuadro' ? 'bg-flow-500 text-white' : 'text-marmol-500 hover:bg-marmol-50')}
            >
              <Table2 size={13} /> Cuadro
            </button>
            <button
              onClick={() => setVista('interacciones')}
              className={cn('px-2.5 py-1.5 text-xs font-medium inline-flex items-center gap-1 border-l border-marmol-200', vista === 'interacciones' ? 'bg-flow-500 text-white' : 'text-marmol-500 hover:bg-marmol-50')}
            >
              <GitBranch size={13} /> Interacciones
            </button>
          </div>
          {puedeEditar && (
            <button
              onClick={() => setModal({ proceso: null })}
              className="inline-flex items-center gap-1 rounded-lg bg-flow-500 hover:bg-flow-600 text-white text-sm font-medium px-3 py-1.5"
            >
              <Plus size={14} /> Nuevo proceso
            </button>
          )}
        </div>
      </div>

      {vista === 'mapa' && (
        <div className="space-y-4">
          {(['estrategico', 'misional', 'apoyo', 'evaluacion'] as TipoProceso[]).map((tipo) => {
            const deEsteTipo = procesosOrdenados.filter((p) => p.tipo === tipo);
            if (deEsteTipo.length === 0) return null;
            const info = TIPO_INFO[tipo];
            return (
              <div key={tipo} className="rounded-xl border border-marmol-100 bg-marmol-50/60 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className={cn('text-[11px] font-semibold rounded-full px-2 py-0.5', info.badge)}>{info.titulo}</span>
                  <span className="text-xs text-marmol-400">{info.descripcion}</span>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {deEsteTipo.map((p) => (
                    <TarjetaProceso
                      key={p.id}
                      proceso={p}
                      responsable={nombreColaborador(p.responsable_id)}
                      puedeEditar={puedeEditar}
                      onEditar={() => setModal({ proceso: p })}
                      onEliminar={() => eliminar(p.id)}
                      onCambiarEstado={(estado) => cambiarEstado(p.id, estado)}
                    />
                  ))}
                </div>
              </div>
            );
          })}

          {procesosOrdenados.some((p) => !p.tipo) && (
            <div className="rounded-xl border border-dashed border-marmol-200 p-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[11px] font-semibold rounded-full px-2 py-0.5 badge-marmol">Sin clasificar</span>
                <span className="text-xs text-marmol-400">Procesos documentados antes del mapa — edítalos para ubicarlos en una categoría</span>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {procesosOrdenados
                  .filter((p) => !p.tipo)
                  .map((p) => (
                    <TarjetaProceso
                      key={p.id}
                      proceso={p}
                      responsable={nombreColaborador(p.responsable_id)}
                      puedeEditar={puedeEditar}
                      onEditar={() => setModal({ proceso: p })}
                      onEliminar={() => eliminar(p.id)}
                      onCambiarEstado={(estado) => cambiarEstado(p.id, estado)}
                    />
                  ))}
              </div>
            </div>
          )}

          {procesosOrdenados.length === 0 && <p className="text-sm text-marmol-400 text-center py-8">Sin procesos documentados todavía.</p>}
        </div>
      )}

      {vista === 'cuadro' && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-marmol-200">
                {columnas.map((c) => (
                  <th
                    key={c.key}
                    onClick={() => alternarOrden(c.key)}
                    className="text-left font-medium text-marmol-500 px-2 py-2 cursor-pointer select-none hover:text-flow-600"
                  >
                    {c.label} {ordenCol === c.key && (ordenAsc ? '▲' : '▼')}
                  </th>
                ))}
                <th className="px-2 py-2" />
              </tr>
            </thead>
            <tbody>
              {procesosOrdenados.map((p) => (
                <tr key={p.id} className={cn('group border-b border-marmol-50 hover:bg-marmol-50/60', p.estado === 'obsoleto' && 'opacity-50')}>
                  <td className="px-2 py-2 font-medium text-marmol-700">{p.codigo ?? '—'}</td>
                  <td className="px-2 py-2">
                    <Link href={`/procesos-gestion/${p.id}`} className="text-marmol-800 hover:text-flow-600">
                      {p.nombre}
                    </Link>
                    <p className="text-xs text-marmol-400">{p.area_proceso}</p>
                  </td>
                  <td className="px-2 py-2 text-marmol-600">{p.tipo ? TIPO_INFO[p.tipo].titulo.replace('Procesos ', '') : 'Sin clasificar'}</td>
                  <td className="px-2 py-2">
                    <span className={cn('text-[11px] rounded-full px-2 py-0.5 font-medium', ESTADO_INFO[p.estado].clase)}>{ESTADO_INFO[p.estado].etiqueta}</span>
                  </td>
                  <td className="px-2 py-2 text-marmol-500 text-xs">{formatearFecha(p.fecha_actualizacion)}</td>
                  <td className="px-2 py-2">
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                      <Link href={`/procesos-gestion/${p.id}`} title="Ver ficha" className="text-marmol-300 hover:text-flow-600">
                        <FileText size={14} />
                      </Link>
                      {puedeEditar && (
                        <>
                          <button onClick={() => setModal({ proceso: p })} title="Editar" className="text-marmol-300 hover:text-flow-600">
                            <Pencil size={13} />
                          </button>
                          <button onClick={() => eliminar(p.id)} title="Eliminar" className="text-marmol-300 hover:text-bajo">
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {procesosOrdenados.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center text-marmol-400 py-8">
                    Sin procesos documentados todavía.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {vista === 'interacciones' && (
        <div className="space-y-2">
          <p className="text-xs text-marmol-400 mb-2">
            Generadas automáticamente a partir de lo que cada proceso declaró que recibe y entrega — nadie dibuja el mapa a mano.
          </p>
          {procesosOrdenados.map((p) => {
            const recibe = interacciones.filter((i) => i.proceso_destino_id === p.id);
            const entrega = interacciones.filter((i) => i.proceso_origen_id === p.id);
            if (recibe.length === 0 && entrega.length === 0) return null;
            return (
              <div key={p.id} className="rounded-lg border border-marmol-100 p-3">
                <p className="text-sm font-medium text-marmol-800 mb-1.5">
                  {p.codigo ? `${p.codigo} · ` : ''}
                  {p.nombre}
                </p>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    {recibe.map((i) => (
                      <p key={i.id} className="text-xs text-marmol-500 flex items-start gap-1.5 mb-1">
                        <ArrowLeft size={12} className={cn('mt-0.5 shrink-0', i.tipo === 'apoyo' ? 'text-deber' : 'text-saber')} />
                        <span>
                          <span className="font-medium text-marmol-700">{nombreProceso(i.proceso_origen_id)}</span>
                          {i.descripcion && <> — {i.descripcion}</>}
                        </span>
                      </p>
                    ))}
                  </div>
                  <div>
                    {entrega.map((i) => (
                      <p key={i.id} className="text-xs text-marmol-500 flex items-start gap-1.5 mb-1">
                        <ArrowRight size={12} className={cn('mt-0.5 shrink-0', i.tipo === 'apoyo' ? 'text-deber' : 'text-saber')} />
                        <span>
                          <span className="font-medium text-marmol-700">{nombreProceso(i.proceso_destino_id)}</span>
                          {i.descripcion && <> — {i.descripcion}</>}
                        </span>
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
          {interacciones.length === 0 && <p className="text-sm text-marmol-400 text-center py-8">Sin interacciones configuradas todavía.</p>}
        </div>
      )}

      {modal && (
        <FormularioProceso
          proceso={modal.proceso}
          procesos={procesos}
          colaboradores={colaboradores}
          interaccionesDelProceso={modal.proceso ? interacciones.filter((i) => i.proceso_origen_id === modal.proceso!.id || i.proceso_destino_id === modal.proceso!.id) : []}
          onCerrar={() => setModal(null)}
          onGuardado={alGuardar}
        />
      )}
    </div>
  );
}

function TarjetaProceso({
  proceso,
  responsable,
  puedeEditar,
  onEditar,
  onEliminar,
  onCambiarEstado,
}: {
  proceso: Proceso;
  responsable: string | undefined;
  puedeEditar: boolean;
  onEditar: () => void;
  onEliminar: () => void;
  onCambiarEstado: (estado: EstadoProceso) => void;
}) {
  return (
    <div className={cn('card p-3 group', proceso.estado === 'obsoleto' && 'opacity-50')}>
      <div className="flex items-start justify-between gap-1.5">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap mb-1">
            {proceso.codigo && <span className="text-[10px] font-semibold text-marmol-400">{proceso.codigo}</span>}
            {puedeEditar ? (
              <select
                value={proceso.estado}
                onChange={(e) => onCambiarEstado(e.target.value as EstadoProceso)}
                className={cn('text-[10px] rounded-full px-1.5 py-0.5 font-medium border-0 cursor-pointer', ESTADO_INFO[proceso.estado].clase)}
              >
                {Object.entries(ESTADO_INFO).map(([v, info]) => (
                  <option key={v} value={v}>
                    {info.etiqueta}
                  </option>
                ))}
              </select>
            ) : (
              <span className={cn('text-[10px] rounded-full px-1.5 py-0.5 font-medium', ESTADO_INFO[proceso.estado].clase)}>{ESTADO_INFO[proceso.estado].etiqueta}</span>
            )}
          </div>
          <Link href={`/procesos-gestion/${proceso.id}`} className="text-sm font-medium text-marmol-800 hover:text-flow-600 break-words">
            {proceso.nombre}
          </Link>
          {responsable && <p className="text-xs text-marmol-400 mt-0.5">{responsable}</p>}
          {proceso.marcos.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {proceso.marcos.map((m) => (
                <span key={m} className="text-[10px] rounded-full bg-flow-50 text-flow-700 px-1.5 py-0.5 font-medium">
                  {ETIQUETA_MARCO[m]}
                </span>
              ))}
            </div>
          )}
        </div>
        {puedeEditar && (
          <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <button onClick={onEditar} className="text-marmol-300 hover:text-flow-600">
              <Pencil size={13} />
            </button>
            <button onClick={onEliminar} className="text-marmol-300 hover:text-bajo">
              <Trash2 size={13} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
