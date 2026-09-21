'use client';

import { useState, useTransition } from 'react';
import { confirmarLectura } from '@/app/(dashboard)/procesos-gestion/documentos/actions';
import { cn, formatearFecha } from '@/lib/utils';
import { Check, Download, MessageSquare } from 'lucide-react';

export interface ConfirmacionLectura {
  id: string;
  colaborador_id: string;
  colaborador_nombre: string;
  comentario: string | null;
  confirmado_at: string;
}

export interface VersionHistorial {
  id: string;
  version: string;
  resumen_cambio: string | null;
  fecha: string;
}

export function DetalleDocumento({
  documentoId,
  requiereConfirmacion,
  totalConColaboradorAcceso,
  umbralPct,
  confirmacionesIniciales,
  yaConfirme,
  puedeConfirmar,
  historial,
}: {
  documentoId: string;
  requiereConfirmacion: boolean;
  totalConColaboradorAcceso: number;
  umbralPct: number;
  confirmacionesIniciales: ConfirmacionLectura[];
  yaConfirme: boolean;
  puedeConfirmar: boolean;
  historial: VersionHistorial[];
}) {
  const [confirmaciones, setConfirmaciones] = useState(confirmacionesIniciales);
  const [confirmado, setConfirmado] = useState(yaConfirme);
  const [comentario, setComentario] = useState('');
  const [mostrarComentario, setMostrarComentario] = useState(false);
  const [pending, startTransition] = useTransition();

  const porcentaje = totalConColaboradorAcceso > 0 ? Math.round((confirmaciones.length / totalConColaboradorAcceso) * 100) : 0;
  const completa = porcentaje >= umbralPct;

  function confirmar() {
    startTransition(async () => {
      const res = await confirmarLectura(documentoId, comentario || undefined);
      if (res.ok) {
        setConfirmado(true);
        setMostrarComentario(false);
      }
    });
  }

  return (
    <div className="space-y-4">
      {requiereConfirmacion && (
        <div className="card p-5">
          <div className="flex items-center justify-between gap-3 flex-wrap mb-2">
            <h2 className="font-display font-semibold text-secundario">Difusión</h2>
            <a
              href={`/api/procesos-gestion/documentos/${documentoId}/acta-difusion/pdf`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-marmol-200 hover:bg-marmol-50 text-marmol-600 text-sm font-medium px-3 py-1.5"
            >
              <Download size={14} /> Exportar acta de difusión
            </a>
          </div>

          <div className="flex items-center gap-3 mb-3">
            <div className="flex-1 h-2 rounded-full bg-marmol-100 overflow-hidden">
              <div className={cn('h-full rounded-full', completa ? 'bg-alto' : 'bg-medio')} style={{ width: `${Math.min(porcentaje, 100)}%` }} />
            </div>
            <span className="text-xs text-marmol-500 shrink-0">
              {confirmaciones.length} de {totalConColaboradorAcceso} confirmaron ({porcentaje}%) · umbral {umbralPct}%
            </span>
          </div>

          {puedeConfirmar && !confirmado && (
            <div className="space-y-1.5">
              {mostrarComentario && (
                <input
                  value={comentario}
                  onChange={(e) => setComentario(e.target.value)}
                  placeholder="Comentario o pregunta (opcional)"
                  className="w-full rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm"
                />
              )}
              <div className="flex items-center gap-2">
                <button
                  onClick={confirmar}
                  disabled={pending}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-flow-500 hover:bg-flow-600 disabled:opacity-40 text-white text-sm font-medium px-3.5 py-1.5"
                >
                  <Check size={14} /> {pending ? 'Confirmando…' : 'Confirmar lectura'}
                </button>
                {!mostrarComentario && (
                  <button onClick={() => setMostrarComentario(true)} className="inline-flex items-center gap-1 text-xs text-marmol-500 hover:text-flow-600">
                    <MessageSquare size={12} /> Agregar comentario
                  </button>
                )}
              </div>
            </div>
          )}
          {confirmado && <p className="text-sm text-alto inline-flex items-center gap-1"><Check size={14} /> Ya confirmaste la lectura de este documento.</p>}

          <div className="mt-3 space-y-1">
            {confirmaciones.map((c) => (
              <div key={c.id} className="text-xs text-marmol-500 flex items-center justify-between border-b border-marmol-50 pb-1">
                <span>
                  {c.colaborador_nombre} {c.comentario && <span className="text-marmol-400 italic">— "{c.comentario}"</span>}
                </span>
                <span>{formatearFecha(c.confirmado_at)}</span>
              </div>
            ))}
            {confirmaciones.length === 0 && <p className="text-xs text-marmol-400">Nadie ha confirmado lectura todavía.</p>}
          </div>
        </div>
      )}

      <div className="card p-5">
        <h2 className="font-display font-semibold text-secundario mb-2">Historial de versiones</h2>
        <div className="space-y-1.5">
          {historial.map((h) => (
            <div key={h.id} className="text-sm border-b border-marmol-50 pb-1.5 flex items-center justify-between">
              <span className="text-marmol-700">
                {h.version} {h.resumen_cambio && <span className="text-marmol-400">— {h.resumen_cambio}</span>}
              </span>
              <span className="text-xs text-marmol-400">{formatearFecha(h.fecha)}</span>
            </div>
          ))}
          {historial.length === 0 && <p className="text-sm text-marmol-400">Sin versiones anteriores — esta es la primera versión.</p>}
        </div>
      </div>
    </div>
  );
}
