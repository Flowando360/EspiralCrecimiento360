'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Opcion {
  id: string;
  nombre: string;
  liderId?: string | null;
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
  // Filtro por líder para el selector de «Un colaborador»
  const [liderFiltro, setLiderFiltro] = useState('');
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
      const data = await res.json().catch(() => ({ error: 'La respuesta tardó demasiado o no se pudo leer. Revisa la lista de abajo y vuelve a intentar.' }));
      if (!res.ok) {
        setResultado(`Error: ${data.error}`);
      } else {
        setResultado(
          `Listo: ${data.evaluacionesCreadas} Encuentros de Crecimiento, ${data.tareasCreadas} tareas de acompañante y ${data.itemsCreados} ítems generados.`
        );
        router.refresh();
      }
    } catch {
      setResultado('Error: no se pudo completar la generación. Revisa tu conexión y vuelve a intentar.');
    } finally {
      setCargando(false);
    }
  }

  const colaboradoresVisibles = liderFiltro
    ? colaboradores.filter((c) => c.liderId === liderFiltro)
    : colaboradores;
  const integrantesEquipo = liderId ? colaboradores.filter((c) => c.liderId === liderId).length : 0;

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

      {scope === 'equipo' && liderId && (
        <p className="text-xs text-marmol-500">
          Este equipo tiene {integrantesEquipo} {integrantesEquipo === 1 ? 'persona' : 'personas'}.
        </p>
      )}

      {scope === 'colaborador' && (
        <div className="space-y-2">
          <select
            value={liderFiltro}
            onChange={(e) => {
              setLiderFiltro(e.target.value);
              setColaboradorId('');
            }}
            className="w-full rounded-lg border border-marmol-200 px-3 py-2 text-sm"
            aria-label="Filtrar por líder"
          >
            <option value="">Todos los líderes (sin filtrar)</option>
            {lideres.map((l) => (
              <option key={l.id} value={l.id}>
                Equipo de {l.nombre}
              </option>
            ))}
          </select>
          <select
            value={colaboradorId}
            onChange={(e) => setColaboradorId(e.target.value)}
            className="w-full rounded-lg border border-marmol-200 px-3 py-2 text-sm"
            aria-label="Colaborador"
          >
            <option value="">Selecciona un colaborador…</option>
            {colaboradoresVisibles.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
          {liderFiltro && colaboradoresVisibles.length === 0 && (
            <p className="text-xs text-marmol-500">Este líder no tiene personas a cargo registradas.</p>
          )}
        </div>
      )}

      <button
        onClick={generar}
        disabled={cargando || (scope === 'equipo' && !liderId) || (scope === 'colaborador' && !colaboradorId)}
        className="rounded-lg bg-flow-500 hover:bg-flow-600 text-white text-sm font-medium px-4 py-2 transition disabled:opacity-50"
      >
        {cargando ? (
          <span className="inline-flex items-center gap-2">
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.3" strokeWidth="4" />
              <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
            </svg>
            Generando…
          </span>
        ) : (
          'Generar Encuentros de Crecimiento'
        )}
      </button>

      {cargando && (
        <div role="status" aria-live="polite" className="rounded-lg border border-flow-200 bg-flow-50 p-3 space-y-2">
          <p className="text-sm font-medium text-flow-700">
            Estamos armando los Encuentros de Crecimiento. Esto puede tardar uno o dos minutos.
          </p>
          <p className="text-xs text-marmol-600">
            Por favor no cierres ni recargues esta página hasta que aparezca el mensaje «Listo».
          </p>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-flow-100">
            <div className="h-full w-1/3 animate-pulse rounded-full bg-flow-500" />
          </div>
        </div>
      )}

      {resultado && <p className="text-xs text-marmol-600">{resultado}</p>}

      <p className="text-xs text-marmol-400">
        Cada Encuentro de Crecimiento se arma con los 5 bloques: Competencias Organizacionales, Funcionales,
        Liderazgo (si aplica), Roles y Funciones (desde el perfil de cargo) y Cultura. Después de
        generarlo, puedes agregar o quitar ítems puntuales desde la ficha de cada Encuentro de Crecimiento.
      </p>
    </div>
  );
}
