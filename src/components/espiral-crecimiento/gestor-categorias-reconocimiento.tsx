'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { crearCategoriaReconocimiento, actualizarCategoriaReconocimiento } from '@/app/(dashboard)/nexa/reconocimientos/actions';

export interface CategoriaGestion {
  id: string;
  nombre: string;
  descripcion: string | null;
  puntos: number;
  activa: boolean;
}

/** Catálogo de categorías de reconocimiento con puntaje fijo (solo admin_th). */
export function GestorCategoriasReconocimiento({ categorias }: { categorias: CategoriaGestion[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [puntos, setPuntos] = useState('20');

  function actualizar(id: string, cambios: { puntos?: number; activa?: boolean }) {
    setError(null);
    startTransition(async () => {
      const res = await actualizarCategoriaReconocimiento({ id, ...cambios });
      if (!res.ok) setError(res.error);
      else router.refresh();
    });
  }

  function crear() {
    setError(null);
    startTransition(async () => {
      const res = await crearCategoriaReconocimiento({ nombre, descripcion, puntos: Number(puntos) || 0 });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setNombre('');
      setDescripcion('');
      setPuntos('20');
      router.refresh();
    });
  }

  return (
    <details className="card p-5">
      <summary className="cursor-pointer font-display font-semibold text-secundario">
        Categorías y puntajes ({categorias.filter((c) => c.activa).length} activas)
      </summary>
      <p className="text-xs text-marmol-500 mt-2 mb-3">
        El líder elige la categoría y el sistema asigna el puntaje fijo, así todos se reconocen con el mismo criterio. Cambiar los puntos no modifica los reconocimientos ya otorgados.
      </p>
      <ul className="divide-y divide-marmol-100">
        {categorias.map((c) => (
          <li key={c.id} className="py-2 flex items-center gap-3 flex-wrap">
            <div className="flex-1 min-w-[12rem]">
              <p className={c.activa ? 'text-sm font-medium text-marmol-800' : 'text-sm text-marmol-400 line-through'}>{c.nombre}</p>
              {c.descripcion && <p className="text-xs text-marmol-400">{c.descripcion}</p>}
            </div>
            <label className="text-xs text-marmol-500 flex items-center gap-1">
              Puntos
              <input
                type="number"
                min={0}
                defaultValue={c.puntos}
                disabled={pending}
                onBlur={(e) => {
                  const v = Number(e.target.value);
                  if (Number.isFinite(v) && v !== c.puntos) actualizar(c.id, { puntos: v });
                }}
                className="w-20 rounded-lg border border-marmol-200 px-2 py-1 text-sm"
              />
            </label>
            <button
              type="button"
              disabled={pending}
              onClick={() => actualizar(c.id, { activa: !c.activa })}
              className="text-xs text-flow-600 hover:underline"
            >
              {c.activa ? 'Desactivar' : 'Activar'}
            </button>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex flex-wrap items-end gap-2">
        <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nueva categoría" className="rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm" />
        <input value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Descripción (opcional)" className="rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm flex-1 min-w-[10rem]" />
        <input type="number" min={0} value={puntos} onChange={(e) => setPuntos(e.target.value)} aria-label="Puntos" className="w-20 rounded-lg border border-marmol-200 px-2 py-1.5 text-sm" />
        <button type="button" disabled={pending || !nombre.trim()} onClick={crear} className="rounded-lg bg-flow-500 hover:bg-flow-600 disabled:opacity-40 text-white text-sm font-medium px-3.5 py-1.5 transition">
          Agregar
        </button>
      </div>
      {error && <p className="text-sm text-bajo mt-2">{error}</p>}
    </details>
  );
}
