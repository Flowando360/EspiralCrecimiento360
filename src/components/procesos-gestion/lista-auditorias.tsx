'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { crearAuditoria, eliminarAuditoria } from '@/app/(dashboard)/procesos-gestion/auditorias/actions';
import { cn, formatearFecha } from '@/lib/utils';
import { Plus, Trash2, X, ClipboardCheck } from 'lucide-react';

type MarcoNormativo = 'iso_9001' | 'sst' | 'sarlaft_sagrilaft' | 'ptee' | 'interno';
type EstadoAuditoria = 'planeada' | 'en_curso' | 'cerrada';

const ETIQUETA_MARCO: Record<MarcoNormativo, string> = {
  iso_9001: 'ISO 9001',
  sst: 'SST',
  sarlaft_sagrilaft: 'SARLAFT/SAGRILAFT',
  ptee: 'PTEE',
  interno: 'Interno',
};

const ETIQUETA_ESTADO: Record<EstadoAuditoria, { texto: string; clase: string }> = {
  planeada: { texto: 'Planeada', clase: 'badge-marmol' },
  en_curso: { texto: 'En curso', clase: 'badge-medio' },
  cerrada: { texto: 'Cerrada', clase: 'badge-alto' },
};

export interface Auditoria {
  id: string;
  codigo: string | null;
  objetivo: string | null;
  alcance: string | null;
  marco_normativo: MarcoNormativo | null;
  auditor_id: string | null;
  auditor_externo_nombre: string | null;
  fecha_planeada: string | null;
  fecha_ejecutada: string | null;
  estado: EstadoAuditoria;
  procesos: { id: string; nombre: string; codigo: string | null }[];
  hallazgos_abiertos: number;
}

interface ProcesoOpcion {
  id: string;
  nombre: string;
  codigo: string | null;
}

interface Colaborador {
  id: string;
  nombre_completo: string;
}

export function ListaAuditorias({
  auditoriasIniciales,
  procesos,
  colaboradores,
  puedeEditar,
}: {
  auditoriasIniciales: Auditoria[];
  procesos: ProcesoOpcion[];
  colaboradores: Colaborador[];
  puedeEditar: boolean;
}) {
  const [auditorias, setAuditorias] = useState(auditoriasIniciales);
  const [modalAbierto, setModalAbierto] = useState(false);

  function eliminar(id: string) {
    if (!confirm('¿Eliminar esta auditoría? También se eliminan sus hallazgos.')) return;
    setAuditorias((prev) => prev.filter((a) => a.id !== id));
    eliminarAuditoria(id);
  }

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="font-display font-semibold text-secundario">Auditorías internas</h2>
          <p className="text-xs text-marmol-400 mt-0.5">Planea, ejecuta y da seguimiento a los hallazgos de tus auditorías internas.</p>
        </div>
        {puedeEditar && (
          <button onClick={() => setModalAbierto(true)} className="inline-flex items-center gap-1 rounded-lg bg-flow-500 hover:bg-flow-600 text-white text-sm font-medium px-3 py-1.5">
            <Plus size={14} /> Nueva auditoría
          </button>
        )}
      </div>

      <div className="space-y-2">
        {auditorias.map((a) => (
          <div key={a.id} className="flex items-start justify-between gap-2 border-b border-marmol-100 pb-2">
            <Link href={`/procesos-gestion/auditorias/${a.id}`} className="min-w-0 group">
              <div className="flex items-center gap-1.5 flex-wrap">
                {a.codigo && <span className="text-xs font-semibold text-marmol-400">{a.codigo}</span>}
                <span className={cn('text-[11px] rounded-full px-2 py-0.5 font-medium', ETIQUETA_ESTADO[a.estado].clase)}>{ETIQUETA_ESTADO[a.estado].texto}</span>
                {a.marco_normativo && <span className="text-[11px] rounded-full bg-flow-50 text-flow-700 px-2 py-0.5 font-medium">{ETIQUETA_MARCO[a.marco_normativo]}</span>}
                {a.hallazgos_abiertos > 0 && (
                  <span className="text-[11px] rounded-full badge-bajo px-2 py-0.5 font-medium">{a.hallazgos_abiertos} hallazgo{a.hallazgos_abiertos !== 1 ? 's' : ''} abierto{a.hallazgos_abiertos !== 1 ? 's' : ''}</span>
                )}
              </div>
              <p className="text-sm font-medium text-marmol-800 mt-1 group-hover:text-flow-600">{a.objetivo || 'Sin objetivo definido'}</p>
              <p className="text-xs text-marmol-400 mt-0.5">
                {a.procesos.map((p) => p.codigo ?? p.nombre).join(', ') || 'Sin procesos asociados'}
                {a.fecha_planeada && ` · Planeada ${formatearFecha(a.fecha_planeada)}`}
              </p>
            </Link>
            {puedeEditar && (
              <button onClick={() => eliminar(a.id)} className="text-marmol-300 hover:text-bajo shrink-0">
                <Trash2 size={14} />
              </button>
            )}
          </div>
        ))}
        {auditorias.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <ClipboardCheck className="text-marmol-300" size={28} />
            <p className="text-sm text-marmol-400">Sin auditorías internas registradas todavía.</p>
          </div>
        )}
      </div>

      {modalAbierto && (
        <ModalNuevaAuditoria
          procesos={procesos}
          colaboradores={colaboradores}
          onCerrar={() => setModalAbierto(false)}
          onCreada={(a) => {
            setAuditorias((prev) => [a, ...prev]);
            setModalAbierto(false);
          }}
        />
      )}
    </div>
  );
}

function ModalNuevaAuditoria({
  procesos,
  colaboradores,
  onCerrar,
  onCreada,
}: {
  procesos: ProcesoOpcion[];
  colaboradores: Colaborador[];
  onCerrar: () => void;
  onCreada: (a: Auditoria) => void;
}) {
  const [objetivo, setObjetivo] = useState('');
  const [alcance, setAlcance] = useState('');
  const [marcoNormativo, setMarcoNormativo] = useState<MarcoNormativo | ''>('');
  const [auditorId, setAuditorId] = useState('');
  const [auditorExternoNombre, setAuditorExternoNombre] = useState('');
  const [fechaPlaneada, setFechaPlaneada] = useState('');
  const [procesoIds, setProcesoIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function toggleProceso(id: string) {
    setProcesoIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function crear() {
    setError(null);
    startTransition(async () => {
      const res = await crearAuditoria({
        objetivo,
        alcance,
        marcoNormativo: marcoNormativo || undefined,
        auditorId: auditorId || undefined,
        auditorExternoNombre: auditorExternoNombre || undefined,
        fechaPlaneada: fechaPlaneada || undefined,
        procesoIds,
      });
      if (res.ok) {
        onCreada({
          id: res.id,
          codigo: res.codigo,
          objetivo: objetivo || null,
          alcance: alcance || null,
          marco_normativo: (marcoNormativo || null) as MarcoNormativo | null,
          auditor_id: auditorId || null,
          auditor_externo_nombre: auditorExternoNombre || null,
          fecha_planeada: fechaPlaneada || null,
          fecha_ejecutada: null,
          estado: 'planeada',
          procesos: procesos.filter((p) => procesoIds.includes(p.id)),
          hallazgos_abiertos: 0,
        });
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30" onClick={onCerrar} />
      <div className="relative w-full max-w-lg bg-white rounded-xl shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-marmol-100">
          <h2 className="font-display font-semibold text-secundario">Nueva auditoría interna</h2>
          <button onClick={onCerrar} className="text-marmol-400 hover:text-marmol-700">
            <X size={18} />
          </button>
        </div>
        <div className="p-5 space-y-3 max-h-[65vh] overflow-y-auto">
          <textarea value={objetivo} onChange={(e) => setObjetivo(e.target.value)} placeholder="Objetivo de la auditoría" rows={2} className="w-full rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm" autoFocus />
          <textarea value={alcance} onChange={(e) => setAlcance(e.target.value)} placeholder="Alcance (opcional)" rows={2} className="w-full rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm" />
          <div className="grid grid-cols-2 gap-2">
            <select value={marcoNormativo} onChange={(e) => setMarcoNormativo(e.target.value as MarcoNormativo)} className="rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm">
              <option value="">Marco normativo (opcional)</option>
              {Object.entries(ETIQUETA_MARCO).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
            <input type="date" value={fechaPlaneada} onChange={(e) => setFechaPlaneada(e.target.value)} className="rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <select value={auditorId} onChange={(e) => setAuditorId(e.target.value)} className="rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm">
              <option value="">Auditor (de la plataforma)</option>
              {colaboradores.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre_completo}
                </option>
              ))}
            </select>
            <input value={auditorExternoNombre} onChange={(e) => setAuditorExternoNombre(e.target.value)} placeholder="o nombre de auditor externo" className="rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm" />
          </div>
          <div>
            <p className="text-xs text-marmol-500 mb-1.5">Procesos que cubre esta auditoría</p>
            <div className="grid grid-cols-2 gap-1.5 max-h-40 overflow-y-auto">
              {procesos.map((p) => (
                <label key={p.id} className={cn('flex items-center gap-1.5 rounded-lg border px-2 py-1.5 text-xs cursor-pointer', procesoIds.includes(p.id) ? 'border-flow-500 bg-flow-50 text-flow-700' : 'border-marmol-200 text-marmol-600')}>
                  <input type="checkbox" checked={procesoIds.includes(p.id)} onChange={() => toggleProceso(p.id)} className="accent-flow-600" />
                  {p.codigo ? `${p.codigo} · ` : ''}
                  {p.nombre}
                </label>
              ))}
            </div>
          </div>
          {error && <p className="text-sm text-bajo">{error}</p>}
        </div>
        <div className="flex justify-end gap-2 px-5 py-4 border-t border-marmol-100">
          <button onClick={onCerrar} className="rounded-lg px-3 py-1.5 text-sm text-marmol-600 hover:bg-marmol-50">
            Cancelar
          </button>
          <button onClick={crear} disabled={pending} className="rounded-lg bg-flow-500 hover:bg-flow-600 disabled:opacity-40 text-white text-sm font-medium px-4 py-1.5">
            {pending ? 'Creando…' : 'Crear auditoría'}
          </button>
        </div>
      </div>
    </div>
  );
}
