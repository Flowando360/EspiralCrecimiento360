'use client';

import { useState, useTransition } from 'react';
import { Trash2, Plus } from 'lucide-react';
import {
  agregarHabilidadCargo,
  eliminarHabilidadCargo,
  agregarFuncionCargo,
  eliminarFuncionCargo,
  agregarDecisionCargo,
  eliminarDecisionCargo,
  agregarRiesgoCargo,
  eliminarRiesgoCargo,
  agregarExamenCargo,
  eliminarExamenCargo,
  agregarEppCargo,
  eliminarEppCargo,
} from '@/app/(dashboard)/administracion/cargos/[id]/actions';

const campo = 'rounded-lg border border-marmol-200 px-2 py-1.5 text-sm';
const filaBorde = 'flex items-center justify-between gap-3 border-b border-marmol-100 pb-2 last:border-0 text-sm';

function BotonEliminar({ onClick, pending }: { onClick: () => void; pending: boolean }) {
  return (
    <button type="button" onClick={onClick} disabled={pending} className="text-marmol-400 hover:text-bajo shrink-0 disabled:opacity-40">
      <Trash2 size={13} />
    </button>
  );
}

// ── Habilidades ──────────────────────────────────────────────────────────
interface Habilidad {
  id: string;
  tipo: 'funcional' | 'tecnica';
  nombre: string;
  nivel_esperado: 'bajo' | 'medio' | 'alto';
}

export function ListaHabilidadesCargo({ cargoId, inicial }: { cargoId: string; inicial: Habilidad[] }) {
  const [items, setItems] = useState(inicial);
  const [tipo, setTipo] = useState<'funcional' | 'tecnica'>('funcional');
  const [nombre, setNombre] = useState('');
  const [nivel, setNivel] = useState<'bajo' | 'medio' | 'alto'>('medio');
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function agregar() {
    if (!nombre.trim()) return;
    setError(null);
    startTransition(async () => {
      const res = await agregarHabilidadCargo({ cargoId, tipo, nombre, nivelEsperado: nivel });
      if (res.ok) {
        setItems((prev) => [...prev, { id: crypto.randomUUID(), tipo, nombre, nivel_esperado: nivel }]);
        setNombre('');
      } else setError(res.error);
    });
  }

  function eliminar(id: string) {
    startTransition(async () => {
      const res = await eliminarHabilidadCargo(id, cargoId);
      if (res.ok) setItems((prev) => prev.filter((i) => i.id !== id));
      else setError(res.error);
    });
  }

  return (
    <div className="card p-5 space-y-3">
      <h2 className="font-display font-semibold text-secundario text-sm">Habilidades funcionales y técnicas</h2>
      <div className="space-y-1.5">
        {items.map((h) => (
          <div key={h.id} className={filaBorde}>
            <span className="text-marmol-700">
              {h.nombre} <span className="text-xs text-marmol-400 capitalize">({h.tipo === 'funcional' ? 'funcional' : 'técnica'}, {h.nivel_esperado})</span>
            </span>
            <BotonEliminar onClick={() => eliminar(h.id)} pending={pending} />
          </div>
        ))}
        {items.length === 0 && <p className="text-xs text-marmol-400">Sin habilidades cargadas.</p>}
      </div>
      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-marmol-100">
        <select value={tipo} onChange={(e) => setTipo(e.target.value as any)} className={campo}>
          <option value="funcional">Funcional</option>
          <option value="tecnica">Técnica</option>
        </select>
        <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre de la habilidad" className={`${campo} flex-1 min-w-[140px]`} />
        <select value={nivel} onChange={(e) => setNivel(e.target.value as any)} className={campo}>
          <option value="bajo">Bajo</option>
          <option value="medio">Medio</option>
          <option value="alto">Alto</option>
        </select>
        <button type="button" onClick={agregar} disabled={pending || !nombre.trim()} className="inline-flex items-center gap-1 rounded-lg bg-flow-500 hover:bg-flow-600 disabled:opacity-40 text-white text-xs font-medium px-2.5 py-1.5">
          <Plus size={12} /> Agregar
        </button>
      </div>
      {error && <p className="text-xs text-bajo">{error}</p>}
    </div>
  );
}

// ── Funciones principales ────────────────────────────────────────────────
interface Funcion {
  id: string;
  proceso: string | null;
  funcion: string;
  tipo_phva: string | null;
  periodicidad: string | null;
  herramientas: string | null;
}

export function ListaFuncionesCargo({ cargoId, inicial }: { cargoId: string; inicial: Funcion[] }) {
  const [items, setItems] = useState(inicial);
  const [funcion, setFuncion] = useState('');
  const [proceso, setProceso] = useState('');
  const [periodicidad, setPeriodicidad] = useState('');
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function agregar() {
    if (!funcion.trim()) return;
    setError(null);
    startTransition(async () => {
      const res = await agregarFuncionCargo({ cargoId, funcion, proceso, periodicidad });
      if (res.ok) {
        setItems((prev) => [...prev, { id: crypto.randomUUID(), proceso: proceso || null, funcion, tipo_phva: null, periodicidad: periodicidad || null, herramientas: null }]);
        setFuncion('');
        setProceso('');
        setPeriodicidad('');
      } else setError(res.error);
    });
  }

  function eliminar(id: string) {
    startTransition(async () => {
      const res = await eliminarFuncionCargo(id, cargoId);
      if (res.ok) setItems((prev) => prev.filter((i) => i.id !== id));
      else setError(res.error);
    });
  }

  return (
    <div className="card p-5 space-y-3">
      <h2 className="font-display font-semibold text-secundario text-sm">Funciones principales</h2>
      <div className="space-y-2">
        {items.map((f) => (
          <div key={f.id} className={filaBorde}>
            <div>
              <p className="text-marmol-800">{f.funcion}</p>
              <p className="text-xs text-marmol-400">{[f.proceso, f.periodicidad].filter(Boolean).join(' · ')}</p>
            </div>
            <BotonEliminar onClick={() => eliminar(f.id)} pending={pending} />
          </div>
        ))}
        {items.length === 0 && <p className="text-xs text-marmol-400">Sin funciones cargadas.</p>}
      </div>
      <div className="space-y-1.5 pt-2 border-t border-marmol-100">
        <input value={funcion} onChange={(e) => setFuncion(e.target.value)} placeholder="Descripción de la función" className={`${campo} w-full`} />
        <div className="flex flex-wrap items-center gap-2">
          <input value={proceso} onChange={(e) => setProceso(e.target.value)} placeholder="Proceso" className={`${campo} flex-1 min-w-[120px]`} />
          <input value={periodicidad} onChange={(e) => setPeriodicidad(e.target.value)} placeholder="Periodicidad" className={`${campo} flex-1 min-w-[120px]`} />
          <button type="button" onClick={agregar} disabled={pending || !funcion.trim()} className="inline-flex items-center gap-1 rounded-lg bg-flow-500 hover:bg-flow-600 disabled:opacity-40 text-white text-xs font-medium px-2.5 py-1.5">
            <Plus size={12} /> Agregar
          </button>
        </div>
      </div>
      {error && <p className="text-xs text-bajo">{error}</p>}
    </div>
  );
}

// ── Decisiones ───────────────────────────────────────────────────────────
interface Decision {
  id: string;
  descripcion: string;
  periodicidad: string | null;
}

export function ListaDecisionesCargo({ cargoId, inicial }: { cargoId: string; inicial: Decision[] }) {
  const [items, setItems] = useState(inicial);
  const [descripcion, setDescripcion] = useState('');
  const [periodicidad, setPeriodicidad] = useState('');
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function agregar() {
    if (!descripcion.trim()) return;
    setError(null);
    startTransition(async () => {
      const res = await agregarDecisionCargo({ cargoId, descripcion, periodicidad });
      if (res.ok) {
        setItems((prev) => [...prev, { id: crypto.randomUUID(), descripcion, periodicidad: periodicidad || null }]);
        setDescripcion('');
        setPeriodicidad('');
      } else setError(res.error);
    });
  }

  function eliminar(id: string) {
    startTransition(async () => {
      const res = await eliminarDecisionCargo(id, cargoId);
      if (res.ok) setItems((prev) => prev.filter((i) => i.id !== id));
      else setError(res.error);
    });
  }

  return (
    <div className="card p-5 space-y-3">
      <h2 className="font-display font-semibold text-secundario text-sm">Decisiones que puede tomar el cargo</h2>
      <div className="space-y-2">
        {items.map((dec) => (
          <div key={dec.id} className={filaBorde}>
            <p className="text-marmol-700">
              {dec.descripcion} {dec.periodicidad && <span className="text-xs text-marmol-400">({dec.periodicidad})</span>}
            </p>
            <BotonEliminar onClick={() => eliminar(dec.id)} pending={pending} />
          </div>
        ))}
        {items.length === 0 && <p className="text-xs text-marmol-400">Sin decisiones cargadas.</p>}
      </div>
      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-marmol-100">
        <input value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Descripción de la decisión" className={`${campo} flex-1 min-w-[160px]`} />
        <input value={periodicidad} onChange={(e) => setPeriodicidad(e.target.value)} placeholder="Periodicidad" className={`${campo} min-w-[120px]`} />
        <button type="button" onClick={agregar} disabled={pending || !descripcion.trim()} className="inline-flex items-center gap-1 rounded-lg bg-flow-500 hover:bg-flow-600 disabled:opacity-40 text-white text-xs font-medium px-2.5 py-1.5">
          <Plus size={12} /> Agregar
        </button>
      </div>
      {error && <p className="text-xs text-bajo">{error}</p>}
    </div>
  );
}

// ── Factores de riesgo ───────────────────────────────────────────────────
const CATEGORIAS_RIESGO = ['quimico', 'mecanico', 'locativo', 'ergonomico', 'psicosocial', 'fisico', 'biologico'] as const;

interface Riesgo {
  id: string;
  factor: string;
  categoria: string | null;
  efectos_posibles: string | null;
}

export function ListaRiesgosCargo({ cargoId, inicial }: { cargoId: string; inicial: Riesgo[] }) {
  const [items, setItems] = useState(inicial);
  const [factor, setFactor] = useState('');
  const [categoria, setCategoria] = useState('');
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function agregar() {
    if (!factor.trim()) return;
    setError(null);
    startTransition(async () => {
      const res = await agregarRiesgoCargo({ cargoId, factor, categoria: categoria as any });
      if (res.ok) {
        setItems((prev) => [...prev, { id: crypto.randomUUID(), factor, categoria: categoria || null, efectos_posibles: null }]);
        setFactor('');
      } else setError(res.error);
    });
  }

  function eliminar(id: string) {
    startTransition(async () => {
      const res = await eliminarRiesgoCargo(id, cargoId);
      if (res.ok) setItems((prev) => prev.filter((i) => i.id !== id));
      else setError(res.error);
    });
  }

  return (
    <div className="card p-5 space-y-3">
      <h2 className="font-display font-semibold text-secundario text-sm">Factores de riesgo (SG-SST)</h2>
      <div className="space-y-2">
        {items.map((r) => (
          <div key={r.id} className={filaBorde}>
            <p className="text-marmol-700">
              {r.factor} {r.categoria && <span className="text-xs text-marmol-400 capitalize">({r.categoria})</span>}
            </p>
            <BotonEliminar onClick={() => eliminar(r.id)} pending={pending} />
          </div>
        ))}
        {items.length === 0 && <p className="text-xs text-marmol-400">Sin factores de riesgo cargados.</p>}
      </div>
      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-marmol-100">
        <input value={factor} onChange={(e) => setFactor(e.target.value)} placeholder="Factor de riesgo" className={`${campo} flex-1 min-w-[160px]`} />
        <select value={categoria} onChange={(e) => setCategoria(e.target.value)} className={campo}>
          <option value="">Sin categoría</option>
          {CATEGORIAS_RIESGO.map((c) => (
            <option key={c} value={c} className="capitalize">
              {c}
            </option>
          ))}
        </select>
        <button type="button" onClick={agregar} disabled={pending || !factor.trim()} className="inline-flex items-center gap-1 rounded-lg bg-flow-500 hover:bg-flow-600 disabled:opacity-40 text-white text-xs font-medium px-2.5 py-1.5">
          <Plus size={12} /> Agregar
        </button>
      </div>
      {error && <p className="text-xs text-bajo">{error}</p>}
    </div>
  );
}

// ── Exámenes médicos ─────────────────────────────────────────────────────
interface Examen {
  id: string;
  momento: 'ingreso' | 'periodico' | 'retiro';
  nombre_examen: string;
}

const ETIQUETA_MOMENTO: Record<string, string> = { ingreso: 'Ingreso', periodico: 'Periódico', retiro: 'Retiro' };

export function ListaExamenesCargo({ cargoId, inicial }: { cargoId: string; inicial: Examen[] }) {
  const [items, setItems] = useState(inicial);
  const [momento, setMomento] = useState<'ingreso' | 'periodico' | 'retiro'>('ingreso');
  const [nombreExamen, setNombreExamen] = useState('');
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function agregar() {
    if (!nombreExamen.trim()) return;
    setError(null);
    startTransition(async () => {
      const res = await agregarExamenCargo({ cargoId, momento, nombreExamen });
      if (res.ok) {
        setItems((prev) => [...prev, { id: crypto.randomUUID(), momento, nombre_examen: nombreExamen }]);
        setNombreExamen('');
      } else setError(res.error);
    });
  }

  function eliminar(id: string) {
    startTransition(async () => {
      const res = await eliminarExamenCargo(id, cargoId);
      if (res.ok) setItems((prev) => prev.filter((i) => i.id !== id));
      else setError(res.error);
    });
  }

  return (
    <div className="card p-5 space-y-3">
      <h2 className="font-display font-semibold text-secundario text-sm">Exámenes médicos ocupacionales</h2>
      <div className="grid sm:grid-cols-3 gap-3">
        {(['ingreso', 'periodico', 'retiro'] as const).map((m) => (
          <div key={m}>
            <p className="text-xs font-medium text-marmol-500 mb-1.5">{ETIQUETA_MOMENTO[m]}</p>
            <ul className="text-sm text-marmol-700 space-y-1">
              {items
                .filter((e) => e.momento === m)
                .map((e) => (
                  <li key={e.id} className="flex items-center justify-between gap-2">
                    {e.nombre_examen}
                    <BotonEliminar onClick={() => eliminar(e.id)} pending={pending} />
                  </li>
                ))}
              {items.filter((e) => e.momento === m).length === 0 && <li className="text-xs text-marmol-400">—</li>}
            </ul>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-marmol-100">
        <select value={momento} onChange={(e) => setMomento(e.target.value as any)} className={campo}>
          <option value="ingreso">Ingreso</option>
          <option value="periodico">Periódico</option>
          <option value="retiro">Retiro</option>
        </select>
        <input value={nombreExamen} onChange={(e) => setNombreExamen(e.target.value)} placeholder="Nombre del examen" className={`${campo} flex-1 min-w-[160px]`} />
        <button type="button" onClick={agregar} disabled={pending || !nombreExamen.trim()} className="inline-flex items-center gap-1 rounded-lg bg-flow-500 hover:bg-flow-600 disabled:opacity-40 text-white text-xs font-medium px-2.5 py-1.5">
          <Plus size={12} /> Agregar
        </button>
      </div>
      {error && <p className="text-xs text-bajo">{error}</p>}
    </div>
  );
}

// ── EPP ──────────────────────────────────────────────────────────────────
interface Epp {
  id: string;
  item: string;
}

export function ListaEppCargo({ cargoId, inicial }: { cargoId: string; inicial: Epp[] }) {
  const [items, setItems] = useState(inicial);
  const [item, setItem] = useState('');
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function agregar() {
    if (!item.trim()) return;
    setError(null);
    startTransition(async () => {
      const res = await agregarEppCargo({ cargoId, item });
      if (res.ok) {
        setItems((prev) => [...prev, { id: crypto.randomUUID(), item }]);
        setItem('');
      } else setError(res.error);
    });
  }

  function eliminar(id: string) {
    startTransition(async () => {
      const res = await eliminarEppCargo(id, cargoId);
      if (res.ok) setItems((prev) => prev.filter((i) => i.id !== id));
      else setError(res.error);
    });
  }

  return (
    <div className="card p-5 space-y-3">
      <h2 className="font-display font-semibold text-secundario text-sm">Elementos de protección personal (EPP)</h2>
      <div className="flex flex-wrap gap-1.5">
        {items.map((e) => (
          <span key={e.id} className="inline-flex items-center gap-1.5 text-xs rounded-full bg-marmol-100 text-marmol-600 px-2.5 py-1">
            {e.item}
            <button type="button" onClick={() => eliminar(e.id)} disabled={pending} className="text-marmol-400 hover:text-bajo disabled:opacity-40">
              <Trash2 size={11} />
            </button>
          </span>
        ))}
        {items.length === 0 && <p className="text-xs text-marmol-400">Sin EPP cargados.</p>}
      </div>
      <div className="flex items-center gap-2 pt-2 border-t border-marmol-100">
        <input value={item} onChange={(e) => setItem(e.target.value)} placeholder="ej: Casco, Guantes..." className={`${campo} flex-1`} />
        <button type="button" onClick={agregar} disabled={pending || !item.trim()} className="inline-flex items-center gap-1 rounded-lg bg-flow-500 hover:bg-flow-600 disabled:opacity-40 text-white text-xs font-medium px-2.5 py-1.5">
          <Plus size={12} /> Agregar
        </button>
      </div>
      {error && <p className="text-xs text-bajo">{error}</p>}
    </div>
  );
}
