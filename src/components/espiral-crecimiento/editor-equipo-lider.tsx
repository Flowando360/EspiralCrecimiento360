'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Search, Users } from 'lucide-react';
import { asignarEquipoLider } from '@/app/(dashboard)/administracion/organigrama/actions';

export interface PersonaEquipo {
  id: string;
  nombre: string;
  cargo: string | null;
  liderActualId: string | null;
  liderActualNombre: string | null;
  enPrueba: boolean;
}

/** Escoger al líder cuyo equipo se quiere editar. */
export function SelectorLiderEquipo({
  lideres,
  liderId,
}: {
  lideres: { id: string; nombre: string }[];
  liderId: string;
}) {
  const router = useRouter();
  return (
    <select
      value={liderId}
      onChange={(e) =>
        router.push(e.target.value ? `/administracion/organigrama?lider=${e.target.value}#equipo` : '/administracion/organigrama')
      }
      className="rounded-lg border border-marmol-200 px-3 py-2 text-sm bg-white min-w-[260px]"
      aria-label="Elegir líder"
    >
      <option value="">— Elige un líder —</option>
      {lideres.map((l) => (
        <option key={l.id} value={l.id}>
          {l.nombre}
        </option>
      ))}
    </select>
  );
}

/**
 * Marca quiénes están a cargo de un líder. Quien ya tiene otro líder se
 * muestra con su líder actual: al guardar pasa a este líder.
 */
export function EditorEquipoLider({
  liderId,
  liderNombre,
  personas,
  bloqueados,
  equipoInicial,
}: {
  liderId: string;
  liderNombre: string;
  personas: PersonaEquipo[];
  /** Jefes (directos o indirectos) del líder: no pueden quedar a su cargo. */
  bloqueados: string[];
  equipoInicial: string[];
}) {
  const router = useRouter();
  const [seleccion, setSeleccion] = useState<Set<string>>(new Set(equipoInicial));
  const [filtro, setFiltro] = useState('');
  const [pending, startTransition] = useTransition();
  const [mensaje, setMensaje] = useState<{ ok: boolean; texto: string } | null>(null);

  const inicial = useMemo(() => new Set(equipoInicial), [equipoInicial]);
  const cambios = useMemo(() => {
    let agregar = 0;
    let quitar = 0;
    seleccion.forEach((id) => !inicial.has(id) && agregar++);
    inicial.forEach((id) => !seleccion.has(id) && quitar++);
    return { agregar, quitar };
  }, [seleccion, inicial]);

  const visibles = useMemo(() => {
    const q = filtro.trim().toLowerCase();
    return personas
      .filter((p) => !q || p.nombre.toLowerCase().includes(q) || (p.cargo ?? '').toLowerCase().includes(q))
      .sort((a, b) => Number(seleccion.has(b.id)) - Number(seleccion.has(a.id)) || a.nombre.localeCompare(b.nombre));
  }, [personas, filtro, seleccion]);

  function alternar(id: string) {
    setMensaje(null);
    setSeleccion((prev) => {
      const sig = new Set(prev);
      if (sig.has(id)) sig.delete(id);
      else sig.add(id);
      return sig;
    });
  }

  function guardar() {
    setMensaje(null);
    startTransition(async () => {
      const res = await asignarEquipoLider(liderId, Array.from(seleccion));
      if (res.ok) {
        setMensaje({
          ok: true,
          texto: `Equipo de ${liderNombre} guardado: ${res.agregados} agregado(s), ${res.quitados} quitado(s).`,
        });
        router.refresh();
      } else {
        setMensaje({ ok: false, texto: res.error });
      }
    });
  }

  return (
    <div className="card p-5 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="font-display font-semibold text-secundario flex items-center gap-2">
          <Users size={16} className="text-flow-600" /> Equipo a cargo de {liderNombre}
        </h2>
        <span className="text-xs text-marmol-500">
          {seleccion.size} persona(s) seleccionada(s)
          {(cambios.agregar > 0 || cambios.quitar > 0) && (
            <> · pendiente de guardar: +{cambios.agregar} / −{cambios.quitar}</>
          )}
        </span>
      </div>

      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-marmol-400" />
        <input
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          placeholder="Buscar persona o cargo…"
          className="w-full rounded-lg border border-marmol-200 pl-9 pr-3 py-2 text-sm"
        />
      </div>

      <ul className="max-h-96 overflow-y-auto divide-y divide-marmol-100 rounded-lg border border-marmol-200">
        {visibles.map((p) => {
          const bloqueado = bloqueados.includes(p.id);
          const marcado = seleccion.has(p.id);
          const otroLider = p.liderActualId && p.liderActualId !== liderId;
          return (
            <li key={p.id}>
              <label
                className={`flex items-start gap-3 px-3 py-2 text-sm ${
                  bloqueado ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-marmol-50'
                }`}
              >
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={marcado}
                  disabled={bloqueado || pending}
                  onChange={() => alternar(p.id)}
                />
                <span className="flex-1">
                  <span className="font-medium text-marmol-900">{p.nombre}</span>
                  {p.enPrueba && <span className="ml-2 text-[11px] text-medio">período de prueba</span>}
                  <span className="block text-xs text-marmol-500">{p.cargo ?? 'Sin cargo'}</span>
                  {bloqueado && <span className="block text-xs text-marmol-400">Es jefe de este líder: no puede quedar a su cargo.</span>}
                  {!bloqueado && otroLider && (
                    <span className={`block text-xs ${marcado ? 'text-medio' : 'text-marmol-400'}`}>
                      {marcado && !inicial.has(p.id) ? 'Pasará de ' : 'Hoy reporta a '}
                      {p.liderActualNombre}
                    </span>
                  )}
                  {!bloqueado && !p.liderActualId && !marcado && (
                    <span className="block text-xs text-marmol-400">Sin líder asignado</span>
                  )}
                </span>
              </label>
            </li>
          );
        })}
        {visibles.length === 0 && <li className="px-3 py-4 text-sm text-marmol-400">Nadie coincide con la búsqueda.</li>}
      </ul>

      {cambios.quitar > 0 && (
        <p className="text-xs text-medio bg-medio/10 border border-medio/20 rounded-lg px-3 py-2">
          Las {cambios.quitar} persona(s) que desmarcaste quedarán <strong>sin líder</strong> hasta que las asignes a otro.
        </p>
      )}
      {mensaje && <p className={`text-sm ${mensaje.ok ? 'text-alto' : 'text-bajo'}`}>{mensaje.texto}</p>}

      <button
        type="button"
        onClick={guardar}
        disabled={pending || (cambios.agregar === 0 && cambios.quitar === 0)}
        className="inline-flex items-center gap-1.5 rounded-lg bg-flow-500 hover:bg-flow-600 disabled:opacity-40 text-white text-sm font-medium px-4 py-2"
      >
        <Check size={14} /> {pending ? 'Guardando…' : 'Guardar equipo'}
      </button>
      <p className="text-xs text-marmol-400">
        Los ciclos ya generados no cambian solos: al terminar de ordenar el equipo, vuelve a pulsar «Generar encuentros» en el
        ciclo; respeta lo ya generado y agrega solo lo nuevo.
      </p>
    </div>
  );
}
