'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { crearVacante } from '@/app/(dashboard)/reclutamiento/actions';

export function FormularioVacante({ cargos }: { cargos: { id: string; nombre: string; proceso_area: string | null }[] }) {
  const router = useRouter();
  const [cargoId, setCargoId] = useState('');
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function crear() {
    setError(null);
    startTransition(async () => {
      const res = await crearVacante({ cargoId, titulo, descripcion });
      if (res.ok) router.push(`/reclutamiento/vacantes/${res.id}`);
      else setError(res.error);
    });
  }

  const campo = 'w-full rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm';
  const label = 'block text-xs text-marmol-500 mb-1';

  return (
    <div className="card p-5 space-y-3">
      <div>
        <label className={label}>Cargo</label>
        <select className={campo} value={cargoId} onChange={(e) => setCargoId(e.target.value)}>
          <option value="">Selecciona un cargo…</option>
          {cargos.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre} {c.proceso_area ? `— ${c.proceso_area}` : ''}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className={label}>Título de la vacante</label>
        <input
          className={campo}
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          placeholder="Ej. Auxiliar de logística — turno mañana"
        />
      </div>
      <div>
        <label className={label}>Descripción (opcional)</label>
        <textarea
          className={campo}
          rows={4}
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          placeholder="Contexto adicional para quien vea la vacante o se postule."
        />
      </div>

      <button
        type="button"
        onClick={crear}
        disabled={pending || !cargoId || !titulo.trim()}
        className="inline-flex items-center gap-1.5 rounded-lg bg-flow-500 hover:bg-flow-600 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 transition"
      >
        {pending ? 'Creando…' : 'Crear vacante'}
      </button>
      {error && <p className="text-xs text-bajo">{error}</p>}
    </div>
  );
}
