'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, Plus } from 'lucide-react';
import { registrarSeguimientoSer, eliminarSeguimientoSer } from '@/app/(dashboard)/espiral-crecimiento/colaboradores/[id]/guia-flow/seguimiento-actions';

export interface SeguimientoSerVista {
  id: string;
  fecha: string;
  fortalezas_en_practica: string | null;
  motivadores: string | null;
  acuerdos: string | null;
  proxima_revision: string | null;
  registrado_por_nombre: string | null;
}

/** Seguimiento periódico del Ser: conversaciones registradas, descriptivas y sin nota. */
export function SeguimientoSer({
  colaboradorId,
  seguimientos,
  puedeRegistrar,
}: {
  colaboradorId: string;
  seguimientos: SeguimientoSerVista[];
  puedeRegistrar: boolean;
}) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const hoy = new Date().toISOString().slice(0, 10);
  const [fecha, setFecha] = useState(hoy);
  const [fortalezas, setFortalezas] = useState('');
  const [motivadores, setMotivadores] = useState('');
  const [acuerdos, setAcuerdos] = useState('');
  const [proxima, setProxima] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function guardar() {
    setError(null);
    startTransition(async () => {
      const res = await registrarSeguimientoSer({ colaboradorId, fecha, fortalezasEnPractica: fortalezas, motivadores, acuerdos, proximaRevision: proxima });
      if (!res.ok) return setError(res.error);
      setAbierto(false);
      setFortalezas('');
      setMotivadores('');
      setAcuerdos('');
      setProxima('');
      router.refresh();
    });
  }

  function eliminar(id: string) {
    if (!window.confirm('¿Eliminar este seguimiento?')) return;
    startTransition(async () => {
      await eliminarSeguimientoSer({ id, colaboradorId });
      router.refresh();
    });
  }

  return (
    <div className="card p-5 space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="font-display font-semibold text-secundario">Seguimiento del Ser</h2>
          <p className="text-xs text-marmol-400 mt-0.5 max-w-lg">
            El Ser cambia con el tiempo. Aquí se deja constancia, conversación a conversación, de cómo la persona pone en práctica sus fortalezas, qué la motiva hoy y qué se acordó. Es descriptivo, sin nota. No escribas aquí aspectos íntimos o sensibles de la Guía del Flow.
          </p>
        </div>
        {puedeRegistrar && !abierto && (
          <button type="button" onClick={() => setAbierto(true)} className="inline-flex items-center gap-1 rounded-lg border border-marmol-200 hover:border-flow-300 px-3 py-1.5 text-xs font-medium text-marmol-600">
            <Plus size={12} /> Registrar seguimiento
          </button>
        )}
      </div>

      {abierto && (
        <div className="space-y-2 rounded-lg border border-marmol-200 bg-marmol-50 p-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <label className="text-xs text-marmol-500">
              Fecha de la conversación
              <input type="date" value={fecha} max={hoy} onChange={(e) => setFecha(e.target.value)} className="mt-0.5 w-full rounded-lg border border-marmol-200 px-2 py-1.5 text-sm" />
            </label>
            <label className="text-xs text-marmol-500">
              Próxima revisión (opcional)
              <input type="date" value={proxima} min={hoy} onChange={(e) => setProxima(e.target.value)} className="mt-0.5 w-full rounded-lg border border-marmol-200 px-2 py-1.5 text-sm" />
            </label>
          </div>
          <label className="block text-xs text-marmol-500">
            Fortalezas puestas en práctica
            <textarea value={fortalezas} onChange={(e) => setFortalezas(e.target.value)} rows={2} className="mt-0.5 w-full rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm" />
          </label>
          <label className="block text-xs text-marmol-500">
            Motivadores del momento
            <textarea value={motivadores} onChange={(e) => setMotivadores(e.target.value)} rows={2} className="mt-0.5 w-full rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm" />
          </label>
          <label className="block text-xs text-marmol-500">
            Acuerdos
            <textarea value={acuerdos} onChange={(e) => setAcuerdos(e.target.value)} rows={2} className="mt-0.5 w-full rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm" />
          </label>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button type="button" onClick={guardar} disabled={pending} className="btn-primary text-xs">
              {pending ? 'Guardando…' : 'Guardar seguimiento'}
            </button>
            <button type="button" onClick={() => setAbierto(false)} className="text-xs text-marmol-500">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {seguimientos.length === 0 ? (
        <p className="text-sm text-marmol-400">Aún no hay seguimientos registrados.</p>
      ) : (
        <ol className="space-y-3">
          {seguimientos.map((s) => (
            <li key={s.id} className="rounded-lg border border-marmol-200 p-3 space-y-1.5">
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs text-marmol-500">
                  {s.fecha}
                  {s.registrado_por_nombre ? ` · ${s.registrado_por_nombre}` : ''}
                  {s.proxima_revision ? ` · próxima revisión ${s.proxima_revision}` : ''}
                </p>
                {puedeRegistrar && (
                  <button type="button" onClick={() => eliminar(s.id)} aria-label="Eliminar seguimiento" className="text-marmol-300 hover:text-bajo shrink-0">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
              {s.fortalezas_en_practica && <p className="text-sm text-marmol-700"><span className="font-medium">Fortalezas en práctica:</span> {s.fortalezas_en_practica}</p>}
              {s.motivadores && <p className="text-sm text-marmol-700"><span className="font-medium">Motivadores:</span> {s.motivadores}</p>}
              {s.acuerdos && <p className="text-sm text-marmol-700"><span className="font-medium">Acuerdos:</span> {s.acuerdos}</p>}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
