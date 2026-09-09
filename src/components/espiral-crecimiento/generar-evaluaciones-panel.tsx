'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Opcion {
  id: string;
  nombre: string;
}

export function GenerarEvaluacionesPanel({
  cicloId,
  lideres,
  colaboradores,
}: {
  cicloId: string;
  lideres: Opcion[];
  colaboradores: Opcion[];
}) {
  const router = useRouter();
  const [scope, setScope] = useState<'todos' | 'equipo' | 'colaborador'>('todos');
  const [liderId, setLiderId] = useState('');
  const [colaboradorId, setColaboradorId] = useState('');
  const [cargando, setCargando] = useState(false);
  const [resultado, setResultado] = useState<string | null>(null);

  async function generar() {
    setCargando(true);
    setResultado(null);
    try {
      const res = await fetch('/api/evaluaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cicloId, scope, liderId: liderId || undefined, colaboradorId: colaboradorId || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setResultado(`Error: ${data.error}`);
      } else {
        setResultado(
          `Listo: ${data.evaluacionesCreadas} Encuentros de Crecimiento, ${data.tareasCreadas} tareas de acompañante y ${data.itemsCreados} ítems generados.`
        );
        router.refresh();
      }
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="card p-5 space-y-4">
      <h3 className="font-display font-semibold text-secundario">Generar Encuentros de Crecimiento</h3>

      <div className="flex gap-2">
        {(['todos', 'equipo', 'colaborador'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setScope(s)}
            className={`text-xs rounded-full px-3 py-1.5 font-medium transition ${
              scope === s ? 'bg-flow-500 text-white' : 'bg-marmol-100 text-marmol-600'
            }`}
          >
            {s === 'todos' ? 'Todos los colaboradores' : s === 'equipo' ? 'Un equipo' : 'Un colaborador'}
          </button>
        ))}
      </div>

      {scope === 'equipo' && (
        <select
          value={liderId}
          onChange={(e) => setLiderId(e.target.value)}
          className="w-full rounded-lg border border-marmol-200 px-3 py-2 text-sm"
        >
          <option value="">Selecciona un líder / equipo…</option>
          {lideres.map((l) => (
            <option key={l.id} value={l.id}>
              {l.nombre}
            </option>
          ))}
        </select>
      )}

      {scope === 'colaborador' && (
        <select
          value={colaboradorId}
          onChange={(e) => setColaboradorId(e.target.value)}
          className="w-full rounded-lg border border-marmol-200 px-3 py-2 text-sm"
        >
          <option value="">Selecciona un colaborador…</option>
          {colaboradores.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </select>
      )}

      <button
        onClick={generar}
        disabled={cargando || (scope === 'equipo' && !liderId) || (scope === 'colaborador' && !colaboradorId)}
        className="rounded-lg bg-flow-500 hover:bg-flow-600 text-white text-sm font-medium px-4 py-2 transition disabled:opacity-50"
      >
        {cargando ? 'Generando…' : 'Generar Encuentros de Crecimiento'}
      </button>

      {resultado && <p className="text-xs text-marmol-600">{resultado}</p>}

      <p className="text-xs text-marmol-400">
        Cada Encuentro de Crecimiento se arma con los 5 bloques: Competencias Organizacionales, Funcionales,
        Liderazgo (si aplica), Roles y Funciones (desde el perfil de cargo) y Cultura. Después de
        generarlo, puedes agregar o quitar ítems puntuales desde la ficha de cada Encuentro de Crecimiento.
      </p>
    </div>
  );
}
