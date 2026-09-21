'use client';

import { useState, useTransition } from 'react';
import { generarEnlaceEvidenciaAuditoria, revocarEnlaceEvidenciaAuditoria, type EnlaceEvidenciaAuditoria } from '@/app/(dashboard)/informes/evidencia-auditoria/actions';
import type { TipoPaqueteAuditoria } from '@/app/(dashboard)/informes/evidencia-auditoria/data';
import { formatearFecha } from '@/lib/utils';
import { Link2, Check, Plus, Ban } from 'lucide-react';

const TIPO_LABEL: Record<TipoPaqueteAuditoria, string> = {
  todos: 'Paquete completo',
  sst: 'SST',
  iso_9001: 'ISO 9001',
  sarlaft_sagrilaft: 'SARLAFT/SAGRILAFT',
  ptee: 'PTEE',
};

export function EnlacesAuditoriaExterna({ enlacesIniciales }: { enlacesIniciales: EnlaceEvidenciaAuditoria[] }) {
  const [enlaces, setEnlaces] = useState(enlacesIniciales);
  const [abierto, setAbierto] = useState(false);
  const [tipo, setTipo] = useState<TipoPaqueteAuditoria>('todos');
  const [diasVigencia, setDiasVigencia] = useState('15');
  const [nota, setNota] = useState('');
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [copiadoId, setCopiadoId] = useState<string | null>(null);

  function generar() {
    setError(null);
    startTransition(async () => {
      const res = await generarEnlaceEvidenciaAuditoria({ tipo, diasVigencia: Number(diasVigencia) || 15, nota });
      if (res.ok) {
        window.location.reload(); // más simple que re-fetch manual: recarga trae el enlace nuevo con su token real
      } else {
        setError(res.error);
      }
    });
  }

  function revocar(id: string) {
    setEnlaces((prev) => prev.map((e) => (e.id === id ? { ...e, activo: false } : e)));
    startTransition(() => {
      revocarEnlaceEvidenciaAuditoria(id);
    });
  }

  function copiar(token: string, id: string) {
    const url = `${window.location.origin}/auditoria/${token}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiadoId(id);
      setTimeout(() => setCopiadoId(null), 2000);
    });
  }

  const activos = enlaces.filter((e) => e.activo && new Date(e.expira_en) > new Date());

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="font-display font-semibold text-secundario">Compartir con un auditor externo</h2>
          <p className="text-xs text-marmol-500 mt-0.5">
            Enlace temporal de solo lectura, sin necesidad de darle una cuenta en la plataforma — el auditor entra, ve el resumen y descarga el ZIP.
          </p>
        </div>
        {!abierto && (
          <button
            type="button"
            onClick={() => setAbierto(true)}
            className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-flow-500 hover:bg-flow-600 text-white text-sm font-medium px-3 py-1.5 transition"
          >
            <Plus size={14} /> Generar enlace
          </button>
        )}
      </div>

      {abierto && (
        <div className="flex flex-wrap items-end gap-2 mb-4 p-3 rounded-lg bg-marmol-50 border border-marmol-100">
          <div>
            <label className="block text-xs text-marmol-500 mb-1">Paquete</label>
            <select className="rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm" value={tipo} onChange={(e) => setTipo(e.target.value as any)}>
              {Object.entries(TIPO_LABEL).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-marmol-500 mb-1">Vigencia (días)</label>
            <input
              type="number"
              min={1}
              max={90}
              className="w-20 rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm"
              value={diasVigencia}
              onChange={(e) => setDiasVigencia(e.target.value)}
            />
          </div>
          <div className="flex-1 min-w-[160px]">
            <label className="block text-xs text-marmol-500 mb-1">Nota (opcional)</label>
            <input
              className="w-full rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm"
              placeholder="Ej. Auditoría de renovación — Bureau Veritas"
              value={nota}
              onChange={(e) => setNota(e.target.value)}
            />
          </div>
          <button type="button" onClick={generar} disabled={pending} className="rounded-lg bg-flow-500 hover:bg-flow-600 disabled:opacity-50 text-white text-sm font-medium px-3 py-1.5">
            {pending ? 'Generando…' : 'Crear'}
          </button>
          <button type="button" onClick={() => setAbierto(false)} className="text-sm text-marmol-400 hover:text-marmol-600">
            Cancelar
          </button>
          {error && <p className="text-xs text-bajo w-full">{error}</p>}
        </div>
      )}

      {activos.length === 0 ? (
        <p className="text-sm text-marmol-400">Sin enlaces activos.</p>
      ) : (
        <ul className="space-y-2">
          {activos.map((e) => (
            <li key={e.id} className="flex items-center justify-between gap-3 text-sm bg-marmol-50 rounded-lg px-3 py-2">
              <div className="min-w-0">
                <p className="text-marmol-800 font-medium truncate">
                  {TIPO_LABEL[e.tipo_paquete]} {e.nota ? `— ${e.nota}` : ''}
                </p>
                <p className="text-xs text-marmol-400">
                  Vence {formatearFecha(e.expira_en)} · {e.veces_consultado} consulta{e.veces_consultado === 1 ? '' : 's'}
                  {e.ultima_consulta_en ? ` · última: ${formatearFecha(e.ultima_consulta_en)}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button type="button" onClick={() => copiar(e.token, e.id)} className="inline-flex items-center gap-1 text-xs text-flow-600 hover:text-flow-700 font-medium">
                  {copiadoId === e.id ? (
                    <>
                      <Check size={13} className="text-alto" /> Copiado
                    </>
                  ) : (
                    <>
                      <Link2 size={13} /> Copiar enlace
                    </>
                  )}
                </button>
                <button type="button" onClick={() => revocar(e.id)} disabled={pending} className="inline-flex items-center gap-1 text-xs text-bajo hover:underline font-medium disabled:opacity-50">
                  <Ban size={13} /> Revocar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
