'use client';

import { useState, useTransition } from 'react';
import { Trash2 } from 'lucide-react';
import {
  registrarSeguimientoExterno,
  eliminarSeguimientoExterno,
} from '@/app/(dashboard)/espiral-crecimiento/externos/actions';
import { formatearFecha } from '@/lib/utils';

export interface Seguimiento {
  id: string;
  fecha: string;
  calificacion: number | null;
  comentario: string;
}

export function SeguimientoExterno({
  colaboradorId,
  items,
  puedeRegistrar,
  puedeBorrar,
}: {
  colaboradorId: string;
  items: Seguimiento[];
  puedeRegistrar: boolean;
  puedeBorrar: boolean;
}) {
  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0, 10));
  const [calificacion, setCalificacion] = useState('');
  const [comentario, setComentario] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function guardar() {
    setError(null);
    startTransition(async () => {
      const res = await registrarSeguimientoExterno({
        colaboradorId,
        fecha,
        calificacion: calificacion ? Number(calificacion) : null,
        comentario,
      });
      if (res.ok) setComentario('');
      else setError(res.error);
    });
  }

  const calificados = items.filter((i) => i.calificacion != null);
  const promedio = calificados.length ? calificados.reduce((a, i) => a + (i.calificacion ?? 0), 0) / calificados.length : null;

  return (
    <section className="card p-5 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="font-display font-semibold text-secundario">Seguimiento del servicio</h2>
        {promedio != null && <span className="text-xs text-marmol-500">Calificación promedio: {promedio.toFixed(1)} / 5</span>}
      </div>

      {puedeRegistrar && (
        <div className="space-y-2 rounded-lg border border-marmol-100 p-3">
          <div className="grid grid-cols-2 gap-2 max-w-sm">
            <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className="rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm" />
            <select value={calificacion} onChange={(e) => setCalificacion(e.target.value)} className="rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm bg-white">
              <option value="">Sin calificar</option>
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>
                  {n} — {['', 'Deficiente', 'Regular', 'Aceptable', 'Bueno', 'Excelente'][n]}
                </option>
              ))}
            </select>
          </div>
          <textarea
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            rows={2}
            placeholder="Novedad, cumplimiento, calidad, seguridad (SST)…"
            className="w-full rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm"
          />
          {error && <p className="text-xs text-bajo">{error}</p>}
          <button
            type="button"
            onClick={guardar}
            disabled={pending || comentario.trim().length < 3}
            className="rounded-lg bg-flow-500 hover:bg-flow-600 disabled:opacity-40 text-white text-xs font-medium px-3 py-1.5"
          >
            {pending ? 'Guardando…' : 'Agregar seguimiento'}
          </button>
        </div>
      )}

      {items.length === 0 ? (
        <p className="text-sm text-marmol-400">Todavía no hay seguimientos registrados.</p>
      ) : (
        <ul className="divide-y divide-marmol-100">
          {items.map((i) => (
            <li key={i.id} className="py-2 text-sm flex items-start justify-between gap-3">
              <div>
                <p className="text-xs text-marmol-400">
                  {formatearFecha(i.fecha)}
                  {i.calificacion != null && <> · {i.calificacion} / 5</>}
                </p>
                <p className="text-marmol-800">{i.comentario}</p>
              </div>
              {puedeBorrar && (
                <button
                  type="button"
                  title="Eliminar"
                  onClick={() => confirm('¿Eliminar este seguimiento?') && startTransition(async () => void (await eliminarSeguimientoExterno(i.id, colaboradorId)))}
                  className="text-marmol-400 hover:text-bajo"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
