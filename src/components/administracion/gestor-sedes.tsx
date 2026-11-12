'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2 } from 'lucide-react';
import { guardarSede, cambiarEstadoSede, eliminarSede } from '@/app/(dashboard)/administracion/sedes/actions';
import { cn } from '@/lib/utils';

export interface SedeVista {
  id: string;
  nombre: string;
  ciudad: string | null;
  direccion: string | null;
  activa: boolean;
  personas: number;
}

const campo = 'w-full rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm';

export function GestorSedes({ sedes }: { sedes: SedeVista[] }) {
  const router = useRouter();
  const [editando, setEditando] = useState<string | 'nueva' | null>(null);
  const [nombre, setNombre] = useState('');
  const [ciudad, setCiudad] = useState('');
  const [direccion, setDireccion] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function abrir(s?: SedeVista) {
    setEditando(s ? s.id : 'nueva');
    setNombre(s?.nombre ?? '');
    setCiudad(s?.ciudad ?? '');
    setDireccion(s?.direccion ?? '');
    setError(null);
  }

  function correr(fn: () => Promise<{ ok: boolean; error?: string }>, alTerminar?: () => void) {
    setError(null);
    startTransition(async () => {
      const res = await fn();
      if (!res.ok) return setError(res.error ?? 'No se pudo guardar');
      alTerminar?.();
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      {error && <p className="text-sm text-red-600">{error}</p>}

      {sedes.length === 0 && editando !== 'nueva' && <p className="text-sm text-marmol-500">Aún no hay sedes. Es opcional: si tu empresa tiene una sola ubicación, no necesitas crearlas.</p>}

      <div className="space-y-2">
        {sedes.map((s) =>
          editando === s.id ? (
            <FormularioSede key={s.id} {...{ nombre, setNombre, ciudad, setCiudad, direccion, setDireccion, pending }} onGuardar={() => correr(() => guardarSede({ id: s.id, nombre, ciudad, direccion }), () => setEditando(null))} onCancelar={() => setEditando(null)} />
          ) : (
            <div key={s.id} className={cn('card p-4 flex items-start justify-between gap-3 flex-wrap', !s.activa && 'opacity-60')}>
              <div>
                <p className="font-medium text-marmol-900">
                  {s.nombre} {!s.activa && <span className="text-xs text-marmol-400">(inactiva)</span>}
                </p>
                <p className="text-xs text-marmol-500">
                  {[s.ciudad, s.direccion].filter(Boolean).join(' · ') || 'Sin ciudad ni dirección'} · {s.personas} persona{s.personas === 1 ? '' : 's'}
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <button type="button" className="text-flow-600 hover:text-flow-700" onClick={() => abrir(s)}>Editar</button>
                <button type="button" className="text-marmol-500 hover:text-marmol-700" disabled={pending} onClick={() => correr(() => cambiarEstadoSede({ id: s.id, activa: !s.activa }))}>
                  {s.activa ? 'Desactivar' : 'Reactivar'}
                </button>
                <button type="button" aria-label="Eliminar sede" className="text-marmol-300 hover:text-bajo" disabled={pending} onClick={() => window.confirm(`¿Eliminar la sede «${s.nombre}»?`) && correr(() => eliminarSede(s.id))}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          )
        )}
      </div>

      {editando === 'nueva' ? (
        <FormularioSede {...{ nombre, setNombre, ciudad, setCiudad, direccion, setDireccion, pending }} onGuardar={() => correr(() => guardarSede({ nombre, ciudad, direccion }), () => setEditando(null))} onCancelar={() => setEditando(null)} />
      ) : (
        <button type="button" onClick={() => abrir()} className="inline-flex items-center gap-1 rounded-lg border border-marmol-200 hover:border-flow-300 px-3 py-1.5 text-xs font-medium text-marmol-600">
          <Plus size={12} /> Nueva sede
        </button>
      )}
    </div>
  );
}

function FormularioSede(p: {
  nombre: string; setNombre: (v: string) => void;
  ciudad: string; setCiudad: (v: string) => void;
  direccion: string; setDireccion: (v: string) => void;
  pending: boolean; onGuardar: () => void; onCancelar: () => void;
}) {
  return (
    <div className="card p-4 space-y-2">
      <input value={p.nombre} onChange={(e) => p.setNombre(e.target.value)} placeholder="Nombre de la sede (p. ej. Planta Medellín)" className={campo} />
      <div className="grid sm:grid-cols-2 gap-2">
        <input value={p.ciudad} onChange={(e) => p.setCiudad(e.target.value)} placeholder="Ciudad (opcional)" className={campo} />
        <input value={p.direccion} onChange={(e) => p.setDireccion(e.target.value)} placeholder="Dirección (opcional)" className={campo} />
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={p.onGuardar} disabled={p.pending} className="btn-primary text-xs">{p.pending ? 'Guardando…' : 'Guardar sede'}</button>
        <button type="button" onClick={p.onCancelar} className="text-xs text-marmol-500">Cancelar</button>
      </div>
    </div>
  );
}
