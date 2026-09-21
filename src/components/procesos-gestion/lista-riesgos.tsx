'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { crearRiesgo, eliminarRiesgo, actualizarRiesgo, marcarRiesgoRevisado } from '@/app/(dashboard)/procesos-gestion/actions';
import { Trash2, Plus, Pencil, Check, X, RefreshCw, AlertTriangle, ListChecks } from 'lucide-react';
import { cn, formatearFecha } from '@/lib/utils';
import {
  CATEGORIAS_RIESGO,
  ETIQUETA_CATEGORIA,
  ETIQUETA_EVALUACION,
  ETIQUETA_EFECTIVIDAD_CONTROL,
  etiquetaGradoImpacto,
  etiquetaGradoProbabilidad,
  calcularValoracionInherente,
  calcularValoracionResidual,
  evaluarNivel,
  type CategoriaRiesgo,
  type TipoRiesgo,
} from '@/lib/calculos/matriz-riesgos';

const ETIQUETA_MARCO: Record<string, string> = {
  iso_9001: 'ISO 9001',
  sst: 'SST',
  sarlaft_sagrilaft: 'SARLAFT/SAGRILAFT',
  ptee: 'PTEE',
  interno: 'Interno',
};

const CLASE_NIVEL: Record<string, string> = {
  alto: 'badge-bajo',
  clave: 'badge-bajo',
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
  tipo: TipoRiesgo;
  riesgo: string;
  consecuencia: string | null;
  categoria: CategoriaRiesgo;
  grado_impacto: number;
  grado_probabilidad: number;
  control: string | null;
  grado_efectividad_control: number | null;
  acciones_a_realizar: string | null;
  proceso_id: string | null;
  frecuencia_revision: string | null;
  fecha_ultima_revision: string | null;
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

const campo = 'rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm';

function SelectorGrado({
  valor,
  onChange,
  opciones,
  prefijo,
}: {
  valor: number;
  onChange: (v: number) => void;
  opciones: [number, string][];
  prefijo: string;
}) {
  return (
    <select value={valor} onChange={(e) => onChange(Number(e.target.value))} className={campo}>
      {opciones.map(([v, l]) => (
        <option key={v} value={v}>
          {prefijo} {v} — {l}
        </option>
      ))}
    </select>
  );
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
  const [tipo, setTipo] = useState<TipoRiesgo>('riesgo');
  const [categoria, setCategoria] = useState<CategoriaRiesgo>('operativo');
  const [riesgo, setRiesgo] = useState('');
  const [consecuencia, setConsecuencia] = useState('');
  const [gradoImpacto, setGradoImpacto] = useState(2);
  const [gradoProbabilidad, setGradoProbabilidad] = useState(2);
  const [control, setControl] = useState('');
  const [gradoEfectividadControl, setGradoEfectividadControl] = useState(0);
  const [accionesARealizar, setAccionesARealizar] = useState('');
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
      const res = await crearRiesgo({
        marcoNormativo,
        tipo,
        riesgo,
        consecuencia: consecuencia || undefined,
        categoria,
        gradoImpacto,
        gradoProbabilidad,
        control,
        gradoEfectividadControl: tipo === 'riesgo' ? gradoEfectividadControl : undefined,
        accionesARealizar: accionesARealizar || undefined,
        procesoId: procesoId || undefined,
        frecuenciaRevision: frecuenciaRevision || undefined,
      });
      if (res.ok) {
        setRiesgos((prev) => [
          ...prev,
          {
            id: res.id,
            marco_normativo: marcoNormativo,
            tipo,
            riesgo,
            consecuencia: consecuencia || null,
            categoria,
            grado_impacto: gradoImpacto,
            grado_probabilidad: gradoProbabilidad,
            control: control || null,
            grado_efectividad_control: tipo === 'riesgo' ? gradoEfectividadControl : null,
            acciones_a_realizar: accionesARealizar || null,
            proceso_id: procesoId || null,
            frecuencia_revision: frecuenciaRevision || null,
            fecha_ultima_revision: new Date().toISOString().slice(0, 10),
          },
        ]);
        setRiesgo('');
        setConsecuencia('');
        setControl('');
        setAccionesARealizar('');
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

  function revisar(r: Riesgo) {
    setRiesgos((prev) => prev.map((x) => (x.id === r.id ? { ...x, fecha_ultima_revision: new Date().toISOString().slice(0, 10) } : x)));
    startTransition(async () => {
      await marcarRiesgoRevisado(r.id);
    });
  }

  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [edMarco, setEdMarco] = useState<typeof marcoNormativo>('iso_9001');
  const [edTipo, setEdTipo] = useState<TipoRiesgo>('riesgo');
  const [edCategoria, setEdCategoria] = useState<CategoriaRiesgo>('operativo');
  const [edRiesgo, setEdRiesgo] = useState('');
  const [edConsecuencia, setEdConsecuencia] = useState('');
  const [edGradoImpacto, setEdGradoImpacto] = useState(2);
  const [edGradoProbabilidad, setEdGradoProbabilidad] = useState(2);
  const [edControl, setEdControl] = useState('');
  const [edGradoEfectividadControl, setEdGradoEfectividadControl] = useState(0);
  const [edAccionesARealizar, setEdAccionesARealizar] = useState('');
  const [edProcesoId, setEdProcesoId] = useState('');
  const [edFrecuencia, setEdFrecuencia] = useState<typeof frecuenciaRevision>('');

  function iniciarEdicion(r: Riesgo) {
    setEditandoId(r.id);
    setEdMarco(r.marco_normativo as typeof edMarco);
    setEdTipo(r.tipo);
    setEdCategoria(r.categoria);
    setEdRiesgo(r.riesgo);
    setEdConsecuencia(r.consecuencia ?? '');
    setEdGradoImpacto(r.grado_impacto);
    setEdGradoProbabilidad(r.grado_probabilidad);
    setEdControl(r.control ?? '');
    setEdGradoEfectividadControl(r.grado_efectividad_control ?? 0);
    setEdAccionesARealizar(r.acciones_a_realizar ?? '');
    setEdProcesoId(r.proceso_id ?? '');
    setEdFrecuencia((r.frecuencia_revision as typeof edFrecuencia) ?? '');
  }

  function guardarEdicion(id: string) {
    setError(null);
    startTransition(async () => {
      const res = await actualizarRiesgo({
        id,
        marcoNormativo: edMarco,
        tipo: edTipo,
        riesgo: edRiesgo,
        consecuencia: edConsecuencia || undefined,
        categoria: edCategoria,
        gradoImpacto: edGradoImpacto,
        gradoProbabilidad: edGradoProbabilidad,
        control: edControl,
        gradoEfectividadControl: edTipo === 'riesgo' ? edGradoEfectividadControl : undefined,
        accionesARealizar: edAccionesARealizar || undefined,
        procesoId: edProcesoId || undefined,
        frecuenciaRevision: edFrecuencia || undefined,
      });
      if (res.ok) {
        setRiesgos((prev) =>
          prev.map((r) =>
            r.id === id
              ? {
                  ...r,
                  marco_normativo: edMarco,
                  tipo: edTipo,
                  categoria: edCategoria,
                  riesgo: edRiesgo,
                  consecuencia: edConsecuencia || null,
                  grado_impacto: edGradoImpacto,
                  grado_probabilidad: edGradoProbabilidad,
                  control: edControl || null,
                  grado_efectividad_control: edTipo === 'riesgo' ? edGradoEfectividadControl : null,
                  acciones_a_realizar: edAccionesARealizar || null,
                  proceso_id: edProcesoId || null,
                  frecuencia_revision: edFrecuencia || null,
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
      <h2 className="font-display font-semibold text-secundario mb-1">Matriz de riesgos y oportunidades</h2>
      <p className="text-xs text-marmol-400 mb-3">Inherente = impacto × probabilidad. Residual = inherente reducido según qué tan efectivo es el control.</p>

      <div className="space-y-2 mb-4">
        {riesgos.map((r) => {
          const inherente = calcularValoracionInherente(r.grado_impacto, r.grado_probabilidad);
          const nivelInherente = evaluarNivel(inherente, r.tipo);
          const residual = r.tipo === 'riesgo' ? calcularValoracionResidual(inherente, r.grado_efectividad_control) : inherente;
          const nivelResidual = evaluarNivel(residual, r.tipo);

          return editandoId === r.id ? (
            <div key={r.id} className="space-y-1.5 border-b border-marmol-100 pb-2 bg-flow-50/40 -mx-1 px-1 rounded">
              <div className="grid grid-cols-3 gap-2">
                <select value={edMarco} onChange={(e) => setEdMarco(e.target.value as typeof edMarco)} className={campo}>
                  {Object.entries(ETIQUETA_MARCO).map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </select>
                <select value={edTipo} onChange={(e) => setEdTipo(e.target.value as TipoRiesgo)} className={campo}>
                  <option value="riesgo">Riesgo</option>
                  <option value="oportunidad">Oportunidad</option>
                </select>
                <select value={edCategoria} onChange={(e) => setEdCategoria(e.target.value as CategoriaRiesgo)} className={campo}>
                  {CATEGORIAS_RIESGO.map((c) => (
                    <option key={c} value={c}>
                      {ETIQUETA_CATEGORIA[c]}
                    </option>
                  ))}
                </select>
              </div>
              <input value={edRiesgo} onChange={(e) => setEdRiesgo(e.target.value)} placeholder="Descripción" className={cn('w-full', campo)} />
              <input value={edConsecuencia} onChange={(e) => setEdConsecuencia(e.target.value)} placeholder="Consecuencia (positiva/negativa)" className={cn('w-full', campo)} />
              <div className="grid grid-cols-2 gap-2">
                <SelectorGrado
                  valor={edGradoImpacto}
                  onChange={setEdGradoImpacto}
                  prefijo="Impacto"
                  opciones={[1, 2, 3].map((g) => [g, etiquetaGradoImpacto(edTipo, g as 1 | 2 | 3)])}
                />
                <SelectorGrado
                  valor={edGradoProbabilidad}
                  onChange={setEdGradoProbabilidad}
                  prefijo="Prob."
                  opciones={[1, 2, 3].map((g) => [g, etiquetaGradoProbabilidad(edTipo, g as 1 | 2 | 3)])}
                />
              </div>
              <select value={edProcesoId} onChange={(e) => setEdProcesoId(e.target.value)} className={cn('w-full', campo)}>
                <option value="">Sin proceso asociado</option>
                {procesos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.codigo ? `${p.codigo} · ` : ''}
                    {p.nombre}
                  </option>
                ))}
              </select>
              <input value={edControl} onChange={(e) => setEdControl(e.target.value)} placeholder="Control (aplica para riesgos)" className={cn('w-full', campo)} />
              {edTipo === 'riesgo' && (
                <select value={edGradoEfectividadControl} onChange={(e) => setEdGradoEfectividadControl(Number(e.target.value))} className={cn('w-full', campo)}>
                  {[0, 1, 2, 3, 4, 5].map((g) => (
                    <option key={g} value={g}>
                      Efectividad del control {g} — {ETIQUETA_EFECTIVIDAD_CONTROL[g]}
                    </option>
                  ))}
                </select>
              )}
              <input value={edAccionesARealizar} onChange={(e) => setEdAccionesARealizar(e.target.value)} placeholder="Acciones a realizar (opcional)" className={cn('w-full', campo)} />
              <select value={edFrecuencia} onChange={(e) => setEdFrecuencia(e.target.value as typeof edFrecuencia)} className={cn('w-full', campo)}>
                <option value="">Sin frecuencia de revisión</option>
                <option value="trimestral">Revisar trimestral</option>
                <option value="semestral">Revisar semestral</option>
                <option value="anual">Revisar anual</option>
              </select>
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
                  <span className="text-xs rounded-full px-2 py-0.5 font-medium bg-marmol-100 text-marmol-600">{ETIQUETA_CATEGORIA[r.categoria]}</span>
                  <span className={cn('text-xs rounded-full px-2 py-0.5 font-medium', CLASE_NIVEL[nivelInherente])} title={`Impacto ${r.grado_impacto} × Probabilidad ${r.grado_probabilidad} = ${inherente}`}>
                    Inherente: {ETIQUETA_EVALUACION[nivelInherente]} ({inherente})
                  </span>
                  <span className={cn('text-xs rounded-full px-2 py-0.5 font-medium', CLASE_NIVEL[nivelResidual])} title={r.tipo === 'riesgo' ? `Reducido por efectividad del control (${ETIQUETA_EFECTIVIDAD_CONTROL[r.grado_efectividad_control ?? 0]})` : 'Igual al inherente (no aplica control)'}>
                    Residual: {ETIQUETA_EVALUACION[nivelResidual]} ({residual})
                  </span>
                  {estaVencido(r) && (
                    <span className="text-xs rounded-full px-2 py-0.5 font-medium badge-bajo inline-flex items-center gap-1">
                      <AlertTriangle size={11} /> Revisión vencida
                    </span>
                  )}
                </div>
                <p className="text-sm font-medium text-marmol-800 mt-1">{r.riesgo}</p>
                {r.consecuencia && <p className="text-xs text-marmol-500">Consecuencia: {r.consecuencia}</p>}
                {r.control && <p className="text-xs text-marmol-500">Control: {r.control}</p>}
                {r.acciones_a_realizar && <p className="text-xs text-marmol-500">Acciones: {r.acciones_a_realizar}</p>}
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
                    <button onClick={() => revisar(r)} title="Marcar revisado hoy (sin cambiar la calificación)" className="text-marmol-300 hover:text-alto">
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
          );
        })}
        {riesgos.length === 0 && <p className="text-sm text-marmol-400">Sin riesgos u oportunidades registrados todavía.</p>}
      </div>

      {puedeEditar && (
        <div className="space-y-2 border-t border-marmol-100 pt-3">
          <div className="grid grid-cols-3 gap-2">
            <select value={marcoNormativo} onChange={(e) => setMarcoNormativo(e.target.value as typeof marcoNormativo)} className={campo}>
              {Object.entries(ETIQUETA_MARCO).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
            <select value={tipo} onChange={(e) => setTipo(e.target.value as TipoRiesgo)} className={campo}>
              <option value="riesgo">Riesgo</option>
              <option value="oportunidad">Oportunidad</option>
            </select>
            <select value={categoria} onChange={(e) => setCategoria(e.target.value as CategoriaRiesgo)} className={campo}>
              {CATEGORIAS_RIESGO.map((c) => (
                <option key={c} value={c}>
                  {ETIQUETA_CATEGORIA[c]}
                </option>
              ))}
            </select>
          </div>
          <input value={riesgo} onChange={(e) => setRiesgo(e.target.value)} placeholder="Descripción del riesgo/oportunidad" className={cn('w-full', campo)} />
          <input value={consecuencia} onChange={(e) => setConsecuencia(e.target.value)} placeholder="Consecuencia (positiva/negativa, opcional)" className={cn('w-full', campo)} />
          <div className="grid grid-cols-2 gap-2">
            <SelectorGrado valor={gradoImpacto} onChange={setGradoImpacto} prefijo="Impacto" opciones={[1, 2, 3].map((g) => [g, etiquetaGradoImpacto(tipo, g as 1 | 2 | 3)])} />
            <SelectorGrado valor={gradoProbabilidad} onChange={setGradoProbabilidad} prefijo="Prob." opciones={[1, 2, 3].map((g) => [g, etiquetaGradoProbabilidad(tipo, g as 1 | 2 | 3)])} />
          </div>
          <select value={procesoId} onChange={(e) => setProcesoId(e.target.value)} className={cn('w-full', campo)}>
            <option value="">Sin proceso asociado</option>
            {procesos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.codigo ? `${p.codigo} · ` : ''}
                {p.nombre}
              </option>
            ))}
          </select>
          <input value={control} onChange={(e) => setControl(e.target.value)} placeholder="Control asociado (aplica para riesgos, opcional)" className={cn('w-full', campo)} />
          {tipo === 'riesgo' && (
            <select value={gradoEfectividadControl} onChange={(e) => setGradoEfectividadControl(Number(e.target.value))} className={cn('w-full', campo)}>
              {[0, 1, 2, 3, 4, 5].map((g) => (
                <option key={g} value={g}>
                  Efectividad del control {g} — {ETIQUETA_EFECTIVIDAD_CONTROL[g]}
                </option>
              ))}
            </select>
          )}
          <input value={accionesARealizar} onChange={(e) => setAccionesARealizar(e.target.value)} placeholder="Acciones a realizar (opcional)" className={cn('w-full', campo)} />
          <select value={frecuenciaRevision} onChange={(e) => setFrecuenciaRevision(e.target.value as typeof frecuenciaRevision)} className={cn('w-full', campo)}>
            <option value="">Sin frecuencia de revisión</option>
            <option value="trimestral">Revisar trimestral</option>
            <option value="semestral">Revisar semestral</option>
            <option value="anual">Revisar anual</option>
          </select>
          <button onClick={agregar} disabled={pending || !riesgo.trim()} className="inline-flex items-center gap-1 rounded-lg bg-flow-500 hover:bg-flow-600 disabled:opacity-40 text-white text-sm font-medium px-3 py-1.5">
            <Plus size={14} /> Agregar
          </button>
          {error && <p className="text-sm text-bajo">{error}</p>}
        </div>
      )}
    </div>
  );
}
