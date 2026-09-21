'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { crearRiesgo, eliminarRiesgo, actualizarRiesgo, marcarRiesgoRevisado } from '@/app/(dashboard)/procesos-gestion/actions';
import { Trash2, Plus, Pencil, Check, X, RefreshCw, AlertTriangle, ListChecks } from 'lucide-react';
import { cn, formatearFecha } from '@/lib/utils';

const ETIQUETA_MARCO: Record<string, string> = {
  iso_9001: 'ISO 9001',
  sst: 'SST',
  sarlaft_sagrilaft: 'SARLAFT/SAGRILAFT',
  ptee: 'PTEE',
  interno: 'Interno',
};

const CLASE_IMPACTO: Record<string, string> = {
  alto: 'badge-bajo',
  medio: 'badge-medio',
  bajo: 'badge-alto',
};

const DIAS_FRECUENCIA: Record<string, number> = {
  trimestral: 90,
  semestral: 182,
  anual: 365,
};

interface Riesgo {
  id: string;
  marco_normativo: string;
  tipo: string;
  riesgo: string;
  categoria_riesgo: string | null;
  probabilidad: string | null;
  impacto: string | null;
  control: string | null;
  proceso_id: string | null;
  frecuencia_revision: string | null;
  fecha_ultima_revision: string | null;
  riesgo_residual: string | null;
}

interface ProcesoOpcion {
  id: string;
  nombre: string;
  codigo: string | null;
}

function estaVencido(r: Riesgo): boolean {
  if (!r.frecuencia_revision || !r.fecha_ultima_revision) return false;
  const dias = DIAS_FRECUENCIA[r.frecuencia_revision] ?? 365;
  const limite = new Date(r.fecha_ultima_revision);
  limite.setDate(limite.getDate() + dias);
  return limite < new Date();
}

export function ListaRiesgos({
  riesgosIniciales,
  procesos,
  puedeEditar,
}: {
  riesgosIniciales: Riesgo[];
  procesos: ProcesoOpcion[];
  puedeEditar: boolean;
}) {
  const [riesgos, setRiesgos] = useState(riesgosIniciales);
  const [marcoNormativo, setMarcoNormativo] = useState<'iso_9001' | 'sst' | 'sarlaft_sagrilaft' | 'ptee' | 'interno'>('iso_9001');
  const [tipo, setTipo] = useState<'riesgo' | 'oportunidad'>('riesgo');
  const [riesgo, setRiesgo] = useState('');
  const [probabilidad, setProbabilidad] = useState<'baja' | 'media' | 'alta'>('media');
  const [impacto, setImpacto] = useState<'bajo' | 'medio' | 'alto'>('medio');
  const [control, setControl] = useState('');
  const [procesoId, setProcesoId] = useState('');
  const [frecuenciaRevision, setFrecuenciaRevision] = useState<'trimestral' | 'semestral' | 'anual' | ''>('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const nombreProceso = (id: string | null) => {
    if (!id) return null;
    const p = procesos.find((p) => p.id === id);
    return p ? `${p.codigo ? p.codigo + ' · ' : ''}${p.nombre}` : null;
  };

  function agregar() {
    setError(null);
    startTransition(async () => {
      const res = await crearRiesgo({ marcoNormativo, tipo, riesgo, probabilidad, impacto, control, procesoId: procesoId || undefined, frecuenciaRevision: frecuenciaRevision || undefined });
      if (res.ok) {
        setRiesgos((prev) => [
          ...prev,
          {
            id: res.id,
            marco_normativo: marcoNormativo,
            tipo,
            riesgo,
            categoria_riesgo: null,
            probabilidad,
            impacto,
            control: control || null,
            proceso_id: procesoId || null,
            frecuencia_revision: frecuenciaRevision || null,
            fecha_ultima_revision: new Date().toISOString().slice(0, 10),
            riesgo_residual: null,
          },
        ]);
        setRiesgo('');
        setControl('');
        setProcesoId('');
        setFrecuenciaRevision('');
      } else {
        setError(res.error);
      }
    });
  }

  function eliminar(id: string) {
    setRiesgos((prev) => prev.filter((r) => r.id !== id));
    startTransition(async () => {
      await eliminarRiesgo(id);
    });
  }

  function revisar(id: string, probabilidad: string, impacto: string, riesgoResidual: string) {
    setRiesgos((prev) => prev.map((r) => (r.id === id ? { ...r, fecha_ultima_revision: new Date().toISOString().slice(0, 10), riesgo_residual: riesgoResidual } : r)));
    startTransition(async () => {
      await marcarRiesgoRevisado({
        id,
        probabilidad: probabilidad as 'baja' | 'media' | 'alta',
        impacto: impacto as 'bajo' | 'medio' | 'alto',
        riesgoResidual: riesgoResidual as 'bajo' | 'medio' | 'alto',
      });
    });
  }

  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [edMarco, setEdMarco] = useState<typeof marcoNormativo>('iso_9001');
  const [edTipo, setEdTipo] = useState<typeof tipo>('riesgo');
  const [edRiesgo, setEdRiesgo] = useState('');
  const [edProbabilidad, setEdProbabilidad] = useState<typeof probabilidad>('media');
  const [edImpacto, setEdImpacto] = useState<typeof impacto>('medio');
  const [edControl, setEdControl] = useState('');
  const [edProcesoId, setEdProcesoId] = useState('');
  const [edFrecuencia, setEdFrecuencia] = useState<typeof frecuenciaRevision>('');
  const [edResidual, setEdResidual] = useState<'bajo' | 'medio' | 'alto' | ''>('');

  function iniciarEdicion(r: Riesgo) {
    setEditandoId(r.id);
    setEdMarco(r.marco_normativo as typeof edMarco);
    setEdTipo((r.tipo as typeof edTipo) ?? 'riesgo');
    setEdRiesgo(r.riesgo);
    setEdProbabilidad((r.probabilidad as typeof edProbabilidad) ?? 'media');
    setEdImpacto((r.impacto as typeof edImpacto) ?? 'medio');
    setEdControl(r.control ?? '');
    setEdProcesoId(r.proceso_id ?? '');
    setEdFrecuencia((r.frecuencia_revision as typeof edFrecuencia) ?? '');
    setEdResidual((r.riesgo_residual as typeof edResidual) ?? '');
  }

  function guardarEdicion(id: string) {
    setError(null);
    startTransition(async () => {
      const res = await actualizarRiesgo({
        id,
        marcoNormativo: edMarco,
        tipo: edTipo,
        riesgo: edRiesgo,
        probabilidad: edProbabilidad,
        impacto: edImpacto,
        control: edControl,
        procesoId: edProcesoId || undefined,
        frecuenciaRevision: edFrecuencia || undefined,
        riesgoResidual: edResidual || undefined,
      });
      if (res.ok) {
        setRiesgos((prev) =>
          prev.map((r) =>
            r.id === id
              ? {
                  ...r,
                  marco_normativo: edMarco,
                  tipo: edTipo,
                  riesgo: edRiesgo,
                  probabilidad: edProbabilidad,
                  impacto: edImpacto,
                  control: edControl || null,
                  proceso_id: edProcesoId || null,
                  frecuencia_revision: edFrecuencia || null,
                  riesgo_residual: edResidual || null,
                }
              : r
          )
        );
        setEditandoId(null);
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <div className="card p-5">
      <h2 className="font-display font-semibold text-secundario mb-3">Matriz de riesgos y oportunidades</h2>

      <div className="space-y-2 mb-4">
        {riesgos.map((r) =>
          editandoId === r.id ? (
            <div key={r.id} className="space-y-1.5 border-b border-marmol-100 pb-2 bg-flow-50/40 -mx-1 px-1 rounded">
              <div className="grid grid-cols-3 gap-2">
                <select value={edMarco} onChange={(e) => setEdMarco(e.target.value as typeof edMarco)} className="rounded-lg border border-marmol-200 px-2 py-1 text-sm">
                  {Object.entries(ETIQUETA_MARCO).map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </select>
                <select value={edTipo} onChange={(e) => setEdTipo(e.target.value as typeof edTipo)} className="rounded-lg border border-marmol-200 px-2 py-1 text-sm">
                  <option value="riesgo">Riesgo</option>
                  <option value="oportunidad">Oportunidad</option>
                </select>
                <select value={edProcesoId} onChange={(e) => setEdProcesoId(e.target.value)} className="rounded-lg border border-marmol-200 px-2 py-1 text-sm">
                  <option value="">Sin proceso asociado</option>
                  {procesos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.codigo ? `${p.codigo} · ` : ''}
                      {p.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <select value={edProbabilidad} onChange={(e) => setEdProbabilidad(e.target.value as typeof edProbabilidad)} className="rounded-lg border border-marmol-200 px-2 py-1 text-sm">
                  <option value="baja">Prob. baja</option>
                  <option value="media">Prob. media</option>
                  <option value="alta">Prob. alta</option>
                </select>
                <select value={edImpacto} onChange={(e) => setEdImpacto(e.target.value as typeof edImpacto)} className="rounded-lg border border-marmol-200 px-2 py-1 text-sm">
                  <option value="bajo">Impacto bajo</option>
                  <option value="medio">Impacto medio</option>
                  <option value="alto">Impacto alto</option>
                </select>
                <select value={edResidual} onChange={(e) => setEdResidual(e.target.value as typeof edResidual)} className="rounded-lg border border-marmol-200 px-2 py-1 text-sm">
                  <option value="">Residual sin definir</option>
                  <option value="bajo">Residual bajo</option>
                  <option value="medio">Residual medio</option>
                  <option value="alto">Residual alto</option>
                </select>
              </div>
              <input value={edRiesgo} onChange={(e) => setEdRiesgo(e.target.value)} className="w-full rounded-lg border border-marmol-200 px-2 py-1 text-sm" />
              <div className="grid grid-cols-2 gap-2">
                <input value={edControl} onChange={(e) => setEdControl(e.target.value)} placeholder="Control" className="rounded-lg border border-marmol-200 px-2 py-1 text-sm" />
                <select value={edFrecuencia} onChange={(e) => setEdFrecuencia(e.target.value as typeof edFrecuencia)} className="rounded-lg border border-marmol-200 px-2 py-1 text-sm">
                  <option value="">Sin frecuencia de revisión</option>
                  <option value="trimestral">Revisar trimestral</option>
                  <option value="semestral">Revisar semestral</option>
                  <option value="anual">Revisar anual</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => guardarEdicion(r.id)} disabled={pending || !edRiesgo.trim()} className="inline-flex items-center gap-1 rounded-lg bg-flow-500 hover:bg-flow-600 disabled:opacity-40 text-white text-xs font-medium px-2.5 py-1.5">
                  <Check size={12} /> Guardar
                </button>
                <button onClick={() => setEditandoId(null)} disabled={pending} className="inline-flex items-center gap-1 rounded-lg border border-marmol-200 text-marmol-600 hover:bg-marmol-100 text-xs font-medium px-2.5 py-1.5">
                  <X size={12} /> Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div key={r.id} className="flex items-start justify-between gap-2 border-b border-marmol-100 pb-2">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs rounded-full bg-flow-50 text-flow-700 px-2 py-0.5 font-medium">{ETIQUETA_MARCO[r.marco_normativo]}</span>
                  <span className={cn('text-xs rounded-full px-2 py-0.5 font-medium', r.tipo === 'oportunidad' ? 'badge-saber' : 'badge-marmol')}>
                    {r.tipo === 'oportunidad' ? 'Oportunidad' : 'Riesgo'}
                  </span>
                  {r.impacto && <span className={cn('text-xs rounded-full px-2 py-0.5 font-medium', CLASE_IMPACTO[r.impacto])}>Impacto {r.impacto}</span>}
                  {r.riesgo_residual && <span className={cn('text-xs rounded-full px-2 py-0.5 font-medium', CLASE_IMPACTO[r.riesgo_residual])}>Residual {r.riesgo_residual}</span>}
                  {estaVencido(r) && (
                    <span className="text-xs rounded-full px-2 py-0.5 font-medium badge-bajo inline-flex items-center gap-1">
                      <AlertTriangle size={11} /> Revisión vencida
                    </span>
                  )}
                </div>
                <p className="text-sm font-medium text-marmol-800 mt-1">{r.riesgo}</p>
                {r.control && <p className="text-xs text-marmol-500">Control: {r.control}</p>}
                <p className="text-xs text-marmol-400 mt-0.5">
                  {nombreProceso(r.proceso_id) && <>{nombreProceso(r.proceso_id)} · </>}
                  {r.frecuencia_revision ? `Revisión ${r.frecuencia_revision}` : 'Sin frecuencia de revisión'}
                  {r.fecha_ultima_revision && ` · Última revisión ${formatearFecha(r.fecha_ultima_revision)}`}
                </p>
              </div>
              {puedeEditar && (
                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={`/procesos-gestion/acpm?origenRiesgo=${r.id}${r.proceso_id ? `&proceso=${r.proceso_id}` : ''}`}
                    title="Crear ACPM desde este riesgo"
                    className="text-marmol-300 hover:text-flow-600"
                  >
                    <ListChecks size={13} />
                  </Link>
                  {r.frecuencia_revision && (
                    <button
                      onClick={() => revisar(r.id, r.probabilidad ?? 'media', r.impacto ?? 'medio', r.riesgo_residual ?? r.impacto ?? 'medio')}
                      title="Marcar revisado hoy"
                      className="text-marmol-300 hover:text-alto"
                    >
                      <RefreshCw size={13} />
                    </button>
                  )}
                  <button onClick={() => iniciarEdicion(r)} className="text-marmol-300 hover:text-flow-600">
                    <Pencil size={13} />
                  </button>
                  <button onClick={() => eliminar(r.id)} className="text-marmol-300 hover:text-bajo">
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>
          )
        )}
        {riesgos.length === 0 && <p className="text-sm text-marmol-400">Sin riesgos u oportunidades registrados todavía.</p>}
      </div>

      {puedeEditar && (
        <div className="space-y-2 border-t border-marmol-100 pt-3">
          <div className="grid grid-cols-3 gap-2">
            <select value={marcoNormativo} onChange={(e) => setMarcoNormativo(e.target.value as typeof marcoNormativo)} className="rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm">
              {Object.entries(ETIQUETA_MARCO).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
            <select value={tipo} onChange={(e) => setTipo(e.target.value as typeof tipo)} className="rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm">
              <option value="riesgo">Riesgo</option>
              <option value="oportunidad">Oportunidad</option>
            </select>
            <select value={procesoId} onChange={(e) => setProcesoId(e.target.value)} className="rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm">
              <option value="">Sin proceso asociado</option>
              {procesos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.codigo ? `${p.codigo} · ` : ''}
                  {p.nombre}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <select value={probabilidad} onChange={(e) => setProbabilidad(e.target.value as typeof probabilidad)} className="rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm">
              <option value="baja">Prob. baja</option>
              <option value="media">Prob. media</option>
              <option value="alta">Prob. alta</option>
            </select>
            <select value={impacto} onChange={(e) => setImpacto(e.target.value as typeof impacto)} className="rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm">
              <option value="bajo">Impacto bajo</option>
              <option value="medio">Impacto medio</option>
              <option value="alto">Impacto alto</option>
            </select>
          </div>
          <input value={riesgo} onChange={(e) => setRiesgo(e.target.value)} placeholder="Descripción del riesgo/oportunidad" className="w-full rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm" />
          <div className="grid grid-cols-2 gap-2">
            <input value={control} onChange={(e) => setControl(e.target.value)} placeholder="Control asociado (opcional)" className="rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm" />
            <select value={frecuenciaRevision} onChange={(e) => setFrecuenciaRevision(e.target.value as typeof frecuenciaRevision)} className="rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm">
              <option value="">Sin frecuencia de revisión</option>
              <option value="trimestral">Revisar trimestral</option>
              <option value="semestral">Revisar semestral</option>
              <option value="anual">Revisar anual</option>
            </select>
          </div>
          <button onClick={agregar} disabled={pending || !riesgo.trim()} className="inline-flex items-center gap-1 rounded-lg bg-flow-500 hover:bg-flow-600 disabled:opacity-40 text-white text-sm font-medium px-3 py-1.5">
            <Plus size={14} /> Agregar
          </button>
          {error && <p className="text-sm text-bajo">{error}</p>}
        </div>
      )}
    </div>
  );
}
