'use client';

import { useState, useTransition } from 'react';
import { actualizarDisponibilidadCandidato, atenderSolicitudTitular } from '@/app/(dashboard)/reclutamiento/actions';

export interface CandidatoBanco {
  id: string;
  nombre: string;
  origen: string | null;
  disponible: boolean;
  conservarHasta: string | null;
}

export interface SolicitudTitular {
  id: string;
  tipo: string;
  nombre: string;
  correo: string | null;
  detalle: string;
  recibidaEn: string;
}

const ETIQUETA_TIPO: Record<string, string> = {
  consulta: 'Conocer sus datos',
  correccion: 'Corregir datos',
  revocacion: 'Revocar autorización',
  supresion: 'Suprimir datos',
};

/** Banco: disponibilidad para otros cargos, plazo de conservación y solicitudes de los titulares. */
export function PanelBanco({ candidatos, solicitudes }: { candidatos: CandidatoBanco[]; solicitudes: SolicitudTitular[] }) {
  const [lista, setLista] = useState(candidatos);
  const [pendientes, setPendientes] = useState(solicitudes);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function alternar(id: string, disponible: boolean) {
    setError(null);
    setLista((prev) => prev.map((c) => (c.id === id ? { ...c, disponible } : c)));
    startTransition(async () => {
      const res = await actualizarDisponibilidadCandidato(id, disponible);
      if (!res.ok) setError(res.error);
    });
  }

  function atender(id: string) {
    setError(null);
    startTransition(async () => {
      const res = await atenderSolicitudTitular(id);
      if (res.ok) setPendientes((prev) => prev.filter((s) => s.id !== id));
      else setError(res.error);
    });
  }

  return (
    <div className="space-y-6">
      <section className="card p-4 space-y-3">
        <div>
          <h2 className="font-display font-semibold text-secundario text-sm">Solicitudes de titulares de datos</h2>
          <p className="text-xs text-marmol-400">Respóndelas dentro del plazo legal. Al atenderlas, marca la solicitud como atendida.</p>
        </div>
        {pendientes.length === 0 ? (
          <p className="text-sm text-marmol-500">No hay solicitudes pendientes.</p>
        ) : (
          <ul className="divide-y divide-marmol-100">
            {pendientes.map((s) => (
              <li key={s.id} className="py-2.5 flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-marmol-800">
                    {s.nombre} · {ETIQUETA_TIPO[s.tipo] ?? s.tipo}
                  </p>
                  <p className="text-xs text-marmol-500">{s.detalle}</p>
                  <p className="text-xs text-marmol-400">
                    {s.correo ?? 'Sin correo'} · recibida el {s.recibidaEn.slice(0, 10)}
                  </p>
                </div>
                <button type="button" onClick={() => atender(s.id)} disabled={pending} className="rounded-lg border border-marmol-200 hover:bg-marmol-50 text-xs px-2.5 py-1">
                  Marcar atendida
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card p-4 space-y-3">
        <div>
          <h2 className="font-display font-semibold text-secundario text-sm">Disponibilidad para otros cargos</h2>
          <p className="text-xs text-marmol-400">Marca a quienes autorizaron el banco de talento y siguen disponibles para otra vacante.</p>
        </div>
        {lista.length === 0 ? (
          <p className="text-sm text-marmol-500">Todavía no hay candidatos.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-marmol-400 border-b border-marmol-100">
                <th className="font-medium py-1.5">Candidato</th>
                <th className="font-medium py-1.5">Origen</th>
                <th className="font-medium py-1.5">Conservar hasta</th>
                <th className="font-medium py-1.5">Disponible</th>
              </tr>
            </thead>
            <tbody>
              {lista.map((c) => (
                <tr key={c.id} className="border-b border-marmol-50 last:border-0">
                  <td className="py-1.5 text-marmol-800">{c.nombre}</td>
                  <td className="py-1.5 text-marmol-500 text-xs">{c.origen ?? '—'}</td>
                  <td className="py-1.5 text-marmol-500 text-xs">{c.conservarHasta ?? '—'}</td>
                  <td className="py-1.5">
                    <input type="checkbox" checked={c.disponible} onChange={(e) => alternar(c.id, e.target.checked)} disabled={pending} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
      {error && <p className="text-xs text-bajo">{error}</p>}
    </div>
  );
}
