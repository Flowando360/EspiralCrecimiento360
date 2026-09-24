'use client';

import { useState, useTransition } from 'react';
import { crearIndicador, eliminarIndicador, agregarMedicion, eliminarMedicion } from '@/app/(dashboard)/procesos-gestion/[id]/indicadores-actions';
import { cn, formatearFecha } from '@/lib/utils';
import { Plus, Trash2, TrendingUp, TrendingDown } from 'lucide-react';

type Unidad = 'numero' | 'porcentaje' | 'dias' | 'moneda';
type Sentido = 'mayor_mejor' | 'menor_mejor';

export interface Medicion {
  id: string;
  periodo: string;
  valor: number;
  fecha_medicion: string;
  observaciones: string | null;
}

export interface Indicador {
  id: string;
  nombre: string;
  formula: string | null;
  meta: number | null;
  unidad: Unidad;
  sentido: Sentido;
  frecuencia_medicion: string | null;
  mediciones: Medicion[];
}

const ETIQUETA_UNIDAD: Record<Unidad, string> = { numero: '', porcentaje: '%', dias: ' días', moneda: ' COP' };

function formatearValor(valor: number, unidad: Unidad) {
  if (unidad === 'moneda') return `$ ${valor.toLocaleString('es-CO')}`;
  return `${valor}${ETIQUETA_UNIDAD[unidad]}`;
}

function cumpleMeta(valor: number, meta: number, sentido: Sentido) {
  return sentido === 'mayor_mejor' ? valor >= meta : valor <= meta;
}

export function IndicadoresProceso({
  procesoId,
  indicadoresIniciales,
  puedeEditar,
}: {
  procesoId: string;
  indicadoresIniciales: Indicador[];
  puedeEditar: boolean;
}) {
  const [indicadores, setIndicadores] = useState(indicadoresIniciales);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [, startTransition] = useTransition();

  function eliminar(id: string) {
    setIndicadores((prev) => prev.filter((i) => i.id !== id));
    startTransition(async () => {
      await eliminarIndicador(procesoId, id);
    });
  }

  function agregarMedicionLocal(indicadorId: string, medicion: Medicion) {
    setIndicadores((prev) => prev.map((i) => (i.id === indicadorId ? { ...i, mediciones: [medicion, ...i.mediciones] } : i)));
  }

  function eliminarMedicionLocal(indicadorId: string, medicionId: string) {
    setIndicadores((prev) => prev.map((i) => (i.id === indicadorId ? { ...i, mediciones: i.mediciones.filter((m) => m.id !== medicionId) } : i)));
    startTransition(async () => {
      await eliminarMedicion(procesoId, medicionId);
    });
  }

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="font-display font-semibold text-secundario">Indicadores</h2>
          <p className="text-xs text-marmol-400 mt-0.5">Meta, sentido de mejora e histórico de mediciones de este proceso.</p>
        </div>
        {puedeEditar && (
          <button onClick={() => setMostrarForm((v) => !v)} className="inline-flex items-center gap-1 rounded-lg bg-flow-500 hover:bg-flow-600 text-white text-sm font-medium px-3 py-1.5">
            <Plus size={14} /> Nuevo indicador
          </button>
        )}
      </div>

      {mostrarForm && (
        <FormularioIndicador
          procesoId={procesoId}
          onCreado={(i) => {
            setIndicadores((prev) => [...prev, i]);
            setMostrarForm(false);
          }}
        />
      )}

      <div className="grid sm:grid-cols-2 gap-3">
        {indicadores.map((ind) => (
          <TarjetaIndicador
            key={ind.id}
            indicador={ind}
            procesoId={procesoId}
            puedeEditar={puedeEditar}
            onEliminar={() => eliminar(ind.id)}
            onAgregarMedicion={(m) => agregarMedicionLocal(ind.id, m)}
            onEliminarMedicion={(mid) => eliminarMedicionLocal(ind.id, mid)}
          />
        ))}
        {indicadores.length === 0 && <p className="text-sm text-marmol-400 col-span-2">Sin indicadores registrados todavía.</p>}
      </div>
    </div>
  );
}

function TarjetaIndicador({
  indicador,
  procesoId,
  puedeEditar,
  onEliminar,
  onAgregarMedicion,
  onEliminarMedicion,
}: {
  indicador: Indicador;
  procesoId: string;
  puedeEditar: boolean;
  onEliminar: () => void;
  onAgregarMedicion: (m: Medicion) => void;
  onEliminarMedicion: (id: string) => void;
}) {
  const [mostrarMedicion, setMostrarMedicion] = useState(false);
  const ultima = [...indicador.mediciones].sort((a, b) => b.fecha_medicion.localeCompare(a.fecha_medicion))[0];
  const cumple = ultima && indicador.meta != null ? cumpleMeta(ultima.valor, indicador.meta, indicador.sentido) : null;

  return (
    <div className="card p-3">
      <div className="flex items-start justify-between gap-1.5">
        <div className="min-w-0">
          <p className="text-sm font-medium text-marmol-800">{indicador.nombre}</p>
          {indicador.formula && <p className="text-xs text-marmol-400">{indicador.formula}</p>}
        </div>
        {puedeEditar && (
          <button onClick={onEliminar} className="text-marmol-300 hover:text-bajo shrink-0">
            <Trash2 size={13} />
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 mt-2 flex-wrap">
        {ultima ? (
          <span className={cn('text-sm font-semibold', cumple === true ? 'text-alto' : cumple === false ? 'text-bajo' : 'text-marmol-700')}>{formatearValor(ultima.valor, indicador.unidad)}</span>
        ) : (
          <span className="text-xs text-marmol-400">Sin mediciones</span>
        )}
        {indicador.meta != null && (
          <span className="text-xs text-marmol-400 inline-flex items-center gap-0.5">
            {indicador.sentido === 'mayor_mejor' ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            meta {formatearValor(indicador.meta, indicador.unidad)}
          </span>
        )}
        {cumple !== null && <span className={cn('text-[10px] rounded-full px-1.5 py-0.5 font-medium', cumple ? 'badge-alto' : 'badge-bajo')}>{cumple ? 'Cumple' : 'No cumple'}</span>}
      </div>

      {indicador.mediciones.length > 0 && (
        <div className="mt-2 space-y-1">
          {indicador.mediciones.slice(0, 4).map((m) => (
            <div key={m.id} className="flex items-center justify-between text-xs text-marmol-500 group">
              <span>
                {m.periodo}: {formatearValor(m.valor, indicador.unidad)}
              </span>
              <span className="flex items-center gap-1">
                {formatearFecha(m.fecha_medicion)}
                {puedeEditar && (
                  <button onClick={() => onEliminarMedicion(m.id)} className="text-marmol-300 hover:text-bajo opacity-0 group-hover:opacity-100">
                    <Trash2 size={11} />
                  </button>
                )}
              </span>
            </div>
          ))}
        </div>
      )}

      {puedeEditar && (
        <div className="mt-2">
          {mostrarMedicion ? (
            <FormularioMedicion
              procesoId={procesoId}
              indicadorId={indicador.id}
              onCreada={(m) => {
                onAgregarMedicion(m);
                setMostrarMedicion(false);
              }}
              onCancelar={() => setMostrarMedicion(false)}
            />
          ) : (
            <button onClick={() => setMostrarMedicion(true)} className="text-xs text-flow-600 hover:text-flow-700 font-medium">
              + Registrar medición
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function FormularioMedicion({
  procesoId,
  indicadorId,
  onCreada,
  onCancelar,
}: {
  procesoId: string;
  indicadorId: string;
  onCreada: (m: Medicion) => void;
  onCancelar: () => void;
}) {
  const [periodo, setPeriodo] = useState('');
  const [valor, setValor] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function guardar() {
    if (!periodo.trim() || valor === '' || Number.isNaN(Number(valor))) {
      setError('Período y valor numérico son requeridos');
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await agregarMedicion({ procesoId, indicadorId, periodo, valor: Number(valor) });
      if (res.ok) {
        onCreada({ id: res.id, periodo, valor: Number(valor), fecha_medicion: new Date().toISOString().slice(0, 10), observaciones: null });
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <div className="space-y-1.5">
      <div className="flex gap-1.5">
        <input value={periodo} onChange={(e) => setPeriodo(e.target.value)} placeholder="Período (ej. Sep 2026)" className="flex-1 rounded-lg border border-marmol-200 px-2 py-1 text-xs" autoFocus />
        <input value={valor} onChange={(e) => setValor(e.target.value)} placeholder="Valor" type="number" className="w-20 rounded-lg border border-marmol-200 px-2 py-1 text-xs" />
      </div>
      <div className="flex gap-2">
        <button onClick={guardar} disabled={pending} className="rounded-lg bg-flow-500 hover:bg-flow-600 text-white text-xs font-medium px-2.5 py-1">
          Guardar
        </button>
        <button onClick={onCancelar} className="text-xs text-marmol-500 hover:text-marmol-700">
          Cancelar
        </button>
      </div>
      {error && <p className="text-xs text-bajo">{error}</p>}
    </div>
  );
}

function FormularioIndicador({ procesoId, onCreado }: { procesoId: string; onCreado: (i: Indicador) => void }) {
  const [nombre, setNombre] = useState('');
  const [formula, setFormula] = useState('');
  const [meta, setMeta] = useState('');
  const [unidad, setUnidad] = useState<Unidad>('porcentaje');
  const [sentido, setSentido] = useState<Sentido>('mayor_mejor');
  const [frecuencia, setFrecuencia] = useState<'mensual' | 'trimestral' | 'semestral' | 'anual' | ''>('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function crear() {
    if (!nombre.trim()) {
      setError('El nombre es requerido');
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await crearIndicador({
        procesoId,
        nombre,
        formula: formula || undefined,
        meta: meta !== '' ? Number(meta) : undefined,
        unidad,
        sentido,
        frecuenciaMedicion: frecuencia || undefined,
      });
      if (res.ok) {
        onCreado({ id: res.id, nombre, formula: formula || null, meta: meta !== '' ? Number(meta) : null, unidad, sentido, frecuencia_medicion: frecuencia || null, mediciones: [] });
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <div className="rounded-lg border border-marmol-200 p-3 mb-3 space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre del indicador" className="rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm" autoFocus />
        <input value={formula} onChange={(e) => setFormula(e.target.value)} placeholder="Fórmula / fuente (opcional)" className="rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <input value={meta} onChange={(e) => setMeta(e.target.value)} placeholder="Meta" type="number" className="rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm" />
        <select value={unidad} onChange={(e) => setUnidad(e.target.value as Unidad)} className="rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm">
          <option value="porcentaje">%</option>
          <option value="numero">Número</option>
          <option value="dias">Días</option>
          <option value="moneda">$</option>
        </select>
        <select value={sentido} onChange={(e) => setSentido(e.target.value as Sentido)} className="rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm">
          <option value="mayor_mejor">Mayor es mejor</option>
          <option value="menor_mejor">Menor es mejor</option>
        </select>
        <select value={frecuencia} onChange={(e) => setFrecuencia(e.target.value as typeof frecuencia)} className="rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm">
          <option value="">Frecuencia</option>
          <option value="mensual">Mensual</option>
          <option value="trimestral">Trimestral</option>
          <option value="semestral">Semestral</option>
          <option value="anual">Anual</option>
        </select>
      </div>
      <button onClick={crear} disabled={pending} className="inline-flex items-center gap-1 rounded-lg bg-flow-500 hover:bg-flow-600 disabled:opacity-40 text-white text-sm font-medium px-3 py-1.5">
        {pending ? 'Creando…' : 'Crear indicador'}
      </button>
      {error && <p className="text-sm text-bajo">{error}</p>}
    </div>
  );
}
