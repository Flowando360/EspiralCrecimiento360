'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  abrirRondaCultura,
  agregarComportamiento,
  cambiarComportamiento,
  cerrarRondaCultura,
  responderCultura,
} from '@/app/(dashboard)/nexa/cultura/actions';
import { cn } from '@/lib/utils';

type Res = { ok: true } | { ok: false; error: string };

function useAccion() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  function correr(fn: () => Promise<Res>, alExito?: () => void) {
    setError(null);
    start(async () => {
      const r = await fn();
      if (r.ok) {
        alExito?.();
        router.refresh();
      } else setError(r.error);
    });
  }
  return { pending, error, correr };
}

export function AdminCultura({
  comportamientos,
  rondaAbierta,
}: {
  comportamientos: { id: string; dimension: string; enunciado: string; activo: boolean }[];
  rondaAbierta: { id: string; nombre: string } | null;
}) {
  const { pending, error, correr } = useAccion();
  const [dimension, setDimension] = useState('');
  const [enunciado, setEnunciado] = useState('');
  const [nombre, setNombre] = useState('');
  const dimensiones = Array.from(new Set(comportamientos.map((c) => c.dimension)));

  return (
    <div className="space-y-4">
      <div className="card p-4 space-y-3">
        <h3 className="text-sm font-semibold text-marmol-800">Comportamientos a medir</h3>
        <p className="text-xs text-marmol-500">
          Agrupa cada comportamiento en una dimensión cultural (por ejemplo, un valor de la empresa). Cada persona dirá con
          qué frecuencia ocurre hoy y con qué frecuencia debería ocurrir.
        </p>
        {comportamientos.length > 0 && (
          <ul className="divide-y divide-marmol-100 text-sm">
            {comportamientos.map((c) => (
              <li key={c.id} className="py-2 flex items-center justify-between gap-3 flex-wrap">
                <span className={cn(!c.activo && 'text-marmol-400 line-through')}>
                  <span className="text-xs uppercase tracking-wide text-marmol-400 mr-2">{c.dimension}</span>
                  {c.enunciado}
                </span>
                <span className="flex gap-3 text-xs">
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => correr(() => cambiarComportamiento(c.id, c.activo ? 'desactivar' : 'activar'))}
                    className="text-marmol-500 hover:text-flow-600"
                  >
                    {c.activo ? 'Desactivar' : 'Activar'}
                  </button>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => correr(() => cambiarComportamiento(c.id, 'eliminar'))}
                    className="text-marmol-500 hover:text-bajo"
                  >
                    Eliminar
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}
        <div className="grid gap-2 sm:grid-cols-[200px_1fr_auto]">
          <input
            list="dimensiones-cultura"
            value={dimension}
            onChange={(e) => setDimension(e.target.value)}
            placeholder="Dimensión cultural"
            className="rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm"
          />
          <datalist id="dimensiones-cultura">
            {dimensiones.map((d) => (
              <option key={d} value={d} />
            ))}
          </datalist>
          <input
            value={enunciado}
            onChange={(e) => setEnunciado(e.target.value)}
            placeholder="Comportamiento, ej. «Pedimos ayuda sin temor a que nos juzguen»"
            className="rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm"
          />
          <button
            type="button"
            disabled={pending || !dimension.trim() || !enunciado.trim()}
            onClick={() =>
              correr(() => agregarComportamiento({ dimension, enunciado }), () => setEnunciado(''))
            }
            className="rounded-lg bg-flow-500 hover:bg-flow-600 disabled:opacity-40 text-white text-sm font-medium px-4 py-2"
          >
            Agregar
          </button>
        </div>
      </div>

      <div className="card p-4">
        {rondaAbierta ? (
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-sm font-medium text-marmol-800">Encuesta abierta: {rondaAbierta.nombre}</p>
              <p className="text-xs text-marmol-500">Ciérrala para fijar los resultados.</p>
            </div>
            <button
              type="button"
              disabled={pending}
              onClick={() => correr(() => cerrarRondaCultura(rondaAbierta.id))}
              className="rounded-lg border border-marmol-200 text-marmol-600 hover:border-bajo hover:text-bajo text-sm font-medium px-4 py-2 disabled:opacity-40"
            >
              Cerrar encuesta
            </button>
          </div>
        ) : (
          <div className="flex gap-2 flex-wrap">
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder='Nombre, ej. "Cultura 2026"'
              className="rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm w-64"
            />
            <button
              type="button"
              disabled={pending || !nombre.trim()}
              onClick={() => correr(() => abrirRondaCultura(nombre), () => setNombre(''))}
              className="rounded-lg bg-flow-500 hover:bg-flow-600 disabled:opacity-40 text-white text-sm font-medium px-4 py-2"
            >
              Abrir encuesta de cultura
            </button>
          </div>
        )}
      </div>
      {error && <p className="text-sm text-bajo">{error}</p>}
    </div>
  );
}

const ESCALA = ['Nunca', 'Casi nunca', 'A veces', 'Casi siempre', 'Siempre'];

export function FormularioCultura({
  rondaId,
  comportamientos,
}: {
  rondaId: string;
  comportamientos: { id: string; dimension: string; enunciado: string }[];
}) {
  const { pending, error, correr } = useAccion();
  const [resp, setResp] = useState<Record<string, { actual?: number; deseada?: number }>>({});
  const [enviado, setEnviado] = useState(false);
  const completo = comportamientos.every((c) => resp[c.id]?.actual && resp[c.id]?.deseada);

  if (enviado)
    return (
      <div className="card p-5">
        <p className="text-sm font-medium text-marmol-800">¡Gracias por responder! 🙌</p>
        <p className="text-xs text-marmol-500 mt-1">Tu respuesta es anónima: no queda ligada a tu nombre.</p>
      </div>
    );

  const botones = (id: string, campo: 'actual' | 'deseada') => (
    <div className="flex gap-1.5 flex-wrap">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          title={ESCALA[n - 1]}
          onClick={() => setResp((r) => ({ ...r, [id]: { ...r[id], [campo]: n } }))}
          className={cn(
            'h-9 min-w-9 px-2 rounded-lg text-sm font-medium border transition',
            resp[id]?.[campo] === n ? 'bg-flow-500 border-flow-500 text-white' : 'border-marmol-200 text-marmol-600 hover:border-flow-300'
          )}
        >
          {n}
        </button>
      ))}
    </div>
  );

  return (
    <div className="card p-5 space-y-5 max-w-3xl">
      <p className="text-xs text-marmol-500">
        Escala: 1 = Nunca · 2 = Casi nunca · 3 = A veces · 4 = Casi siempre · 5 = Siempre. Responde cuántas veces ocurre
        HOY y cuántas veces CREES QUE DEBERÍA ocurrir.
      </p>
      {comportamientos.map((c) => (
        <div key={c.id} className="space-y-2 border-t border-marmol-100 pt-4 first:border-0 first:pt-0">
          <p className="text-sm font-medium text-marmol-800">
            <span className="text-xs uppercase tracking-wide text-marmol-400 mr-2">{c.dimension}</span>
            {c.enunciado}
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            <div>
              <p className="text-xs text-marmol-500 mb-1">¿Con qué frecuencia ocurre hoy?</p>
              {botones(c.id, 'actual')}
            </div>
            <div>
              <p className="text-xs text-marmol-500 mb-1">¿Con qué frecuencia debería ocurrir?</p>
              {botones(c.id, 'deseada')}
            </div>
          </div>
        </div>
      ))}
      {error && <p className="text-sm text-bajo">{error}</p>}
      <button
        type="button"
        disabled={pending || !completo}
        onClick={() =>
          correr(
            () =>
              responderCultura({
                rondaId,
                respuestas: comportamientos.map((c) => ({ comportamientoId: c.id, actual: resp[c.id]!.actual!, deseada: resp[c.id]!.deseada! })),
              }),
            () => setEnviado(true)
          )
        }
        className="rounded-lg bg-flow-500 hover:bg-flow-600 disabled:opacity-40 text-white text-sm font-medium px-4 py-2"
      >
        {pending ? 'Enviando…' : 'Enviar respuesta'}
      </button>
    </div>
  );
}
